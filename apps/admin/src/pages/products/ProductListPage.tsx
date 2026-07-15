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
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.name}</div>
            <div className="body-sm text-on-surface-variant">{row.slug}</div>
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
              className="label-sm text-primary hover:underline"
            >
              {t('common.edit')}
            </Link>
            {isAdmin && (
              <button
                type="button"
                className="label-sm text-error hover:underline"
                onClick={() => setDeleteTarget(row)}
              >
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
