import { cn } from '../../utils/cn';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error';
  children: React.ReactNode;
  className?: string;
}

const variantStyles = {
  default: 'bg-surface-container text-on-surface-variant border border-outline-variant',
  success: 'bg-green-100 text-green-900 border border-green-500',
  warning: 'bg-amber-100 text-amber-950 border border-amber-500',
  error: 'bg-red-100 text-red-900 border border-red-500',
};

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 label-sm', variantStyles[variant], className)}>
      {children}
    </span>
  );
}
