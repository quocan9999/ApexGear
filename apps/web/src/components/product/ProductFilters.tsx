import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';
import { formatPrice } from '../../utils/format';
import type { Brand, Category } from '../../types';

export interface FilterValues {
  categoryIds: string[];
  brandIds: string[];
  minPrice: string;
  maxPrice: string;
}

interface ProductFiltersProps {
  categories: Category[];
  brands: Brand[];
  values: FilterValues;
  onChange: (next: FilterValues) => void;
  onClearAll: () => void;
  className?: string;
}

export default function ProductFilters({
  categories,
  brands,
  values,
  onChange,
  onClearAll,
  className,
}: ProductFiltersProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand parent categories whose child is selected, for clarity
  useEffect(() => {
    setExpanded((prev) => {
      const next = { ...prev };
      categories.forEach((c) => {
        const childSelected = c.children?.some((ch) => values.categoryIds.includes(ch.id));
        const selfSelected = values.categoryIds.includes(c.id);
        if (childSelected || selfSelected) next[c.id] = true;
      });
      return next;
    });
  }, [values.categoryIds, categories]);

  const toggleCategory = (id: string) => {
    const set = new Set(values.categoryIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...values, categoryIds: Array.from(set) });
  };

  const toggleBrand = (id: string) => {
    const set = new Set(values.brandIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...values, brandIds: Array.from(set) });
  };

  const topLevel = categories.filter((c) => !c.parentId);

  return (
    <aside
      className={cn(
        'flex flex-col gap-xl rounded-xl bg-surface-container-lowest p-lg',
        'shadow-[var(--shadow-level-1)]',
        className,
      )}
      aria-label={t('product.filters')}
    >
      <header className="flex items-center justify-between">
        <h2 className="headline-md text-on-surface">{t('product.filters')}</h2>
        <button
          type="button"
          onClick={onClearAll}
          className="label-sm text-primary hover:text-primary-container"
        >
          {t('product.clearAll')}
        </button>
      </header>

      {/* Categories */}
      <section className="flex flex-col gap-sm">
        <h3 className="label-md text-on-surface">{t('nav.categories')}</h3>
        <ul className="flex flex-col gap-xs">
          {topLevel.length === 0 && (
            <li className="body-sm text-on-surface-variant">—</li>
          )}
          {topLevel.map((cat) => {
            const children = cat.children ?? [];
            const isOpen = expanded[cat.id] ?? false;
            return (
              <li key={cat.id}>
                <div className="flex items-center gap-xs">
                  <label className="flex flex-1 cursor-pointer items-center gap-sm py-xs">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary"
                      checked={values.categoryIds.includes(cat.id)}
                      onChange={() => toggleCategory(cat.id)}
                    />
                    <span className="body-sm text-on-surface">{cat.name}</span>
                  </label>
                  {children.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExpanded((p) => ({ ...p, [cat.id]: !isOpen }))}
                      className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container"
                      aria-label={isOpen ? 'Collapse' : 'Expand'}
                      aria-expanded={isOpen}
                    >
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-90')}
                      >
                        <path
                          fillRule="evenodd"
                          d="M7.21 5.23a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 11-1.06-1.06L10.94 10 7.21 6.29a.75.75 0 010-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
                {isOpen && children.length > 0 && (
                  <ul className="ml-6 mt-xs flex flex-col gap-xs border-l border-outline-variant pl-sm">
                    {children.map((child) => (
                      <li key={child.id}>
                        <label className="flex cursor-pointer items-center gap-sm py-xs">
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={values.categoryIds.includes(child.id)}
                            onChange={() => toggleCategory(child.id)}
                          />
                          <span className="body-sm text-on-surface-variant">
                            {child.name}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* Brands */}
      <section className="flex flex-col gap-sm">
        <h3 className="label-md text-on-surface">{t('product.brand')}</h3>
        <ul className="flex flex-col gap-xs">
          {brands.length === 0 && (
            <li className="body-sm text-on-surface-variant">—</li>
          )}
          {brands.map((brand) => (
            <li key={brand.id}>
              <label className="flex cursor-pointer items-center gap-sm py-xs">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={values.brandIds.includes(brand.id)}
                  onChange={() => toggleBrand(brand.id)}
                />
                <span className="body-sm text-on-surface">{brand.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* Price */}
      <section className="flex flex-col gap-sm">
        <h3 className="label-md text-on-surface">{t('product.price')}</h3>
        <div className="grid grid-cols-2 gap-sm">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="0"
            value={values.minPrice}
            onChange={(e) =>
              onChange({ ...values, minPrice: e.target.value.replace(/[^0-9]/g, '') })
            }
            className={cn(
              'h-10 w-full rounded-md border bg-surface-container-lowest px-sm body-sm',
              'border-outline-variant placeholder:text-outline',
              'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            )}
            aria-label={t('product.minPrice')}
          />
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="∞"
            value={values.maxPrice}
            onChange={(e) =>
              onChange({ ...values, maxPrice: e.target.value.replace(/[^0-9]/g, '') })
            }
            className={cn(
              'h-10 w-full rounded-md border bg-surface-container-lowest px-sm body-sm',
              'border-outline-variant placeholder:text-outline',
              'focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none',
            )}
            aria-label={t('product.maxPrice')}
          />
        </div>
        {(values.minPrice || values.maxPrice) && (
          <p className="body-sm text-on-surface-variant">
            {values.minPrice ? formatPrice(Number(values.minPrice)) : '0'} —{' '}
            {values.maxPrice ? formatPrice(Number(values.maxPrice)) : '∞'}
          </p>
        )}
      </section>
    </aside>
  );
}
