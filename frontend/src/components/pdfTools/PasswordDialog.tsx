import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useState } from 'react';
import axios from 'axios';
import { API_URL } from '@/config';

interface PasswordDialogProps {
  open: boolean;
  file: File | null;
  onSuccess: (password: string) => void;
  onCancel: () => void;
}

export function PasswordDialog({
  open,
  file,
  onSuccess,
  onCancel,
}: PasswordDialogProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordCheckError, setPasswordCheckError] = useState<string | null>(
    null
  );
  const [isChecking, setIsChecking] = useState(false);

  const handleSubmit = async () => {
    if (!password || !file) return;
    setIsChecking(true);
    setPasswordCheckError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('password', password);
      const res = await axios.post(`${API_URL}/check-password`, formData);
      if (res.data.ok) {
        setPassword('');
        setPasswordCheckError(null);
        setIsChecking(false);
        onSuccess(password);
      } else {
        setPasswordCheckError(res.data.error || 'Incorrect password');
        setIsChecking(false);
      }
    } catch (err: any) {
      setPasswordCheckError('Error checking password');
      setIsChecking(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    setPasswordCheckError(null);
    setShowPassword(false);
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>Unlock Locked File</span>
          </DialogTitle>
          <DialogDescription>
            Enter the password for the file:
            <div className="mt-1 font-bold text-slate-800 break-all" dir="ltr">
              {file?.name || ''}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
              className="pr-10"
              disabled={isChecking}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              disabled={isChecking}
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
            onClick={handleCancel}
            disabled={isChecking}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isChecking || !password || !file}
          >
            {isChecking ? 'Checking...' : 'Check Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
