/**
 * FileList component
 * ------------------
 * Displays a list of PDF files with their status (green/red/normal),
 * password status, and allows removing files or opening the password dialog for locked files.
 * Used in the merge tab to show all selected files and their current state.
 *
 * Props:
 * - files: Array of FileListItem (file, password status, error, color)
 * - onRemove: function to remove a file by index
 * - onUnlock: function to open password dialog for a file
 */
import React from 'react';
import { FileText, X, CheckCircle2, LockKeyhole } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface FileListItem {
  file: File;
  hasPassword: boolean;
  isVerified: boolean;
  isError: boolean;
  rowColor?: 'green' | 'red';
}

interface FileListProps {
  files: FileListItem[];
  onRemove: (index: number) => void;
  onUnlock: (fileName: string) => void;
}

export function FileList({ files, onRemove, onUnlock }: FileListProps) {
  return (
    <div className="grid gap-2">
      {files.map((item, index) => (
        <div
          key={index}
          className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
            item.rowColor === 'green'
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
                item.isError || item.rowColor === 'red'
                  ? 'text-red-500'
                  : item.rowColor === 'green'
                    ? 'text-green-600'
                    : 'text-slate-500'
              }`}
            />
            <span
              className={`text-sm truncate ${
                item.isError || item.rowColor === 'red'
                  ? 'text-red-700 font-medium'
                  : item.rowColor === 'green'
                    ? 'text-green-700 font-medium'
                    : ''
              }`}
            >
              {item.file.name}
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
            onClick={() => onRemove(index)}
            className="text-slate-400 hover:text-red-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
