import React, { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface FileDropZoneProps {
  onFilesAdded: (files: File[]) => void;
  disabled?: boolean;
}

export function FileDropZone({ onFilesAdded, disabled }: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  function handleDragEnter() {
    dragCounter.current++;
    setIsDragging(true);
  }

  function handleDragLeave() {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      setIsDragging(false);
    }
  }

  function handleDropOverlay() {
    dragCounter.current = 0;
    setIsDragging(false);
  }
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnterZone = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragEnter();
  };

  const handleDragLeaveZone = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleDragLeave();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    handleDropOverlay();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    if (droppedFiles.length > 0) {
      onFilesAdded(droppedFiles);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf'
      );
      if (newFiles.length > 0) {
        onFilesAdded(newFiles);
      }
    }
  };

  return (
    <div
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnterZone}
      onDragLeave={handleDragLeaveZone}
      onDrop={handleDrop}
      className={`border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer bg-white relative ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
    >
      <input
        type="file"
        multiple
        accept=".pdf"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled}
      />
      <div className="flex flex-col items-center gap-2">
        <Upload className="h-10 w-10 text-blue-500" />
        <p className="text-sm font-medium text-slate-600">
          Drag PDF files here or click to select
        </p>
      </div>
      {isDragging && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 transition-all">
          <span className="text-3xl font-bold text-white drop-shadow-lg">
            Drop here
          </span>
        </div>
      )}
    </div>
  );
}
