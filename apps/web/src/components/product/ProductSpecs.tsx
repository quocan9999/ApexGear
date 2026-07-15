import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { ProductSpec } from '../../types';

interface ProductSpecsProps {
  specs: ProductSpec[];
  className?: string;
  /** Rows shown before the panel collapses the remainder. */
  collapsedRows?: number;
}

interface Grouped {
  group: string;
  items: ProductSpec[];
}

export default function ProductSpecs({
  specs,
  className,
  collapsedRows = 6,
}: ProductSpecsProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const groups = useMemo<Grouped[]>(() => {
    const map = new Map<string, ProductSpec[]>();
    const ordered: string[] = [];
    [...specs]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .forEach((spec) => {
        const key = spec.group ?? t('product.specGeneral');
        if (!map.has(key)) {
          map.set(key, []);
          ordered.push(key);
        }
        map.get(key)!.push(spec);
      });
    return ordered.map((g) => ({ group: g, items: map.get(g)! }));
  }, [specs, t]);

  const totalRows = specs.length;
  const canCollapse = totalRows > collapsedRows;

  if (groups.length === 0) return null;

  // Flatten to a single ordered list of [group?, spec] so the collapse cut can
  // fall anywhere — the panel reads as one continuous table like the reference.
  let shown = 0;
  const visibleGroups = groups
    .map((g) => {
      if (expanded || !canCollapse) return g;
      if (shown >= collapsedRows) return { ...g, items: [] };
      const remaining = collapsedRows - shown;
      const items = g.items.slice(0, remaining);
      shown += items.length;
      return { ...g, items };
    })
    .filter((g) => g.items.length > 0);

  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl bg-surface-container-lowest shadow-[var(--shadow-level-1)]',
        className,
      )}
      aria-labelledby="specs-heading"
    >
      <h2
        id="specs-heading"
        className="label-lg border-b border-outline-variant bg-surface-container-low px-lg py-md text-on-surface"
      >
        {t('product.specifications')}
      </h2>

      <div className="px-lg py-md">
        {visibleGroups.map((g) => (
          <div key={g.group} className="mb-md last:mb-0">
            {groups.length > 1 && (
              <h3 className="label-md mb-sm text-primary">{g.group}</h3>
            )}
            <dl className="flex flex-col">
              {g.items.map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-baseline gap-md border-b border-outline-variant/60 py-sm last:border-b-0"
                >
                  <dt className="body-sm w-2/5 flex-shrink-0 text-on-surface-variant">
                    {spec.name}
                  </dt>
                  <dd className="body-sm flex-1 font-medium text-on-surface">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="label-md flex w-full items-center justify-center gap-xs border-t border-outline-variant py-md text-primary transition-colors hover:bg-surface-container-low"
        >
          {expanded ? t('product.collapseSpecs') : t('product.viewDetailSpecs')}
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
