import { useState } from 'react';
import axios from 'axios';
import { API_URL, MAX_FILES } from '@/config';
import { useFileValidation } from '@/lib/useFileValidation';

export function usePDFManager() {
  const [files, setFiles] = useState<File[]>([]);
  const [filePasswords, setFilePasswords] = useState<Record<string, string>>(
    {}
  );
  const [passwordVerified, setPasswordVerified] = useState<
    Record<string, boolean>
  >({});
  const [lockedFiles, setLockedFiles] = useState<string[]>([]);
  const [fileRotations, setFileRotations] = useState<Record<string, number>>(
    {}
  );

  const fileValidation = useFileValidation();

  const addFiles = async (newFiles: File[], onError: (msg: string) => void) => {
    if (files.length + newFiles.length > MAX_FILES) {
      onError(`You cannot select more than ${MAX_FILES} files.`);
      return;
    }

    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);

    fileValidation.resetValidation();
    await fileValidation.validateFiles(updatedFiles);
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    if (fileToRemove) {
      setLockedFiles((prev) =>
        prev.filter((name) => name !== fileToRemove.name)
      );

      setFileRotations((prev) => {
        const next = { ...prev };
        delete next[fileToRemove.name];
        return next;
      });

      setFilePasswords((prev) => {
        const next = { ...prev };
        delete next[fileToRemove.name];
        return next;
      });

      setPasswordVerified((prev) => {
        const next = { ...prev };
        delete next[fileToRemove.name];
        return next;
      });
    }
  };

  const rotateFile = (fileName: string) => {
    setFileRotations((prev) => ({
      ...prev,
      [fileName]: (prev[fileName] || 0) + 90,
    }));
  };

  const handleThumbnailError = async (file: File) => {
    if (
      lockedFiles.includes(file.name) ||
      fileValidation.brokenFiles.includes(file.name)
    )
      return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await axios.post(`${API_URL}/check-password`, formData);

      if (!res.data.ok) {
        setLockedFiles((prev) => {
          if (!prev.includes(file.name)) return [...prev, file.name];
          return prev;
        });
      }
    } catch (e) {
      console.error('Lock check failed', e);
    }
  };

  const unlockFile = (fileName: string, password: string) => {
    setFilePasswords((prev) => ({ ...prev, [fileName]: password }));
    setPasswordVerified((prev) => ({ ...prev, [fileName]: true }));
    setLockedFiles((prev) => prev.filter((name) => name !== fileName));
  };

  const isValidToProcess =
    files.length > 0 &&
    files.every((f) => {
      if (filePasswords[f.name] && !passwordVerified[f.name]) return false;
      if (lockedFiles.includes(f.name)) return false;
      if (fileValidation.brokenFiles.includes(f.name)) return false;
      return true;
    });

  const resetAll = () => {
    setFiles([]);
    setFilePasswords({});
    setPasswordVerified({});
    setLockedFiles([]);
    setFileRotations({});
    fileValidation.resetValidation();
  };

  return {
    files,
    setFiles,
    filePasswords,
    passwordVerified,
    lockedFiles,
    fileRotations,
    fileValidation,
    addFiles,
    removeFile,
    rotateFile,
    handleThumbnailError,
    unlockFile,
    isValidToProcess,
    resetAll,
    setLockedFiles,
  };
}
