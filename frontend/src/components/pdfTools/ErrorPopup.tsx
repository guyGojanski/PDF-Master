import { AlertCircle } from 'lucide-react';

interface ErrorPopupProps {
  message: string;
  onClose: () => void;
}

export function ErrorPopup({ message, onClose }: ErrorPopupProps) {
  if (!message) return null;
  return (
    <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
      <AlertCircle className="w-5 h-5" />
      {message}
      <button
        className="ml-4 text-white text-lg"
        onClick={onClose}
        aria-label="Close error popup"
      >
        &times;
      </button>
    </div>
  );
}
