import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Input,
  Pagination,
  Spinner,
  Table,
  type TableColumn,
} from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { inventoryService } from '../services/inventory.service';
import type { InventoryItem, PageMeta } from '../types';
import type { BadgeVariant } from '../components/ui/Badge';

type Tab = 'all' | 'low' | 'out';

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

function stockVariant(item: InventoryItem): BadgeVariant {
  if (item.stockAvailable === 0) return 'error';
  if (item.stockAvailable <= item.lowStockThreshold) return 'warning';
  return 'success';
}

function stockLabel(t: ReturnType<typeof useTranslation>['t'], item: InventoryItem): string {
  if (item.stockAvailable === 0) return t('inventory.status.outOfStock');
  if (item.stockAvailable <= item.lowStockThreshold) return t('inventory.status.lowStock');
  return t('inventory.status.inStock');
}

export function InventoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canAdjust = user?.role === 'ADMIN' || user?.role === 'INVENTORY_MANAGER';

  const [tab, setTab] = useState<Tab>('all');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [meta, setMeta] = useState<PageMeta>(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  const [adjusting, setAdjusting] = useState<Record<string, boolean>>({});
  const [adjustValues, setAdjustValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = { page, limit: 20, search: search || undefined };
      let result: { data: InventoryItem[]; meta?: PageMeta };
      if (tab === 'low') {
        result = await inventoryService.lowStock(query);
      } else if (tab === 'out') {
        result = await inventoryService.outOfStock(query);
      } else {
        result = await inventoryService.list(query);
      }
      setItems(result.data);
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
      setItems([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [page, search, tab, t]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleAdjust = async (variantId: string) => {
    const raw = adjustValues[variantId]?.trim();
    if (!raw) return;
    const adjustment = Number(raw);
    if (!Number.isFinite(adjustment) || !Number.isInteger(adjustment) || adjustment === 0) return;

    setAdjusting((prev) => ({ ...prev, [variantId]: true }));
    try {
      await inventoryService.adjust(variantId, adjustment);
      setAdjustValues((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      await loadItems();
    } catch {
      // Keep input for retry.
    } finally {
      setAdjusting((prev) => ({ ...prev, [variantId]: false }));
    }
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'all', label: t('inventory.tabs.all') },
    { key: 'low', label: t('inventory.tabs.lowStock') },
    { key: 'out', label: t('inventory.tabs.outOfStock') },
  ];

  const columns = useMemo<TableColumn<InventoryItem>[]>(
    () => [
      {
        key: 'product',
        header: t('inventory.columns.product'),
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.product.name}</div>
            <div className="body-sm text-on-surface-variant">{row.sku}</div>
          </div>
        ),
      },
      {
        key: 'variant',
        header: t('inventory.columns.variant'),
        render: (row) => row.name ?? '—',
      },
      {
        key: 'stockTotal',
        header: t('inventory.columns.stockTotal'),
        render: (row) => new Intl.NumberFormat('vi-VN').format(row.stockTotal),
      },
      {
        key: 'stockAvailable',
        header: t('inventory.columns.stockAvailable'),
        render: (row) => new Intl.NumberFormat('vi-VN').format(row.stockAvailable),
      },
      {
        key: 'threshold',
        header: t('inventory.columns.threshold'),
        render: (row) => new Intl.NumberFormat('vi-VN').format(row.lowStockThreshold),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={stockVariant(row)}>
            {stockLabel(t, row)}
          </Badge>
        ),
      },
      ...(canAdjust
        ? [
            {
              key: 'adjust' as string,
              header: t('inventory.columns.adjust'),
              cellClassName: 'whitespace-nowrap',
              render: (row: InventoryItem) => (
                <div className="flex items-center gap-xs">
                  <input
                    type="number"
                    className="body-sm h-9 w-20 rounded border border-outline-variant bg-surface-container-lowest px-2 text-on-surface"
                    placeholder={t('inventory.adjustPlaceholder')}
                    value={adjustValues[row.id] ?? ''}
                    onChange={(event) =>
                      setAdjustValues((prev) => ({ ...prev, [row.id]: event.target.value }))
                    }
                    aria-label={t('inventory.adjustInputLabel', { name: row.sku })}
                  />
                  <button
                    type="button"
                    className="label-sm inline-flex h-9 items-center rounded bg-primary px-3 font-semibold text-on-primary transition-colors hover:bg-primary-container focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50"
                    disabled={adjusting[row.id]}
                    onClick={() => void handleAdjust(row.id)}
                  >
                    {adjusting[row.id] ? t('common.loading') : t('inventory.adjust')}
                  </button>
                </div>
              ),
            },
          ]
        : []),
    ],
    [adjustValues, adjusting, canAdjust, t],
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md">
        <h2 id="inventory-page-title" className="headline-lg text-on-surface">
          {t('pages.inventory.title')}
        </h2>
      </div>

      <div className="flex flex-col gap-md md:flex-row md:items-end md:justify-between">
        <div
          className="inline-flex items-center gap-xs self-start rounded-lg border border-outline-variant bg-surface-container-lowest p-xs"
          role="tablist"
          aria-label={t('pages.inventory.title')}
        >
          {TABS.map(({ key, label }) => {
            const isActive = key === tab;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setTab(key)}
                className={
                  isActive
                    ? 'label-sm rounded px-md py-sm bg-primary-container text-on-primary-container transition-colors'
                    : 'label-sm rounded px-md py-sm text-on-surface-variant transition-colors hover:bg-surface-container-high'
                }
              >
                {label}
              </button>
            );
          })}
        </div>

        <Input
          label={t('common.search')}
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          placeholder={t('inventory.searchPlaceholder')}
        />
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
            data={items}
            rowKey="id"
            caption={t('pages.inventory.title')}
            emptyState={t('common.empty')}
          />
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default InventoryPage;
