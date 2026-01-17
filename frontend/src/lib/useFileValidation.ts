import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config';

export interface FileValidationResult {
  brokenFiles: string[];
  brokenFileErrors: Record<string, string>;
}

export function useFileValidation() {
  const [brokenFiles, setBrokenFiles] = useState<string[]>([]);
  const [brokenFileErrors, setBrokenFileErrors] = useState<
    Record<string, string>
  >({});

  const validateFiles = async (
    files: File[]
  ): Promise<FileValidationResult> => {
    const broken: string[] = [];
    const brokenErrors: Record<string, string> = {};
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    try {
      const res = await axios.post(`${API_URL}/validate-pdf`, formData);
      const results = res.data;
      files.forEach((file) => {
        const result = results[file.name];
        if (!result || !result.ok) {
          broken.push(file.name);
          brokenErrors[file.name] =
            result && result.error_type
              ? `${result.error_type}: ${result.error}`
              : (result && result.error) || 'Unknown error';
        }
      });
    } catch (err: any) {
      files.forEach((file) => {
        broken.push(file.name);
        brokenErrors[file.name] = 'Connection error';
      });
    }
    setBrokenFiles(broken);
    setBrokenFileErrors(brokenErrors);
    return { brokenFiles: broken, brokenFileErrors: brokenErrors };
  };

  const resetValidation = () => {
    setBrokenFiles([]);
    setBrokenFileErrors({});
  };

  return {
    brokenFiles,
    brokenFileErrors,
    validateFiles,
    resetValidation,
  };
}
