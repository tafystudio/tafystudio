import { ReactNode } from 'react';
import Button from './Button';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  children?: ReactNode;
}

export default function EmptyState({
  icon = '📦',
  title,
  description,
  action,
  children,
}: EmptyStateProps) {
  return (
    <div className="text-center py-12 px-4">
      {icon && (
        <div className="text-6xl mb-4" role="img" aria-label="empty state icon">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      )}
      {action && (
        <Button
          variant={action.variant || 'primary'}
          onClick={action.onClick}
          className="mb-4"
        >
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
}
