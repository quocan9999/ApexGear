import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Pagination,
  Spinner,
  Table,
  type TableColumn,
} from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { brandsService } from '../services/brands.service';
import type { Brand, PageMeta } from '../types';
import { slugify } from '../utils/slugify';

interface FormState {
  name: string;
  description: string;
  logo: string;
  website: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  logo: '',
  website: '',
  isActive: true,
};

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

export function BrandsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [brands, setBrands] = useState<Brand[]>([]);
  const [meta, setMeta] = useState<PageMeta>(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);

  const slugPreview = useMemo(
    () => (editing ? editing.slug : slugify(form.name) || '—'),
    [editing, form.name],
  );

  const loadBrands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await brandsService.list({ page, limit: 20 });
      setBrands(result.data);
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
      setBrands([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    void loadBrands();
  }, [loadBrands]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditing(brand);
    setForm({
      name: brand.name,
      description: brand.description ?? '',
      logo: brand.logo ?? '',
      website: brand.website ?? '',
      isActive: brand.isActive,
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

    if (!form.name.trim()) {
      setFormError(t('brands.form.validationRequired'));
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      logo: form.logo.trim() || undefined,
      website: form.website.trim() || undefined,
      ...(editing ? { isActive: form.isActive } : {}),
    };

    setSaving(true);
    try {
      if (editing) {
        await brandsService.update(editing.id, payload);
      } else {
        await brandsService.create(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await loadBrands();
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
      await brandsService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadBrands();
    } catch {
      // Keep dialog open for retry.
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<Brand>[]>(
    () => [
      {
        key: 'logo',
        header: t('brands.columns.logo'),
        cellClassName: 'w-16',
        render: (row) =>
          row.logo ? (
            <img src={row.logo} alt={row.name} className="h-10 w-10 rounded object-contain" />
          ) : (
            <span className="inline-flex h-10 w-10 items-center justify-center rounded bg-surface-container text-on-surface-variant label-sm">
              —
            </span>
          ),
      },
      {
        key: 'name',
        header: t('brands.columns.name'),
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.name}</div>
            <div className="body-sm text-on-surface-variant">{row.slug}</div>
          </div>
        ),
      },
      {
        key: 'website',
        header: t('brands.columns.website'),
        render: (row) =>
          row.website ? (
            <a
              href={row.website}
              target="_blank"
              rel="noreferrer"
              className="label-sm text-primary hover:underline"
            >
              {row.website}
            </a>
          ) : (
            '—'
          ),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={row.isActive ? 'success' : 'default'}>
            {row.isActive ? t('brands.status.active') : t('brands.status.inactive')}
          </Badge>
        ),
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
        <h2 id="brands-page-title" className="headline-lg text-on-surface">
          {t('pages.brands.title')}
        </h2>
        <Button type="button" onClick={openCreate}>
          {t('brands.create')}
        </Button>
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
            data={brands}
            rowKey="id"
            caption={t('pages.brands.title')}
            emptyState={t('common.empty')}
          />
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? t('brands.form.editTitle') : t('brands.form.createTitle')}
      >
        <form className="flex flex-col gap-md" onSubmit={(event) => void handleSubmit(event)}>
          {formError && (
            <p className="body-md text-error" role="alert">
              {formError}
            </p>
          )}
          <Input
            label={t('brands.form.name')}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input label={t('brands.form.slug')} value={slugPreview} readOnly disabled />
          <Input
            label={t('brands.form.logo')}
            value={form.logo}
            onChange={(event) => setForm((prev) => ({ ...prev, logo: event.target.value }))}
            placeholder="https://"
          />
          <Input
            label={t('brands.form.website')}
            value={form.website}
            onChange={(event) => setForm((prev) => ({ ...prev, website: event.target.value }))}
            placeholder="https://"
          />
          <Input
            label={t('brands.form.description')}
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
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
              {t('brands.form.isActive')}
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
        title={t('brands.deleteTitle')}
        description={
          deleteTarget ? t('brands.deleteDescription', { name: deleteTarget.name }) : ''
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

export default BrandsPage;
