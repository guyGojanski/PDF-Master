// Password and verification state logic (from useFilePasswords)
import { useState } from "react";

export function usePasswordState() {
  const [filePasswords, setFilePasswords] = useState<Record<string, string>>({});
  const [passwordVerified, setPasswordVerified] = useState<Record<string, boolean>>({});

  function setPassword(fileName: string, password: string) {
    setFilePasswords(prev => ({ ...prev, [fileName]: password }));
  }

  function setVerified(fileName: string, verified: boolean) {
    setPasswordVerified(prev => ({ ...prev, [fileName]: verified }));
  }

  function removePassword(fileName: string) {
    setFilePasswords(prev => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });
    setPasswordVerified(prev => {
      const copy = { ...prev };
      delete copy[fileName];
      return copy;
    });
  }

  function resetPasswords() {
    setFilePasswords({});
    setPasswordVerified({});
  }

  return {
    filePasswords,
    passwordVerified,
    setPassword,
    setVerified,
    removePassword,
    resetPasswords,
  };
}
/**
 * PasswordDialog component
 * -----------------------
 * Modal dialog for entering and verifying a password for a locked PDF file.
 * Handles password input, show/hide toggle, error display, and submit/cancel actions.
 *
 * Props:
 * - open: whether the dialog is open
 * - fileName: name of the file being unlocked
 * - password: current password value
 * - showPassword: show/hide password state
 * - passwordCheckError: error message to display
 * - onPasswordChange: handler for password input change
 * - onShowPasswordToggle: handler for toggling password visibility
 * - onSubmit: handler for submitting the password
 * - onCancel: handler for closing the dialog
 *
 * Usage: Use in merge, split, or any PDF tool that needs password entry for locked files.
 */
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { FiEye, FiEyeOff } from "react-icons/fi";

interface PasswordDialogProps {
  open: boolean;
  fileName: string;
  password: string;
  showPassword: boolean;
  passwordCheckError: string | null;
  onPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function PasswordDialog({
  open,
  fileName,
  password,
  showPassword,
  passwordCheckError,
  onPasswordChange,
  onShowPasswordToggle,
  onSubmit,
  onCancel,
}: PasswordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            <span>Unlock Locked File</span>
          </DialogTitle>
          <DialogDescription>
            Enter the password for the file:
            <div className="mt-1 font-bold text-slate-800 break-all" dir="ltr">
              {fileName}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password..."
              value={password}
              onChange={e => onPasswordChange(e.target.value)}
              onKeyDown={e => e.key === "Enter" && onSubmit()}
              autoFocus
              className="pr-10"
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600"
              onClick={onShowPasswordToggle}
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>
          {passwordCheckError && (
            <div className="text-red-600 text-sm">{passwordCheckError}</div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={onSubmit}>Check Password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
