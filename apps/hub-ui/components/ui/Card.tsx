import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function Card({ title, icon, children, className = '', onClick }: CardProps) {
  const baseClasses = 'bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6';
  const clickableClasses = onClick ? 'cursor-pointer' : '';
  
  return (
    <div 
      className={`${baseClasses} ${clickableClasses} ${className}`}
      onClick={onClick}
    >
      {title && (
        <h3 className="text-xl font-semibold text-tafy-800 mb-3 flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}