import { FileCard } from './FileCard';

export interface FileGridItem {
  file: File;
  isLocked: boolean;
  isVerified: boolean;
  isError: boolean;
  errorMessage?: string;
  password?: string;
  rotation: number;
}

interface FileGridProps {
  items: FileGridItem[];
  onFilesChange: (files: File[]) => void;
  onUnlock: (fileName: string) => void;
  onCheckLock?: (file: File) => void;
  onRotate: (fileName: string) => void;
}

export function FileGrid({
  items,
  onFilesChange,
  onUnlock,
  onCheckLock,
  onRotate,
}: FileGridProps) {
  const handleDelete = (index: number) => {
    const newFiles = items.map((item) => item.file);
    newFiles.splice(index, 1);
    onFilesChange(newFiles);
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 p-4 bg-slate-50/50 rounded-lg border border-slate-200 min-h-[200px]">
      {items.map((item, index) => (
        <FileCard
          key={`${item.file.name}-${index}`}
          file={item.file}
          index={index}
          onDelete={() => handleDelete(index)}
          onUnlock={() => onUnlock(item.file.name)}
          onThumbnailError={() => onCheckLock && onCheckLock(item.file)}
          onRotate={() => onRotate(item.file.name)}
          rotation={item.rotation}
          isLocked={item.isLocked}
          isVerified={item.isVerified}
          isError={item.isError}
          errorMessage={item.errorMessage}
          password={item.password}
        />
      ))}
    </div>
  );
}
