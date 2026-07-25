import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  ConfirmDialog,
  Input,
  Pagination,
  Select,
  Spinner,
  StatCard,
  StatCardSkeleton,
  StatIcon,
  Table,
  type TableColumn,
} from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';
import { brandsService } from '../../services/brands.service';
import { categoriesService } from '../../services/categories.service';
import { productsService } from '../../services/products.service';
import type { Brand, Category, PageMeta, Product } from '../../types';
import { formatPrice } from '../../utils/format';

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

function sumStock(product: Product): number {
  if (!product.variants?.length) return 0;
  return product.variants.reduce((sum, variant) => sum + (variant.stockAvailable ?? 0), 0);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

function productStats(products: Product[], meta: PageMeta) {
  return {
    total: meta.total,
    active: products.filter((p) => p.isActive).length,
    inactive: products.filter((p) => !p.isActive).length,
    lowStock: products.filter((p) => sumStock(p) > 0 && sumStock(p) <= 5).length,
  };
}

function flattenCategories(tree: Category[]): Category[] {
  const rows: Category[] = [];
  for (const parent of tree) {
    rows.push(parent);
    if (parent.children?.length) {
      for (const child of parent.children) rows.push(child);
    }
  }
  return rows;
}

export function ProductListPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PageMeta>(DEFAULT_META);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [page, setPage] = useState(1);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      categoriesService.list().catch(() => [] as Category[]),
      brandsService.list({ page: 1, limit: 100 }).catch(() => ({
        data: [] as Brand[],
        meta: DEFAULT_META,
      })),
    ]).then(([categoryTree, brandPage]) => {
      if (cancelled) return;
      setCategories(flattenCategories(categoryTree));
      setBrands(brandPage.data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await productsService.list({
        page,
        limit: 20,
        search: search || undefined,
        categoryId: categoryId || undefined,
        brandId: brandId || undefined,
      });
      setProducts(result.data);
      setMeta({
        page: result.meta?.page ?? page,
        limit: result.meta?.limit ?? 20,
        total: result.meta?.total ?? result.data.length,
        totalPages: result.meta?.totalPages ?? 1,
      });
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setError(message);
      setProducts([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [brandId, categoryId, page, search, t]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await productsService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadProducts();
    } catch {
      // ConfirmDialog already surfaces console.error; keep dialog open for retry.
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<Product>[]>(
    () => [
      {
        key: 'image',
        header: t('products.columns.image'),
        cellClassName: 'w-16',
        render: (row) => {
          const image = row.images?.[0];
          if (!image?.url) {
            return (
              <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-surface-container text-on-surface-variant label-sm">
                —
              </span>
            );
          }
          return (
            <img
              src={image.url}
              alt={image.alt ?? row.name}
              className="h-10 w-10 rounded object-cover"
            />
          );
        },
      },
      {
        key: 'name',
        header: t('products.columns.name'),
        cellClassName: 'max-w-[220px]',
        render: (row) => (
          <div className="min-w-0 truncate">
            <div className="label-md truncate text-on-surface">{row.name}</div>
            <div className="body-sm truncate text-on-surface-variant">{row.slug}</div>
          </div>
        ),
      },
      {
        key: 'brand',
        header: t('products.columns.brand'),
        render: (row) => row.brand?.name ?? '—',
      },
      {
        key: 'category',
        header: t('products.columns.category'),
        render: (row) => row.category?.name ?? '—',
      },
      {
        key: 'price',
        header: t('products.columns.price'),
        render: (row) => formatPrice(row.salePrice ?? row.basePrice),
      },
      {
        key: 'status',
        header: t('products.columns.status'),
        render: (row) => (
          <Badge variant={row.isActive ? 'success' : 'default'}>
            {row.isActive ? t('products.status.active') : t('products.status.inactive')}
          </Badge>
        ),
      },
      {
        key: 'stock',
        header: t('products.columns.stock'),
        render: (row) => new Intl.NumberFormat('vi-VN').format(sumStock(row)),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        cellClassName: 'whitespace-nowrap',
        render: (row) => (
          <div className="flex flex-wrap items-center gap-sm">
            <Link
              to={`/products/${row.slug}/edit`}
              className="label-sm inline-flex items-center gap-1 text-primary hover:underline"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              </svg>
              {t('common.edit')}
            </Link>
            {isAdmin && (
              <button
                type="button"
                className="label-sm inline-flex items-center gap-1 text-error hover:underline"
                onClick={() => setDeleteTarget(row)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <line x1="10" y1="11" x2="10" y2="17" />
                  <line x1="14" y1="11" x2="14" y2="17" />
                </svg>
                {t('common.delete')}
              </button>
            )}
          </div>
        ),
      },
    ],
    [isAdmin, t],
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md md:flex-row md:items-center md:justify-between">
        <h2 id="products-page-title" className="headline-lg text-on-surface">
          {t('pages.products.title')}
        </h2>
        <Link
          to="/products/new"
          className="inline-flex h-12 self-start items-center justify-center rounded bg-primary px-6 font-semibold text-on-primary transition-colors hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          {t('products.create')}
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
          <StatCardSkeleton index={1} />
          <StatCardSkeleton index={2} />
          <StatCardSkeleton index={3} />
          <StatCardSkeleton index={4} />
        </div>
      ) : meta.total > 0 ? (() => {
        const stats = productStats(products, meta);
        return (
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              index={1}
              label={t('products.stats.total')}
              value={formatCount(stats.total)}
              tone="primary"
              icon={<StatIcon><path d="M4 7.5 12 3l8 4.5-8 4.5L4 7.5Z" /><path d="m4 12 8 4.5L20 12" /><path d="m4 16.5 8 4.5 8-4.5" /></StatIcon>}
            />
            <StatCard
              index={2}
              label={t('products.stats.active')}
              value={formatCount(stats.active)}
              tone="success"
              icon={<StatIcon><path d="M20 6 9 17l-5-5" /></StatIcon>}
            />
            <StatCard
              index={3}
              label={t('products.stats.inactive')}
              value={formatCount(stats.inactive)}
              icon={<StatIcon><circle cx="12" cy="12" r="8" /><path d="m9 9 6 6M15 9l-6 6" /></StatIcon>}
            />
            <StatCard
              index={4}
              label={t('products.stats.lowStock')}
              value={formatCount(stats.lowStock)}
              tone="warning"
              icon={<StatIcon><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 4.7 2.8 18a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.7a2 2 0 0 0-3.4 0Z" /></StatIcon>}
            />
          </div>
        );
      })() : null}

      <div className="grid grid-cols-1 gap-md md:grid-cols-3">
        <Input
          label={t('common.search')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t('products.searchPlaceholder')}
        />
        <Select
          label={t('products.filters.category')}
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('products.filters.allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? `— ${category.name}` : category.name}
            </option>
          ))}
        </Select>
        <Select
          label={t('products.filters.brand')}
          value={brandId}
          onChange={(event) => {
            setBrandId(event.target.value);
            setPage(1);
          }}
        >
          <option value="">{t('products.filters.allBrands')}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </Select>
      </div>

      {error && (
        <p className="body-md text-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-xl" role="status">
          <Spinner label={t('common.loading')} />
        </div>
      ) : (
        <>
          <Table
            columns={columns}
            data={products}
            rowKey="id"
            caption={t('pages.products.title')}
            emptyState={t('common.empty')}
          />
          <Pagination
            page={meta.page}
            totalPages={meta.totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('products.deleteTitle')}
        description={
          deleteTarget
            ? t('products.deleteDescription', { name: deleteTarget.name })
            : ''
        }
        variant="danger"
        confirmLabel={t('common.delete')}
        isLoading={deleting}
        onCancel={() => {
          if (!deleting) setDeleteTarget(null);
        }}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}

export default ProductListPage;
