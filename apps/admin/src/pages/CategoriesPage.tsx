import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Select,
  Spinner,
  Table,
  type TableColumn,
} from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { categoriesService } from '../services/categories.service';
import type { Category } from '../types';
import { slugify } from '../utils/slugify';

interface CategoryRow extends Category {
  depth: number;
}

interface FormState {
  name: string;
  parentId: string;
  sortOrder: string;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  parentId: '',
  sortOrder: '0',
  description: '',
  isActive: true,
};

function flattenTree(tree: Category[]): CategoryRow[] {
  const rows: CategoryRow[] = [];
  for (const parent of tree) {
    rows.push({ ...parent, depth: 0 });
    if (parent.children?.length) {
      for (const child of parent.children) {
        rows.push({ ...child, depth: 1 });
      }
    }
  }
  return rows;
}

function topLevelParents(tree: Category[], excludeId?: string): Category[] {
  return tree.filter((category) => !excludeId || category.id !== excludeId);
}

export function CategoriesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [tree, setTree] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const rows = useMemo(() => flattenTree(tree), [tree]);
  const parentOptions = useMemo(
    () => topLevelParents(tree, editing?.id),
    [tree, editing],
  );
  const slugPreview = useMemo(
    () => (editing ? editing.slug : slugify(form.name) || '—'),
    [editing, form.name],
  );

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoriesService.list({ includeInactive: true });
      setTree(data);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setError(message);
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setForm({
      name: category.name,
      parentId: category.parentId ?? '',
      sortOrder: String(category.sortOrder ?? 0),
      description: category.description ?? '',
      isActive: category.isActive,
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
      setFormError(t('categories.form.validationRequired'));
      return;
    }

    const sortOrder = Number(form.sortOrder);
    if (!Number.isFinite(sortOrder) || sortOrder < 0 || !Number.isInteger(sortOrder)) {
      setFormError(t('categories.form.validationSortOrder'));
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      parentId: form.parentId || null,
      sortOrder,
      ...(editing ? { isActive: form.isActive } : {}),
    };

    setSaving(true);
    try {
      if (editing) {
        await categoriesService.update(editing.id, payload);
      } else {
        await categoriesService.create(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await loadCategories();
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
      await categoriesService.remove(deleteTarget.id);
      setDeleteTarget(null);
      await loadCategories();
    } catch {
      // Keep dialog open for retry.
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<CategoryRow>[]>(
    () => [
      {
        key: 'name',
        header: t('categories.columns.name'),
        render: (row) => (
          <div className="min-w-0" style={{ paddingLeft: row.depth * 16 }}>
            <div className="label-md text-on-surface">
              {row.depth > 0 ? `— ${row.name}` : row.name}
            </div>
            <div className="body-sm text-on-surface-variant">{row.slug}</div>
          </div>
        ),
      },
      {
        key: 'sortOrder',
        header: t('categories.columns.sortOrder'),
        render: (row) => String(row.sortOrder),
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={row.isActive ? 'success' : 'default'}>
            {row.isActive ? t('categories.status.active') : t('categories.status.inactive')}
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
        <h2 id="categories-page-title" className="headline-lg text-on-surface">
          {t('pages.categories.title')}
        </h2>
        <Button type="button" onClick={openCreate}>
          {t('categories.create')}
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
        <Table
          columns={columns}
          data={rows}
          rowKey="id"
          caption={t('pages.categories.title')}
          emptyState={t('common.empty')}
        />
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? t('categories.form.editTitle') : t('categories.form.createTitle')}
      >
        <form className="flex flex-col gap-md" onSubmit={(event) => void handleSubmit(event)}>
          {formError && (
            <p className="body-md text-error" role="alert">
              {formError}
            </p>
          )}
          <Input
            label={t('categories.form.name')}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input label={t('categories.form.slug')} value={slugPreview} readOnly disabled />
          <Select
            label={t('categories.form.parent')}
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
            disabled={Boolean(editing?.children?.length)}
          >
            <option value="">{t('categories.form.noParent')}</option>
            {parentOptions.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </Select>
          <Input
            label={t('categories.form.sortOrder')}
            type="number"
            min={0}
            step={1}
            value={form.sortOrder}
            onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
          />
          <Input
            label={t('categories.form.description')}
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
              {t('categories.form.isActive')}
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
        title={t('categories.deleteTitle')}
        description={
          deleteTarget
            ? t('categories.deleteDescription', { name: deleteTarget.name })
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

export default CategoriesPage;
