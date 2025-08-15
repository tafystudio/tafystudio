interface StatusBadgeProps {
  status: 'online' | 'offline' | 'discovered' | 'claimed' | 'error' | 'warning';
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const statusConfig = {
    online: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      dotColor: 'bg-green-500',
      defaultLabel: 'Online',
    },
    offline: {
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      dotColor: 'bg-gray-500',
      defaultLabel: 'Offline',
    },
    discovered: {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      dotColor: 'bg-blue-500',
      defaultLabel: 'Discovered',
    },
    claimed: {
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-800',
      dotColor: 'bg-purple-500',
      defaultLabel: 'Claimed',
    },
    error: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      dotColor: 'bg-red-500',
      defaultLabel: 'Error',
    },
    warning: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      dotColor: 'bg-yellow-500',
      defaultLabel: 'Warning',
    },
  };

  const config = statusConfig[status];
  const displayLabel = label || config.defaultLabel;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      <span className={`w-2 h-2 rounded-full ${config.dotColor} mr-1.5 ${status === 'online' ? 'animate-pulse' : ''}`}></span>
      {displayLabel}
    </span>
  );
}