import { useState, useEffect } from 'react';
import {
  FileText,
  Trash2,
  RotateCw,
  Lock,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { truncateFilename, formatFileSize } from '@/lib/formatters';
import { getPdfThumbnailUrl } from '@/lib/pdfThumbnails';

interface FileCardProps {
  file: File;
  index: number;
  onDelete: () => void;
  onRotate?: () => void;
  onUnlock?: () => void;
  isLocked?: boolean;
  isError?: boolean;
  isVerified?: boolean;
  errorMessage?: string;
}

export function FileCard({
  file,
  index,
  onDelete,
  onRotate,
  onUnlock,
  isLocked,
  isError,
  isVerified,
  errorMessage,
}: FileCardProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setThumbnailUrl(null);

    if (!isLocked && !isError && file.type === 'application/pdf') {
      getPdfThumbnailUrl(file)
        .then((url) => {
          if (isMounted) setThumbnailUrl(url);
        })
        .catch(() => {
          console.warn('Failed thumbnail generation:', file.name);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [file, isLocked, isError]);

  return (
    <div
      className={`group relative w-40 h-52 rounded-xl border-2 transition-all duration-200 shadow-sm hover:shadow-md
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
            <Lock className="h-12 w-12 text-red-400" />
          ) : isError ? (
            <AlertCircle className="h-12 w-12 text-orange-400" />
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt="Page 1"
              className="object-contain w-full h-full shadow-sm rounded border border-slate-100"
            />
          ) : (
            <FileText
              className={`h-12 w-12 ${
                isVerified ? 'text-green-500' : 'text-slate-400'
              }`}
            />
          )}
        </div>

        <div className="w-full px-1">
          <p className="text-sm font-medium text-slate-700 break-words leading-tight truncate">
            {truncateFilename(file.name)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>

      <div className="absolute inset-0 z-20 hidden flex-col items-center justify-center gap-3 rounded-xl bg-black/60 backdrop-blur-[1px] transition-all group-hover:flex">
        <Button
          variant="destructive"
          size="icon"
          className="h-10 w-10 rounded-full shadow-lg"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Remove file"
        >
          <Trash2 className="h-5 w-5" />
        </Button>

        {onRotate && (
          <Button
            variant="secondary"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onRotate();
            }}
            title="Rotate"
          >
            <RotateCw className="h-5 w-5" />
          </Button>
        )}

        {(isLocked || isVerified) && onUnlock && (
          <Button
            variant={isVerified ? 'default' : 'outline'}
            size="icon"
            className={`h-10 w-10 rounded-full shadow-lg ${
              isVerified
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-white text-black hover:bg-slate-200'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onUnlock();
            }}
            title={isVerified ? 'Verified' : 'Unlock PDF'}
          >
            {isVerified ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Lock className="h-5 w-5" />
            )}
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
