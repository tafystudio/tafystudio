import Spinner from './Spinner';

interface LoadingStateProps {
  message?: string;
  fullPage?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function LoadingState({
  message = 'Loading...',
  fullPage = false,
  size = 'md',
}: LoadingStateProps) {
  const containerClasses = fullPage
    ? 'fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'
    : 'flex flex-col items-center justify-center py-12';

  return (
    <div className={containerClasses}>
      <Spinner size={size} />
      {message && <p className="mt-4 text-gray-600 text-center">{message}</p>}
    </div>
  );
}
