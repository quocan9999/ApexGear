import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import type { ProductSpec } from '../../types';

interface ProductSpecsProps {
  specs: ProductSpec[];
  className?: string;
}

interface Grouped {
  group: string;
  items: ProductSpec[];
}

export default function ProductSpecs({ specs, className }: ProductSpecsProps) {
  const { t } = useTranslation();

  const groups = useMemo<Grouped[]>(() => {
    const map = new Map<string, ProductSpec[]>();
    const ordered: string[] = [];
    [...specs]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach((spec) => {
        const key = spec.group ?? 'General';
        if (!map.has(key)) {
          map.set(key, []);
          ordered.push(key);
        }
        map.get(key)!.push(spec);
      });
    return ordered.map((g) => ({ group: g, items: map.get(g)! }));
  }, [specs]);

  if (groups.length === 0) return null;

  return (
    <section className={cn('flex flex-col gap-md', className)} aria-labelledby="specs-heading">
      <h2 id="specs-heading" className="headline-md text-on-surface">
        {t('product.specifications')}
      </h2>
      <div className="grid grid-cols-1 gap-md md:grid-cols-2">
        {groups.map((g) => (
          <article
            key={g.group}
            className="rounded-xl bg-surface-container-lowest p-md shadow-[var(--shadow-level-1)]"
          >
            <h3 className="label-lg mb-md text-on-surface">{g.group}</h3>
            <dl className="flex flex-col gap-sm">
              {g.items.map((spec) => (
                <div key={spec.id} className="flex items-baseline justify-between gap-md">
                  <dt className="body-sm text-on-surface-variant">{spec.key}</dt>
                  <dd className="body-sm text-right font-medium text-on-surface">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}
