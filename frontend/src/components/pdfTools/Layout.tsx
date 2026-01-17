import { useState, type ReactNode } from 'react'; // הוספנו useState
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDropZone } from '@/components/pdfTools/FileDropZone';
import { FileGrid } from '@/components/pdfTools/FileGrid';
import { PasswordDialog } from '@/components/pdfTools/PasswordDialog';
import { ErrorPopup } from '@/components/pdfTools/ErrorPopup';
import { StatusAlert } from '@/components/pdfTools/StatusAlert';
import { SpinnerItem } from '@/components/ui/SpinnerItem';
import { usePDFManager } from '@/lib/usePDFManager';

interface PDFToolLayoutProps {
  title: string;
  description: string;
  pdfManager: ReturnType<typeof usePDFManager>;
  controls: ReactNode;
  layoutMode?: 'simple' | 'sidebar';
  
  isUploading: boolean;
  status: { type: 'success' | 'error' | 'loading' | ''; message: string };
  
  externalError?: string | null; 
  onClearError?: () => void;
}

export function PDFToolLayout({
  title,
  description,
  pdfManager,
  controls,
  layoutMode = 'simple',
  isUploading,
  status,
  externalError,
  onClearError
}: PDFToolLayoutProps) {
  
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [fileToUnlock, setFileToUnlock] = useState<File | null>(null);
  const [internalError, setInternalError] = useState<string | null>(null);

  const errorMessage = externalError || internalError;
  
  const handleCloseError = () => {
      setInternalError(null);
      if (onClearError) onClearError();
  }

  const handleFilesAdded = (newFiles: File[]) => {
    pdfManager.addFiles(newFiles, (msg) => setInternalError(msg));
  };

  const openUnlockModal = (fileName: string) => {
    const file = pdfManager.files.find((f) => f.name === fileName) || null;
    setFileToUnlock(file);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSuccess = (password: string) => {
    if (fileToUnlock) {
      pdfManager.unlockFile(fileToUnlock.name, password);
      setIsPasswordModalOpen(false);
    }
  };

  const hasFiles = pdfManager.files.length > 0;

  return (
    <Card className="h-full flex flex-col min-h-[600px] overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      
      <CardContent className={`p-0 flex flex-grow relative ${layoutMode === 'sidebar' && hasFiles ? 'flex-col md:flex-row' : 'flex-col'}`}>
        
        <div className={`flex-grow flex flex-col p-6 overflow-y-auto ${layoutMode === 'sidebar' && hasFiles ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
          {isUploading ? (
            <div className="flex justify-center items-center flex-grow py-12">
              <SpinnerItem
                title="Processing..."
                description={`Processing ${pdfManager.files.length} files...`}
                progress={0}
                onCancel={() => {}}
              />
            </div>
          ) : hasFiles ? (
            <div className="space-y-4 flex-grow">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-sm font-medium text-slate-700">
                  Selected files ({pdfManager.files.length}):
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={pdfManager.resetAll}
                  className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                >
                  Clear All
                </Button>
              </div>

              <FileGrid
                items={pdfManager.files.map((file) => ({
                  file,
                  isLocked: pdfManager.lockedFiles.includes(file.name),
                  isVerified: !!pdfManager.passwordVerified[file.name],
                  isError: pdfManager.fileValidation.brokenFiles.includes(file.name),
                  errorMessage: pdfManager.fileValidation.brokenFileErrors[file.name],
                  password: pdfManager.filePasswords[file.name],
                  rotation: pdfManager.fileRotations[file.name] || 0,
                }))}
                onFilesChange={pdfManager.setFiles}
                onUnlock={openUnlockModal}
                onCheckLock={pdfManager.handleThumbnailError}
                onRotate={pdfManager.rotateFile}
              />
            </div>
          ) : (
            <div className="flex-grow flex flex-col justify-center">
              <FileDropZone
                onFilesAdded={handleFilesAdded}
                disabled={isUploading}
              />
            </div>
          )}
        </div>

        {hasFiles && !isUploading && (
          <div className={`bg-slate-50 border-slate-200 p-6 ${layoutMode === 'sidebar' ? 'border-t md:border-t-0 md:border-l md:w-1/3 lg:w-1/4 flex-shrink-0 overflow-y-auto' : 'border-t mt-auto'}`}>
            <div className="space-y-4">
              <StatusAlert status={status} />
              {pdfManager.files.some((file) => pdfManager.fileValidation.brokenFiles.includes(file.name)) && (
                <div className="text-orange-700 bg-orange-50 border border-orange-300 rounded-md p-2 text-center font-medium text-sm">
                  Please remove broken files.
                </div>
              )}
              {controls}
            </div>
          </div>
        )}

        {errorMessage && (
          <ErrorPopup message={errorMessage} onClose={handleCloseError} />
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