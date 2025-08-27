import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({
  title,
  icon,
  children,
  className = '',
  onClick,
}: CardProps) {
  const baseClasses =
    'bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 hover:shadow-lg dark:hover:shadow-gray-900/70 transition-shadow p-6';
  const clickableClasses = onClick ? 'cursor-pointer' : '';

  return (
    <div
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <h3 className="text-xl font-semibold text-tafy-800 dark:text-tafy-200 mb-3 flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
