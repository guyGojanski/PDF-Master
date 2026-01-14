import { useState, useRef } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileText, Upload, X, LockKeyhole, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export function MergeTab() {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [files, setFiles] = useState<File[]>([]);
  const [filePasswords, setFilePasswords] = useState<Record<string, string>>(
    {}
  );
  const [lockedFiles, setLockedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | 'loading' | '';
    message: string;
  }>({ type: '', message: '' });
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [fileToUnlock, setFileToUnlock] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [passwordVerified, setPasswordVerified] = useState<
    Record<string, boolean>
  >({});
  const [passwordCheckError, setPasswordCheckError] = useState<string | null>(
    null
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errorPopup, setErrorPopup] = useState<string | null>(null);
  const [rowStatus, setRowStatus] = useState<
    Record<string, 'green' | 'red' | undefined>
  >({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.type === 'application/pdf');
    if (files.length + droppedFiles.length > 20) {
      setErrorPopup('You cannot select more than 20 files.');
      return;
    }
    setFiles((prev) => [...prev, ...droppedFiles]);
    setStatus({ type: '', message: '' });
    setLockedFiles([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files || []);
      if (files.length + newFiles.length > 20) {
        setErrorPopup('You cannot select more than 20 files.');
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
      setStatus({ type: '', message: '' });
      setLockedFiles([]);
    }
    dragCounter.current = 0;
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    const fileToRemove = newFiles[index];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    const newPasswords = { ...filePasswords };
    delete newPasswords[fileToRemove.name];
    setFilePasswords(newPasswords);
    const newVerified = { ...passwordVerified };
    delete newVerified[fileToRemove.name];
    setPasswordVerified(newVerified);
    setLockedFiles((prev) => prev.filter((name) => name !== fileToRemove.name));
    setRowStatus((prev) => {
      const copy = { ...prev };
      delete copy[fileToRemove.name];
      return copy;
    });
  };

  const openUnlockModal = (fileName: string) => {
    setFileToUnlock(fileName);
    setTempPassword('');
    setPasswordCheckError(null);
    setShowPassword(false);
    setIsPasswordModalOpen(true);
  };

  const handlePasswordSubmit = async () => {
    if (!tempPassword) return;
    const file = files.find((f) => f.name === fileToUnlock);
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', tempPassword);
    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/check-password',
        formData
      );
      if (res.data.ok) {
        setFilePasswords((prev) => ({ ...prev, [fileToUnlock]: tempPassword }));
        setPasswordVerified((prev) => ({ ...prev, [fileToUnlock]: true }));
        setIsPasswordModalOpen(false);
        setPasswordCheckError(null);
        setLockedFiles((prev) => prev.filter((name) => name !== fileToUnlock));
        setRowStatus((prev) => ({ ...prev, [fileToUnlock]: 'green' }));
        if (lockedFiles.length <= 1) {
          setStatus({ type: '', message: '' });
        }
      } else {
        setPasswordCheckError(res.data.error || 'Incorrect password');
        setRowStatus((prev) => ({ ...prev, [fileToUnlock]: 'red' }));
      }
    } catch (e) {
      setPasswordCheckError('Error checking password');
      setRowStatus((prev) => ({ ...prev, [fileToUnlock]: 'red' }));
    }
  };

  const canMerge =
    files.length > 0 &&
    files.length <= 20 &&
    files.every((f) => {
      if (filePasswords[f.name]) {
        return passwordVerified[f.name];
      }
      return true;
    });

  const handleMergeClick = async () => {
    if (files.length === 0) return;
    setIsUploading(true);
    setStatus({ type: 'loading', message: 'Processing files... ⏳' });
    setLockedFiles([]);
    const newRowStatus: Record<string, 'green' | 'red'> = {};
    files.forEach((f) => {
      if (filePasswords[f.name]) {
        newRowStatus[f.name] = passwordVerified[f.name] ? 'green' : 'red';
      } else {
        newRowStatus[f.name] = 'green';
      }
    });
    setRowStatus(newRowStatus);
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('passwords', JSON.stringify(filePasswords));
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/merge',
        formData,
        {
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'merged.pdf');
      document.body.appendChild(link);
      link.click();
      setStatus({
        type: 'success',
        message: 'Merge completed successfully! 🎉',
      });
      setFiles([]);
      setFilePasswords({});
      setPasswordVerified({});
      setLockedFiles([]);
      setRowStatus({});
    } catch (error: any) {
      console.error('Merge error:', error);
      let errorData: any = {};
      if (error.response?.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          errorData = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse error blob:', e);
        }
      } else {
        errorData = error.response?.data || {};
      }
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 423) {
          let lockedList: string[] = [];
          try {
            lockedList = JSON.parse(errorData.detail);
          } catch {
            lockedList = [errorData.detail || 'Unknown File'];
          }
          setLockedFiles(lockedList);
          setStatus({
            type: 'error',
            message: `${lockedList.length} locked files found. Click the red locks to enter a password.`,
          });
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
        } else {
          const errorMsg =
            errorData.detail || errorData.error || 'Unknown server error';
          setStatus({ type: 'error', message: `Error: ${errorMsg} ❌` });
        }
      } else {
        setStatus({ type: 'error', message: 'Connection error to server ❌' });
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Merge PDF Files</CardTitle>
        <CardDescription>
          Select multiple files to merge them into one.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current++;
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current--;
            if (dragCounter.current <= 0) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          className="border-2 border-dashed border-slate-300 rounded-lg p-10 text-center hover:bg-slate-50 transition-colors cursor-pointer bg-white relative"
        >
          <input
            type="file"
            multiple
            accept=".pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-10 w-10 text-blue-500" />
            <p className="text-sm font-medium text-slate-600">
              Drag files here or click to select
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
        {files.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-slate-700">
              Selected files ({files.length}):
            </h4>
            <div className="grid gap-2">
              {files.map((file, index) => {
                const hasPassword = !!filePasswords[file.name];
                const isVerified = !!passwordVerified[file.name];
                const isError = lockedFiles.includes(file.name);
                const rowColor = rowStatus[file.name];
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-md border transition-colors ${
                      rowColor === 'green'
                        ? 'bg-green-50 border-green-300'
                        : rowColor === 'red'
                          ? 'bg-red-50 border-red-300'
                          : isError
                            ? 'bg-red-50 border-red-300'
                            : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileText
                        className={`w-4 h-4 flex-shrink-0 ${isError || rowColor === 'red' ? 'text-red-500' : rowColor === 'green' ? 'text-green-600' : 'text-slate-500'}`}
                      />
                      <span
                        className={`text-sm truncate ${isError || rowColor === 'red' ? 'text-red-700 font-medium' : rowColor === 'green' ? 'text-green-700 font-medium' : ''}`}
                      >
                        {file.name}
                      </span>
                      {(hasPassword || isError) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-6 w-6 p-0 rounded-full ${
                            isError || rowColor === 'red'
                              ? 'text-red-500 hover:text-red-700 hover:bg-red-100 animate-pulse'
                              : isVerified || rowColor === 'green'
                                ? 'text-green-600 hover:text-green-700 hover:bg-green-100'
                                : 'text-yellow-500 hover:text-yellow-600 hover:bg-yellow-100'
                          }`}
                          onClick={() => openUnlockModal(file.name)}
                          title={
                            isError
                              ? 'Click to enter password'
                              : isVerified
                                ? 'Password verified'
                                : 'Password saved'
                          }
                        >
                          {isVerified || rowColor === 'green' ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <LockKeyhole className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <Button
              onClick={handleMergeClick}
              disabled={isUploading || !canMerge}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
            >
              {isUploading ? 'Processing...' : 'Merge files now 🚀'}
            </Button>
          </div>
        )}
        {status.message && (
          <div
            className={`text-center p-4 rounded-md font-medium border flex items-center justify-center gap-2 ${
              status.type === 'error'
                ? 'bg-red-50 text-red-700 border-red-200'
                : status.type === 'success'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}
          >
            {status.type === 'error' && <AlertCircle className="w-5 h-5" />}
            {status.message}
          </div>
        )}
        {errorPopup && (
          <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {errorPopup}
            <button
              className="ml-4 text-white text-lg"
              onClick={() => setErrorPopup(null)}
            >
              &times;
            </button>
          </div>
        )}
        <Dialog
          open={isPasswordModalOpen}
          onOpenChange={setIsPasswordModalOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-600" />
                <span>Unlock Locked File</span>
              </DialogTitle>
              <DialogDescription>
                Enter the password for the file:
                <div
                  className="mt-1 font-bold text-slate-800 break-all"
                  dir="ltr"
                >
                  {fileToUnlock}
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password..."
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                  autoFocus
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              {passwordCheckError && (
                <div className="text-red-600 text-sm">{passwordCheckError}</div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handlePasswordSubmit}>Check Password</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default MergeTab;
