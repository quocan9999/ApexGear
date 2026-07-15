import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

export function buildPages(current: number, total: number): PageItem[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages: PageItem[] = [1];
  if (current > 4) pages.push('start-ellipsis');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let page = start; page <= end; page += 1) pages.push(page);

  if (current < total - 3) pages.push('end-ellipsis');
  pages.push(total);
  return pages;
}

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const { t } = useTranslation();
  const total = Math.max(0, Math.floor(totalPages));

  if (total <= 1) return null;

  const current = Math.min(Math.max(1, Math.floor(page)), total);
  const pages = buildPages(current, total);
  const goTo = (target: number) => {
    if (target < 1 || target > total || target === current) return;
    onPageChange(target);
  };

  const baseButton =
    'label-md inline-flex h-10 min-w-10 items-center justify-center rounded border px-sm transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const idleButton =
    'border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low';

  return (
    <nav aria-label={t('pagination.navigation')} className={cn('flex flex-wrap items-center justify-center gap-xs', className)}>
      <button
        type="button"
        onClick={() => goTo(current - 1)}
        disabled={current === 1}
        aria-label={t('pagination.previous')}
        className={cn(baseButton, idleButton)}
      >
        <span aria-hidden="true">‹</span>
      </button>

      {pages.map((item) =>
        typeof item !== 'number' ? (
          <span
            key={item}
            aria-hidden="true"
            className="inline-flex h-10 min-w-10 items-center justify-center text-outline"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => goTo(item)}
            disabled={item === current}
            aria-current={item === current ? 'page' : undefined}
            aria-label={t('pagination.page', { page: item })}
            className={cn(
              baseButton,
              item === current
                ? 'border-primary bg-primary text-on-primary'
                : idleButton,
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => goTo(current + 1)}
        disabled={current === total}
        aria-label={t('pagination.next')}
        className={cn(baseButton, idleButton)}
      >
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
