import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  /** Max height (px) shown while collapsed. Content taller than this collapses. */
  collapsedHeight?: number;
  className?: string;
}

/**
 * Card with a header and a body that collapses to `collapsedHeight` with a fade
 * mask + toggle when the content overflows. Used for the product description,
 * mirroring GearVN's "Đọc tiếp bài viết" behaviour. If the content is shorter
 * than the threshold, no toggle is rendered.
 */
export default function CollapsibleSection({
  title,
  children,
  collapsedHeight = 320,
  className,
}: CollapsibleSectionProps) {
  const { t } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > collapsedHeight + 24);
    check();
    // Recheck when images inside finish loading (they change scrollHeight).
    const imgs = Array.from(el.querySelectorAll('img'));
    imgs.forEach((img) => img.addEventListener('load', check));
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      imgs.forEach((img) => img.removeEventListener('load', check));
      ro.disconnect();
    };
  }, [collapsedHeight, children]);

  const collapsed = overflows && !expanded;

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl bg-surface-container-lowest shadow-[var(--shadow-level-1)]',
        className,
      )}
    >
      <h2 className="label-lg border-b border-outline-variant bg-surface-container-low px-lg py-md text-on-surface">
        {title}
      </h2>

      <div className="relative">
        <div
          ref={contentRef}
          className="px-lg py-md transition-[max-height] duration-300"
          style={collapsed ? { maxHeight: collapsedHeight, overflow: 'hidden' } : undefined}
        >
          {children}
        </div>
        {collapsed && (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-container-lowest to-transparent"
            aria-hidden
          />
        )}
      </div>

      {overflows && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="label-md flex w-full items-center justify-center gap-xs border-t border-outline-variant py-md text-primary transition-colors hover:bg-surface-container-low"
        >
          {expanded ? t('product.collapse') : t('product.readMore')}
          <svg
            className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </section>
  );
}
