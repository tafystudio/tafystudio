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
    focus:outline-none focus:ring-2 focus:ring-tafy-500 focus:border-transparent
    disabled:bg-gray-100 disabled:cursor-not-allowed
  `;
  
  const errorClasses = error 
    ? 'border-red-500 focus:ring-red-500' 
    : 'border-gray-300';

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        className={`${baseClasses} ${errorClasses} ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}