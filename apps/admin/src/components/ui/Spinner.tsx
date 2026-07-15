import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface SpinnerProps {
  className?: string;
  fullscreen?: boolean;
  label?: string;
}

export default function Spinner({ className, fullscreen = false, label }: SpinnerProps) {
  const { t } = useTranslation();
  const accessibleLabel = label ?? t('common.loading');
  const spinner = (
    <span
      role="status"
      aria-label={accessibleLabel}
      className={cn('inline-flex shrink-0 items-center justify-center', className)}
    >
      <span
        aria-hidden="true"
        className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent text-primary"
      />
    </span>
  );

  if (!fullscreen) return spinner;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface" aria-busy="true">
      {spinner}
    </div>
  );
}
