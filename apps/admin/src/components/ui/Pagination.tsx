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

  if (current <= 4) {
    for (let page = 2; page <= 5; page += 1) pages.push(page);
    pages.push('end-ellipsis');
  } else if (current >= total - 3) {
    pages.push('start-ellipsis');
    for (let page = total - 4; page <= total - 1; page += 1) pages.push(page);
  } else {
    pages.push('start-ellipsis');
    for (let page = current - 1; page <= current + 1; page += 1) pages.push(page);
    pages.push('end-ellipsis');
  }

  pages.push(total);
  return pages;
}

function normalizePage(page: number, total: number): number {
  if (!Number.isFinite(page)) return 1;
  return Math.min(Math.max(1, Math.floor(page)), total);
}

function normalizeTotal(totalPages: number): number {
  if (!Number.isFinite(totalPages)) return 0;
  return Math.max(0, Math.floor(totalPages));
}

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  const { t } = useTranslation();
  const total = normalizeTotal(totalPages);

  if (total <= 1) return null;

  const current = normalizePage(page, total);
  const pages = buildPages(current, total);
  const goTo = (target: number) => {
    if (!Number.isFinite(target)) return;
    const next = Math.floor(target);
    if (next < 1 || next > total || next === current) return;
    onPageChange(next);
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
            disabled={item === current || item < 1 || item > total}
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
