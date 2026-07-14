import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { productsService } from '../services/products.service';
import { categoriesService } from '../services/categories.service';
import { brandsService } from '../services/brands.service';
import { useDebounce } from '../hooks/useDebounce';
import ProductFilters, {
  type FilterValues,
} from '../components/product/ProductFilters';
import ProductGrid from '../components/product/ProductGrid';
import ProductSort, { type SortKey } from '../components/product/ProductSort';
import Pagination from '../components/ui/Pagination';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import type { Brand, Category, Product } from '../types';

const SORT_MAP: Record<SortKey, { sortBy: 'createdAt' | 'price' | 'name'; sortOrder: 'asc' | 'desc' }> = {
  newest: { sortBy: 'createdAt', sortOrder: 'desc' },
  priceAsc: { sortBy: 'price', sortOrder: 'asc' },
  priceDesc: { sortBy: 'price', sortOrder: 'desc' },
  nameAsc: { sortBy: 'name', sortOrder: 'asc' },
};

const PAGE_SIZE = 12;

function getStr(params: URLSearchParams, key: string): string {
  return params.get(key) ?? '';
}

function getNum(params: URLSearchParams, key: string): number {
  const v = Number(params.get(key));
  return Number.isFinite(v) && v > 0 ? v : 1;
}

function getList(params: URLSearchParams, key: string): string[] {
  const v = params.get(key);
  if (!v) return [];
  return v.split(',').filter(Boolean);
}

export default function ProductListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // ----- Read state from URL -----
  const search = getStr(searchParams, 'search');
  const sort: SortKey = (searchParams.get('sort') as SortKey) || 'newest';
  const page = getNum(searchParams, 'page');
  const filterValues: FilterValues = useMemo(
    () => ({
      categoryIds: getList(searchParams, 'categoryId'),
      brandIds: getList(searchParams, 'brandId'),
      minPrice: getStr(searchParams, 'minPrice'),
      maxPrice: getStr(searchParams, 'maxPrice'),
    }),
    [searchParams],
  );

  // ----- Local UI state -----
  const [searchInput, setSearchInput] = useState(search);
  const debouncedSearch = useDebounce(searchInput, 300);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const skipNextSearchSync = useRef(false);

  // ----- Filter data -----
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([categoriesService.getAll(), brandsService.getAll()])
      .then(([cats, brs]) => {
        if (!mounted) return;
        setCategories(cats ?? []);
        setBrands(brs ?? []);
      })
      .catch(() => {
        if (!mounted) return;
        setCategories([]);
        setBrands([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // ----- Product results -----
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Sync search input → URL (debounced). Skip first sync from URL → state.
  useEffect(() => {
    if (skipNextSearchSync.current) {
      skipNextSearchSync.current = false;
      return;
    }
    const next = new URLSearchParams(searchParams);
    const trimmed = debouncedSearch.trim();
    if (trimmed) next.set('search', trimmed);
    else next.delete('search');
    next.delete('page');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // On mount: align input state to URL value (without re-triggering URL write).
  useEffect(() => {
    setSearchInput(search);
    skipNextSearchSync.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch products whenever any query input changes (skip while typing).
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const { sortBy, sortOrder } = SORT_MAP[sort] ?? SORT_MAP.newest;
    const params: import('../types').ProductQueryParams = {
      page,
      limit: PAGE_SIZE,
      sortBy,
      sortOrder,
    };

    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (filterValues.categoryIds.length === 1) {
      params.categoryId = filterValues.categoryIds[0];
    } else if (filterValues.categoryIds.length > 1) {
      // Backend supports single categoryId; fall back to client-side filtering for multi.
      params.categoryId = filterValues.categoryIds[0];
    }
    if (filterValues.brandIds.length === 1) {
      params.brandId = filterValues.brandIds[0];
    } else if (filterValues.brandIds.length > 1) {
      params.brandId = filterValues.brandIds[0];
    }
    const minP = Number(filterValues.minPrice);
    const maxP = Number(filterValues.maxPrice);
    if (filterValues.minPrice && Number.isFinite(minP)) params.minPrice = minP;
    if (filterValues.maxPrice && Number.isFinite(maxP)) params.maxPrice = maxP;

    productsService
      .getAll(params)
      .then((res) => {
        if (!mounted) return;
        let items = (res.data ?? []) as Product[];

        // Client-side fallback for multi-select filters the API can't combine.
        if (filterValues.categoryIds.length > 1) {
          const set = new Set(filterValues.categoryIds);
          items = items.filter((p) => set.has(p.categoryId));
        }
        if (filterValues.brandIds.length > 1) {
          const set = new Set(filterValues.brandIds);
          items = items.filter((p) => p.brandId && set.has(p.brandId));
        }

        setProducts(items);
        setTotalPages(res.meta?.totalPages ?? 1);
        setTotal(res.meta?.total ?? items.length);
      })
      .catch(() => {
        if (!mounted) return;
        setProducts([]);
        setTotalPages(1);
        setTotal(0);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [
    page,
    sort,
    debouncedSearch,
    filterValues.categoryIds.join(','),
    filterValues.brandIds.join(','),
    filterValues.minPrice,
    filterValues.maxPrice,
  ]);

  // ----- URL update helpers -----
  const updateParams = useCallback(
    (mutator: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(searchParams);
      mutator(next);
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleFiltersChange = (next: FilterValues) => {
    updateParams((p) => {
      if (next.categoryIds.length) p.set('categoryId', next.categoryIds.join(','));
      else p.delete('categoryId');
      if (next.brandIds.length) p.set('brandId', next.brandIds.join(','));
      else p.delete('brandId');
      if (next.minPrice) p.set('minPrice', next.minPrice);
      else p.delete('minPrice');
      if (next.maxPrice) p.set('maxPrice', next.maxPrice);
      else p.delete('maxPrice');
      p.delete('page');
    });
  };

  const handleClearAll = () => {
    setSearchInput('');
    updateParams((p) => {
      p.delete('search');
      p.delete('categoryId');
      p.delete('brandId');
      p.delete('minPrice');
      p.delete('maxPrice');
      p.delete('page');
    });
  };

  const handleSortChange = (next: SortKey) => {
    updateParams((p) => {
      if (next === 'newest') p.delete('sort');
      else p.set('sort', next);
      p.delete('page');
    });
  };

  const handlePageChange = (next: number) => {
    updateParams((p) => {
      if (next === 1) p.delete('page');
      else p.set('page', String(next));
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const filtersContent = (
    <ProductFilters
      categories={categories}
      brands={brands}
      values={filterValues}
      onChange={handleFiltersChange}
      onClearAll={handleClearAll}
    />
  );

  return (
    <div className="mx-auto w-full max-w-[1280px] px-md py-lg sm:px-lg">
      {/* Page header */}
      <header className="mb-lg flex flex-col gap-sm">
        <h1 className="headline-lg text-on-surface">{t('nav.products')}</h1>
        {search && (
          <p className="body-md text-on-surface-variant">
            {t('product.showingResults', { count: total })} · &ldquo;{search}&rdquo;
          </p>
        )}
      </header>

      {/* Search + sort + mobile filter trigger */}
      <div className="mb-lg flex flex-col gap-md sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t('common.search')}
            aria-label={t('common.search')}
          />
        </div>
        <div className="flex items-center justify-between gap-md">
          <Button
            variant="outline"
            size="md"
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden"
          >
            {t('product.filterButton')}
          </Button>
          <ProductSort value={sort} onChange={handleSortChange} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-[280px_1fr]">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">{filtersContent}</div>

        {/* Results */}
        <section className="flex flex-col gap-lg">
          <ProductGrid products={products} loading={loading} />

          {!loading && total > 0 && (
            <div className="flex flex-col items-center gap-md">
              <p className="body-sm text-on-surface-variant">
                {t('product.page', { page, totalPages })}
              </p>
              <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </section>
      </div>

      {/* Mobile filters drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          mobileFiltersOpen ? 'pointer-events-auto' : 'pointer-events-none',
        )}
        aria-hidden={!mobileFiltersOpen}
      >
        <div
          onClick={() => setMobileFiltersOpen(false)}
          className={cn(
            'absolute inset-0 bg-black/50 transition-opacity',
            mobileFiltersOpen ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('product.filters')}
          className={cn(
            'absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-xl bg-surface p-lg',
            'transition-transform duration-300',
            mobileFiltersOpen ? 'translate-y-0' : 'translate-y-full',
          )}
        >
          <div className="mb-md flex items-center justify-between">
            <h2 className="headline-md text-on-surface">{t('product.filters')}</h2>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="rounded-md p-1 text-on-surface-variant hover:bg-surface-container"
              aria-label={t('nav.closeMenu')}
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {filtersContent}
          <div className="mt-lg">
            <Button
              size="md"
              className="w-full"
              onClick={() => setMobileFiltersOpen(false)}
            >
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
