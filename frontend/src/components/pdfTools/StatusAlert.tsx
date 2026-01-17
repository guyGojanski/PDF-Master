import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface StatusAlertProps {
  status: {
    type: 'success' | 'error' | 'loading' | '';
    message: string;
  };
}

export function StatusAlert({ status }: StatusAlertProps) {
  if (!status.message) return null;

  const styles = {
    error: 'bg-red-50 text-red-700 border-red-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    loading: 'bg-blue-50 text-blue-700 border-blue-200',
    '': '',
  };

  const icons = {
    error: <AlertCircle className="w-5 h-5" />,
    success: <CheckCircle2 className="w-5 h-5" />,
    loading: <Info className="w-5 h-5 animate-pulse" />,
    '': null,
  };

  return (
    <div
      className={`text-center p-4 rounded-md font-medium border flex items-center justify-center gap-2 ${styles[status.type]}`}
    >
      {icons[status.type]}
      {status.message}
    </div>
  );
}
