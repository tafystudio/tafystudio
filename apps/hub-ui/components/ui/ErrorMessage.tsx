interface ErrorMessageProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  variant?: 'error' | 'warning';
  className?: string;
}

export default function ErrorMessage({
  title = 'Error',
  message,
  details,
  onRetry,
  variant = 'error',
  className = '',
}: ErrorMessageProps) {
  const variantClasses = {
    error: {
      container: 'bg-red-50 border-red-200',
      icon: '❌',
      title: 'text-red-800',
      message: 'text-red-700',
      details: 'text-red-600',
      button: 'text-red-600 hover:bg-red-100',
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200',
      icon: '⚠️',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      details: 'text-yellow-600',
      button: 'text-yellow-600 hover:bg-yellow-100',
    },
  };

  const classes = variantClasses[variant];

  return (
    <div className={`rounded-lg border p-4 ${classes.container} ${className}`}>
      <div className="flex items-start">
        <span className="text-2xl mr-3" role="img" aria-label={variant}>
          {classes.icon}
        </span>
        <div className="flex-1">
          <h3 className={`font-semibold mb-1 ${classes.title}`}>{title}</h3>
          <p className={`${classes.message}`}>{message}</p>
          {details && (
            <details className="mt-2">
              <summary className={`cursor-pointer text-sm ${classes.details}`}>
                Show details
              </summary>
              <pre className="mt-2 text-xs font-mono whitespace-pre-wrap overflow-x-auto bg-white bg-opacity-50 p-2 rounded">
                {details}
              </pre>
            </details>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className={`mt-3 text-sm font-medium px-3 py-1 rounded-md transition-colors ${classes.button}`}
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
