import type { HTMLAttributes, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  variant?: ToastVariant;
  onDismiss: () => void;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-success/30 bg-success/10 text-on-surface',
  error: 'border-error/30 bg-error-container text-on-error-container',
  warning: 'border-warning/30 bg-warning/10 text-on-surface',
  info: 'border-primary/30 bg-surface-container-lowest text-on-surface',
};

export default function Toast({
  title,
  description,
  variant = 'info',
  onDismiss,
  className,
  ...props
}: ToastProps) {
  const { t } = useTranslation();

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      data-toast
      className={cn(
        'flex w-full items-start gap-sm rounded-lg border p-md shadow-[var(--shadow-level-2)]',
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      <div className="min-w-0 flex-1">
        <p className="label-md break-words">{title}</p>
        {description && <div className="body-sm mt-xs break-words opacity-80">{description}</div>}
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t('toast.dismiss')}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-current opacity-70 transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span aria-hidden="true">×</span>
      </button>
    </div>
  );
}
