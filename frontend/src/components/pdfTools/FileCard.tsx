import { useState, useEffect } from 'react';
import { FileText, Trash2, RotateCw, Lock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { truncateFilename, formatFileSize } from '@/lib/formatters';
import { getPdfThumbnailUrl } from '@/lib/pdfThumbnails';

interface FileCardProps {
  file: File;
  index: number;
  onDelete: () => void;
  onRotate?: () => void;
  onUnlock?: () => void;
  onThumbnailError?: () => void;
  isLocked?: boolean;
  isError?: boolean;
  isVerified?: boolean;
  errorMessage?: string;
  password?: string;
  rotation?: number;
}

export function FileCard({
  file,
  index,
  onDelete,
  onRotate,
  onUnlock,
  onThumbnailError,
  isLocked,
  isError,
  isVerified,
  errorMessage,
  password,
  rotation = 0,
}: FileCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (
      (!isLocked || password) &&
      !isError &&
      file.type === 'application/pdf'
    ) {
      getPdfThumbnailUrl(file, password)
        .then((url) => {
          if (isMounted) setThumbnailUrl(url);
        })
        .catch(() => {
          if (!password && onThumbnailError) onThumbnailError();
        });
    }

    return () => {
      isMounted = false;
    };
  }, [file, isLocked, isError, password]);

  return (
    <div
      className={`group relative w-[150px] h-[200px] rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md
        ${
          isLocked
            ? 'border-red-300 bg-red-50'
            : isVerified
              ? 'border-green-300 bg-green-50'
              : isError
                ? 'border-orange-300 bg-orange-50'
                : 'border-slate-200 bg-white hover:border-blue-300'
        }
      `}
      title={file.name}
    >
      <div className="absolute top-2 left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-200/80 text-xs font-bold text-slate-600">
        {index + 1}
      </div>

      <div className="flex h-full flex-col items-center justify-center p-2 text-center overflow-hidden">
        <div className="mb-2 flex-grow flex items-center justify-center w-full h-24 overflow-hidden rounded-md bg-white/50">
          {isLocked ? (
            <Lock className="h-10 w-10 text-red-400" />
          ) : isError ? (
            <AlertCircle className="h-10 w-10 text-orange-400" />
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Page 1"
              className="object-contain w-full h-full shadow-sm rounded border border-slate-100 transition-transform duration-300"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          ) : (
            <FileText
              className={`h-10 w-10 ${isVerified ? 'text-green-500' : 'text-slate-400'}`}
            />
          )}
        </div>

        <div className="w-full px-1">
          <p className="text-xs font-medium text-slate-700 break-words leading-tight truncate">
            {truncateFilename(file.name, 15)}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>

      <div className="absolute inset-0 z-20 hidden flex-col items-center justify-center gap-2 rounded-xl bg-black/60 backdrop-blur-[1px] transition-all group-hover:flex">
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8 rounded-full shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove file"
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        {onRotate && !isLocked && !isError && (
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
            title="Rotate"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
        )}

        {isLocked && onUnlock && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full shadow-lg bg-white text-black hover:bg-slate-200"
            onClick={(e) => {
              e.stopPropagation();
              onUnlock();
            }}
            title="Unlock PDF"
          >
            <Lock className="h-4 w-4" />
          </Button>
        )}
      </div>

      {errorMessage && (
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-bold text-red-600 px-2 truncate bg-red-100/90 py-1">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
