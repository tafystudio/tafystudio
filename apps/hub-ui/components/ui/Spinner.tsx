interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-tafy-200 border-t-tafy-600`}
      />
    </div>
  );
}