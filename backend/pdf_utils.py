import os
import subprocess
import zipfile
import fitz
import shutil

from pypdf import PdfReader, PdfWriter
from typing import List, Dict, Optional

DIR_OUTPUT = "output_files"


def get_pdf_info(file_path: str):
    """Check the validity of a PDF file without UI"""
    if not os.path.exists(file_path):
        return {"valid": False, "error": "File not found"}
    try:
        with fitz.open(file_path) as doc:
            is_encrypted = doc.is_encrypted
            page_count = len(doc)
        return {"valid": True, "pages": page_count, "encrypted": is_encrypted}
    except Exception as e:
        return {"valid": False, "error": str(e)}


def save_file_to_temp(upload_file, temp_folder="temp_uploads"):
    """Save a file received from the client to disk"""
    os.makedirs(temp_folder, exist_ok=True)
    file_location = os.path.join(temp_folder, upload_file.filename)
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    return file_location


def parse_page_range(text: str) -> List[int]:
    """Parse a page range string like '1-3,5,7-9' into a list of page numbers. [1,2,3,5,7,8,9]"""
    pages = set()
    if not text:
        return []

    parts = text.split(",")
    for part in parts:
        part = part.strip()
        if "-" in part:
            try:
                start_str, end_str = part.split("-")
                start, end = int(start_str), int(end_str)
                pages.update(range(start, end + 1))
            except ValueError:
                continue
        else:
            try:
                pages.add(int(part))
            except ValueError:
                continue
    return sorted(list(pages))


def unlock_if_encrypted(reader: PdfReader, password: Optional[str], filename: str):
    """Helper to handle decryption logic centrally"""
    if reader.is_encrypted:
        if not password:
            if not reader.decrypt(""):
                raise ValueError(f"PASSWORD_REQUIRED:{filename}")
        else:
            if not reader.decrypt(password):
                raise ValueError(f"INVALID_PASSWORD:{filename}")


def merge_pdfs(file_paths: Dict[str, str], output_filename="merged.pdf") -> str:
    """Perform the actual merge."""
    writer = PdfWriter()
    for path, password in file_paths.items():
        try:
            reader = PdfReader(path)
            unlock_if_encrypted(reader, password, os.path.basename(path))

            for page in reader.pages:
                writer.add_page(page)

        except Exception as e:
            print(f"Error merging {path}: {e}")
            raise e

    os.makedirs(DIR_OUTPUT, exist_ok=True)
    output_path = os.path.join(DIR_OUTPUT, output_filename)

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path


def delete_pages(file_path: str, page_ranges: str, password: str = None) -> str:
    """Delete specified pages from a PDF file."""
    reader = PdfReader(file_path)
    unlock_if_encrypted(reader, password, os.path.basename(file_path))

    writer = PdfWriter()
    pages_to_remove = parse_page_range(page_ranges)
    indices_to_remove = [page - 1 for page in pages_to_remove]

    for i in range(len(reader.pages)):
        if i not in indices_to_remove:
            writer.add_page(reader.pages[i])

    if len(writer.pages) == 0:
        raise ValueError("Cannot delete all pages from the PDF")

    output_filename = f"deleted_{os.path.basename(file_path)}"
    os.makedirs(DIR_OUTPUT, exist_ok=True)
    output_path = os.path.join(DIR_OUTPUT, output_filename)

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path


def split_pdf(file_path: str, page_ranges: str, password: str = None) -> str:
    """Split a PDF into multiple files based on specified page ranges."""
    ranges_list = [r.strip() for r in page_ranges.split(",")]
    output_ranges = []

    reader = PdfReader(file_path)
    unlock_if_encrypted(reader, password, os.path.basename(file_path))

    base_name = os.path.splitext(os.path.basename(file_path))[0]
    os.makedirs(DIR_OUTPUT, exist_ok=True)

    for i, r in enumerate(ranges_list):
        pages_in_range = parse_page_range(r)
        pages = [p - 1 for p in pages_in_range]

        writer = PdfWriter()
        flag = False

        for p in pages:
            if 0 <= p < len(reader.pages):
                writer.add_page(reader.pages[p])
                flag = True
        if flag:
            range_name = f"{base_name}_part{i+1}.pdf"
            range_name_path = os.path.join(DIR_OUTPUT, range_name)
            with open(range_name_path, "wb") as f:
                writer.write(f)
            output_ranges.append(range_name_path)
    if not output_ranges:
        raise ValueError("No valid pages found for the specified ranges.")

    if len(output_ranges) == 1:
        return output_ranges[0]

    zip_filename = f"{base_name}_splits.zip"
    zip_path = os.path.join(DIR_OUTPUT, zip_filename)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for file in output_ranges:
            zipf.write(file, os.path.basename(file))
            os.remove(file)

    return zip_path


def compress_pdf(
    file_path: str, level: str = "recommended", password: str = None
) -> str:
    """Compress a PDF file with Ghostscript."""

    try:
        reader = PdfReader(file_path)
        unlock_if_encrypted(reader, password, os.path.basename(file_path))

    except ValueError as e:
        raise e

    compression_settings = {
        "extreme": "/screen",
        "recommended": "/ebook",
        "less": "/printer",
    }

    ghostscript_setting = compression_settings.get(level, "/ebook")
    ghostscript = shutil.which("gswin64c") or shutil.which("gs")

    if not ghostscript:
        raise EnvironmentError("Ghostscript not found.")

    output_filename = f"compressed_{level}_{os.path.basename(file_path)}"
    os.makedirs(DIR_OUTPUT, exist_ok=True)
    output_path = os.path.join(DIR_OUTPUT, output_filename)

    command = [
        ghostscript,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS={ghostscript_setting}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_path}",
    ]

    if password:
        command.append(f"-sPDFPassword={password}")

    command.append(file_path)

    try:
        subprocess.run(command, check=True)
        return output_path
    except subprocess.CalledProcessError as e:
        raise RuntimeError(f"PDF compression failed: {e}")


def lock_pdfs(file_paths: Dict[str, str], new_password: str) -> str:
    """Protect PDF files with a password."""
    output_files = []
    os.makedirs(DIR_OUTPUT, exist_ok=True)

    for path, old_password in file_paths.items():
        try:
            reader = PdfReader(path)
            unlock_if_encrypted(reader, old_password, os.path.basename(path))

            writer = PdfWriter()

            for page in reader.pages:
                writer.add_page(page)

            writer.encrypt(user_password=new_password, algorithm="AES-256")

            filename = f"locked_{os.path.basename(path)}"
            out_path = os.path.join(DIR_OUTPUT, filename)

            with open(out_path, "wb") as f:
                writer.write(f)

            output_files.append(out_path)

        except Exception as e:
            print(f"Error locking {path}: {e}")
            raise e

    if not output_files:
        raise ValueError("Failed to lock any files.")

    if len(output_files) == 1:
        return output_files[0]

    zip_filename = "locked_files.zip"
    zip_path = os.path.join(DIR_OUTPUT, zip_filename)

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
        for f in output_files:
            zipf.write(f, os.path.basename(f))
            os.remove(f)

    return zip_path


def unlock_pdf(file_path: str, password: str = None) -> str:
    """Remove password protection from a PDF file."""

    reader = PdfReader(file_path)
    unlock_if_encrypted(reader, password, os.path.basename(file_path))
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    output_filename = f"unlocked_{os.path.basename(file_path)}"
    os.makedirs(DIR_OUTPUT, exist_ok=True)
    output_path = os.path.join(DIR_OUTPUT, output_filename)

    with open(output_path, "wb") as f:
        writer.write(f)

    return output_path
