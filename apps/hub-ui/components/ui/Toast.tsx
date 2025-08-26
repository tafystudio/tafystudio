import { useEffect } from 'react';

interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose: () => void;
}

export default function Toast({
  message,
  variant = 'info',
  duration = 5000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variantClasses = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: '✅',
      text: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: '❌',
      text: 'text-red-800',
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200',
      icon: '⚠️',
      text: 'text-yellow-800',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: 'ℹ️',
      text: 'text-blue-800',
    },
  };

  const classes = variantClasses[variant];

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg border shadow-lg transition-all transform translate-y-0 ${classes.bg}`}
      role="alert"
    >
      <div className="flex items-start">
        <span className="text-xl mr-3" role="img" aria-label={variant}>
          {classes.icon}
        </span>
        <p className={`flex-1 ${classes.text}`}>{message}</p>
        <button
          onClick={onClose}
          className={`ml-4 ${classes.text} hover:opacity-70 transition-opacity`}
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
