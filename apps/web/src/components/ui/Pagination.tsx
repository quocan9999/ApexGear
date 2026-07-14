import { cn } from '../../utils/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * Build a windowed page list, e.g. [1, '…', 4, 5, 6, '…', 12].
 */
function buildPages(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | '…')[] = [];
  const add = (n: number | '…') => pages.push(n);

  add(1);
  if (current > 4) add('…');

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) add(i);

  if (current < total - 3) add('…');
  add(total);

  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = buildPages(page, totalPages);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  const baseBtn =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-md body-sm font-medium transition-colors';
  const idleBtn =
    'border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container';
  const activeBtn = 'bg-primary text-on-primary border border-primary';

  return (
    <nav
      aria-label="Pagination"
      className={cn('flex flex-wrap items-center justify-center gap-xs', className)}
    >
      <button
        type="button"
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        className={cn(baseBtn, 'px-md', idleBtn, !canPrev && 'opacity-40 pointer-events-none')}
        aria-label="Previous page"
      >
        ‹
      </button>

      {pages.map((p, idx) =>
        p === '…' ? (
          <span
            key={`ellipsis-${idx}`}
            className="inline-flex h-10 min-w-10 items-center justify-center text-outline"
            aria-hidden
          >
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={cn(baseBtn, 'px-sm', p === page ? activeBtn : idleBtn)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        className={cn(baseBtn, 'px-md', idleBtn, !canNext && 'opacity-40 pointer-events-none')}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
