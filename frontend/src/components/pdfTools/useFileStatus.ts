
import { useState } from 'react';

export type RowColor = 'green' | 'red' | undefined;

export function useFileStatus() {
  const [rowStatus, setRowStatus] = useState<Record<string, RowColor>>({});

  function updateStatus(
    files: File[],
    filePasswords: Record<string, string>,
    passwordVerified: Record<string, boolean>
  ) {
    const newRowStatus: Record<string, RowColor> = {};
    files.forEach((f) => {
      if (filePasswords[f.name]) {
        newRowStatus[f.name] = passwordVerified[f.name] ? 'green' : 'red';
      } else {
        newRowStatus[f.name] = 'green';
      }
    });
    setRowStatus(newRowStatus);
  }

  function setLockedStatus(lockedList: string[], files: File[]) {
    setRowStatus((prev) => {
      const copy = { ...prev };
      lockedList.forEach((name) => {
        copy[name] = 'red';
      });
      files.forEach((f) => {
        if (!lockedList.includes(f.name)) copy[f.name] = 'green';
      });
      return copy;
    });
  }

  function removeFileStatus(fileName: string) {
    setRowStatus((prev) => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });
  }

  function resetStatus() {
    setRowStatus({});
  }

  return {
    rowStatus,
    updateStatus,
    setLockedStatus,
    removeFileStatus,
    resetStatus,
  };
}
