import { FileText, X, CheckCircle2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FileListItem {
  file: File;
  hasPassword: boolean;
  isVerified: boolean;
  isError: boolean;
  isBroken?: boolean;
  rowColor?: 'green' | 'red' | 'orange';
  errorMsg?: string;
}

interface FileListProps {
  files: FileListItem[];
  setFiles: (files: File[]) => void;
  onUnlock: (fileName: string) => void;
  lockedFiles?: string[];
  onClearError?: () => void;
  errorMessage?: string;
}

export function FileList({
  files,
  setFiles,
  onUnlock,
  lockedFiles = [],
  onClearError,
  errorMessage,
}: FileListProps) {
  const handleRemove = (index: number) => {
    const newFiles = files.map((f) => f.file);
    const removedFile = files[index].file.name;
    newFiles.splice(index, 1);
    setFiles(newFiles);
    // If the removed file was locked, and now no locked files remain, clear error
    if (lockedFiles.includes(removedFile)) {
      const remainingLocked = lockedFiles.filter((f) => f !== removedFile);
      if (remainingLocked.length === 0 && onClearError) {
        onClearError();
      }
    }
  };

  return (
    <>
      <div className="grid gap-2">
        {files.map((item, index) => (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
              item.isBroken
                ? 'bg-orange-50 border-orange-300'
                : item.rowColor === 'green'
                  ? 'bg-green-50 border-green-300'
                  : item.rowColor === 'red'
                    ? 'bg-red-50 border-red-300'
                    : item.isError
                      ? 'bg-red-50 border-red-300'
                      : 'bg-slate-100 border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <FileText
                className={`w-4 h-4 flex-shrink-0 ${
                  item.isBroken
                    ? 'text-orange-500'
                    : item.isError || item.rowColor === 'red'
                      ? 'text-red-500'
                      : item.rowColor === 'green'
                        ? 'text-green-600'
                        : 'text-slate-500'
                }`}
              />
              <span
                className={`text-sm truncate ${
                  item.isBroken
                    ? 'text-orange-700 font-medium line-through'
                    : item.isError || item.rowColor === 'red'
                      ? 'text-red-700 font-medium'
                      : item.rowColor === 'green'
                        ? 'text-green-700 font-medium'
                        : ''
                }`}
              >
                {item.file.name}
                {item.isBroken && item.errorMsg && (
                  <span className="ml-2 text-xs text-orange-600 font-normal">
                    ({item.errorMsg})
                  </span>
                )}
              </span>
              {(item.hasPassword || item.isError) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 w-6 p-0 rounded-full ${
                    item.isError || item.rowColor === 'red'
                      ? 'text-red-500 hover:text-red-700 hover:bg-red-100 animate-pulse'
                      : item.isVerified || item.rowColor === 'green'
                        ? 'text-green-600 hover:text-green-700 hover:bg-green-100'
                        : 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100'
                  }`}
                  onClick={() => onUnlock(item.file.name)}
                  title={
                    item.isError
                      ? 'Click to enter password'
                      : item.isVerified || item.rowColor === 'green'
                        ? 'Password verified'
                        : 'Password saved'
                  }
                >
                  {item.isVerified || item.rowColor === 'green' ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <LockKeyhole className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
            <button
              onClick={() => handleRemove(index)}
              className="text-slate-400 hover:text-red-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      {errorMessage && lockedFiles.length > 0 && (
        <div className="text-center p-4 rounded-md font-medium border flex items-center justify-center gap-2 bg-red-50 text-red-700 border-red-200 mt-2">
          <span className="mr-2">&#9888;</span>
          {errorMessage}
        </div>
      )}
    </>
  );
}
