import { useState } from 'react';
import axios from 'axios';
import { API_URL, MAX_FILES } from '@/config';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PasswordDialog } from '@/components/pdfTools/PasswordDialog';
import { FileDropZone } from '@/components/pdfTools/FileDropZone';
import { FileGrid } from '@/components/pdfTools/FileGrid';
import { useFileStatus } from '@/components/pdfTools/useFileStatus';
import { useFileValidation } from '@/components/pdfTools/useFileValidation';
import { ErrorPopup } from '@/components/pdfTools/ErrorPopup';
import { SpinnerItem } from '@/components/ui/SpinnerItem';

export function MergeTab() {
  const [files, setFiles] = useState<File[]>([]);
  const [filePasswords, setFilePasswords] = useState<Record<string, string>>(
    {}
  );
  const [passwordVerified, setPasswordVerified] = useState<
    Record<string, boolean>
  >({});
  const [lockedFiles, setLockedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'loading' | '';
    message: string;
  }>({ type: '', message: '' });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [fileToUnlock, setFileToUnlock] = useState<File | null>(null);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);

  const fileStatus = useFileStatus();
  const fileValidation = useFileValidation();

  const handleFilesAdded = async (newFiles: File[]) => {
    if (files.length + newFiles.length > MAX_FILES) {
      setErrorPopup(`You cannot select more than ${MAX_FILES} files.`);
      return;
    }
    setFiles((prev) => [...prev, ...newFiles]);
    setStatus({ type: '', message: '' });
    setLockedFiles([]);
    fileStatus.resetStatus();
    fileValidation.resetValidation();
    await fileValidation.validateFiles(newFiles);
  };

  const handleSetFiles = (newFiles: File[]) => {
    setFiles(newFiles);
    setLockedFiles((prevLocked) => {
      const filtered = prevLocked.filter((name) =>
        newFiles.some((f) => f.name === name)
      );
      if (filtered.length === 0 && status.type === 'error') {
        setStatus({ type: '', message: '' });
      }
      return filtered;
    });
  };

  const openUnlockModal = (fileName: string) => {
    const file = files.find((f) => f.name === fileName) || null;
    setFileToUnlock(file);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSuccess = (password: string) => {
    if (!fileToUnlock) return;
    const updatedPasswords = {
      ...filePasswords,
      [fileToUnlock.name]: password,
    };
    const updatedVerified = { ...passwordVerified, [fileToUnlock.name]: true };

    const updatedLocked = lockedFiles.filter(
      (name) => name !== fileToUnlock.name
    );

    setFilePasswords(updatedPasswords);
    setPasswordVerified(updatedVerified);
    setIsPasswordModalOpen(false);
    setLockedFiles(updatedLocked);

    if (updatedLocked.length > 0) {
      setStatus({
        type: 'error',
        message: `${updatedLocked.length} locked files remaining.`,
      });
    } else {
      setStatus({ type: '', message: '' });
    }
  };

  const canMerge =
    files.length > 0 &&
    files.length <= MAX_FILES &&
    files.every((f) => {
      if (filePasswords[f.name]) {
        return passwordVerified[f.name];
      }
      return true;
    });

  const handleMergeClick = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setStatus({ type: 'loading', message: 'Processing files... ' });
    setLockedFiles([]);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('passwords', JSON.stringify(filePasswords));

    try {
      const response = await axios.post(`${API_URL}/merge`, formData, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();

      setStatus({ type: 'success', message: 'Merge completed successfully! ' });
      setFiles([]);
      setFilePasswords({});
      setLockedFiles([]);
      fileStatus.resetStatus();
    } catch (error: any) {
      console.error('Merge error:', error);
      let errorData: any = {};

      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          errorData = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse error blob:', e);
        }
      } else {
        errorData = error.response?.data || {};
      }

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 423) {
          let lockedList: string[] = [];
          try {
            lockedList = JSON.parse(errorData.detail);
          } catch {
            lockedList = [errorData.detail || 'Unknown File'];
          }
          setLockedFiles(lockedList);
          setStatus({
            type: 'error',
            message: `${lockedList.length} locked files found. Click the red locks to enter a password.`,
          });
        } else {
          const errorMsg =
            errorData.detail || errorData.error || 'Unknown server error';
          setStatus({ type: 'error', message: `Error: ${errorMsg} ` });
        }
      } else {
        setStatus({ type: 'error', message: 'Connection error to server ' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merge PDF Files</CardTitle>
        <CardDescription>
          Select multiple files to merge them into one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        <FileDropZone onFilesAdded={handleFilesAdded} disabled={isUploading} />

        {isUploading ? (
          <div className="flex justify-center py-8">
            <SpinnerItem
              title="Processing..."
              description={
                files.length > 0
                  ? `Merging ${files.length} files...`
                  : 'Processing...'
              }
              progress={0}
              onCancel={() => setIsUploading(false)}
            />
          </div>
        ) : (
          files.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-slate-700">
                Selected files ({files.length}):
              </h4>

              <FileGrid
                items={files.map((file) => ({
                  file,
                  isLocked: lockedFiles.includes(file.name),
                  isVerified: !!passwordVerified[file.name],
                  isError: fileValidation.brokenFiles.includes(file.name),
                  errorMessage: fileValidation.brokenFileErrors[file.name],
                }))}
                onFilesChange={handleSetFiles}
                onUnlock={openUnlockModal}
              />

              <Button
                onClick={handleMergeClick}
                disabled={
                  isUploading ||
                  !canMerge ||
                  files.some((file) =>
                    fileValidation.brokenFiles.includes(file.name)
                  )
                }
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
              >
                Merge files now 🚀
              </Button>
            </div>
          )
        )}

        {errorPopup && (
          <ErrorPopup
            message={errorPopup}
            onClose={() => setErrorPopup(null)}
          />
        )}

        {files.some((file) =>
          fileValidation.brokenFiles.includes(file.name)
        ) && (
          <div className="text-orange-700 bg-orange-50 border border-orange-300 rounded-md p-2 mt-2 text-center font-medium">
            <div className="mt-1">Please remove broken files to continue.</div>
          </div>
        )}

        <PasswordDialog
          open={isPasswordModalOpen}
          file={fileToUnlock}
          onSuccess={handlePasswordSuccess}
          onCancel={() => setIsPasswordModalOpen(false)}
        />
      </CardContent>
    </Card>
  );
}

export default MergeTab;
