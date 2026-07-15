import type { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-surface-container text-on-surface-variant',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-on-surface',
  error: 'bg-error-container text-on-error-container',
};

export default function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'label-sm inline-flex items-center rounded-full px-2.5 py-1 font-semibold',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
