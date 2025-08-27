import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  const baseClasses = `
    w-full px-3 py-2 border rounded-md
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
    focus:outline-none focus:ring-2 focus:ring-tafy-500 focus:border-transparent
    disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
  `;

  const errorClasses = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-300 dark:border-gray-600';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
