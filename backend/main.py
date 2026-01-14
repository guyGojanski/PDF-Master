import os
import shutil
import json
import io
import PyPDF2

from pypdf import PdfReader
from typing import List, Dict
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    BackgroundTasks,
    Form,
    HTTPException,
    Request,
)
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from pdf_utils import *

load_dotenv()

app = FastAPI()

DEBUG_MODE = os.getenv("DEBUG", "False").lower() == "true"
TEMP_FOLDER = os.getenv("TEMP_FOLDER", "temp_uploads")

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

origins_str = os.getenv("ALLOWED_ORIGINS", "")
origins = [origin.strip() for origin in origins_str.split(",") if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", "104857600"))


def cleanup_files(file_paths: List[str]):
    for path in file_paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except Exception as e:
                print(f"Error deleting file {path}: {e}")


@app.post("/check-password")
@limiter.limit("50/minute")
async def check_password_endpoint(
    request: Request, file: UploadFile = File(...), password: str = Form(None)
):
    try:
        content = await file.read()
        await file.seek(0)

        reader = PdfReader(io.BytesIO(content))
        if reader.is_encrypted:
            if password and reader.decrypt(password):
                return {"ok": True}
            else:
                return {"ok": False, "error": "Invalid password"}
        else:
            return {"ok": True}
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def validate_file(file: UploadFile):
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max size is {MAX_FILE_SIZE} bytes.",
        )

    await file.seek(0)
    header = await file.read(5)
    await file.seek(0)

    if not header.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=400, detail="Invalid file format. Not a generic PDF."
        )


async def check_files_lock(files: List[UploadFile], passwords_dict: Dict[str, str]):
    """Check if any of the uploaded PDF files are locked"""

    locked_files_names = []

    for file in files:
        await file.seek(0)
        content = await file.read()
        await file.seek(0)  # Use await file.seek(0) for pointer reset
        try:
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
            if pdf_reader.is_encrypted:
                file_password = passwords_dict.get(file.filename)
                if not file_password or not pdf_reader.decrypt(file_password):
                    locked_files_names.append(file.filename)
        except Exception as e:
            print(f"Check lock failed for {file.filename}: {e}")
            continue

    if locked_files_names:
        raise HTTPException(status_code=423, detail=json.dumps(locked_files_names))


def handle_pdf_error(e: Exception, saved_paths: List[str]):
    """Helper to catch password errors and cleanup"""
    cleanup_files(saved_paths)
    error_msg = str(e)

    if "PASSWORD_REQUIRED" in error_msg or "INVALID_PASSWORD" in error_msg:
        try:
            filename = error_msg.split(":")[-1].strip()
        except:
            filename = "Unknown File"

        raise HTTPException(status_code=423, detail=json.dumps([filename]))  # Locked

    if isinstance(e, HTTPException):
        raise e

    return JSONResponse(
        status_code=500, content={"detail": f"Operation failed: {str(e)}"}
    )


@app.get("/")
def read_root():
    return {"message": "Welcome to the PDF upload service!"}


@app.post("/upload-pdf/")
@limiter.limit("10/minute")
async def upload_pdf(request: Request, file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        return {"error": "Invalid file. Please upload only PDF files."}

    await validate_file(file)

    file_location = save_file_to_temp(file, TEMP_FOLDER)

    return {
        "filename": file.filename,
        "location": file_location,
        "status": "File uploaded successfully",
        "content_type": file.content_type,
    }


@app.post("/merge")
@limiter.limit("10/minute")
async def merge_pdfs_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    passwords: str = Form("{}"),
):
    saved_paths_map = {}
    saved_paths_list = []
    unlocked_paths_list = []
    try:
        passwords_dict = json.loads(passwords)
    except:
        passwords_dict = {}

    try:
        await check_files_lock(files, passwords_dict)
        for file in files:
            await validate_file(file)
            path = save_file_to_temp(file)
            saved_paths_list.append(path)
            file_password = passwords_dict.get(file.filename)
            if file_password:
                # Unlock the file and use the unlocked version for merging
                unlocked_path = unlock_pdf(path, file_password)
                unlocked_paths_list.append(unlocked_path)
            else:
                unlocked_paths_list.append(path)

        if not unlocked_paths_list:
            return {"error": "No valid PDF files uploaded."}
        # Merge only unlocked files (no password)
        merge_files_path = merge_pdfs({p: None for p in unlocked_paths_list})
        files_to_delete = saved_paths_list + unlocked_paths_list + [merge_files_path]
        background_tasks.add_task(cleanup_files, files_to_delete)
        return FileResponse(
            path=merge_files_path, filename="merged.pdf", media_type="application/pdf"
        )
    except Exception as e:
        return handle_pdf_error(e, saved_paths_list + unlocked_paths_list)


@app.post("/delete-pages")
@limiter.limit("10/minute")
async def delete_pages_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    pages: str = Form(...),
    passwords: str = Form("{}"),
):
    saved_path = None

    try:
        passwords_dict = json.loads(passwords)
        password = passwords_dict.get(file.filename)
    except:
        passwords_dict = {}
        password = None

    try:
        await validate_file(file)
        await check_files_lock([file], passwords_dict)
        saved_path = save_file_to_temp(file)
        new_pdf_path = delete_pages(saved_path, pages, password)
        pages_to_delete = [saved_path, new_pdf_path]
        background_tasks.add_task(cleanup_files, pages_to_delete)

        return FileResponse(
            path=new_pdf_path, filename="edited.pdf", media_type="application/pdf"
        )
    except Exception as e:
        return handle_pdf_error(e, [saved_path] if saved_path else [])


@app.post("/split_pdf")
@limiter.limit("10/minute")
async def split_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    ranges: str = Form(...),
    passwords: str = Form("{}"),
):
    saved_path = None

    try:
        passwords_dict = json.loads(passwords)
        password = passwords_dict.get(file.filename)
    except:
        passwords_dict = {}
        password = None

    try:
        await validate_file(file)
        await check_files_lock([file], passwords_dict)  # Preliminary check
        saved_path = save_file_to_temp(file)
        output_path = split_pdf(saved_path, ranges, password)

        if output_path.endswith(".zip"):
            media_type = "application/zip"
        else:
            media_type = "application/pdf"

        filename = os.path.basename(output_path)
        background_tasks.add_task(cleanup_files, [saved_path, output_path])
        return FileResponse(path=output_path, filename=filename, media_type=media_type)
    except Exception as e:
        return handle_pdf_error(e, [saved_path] if saved_path else [])


@app.post("/compress_pdf")
@limiter.limit("10/minute")
async def compress_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    level: str = Form("recommended"),
    passwords: str = Form("{}"),
):
    saved_path = None

    try:
        passwords_dict = json.loads(passwords)
        password = passwords_dict.get(file.filename)
    except:
        passwords_dict = {}
        password = None

    try:
        await validate_file(file)
        await check_files_lock([file], passwords_dict)
        saved_path = save_file_to_temp(file)
        compressed_path = compress_pdf(saved_path, level, password)
        background_tasks.add_task(cleanup_files, [saved_path, compressed_path])

        return FileResponse(
            path=compressed_path,
            filename=f"compressed_{level}_{file.filename}",
            media_type="application/pdf",
        )

    except Exception as e:
        return handle_pdf_error(e, [saved_path] if saved_path else [])


@app.post("/lock-pdf")
@limiter.limit("10/minute")
async def lock_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    password: str = Form(...),
    passwords: str = Form("{}"),
):
    saved_paths_map = {}
    saved_paths_list = []

    try:
        old_passwords_dict = json.loads(passwords)
    except:
        old_passwords_dict = {}

    try:
        await check_files_lock(files, old_passwords_dict)  # Moved outside the loop
        for file in files:
            await validate_file(file)
            path = save_file_to_temp(file)
            saved_paths_list.append(path)
            old_pass = old_passwords_dict.get(file.filename)
            saved_paths_map[path] = old_pass

        output_path = lock_pdfs(saved_paths_map, password)
        if output_path.endswith(".zip"):
            media_type = "application/zip"
            filename = "locked_files.zip"
        else:
            media_type = "application/pdf"
            filename = f"locked_{files[0].filename}"
        background_tasks.add_task(cleanup_files, saved_paths_list + [output_path])
        return FileResponse(path=output_path, filename=filename, media_type=media_type)
    except Exception as e:
        return handle_pdf_error(e, saved_paths_list)


@app.post("/unlock-pdf")
@limiter.limit("10/minute")
async def unlock_pdf_endpoint(
    request: Request,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    password: str = Form(None),
):
    saved_path = None

    try:
        await validate_file(file)
        saved_path = save_file_to_temp(file)
        output_path = unlock_pdf(saved_path, password)
        background_tasks.add_task(cleanup_files, [saved_path, output_path])

        return FileResponse(
            path=output_path,
            filename=f"unlocked_{file.filename}",
            media_type="application/pdf",
        )

    except Exception as e:
        return handle_pdf_error(e, [saved_path] if saved_path else [])
