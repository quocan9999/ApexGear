import { cn } from '../../utils/cn';

interface ToastProps {
  variant?: 'success' | 'error' | 'info';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  success: 'bg-green-50 text-green-700 border-green-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export default function Toast({ variant = 'info', children, className }: ToastProps) {
  return (
    <div
      role="status"
      className={cn(
        'inline-flex items-center rounded-lg border px-4 py-2 body-md shadow-[var(--shadow-level-1)]',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </div>
  );
}
