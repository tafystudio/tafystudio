interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

export default function Skeleton({
  className = '',
  variant = 'text',
  animation = 'pulse',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  const baseClasses = animation === 'wave' ? '' : 'bg-gray-200';

  const style: React.CSSProperties = {
    width: width,
    height: height || (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
    />
  );
}

// Skeleton group for loading cards
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
      <div className="flex justify-between items-start">
        <Skeleton variant="text" width="60%" height={24} />
        <Skeleton variant="rectangular" width={80} height={24} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="50%" />
        <Skeleton variant="text" width="45%" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" width="48%" height={36} />
        <Skeleton variant="rectangular" width="48%" height={36} />
      </div>
    </div>
  );
}
