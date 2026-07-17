import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, ConfirmDialog, Input, Modal, Spinner, Table, type TableColumn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { shippingService, type ShippingRule } from '../services/shipping.service';

interface FormState {
  name: string;
  fee: string;
  isDefault: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  name: '',
  fee: '30000',
  isDefault: false,
  isActive: true,
};

export function ShippingRulesPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [rules, setRules] = useState<ShippingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ShippingRule | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ShippingRule | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadRules = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await shippingService.getRules();
      setRules(data);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setError(message);
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadRules();
  }, [loadRules]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (rule: ShippingRule) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      fee: String(rule.fee),
      isDefault: rule.isDefault,
      isActive: rule.isActive,
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
      setFormError(t('common.requiredField', { field: t('shipping.form.name') }));
      return;
    }

    const feeNum = Number(form.fee);
    if (!Number.isFinite(feeNum) || feeNum < 0) {
      setFormError(t('common.invalidNumber'));
      return;
    }

    const payload = {
      name: form.name.trim(),
      fee: feeNum,
      isDefault: form.isDefault,
      ...(editing ? { isActive: form.isActive } : {}),
    };

    setSaving(true);
    try {
      if (editing) {
        await shippingService.updateRule(editing.id, payload);
      } else {
        await shippingService.createRule(payload);
      }
      setFormOpen(false);
      setEditing(null);
      await loadRules();
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
      await shippingService.deleteRule(deleteTarget.id);
      setDeleteTarget(null);
      await loadRules();
    } catch {
      // Keep dialog open for retry
    } finally {
      setDeleting(false);
    }
  };

  const columns = useMemo<TableColumn<ShippingRule>[]>(
    () => [
      {
        key: 'name',
        header: t('common.name'),
        render: (row) => (
          <div className="flex items-center gap-2">
            <span className="label-md text-on-surface">{row.name}</span>
            {row.isDefault && (
              <Badge variant="info">Mặc định</Badge>
            )}
          </div>
        ),
      },
      {
        key: 'fee',
        header: 'Phí',
        render: (row) => `${new Intl.NumberFormat('vi-VN').format(row.fee)} ₫`,
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={row.isActive ? 'success' : 'default'}>
            {row.isActive ? 'Kích hoạt' : 'Vô hiệu'}
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
            {isAdmin && !row.isDefault && (
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
        <h2 id="shipping-rules-page-title" className="headline-lg text-on-surface">
          Quy tắc vận chuyển
        </h2>
        {isAdmin && (
          <Button type="button" onClick={openCreate}>
            Tạo mới
          </Button>
        )}
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
          data={rules}
          rowKey="id"
          caption="Danh sách quy tắc vận chuyển"
          emptyState={t('common.empty')}
        />
      )}

      <Modal
        isOpen={formOpen}
        onClose={closeForm}
        title={editing ? 'Sửa quy tắc' : 'Tạo quy tắc mới'}
      >
        <form className="flex flex-col gap-md" onSubmit={(event) => void handleSubmit(event)}>
          {formError && (
            <p className="body-md text-error" role="alert">
              {formError}
            </p>
          )}
          <Input
            label="Tên quy tắc"
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            required
          />
          <Input
            label="Phí (VNĐ)"
            type="number"
            min={0}
            step={1000}
            value={form.fee}
            onChange={(event) => setForm((prev) => ({ ...prev, fee: event.target.value }))}
            required
          />
          <label className="inline-flex items-center gap-sm body-md text-on-surface mt-sm">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isDefault: event.target.checked }))
              }
            />
            Là mức phí mặc định
          </label>
          {editing && (
            <label className="inline-flex items-center gap-sm body-md text-on-surface mt-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.checked }))
                }
              />
              Kích hoạt
            </label>
          )}
          <div className="flex justify-end gap-sm pt-sm mt-md border-t border-outline-variant pt-4">
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
        title="Xóa quy tắc vận chuyển"
        description={
          deleteTarget
            ? `Bạn có chắc muốn xóa quy tắc "${deleteTarget.name}" không? Thao tác này không thể hoàn tác.`
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

export default ShippingRulesPage;
