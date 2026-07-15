import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Pagination,
  Select,
  Spinner,
  Table,
  type TableColumn,
} from '../components/ui';
import { couponsService, type CouponPayload } from '../services/coupons.service';
import type { Coupon, PageMeta } from '../types';
import { formatDate, formatPrice } from '../utils/format';

interface FormState {
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: string;
  description: string;
  minOrderValue: string;
  maxDiscount: string;
  maxUses: string;
  startsAt: string;
  expiresAt: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  code: '',
  type: 'PERCENTAGE',
  value: '',
  description: '',
  minOrderValue: '',
  maxDiscount: '',
  maxUses: '',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export function CouponsPage() {
  const { t } = useTranslation();

  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [meta, setMeta] = useState<PageMeta>(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (statusFilter === 'active') params.isActive = true;
      else if (statusFilter === 'inactive') params.isActive = false;

      const result = await couponsService.list(params);
      setCoupons(result.data);
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
      setCoupons([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, t]);

  useEffect(() => {
    void loadCoupons();
  }, [loadCoupons]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: String(coupon.value),
      description: coupon.description ?? '',
      minOrderValue: coupon.minOrderValue != null ? String(coupon.minOrderValue) : '',
      maxDiscount: coupon.maxDiscount != null ? String(coupon.maxDiscount) : '',
      maxUses: coupon.maxUses != null ? String(coupon.maxUses) : '',
      startsAt: coupon.startsAt ? coupon.startsAt.slice(0, 16) : '',
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 16) : '',
      isActive: coupon.isActive,
    });
    setFormError(null);
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!form.code.trim() || !form.value) {
      setFormError(t('coupons.form.validationRequired'));
      return;
    }

    const value = Number(form.value);
    if (!Number.isFinite(value) || value < 0) {
      setFormError(t('coupons.form.validationValue'));
      return;
    }

    const minOrderValue = form.minOrderValue ? Number(form.minOrderValue) : undefined;
    if (form.minOrderValue && (!Number.isFinite(minOrderValue) || minOrderValue! < 0)) {
      setFormError(t('coupons.form.validationMinOrder'));
      return;
    }

    const maxDiscount = form.maxDiscount ? Number(form.maxDiscount) : undefined;
    if (form.maxDiscount && (!Number.isFinite(maxDiscount) || maxDiscount! < 0)) {
      setFormError(t('coupons.form.validationMaxDiscount'));
      return;
    }

    const maxUses = form.maxUses ? Number(form.maxUses) : undefined;
    if (form.maxUses && (!Number.isInteger(maxUses) || maxUses! < 1)) {
      setFormError(t('coupons.form.validationMaxUses'));
      return;
    }

    const payload: Record<string, unknown> = {
      code: form.code.trim(),
      type: form.type,
      value,
    };
    if (form.description.trim()) payload.description = form.description.trim();
    if (minOrderValue !== undefined) payload.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) payload.maxDiscount = maxDiscount;
    if (maxUses !== undefined) payload.maxUses = maxUses;
    if (form.startsAt) payload.startsAt = form.startsAt;
    if (form.expiresAt) payload.expiresAt = form.expiresAt;

    setSaving(true);
    try {
      if (editing) {
        await couponsService.update(editing.id, { ...payload, isActive: form.isActive });
      } else {
        await couponsService.create(payload as unknown as CouponPayload);
      }
      setFormOpen(false);
      setEditing(null);
      await loadCoupons();
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setFormError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await couponsService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadCoupons();
    } catch {
      // Keep dialog open for retry.
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<Coupon>[]>(
    () => [
      {
        key: 'code',
        header: t('coupons.columns.code'),
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.code}</div>
            <div className="body-sm text-on-surface-variant">{row.description}</div>
          </div>
        ),
      },
      {
        key: 'type',
        header: t('coupons.columns.type'),
        render: (row) => (
          <Badge variant={row.type === 'PERCENTAGE' ? 'primary' : 'default'}>
            {t(`coupons.type.${row.type}`)}
          </Badge>
        ),
      },
      {
        key: 'value',
        header: t('coupons.columns.value'),
        render: (row) =>
          row.type === 'PERCENTAGE' ? `${row.value}%` : formatPrice(row.value),
      },
      {
        key: 'minOrderValue',
        header: t('coupons.columns.minOrderValue'),
        render: (row) => (row.minOrderValue != null ? formatPrice(row.minOrderValue) : '—'),
      },
      {
        key: 'maxDiscount',
        header: t('coupons.columns.maxDiscount'),
        render: (row) => (row.maxDiscount != null ? formatPrice(row.maxDiscount) : '—'),
      },
      {
        key: 'used',
        header: t('coupons.columns.used'),
        render: (row) =>
          row.maxUses != null ? `${row.usedCount}/${row.maxUses}` : String(row.usedCount),
      },
      {
        key: 'isActive',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={row.isActive ? 'success' : 'error'}>
            {row.isActive ? t('coupons.status.active') : t('coupons.status.inactive')}
          </Badge>
        ),
      },
      {
        key: 'startsAt',
        header: t('coupons.columns.startsAt'),
        render: (row) => (row.startsAt ? formatDate(row.startsAt) : '—'),
      },
      {
        key: 'expiresAt',
        header: t('coupons.columns.expiresAt'),
        render: (row) => (row.expiresAt ? formatDate(row.expiresAt) : '—'),
      },
      {
        key: 'createdAt',
        header: t('coupons.columns.date'),
        render: (row) => formatDate(row.createdAt),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        cellClassName: 'whitespace-nowrap',
        render: (row) => (
          <div className="flex flex-wrap items-center gap-sm">
            <button
              type="button"
              className="label-sm text-primary hover:underline"
              onClick={() => openEdit(row)}
            >
              {t('common.edit')}
            </button>
            <button
              type="button"
              className="label-sm text-error hover:underline"
              onClick={() => setDeleteTarget(row)}
            >
              {t('common.delete')}
            </button>
          </div>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md md:flex-row md:items-center md:justify-between">
        <h2 id="coupons-page-title" className="headline-lg text-on-surface">
          {t('pages.coupons.title')}
        </h2>
        <Button type="button" onClick={openCreate}>
          {t('coupons.create')}
        </Button>
      </div>

      <div className="flex flex-wrap items-end gap-md">
        <div className="w-40">
          <Select
            label={t('coupons.filters.status')}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="">{t('coupons.filters.all')}</option>
            <option value="active">{t('coupons.filters.active')}</option>
            <option value="inactive">{t('coupons.filters.inactive')}</option>
          </Select>
        </div>
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
            data={coupons}
            rowKey="id"
            caption={t('pages.coupons.title')}
            emptyState={t('common.empty')}
          />
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? t('coupons.form.editTitle') : t('coupons.form.createTitle')}
      >
        <form className="flex flex-col gap-md" onSubmit={(event) => void handleSubmit(event)}>
          {formError && (
            <p className="body-md text-error" role="alert">
              {formError}
            </p>
          )}

          <Input
            label={t('coupons.form.code')}
            value={form.code}
            onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
            required
            placeholder="WELCOME10"
          />

          <Select
            label={t('coupons.form.type')}
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value as 'PERCENTAGE' | 'FIXED' }))
            }
          >
            <option value="PERCENTAGE">{t('coupons.type.PERCENTAGE')}</option>
            <option value="FIXED">{t('coupons.type.FIXED')}</option>
          </Select>

          <Input
            label={
              form.type === 'PERCENTAGE'
                ? t('coupons.form.valuePercent')
                : t('coupons.form.valueFixed')
            }
            type="number"
            min="0"
            step={form.type === 'PERCENTAGE' ? '1' : '1000'}
            value={form.value}
            onChange={(event) => setForm((prev) => ({ ...prev, value: event.target.value }))}
            required
          />

          <Input
            label={t('coupons.form.description')}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />

          <Input
            label={t('coupons.form.minOrderValue')}
            type="number"
            min="0"
            step="1000"
            value={form.minOrderValue}
            onChange={(event) => setForm((prev) => ({ ...prev, minOrderValue: event.target.value }))}
          />

          {form.type === 'PERCENTAGE' && (
            <Input
              label={t('coupons.form.maxDiscount')}
              type="number"
              min="0"
              step="1000"
              value={form.maxDiscount}
              onChange={(event) => setForm((prev) => ({ ...prev, maxDiscount: event.target.value }))}
            />
          )}

          <Input
            label={t('coupons.form.maxUses')}
            type="number"
            min="1"
            step="1"
            value={form.maxUses}
            onChange={(event) => setForm((prev) => ({ ...prev, maxUses: event.target.value }))}
          />

          <Input
            label={t('coupons.form.startsAt')}
            type="datetime-local"
            value={form.startsAt}
            onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))}
          />

          <Input
            label={t('coupons.form.expiresAt')}
            type="datetime-local"
            value={form.expiresAt}
            onChange={(event) => setForm((prev) => ({ ...prev, expiresAt: event.target.value }))}
          />

          {editing && (
            <label className="inline-flex items-center gap-sm body-md text-on-surface">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              {t('coupons.form.isActive')}
            </label>
          )}

          <div className="flex justify-end gap-sm pt-sm">
            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={saving} loadingLabel={t('common.loading')}>
              {t('common.save')}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={t('coupons.deleteTitle')}
        description={
          deleteTarget ? t('coupons.deleteDescription', { code: deleteTarget.code }) : ''
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

export default CouponsPage;
