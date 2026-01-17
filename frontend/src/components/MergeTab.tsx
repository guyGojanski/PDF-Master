import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config';
import { Button } from '@/components/ui/button';
import { PDFToolLayout } from '@/components/pdfTools/Layout';
import { usePDFManager } from '@/lib/usePDFManager';
import { downloadFile, parseServerError } from '@/lib/utils'; 

export function MergeTab() {
  const pdfManager = usePDFManager();
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | ''; message: string }>({ type: '', message: '' });

  const handleMergeClick = async () => {
    if (pdfManager.files.length === 0) return;

    setIsUploading(true);
    setStatus({ type: 'loading', message: 'Merging files...' });

    const formData = new FormData();
    pdfManager.files.forEach((file) => formData.append('files', file));
    formData.append('passwords', JSON.stringify(pdfManager.filePasswords));
    formData.append('rotations', JSON.stringify(pdfManager.fileRotations));

    try {
      const response = await axios.post(`${API_URL}/merge`, formData, { responseType: 'blob' });
      
      downloadFile(response.data, 'merged.pdf');

      setStatus({ type: 'success', message: 'Merge completed successfully! ' });
      pdfManager.resetAll();
      
    } catch (error: any) {
      console.error('Merge error:', error);
      
      const errorData = await parseServerError(error);

      if (axios.isAxiosError(error) && error.response?.status === 423) {
          let lockedList: string[] = [];
          try {
            lockedList = JSON.parse(errorData.detail);
          } catch {
            lockedList = [errorData.detail || 'Unknown File'];
          }
          pdfManager.setLockedFiles((prev) => Array.from(new Set([...prev, ...lockedList])));
          setStatus({
            type: 'error',
            message: `${lockedList.length} locked files found. Click the red locks to enter a password.`,
          });
      } else {
          const errorMsg = errorData.detail || errorData.error || 'Unknown server error';
          setStatus({ type: 'error', message: `Error: ${errorMsg} ` });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PDFToolLayout
      title="Merge PDF Files"
      description="Drag and drop files to merge them into one document."
      pdfManager={pdfManager}
      layoutMode="simple"
      isUploading={isUploading}
      status={status}
      
      controls={
        <Button
          onClick={handleMergeClick}
          disabled={isUploading || !pdfManager.isValidToProcess}
          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-12 text-lg shadow-md transition-all hover:scale-[1.01]"
        >
          Merge files now 🚀
        </Button>
      }
    />
  );
}

export default MergeTab;