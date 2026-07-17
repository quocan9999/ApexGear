import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, ConfirmDialog, Input, Modal, Spinner, Table, type TableColumn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { useProvinces } from '../hooks/useProvinces';
import { shippingService, type ShippingRule, type ShippingRegion } from '../services/shipping.service';

interface RegionState {
  provinceCode: string;
  provinceName: string;
  wardCode?: string;
  wardName?: string;
}

interface FormState {
  name: string;
  fee: string;
  isDefault: boolean;
  isActive: boolean;
  regions: RegionState[];
}

const EMPTY_FORM: FormState = {
  name: '',
  fee: '30000',
  isDefault: false,
  isActive: true,
  regions: [],
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

  const { provinces, wards, selectedProvince, selectedWard, selectProvince, selectWard, loading: loadingProvinces } = useProvinces();

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
    selectProvince('');
  };

  const openEdit = (rule: ShippingRule) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      fee: String(rule.fee),
      isDefault: rule.isDefault,
      isActive: rule.isActive,
      regions: rule.regions?.map(r => ({
        provinceCode: r.provinceCode,
        provinceName: r.provinceName,
        wardCode: r.wardCode || undefined,
        wardName: r.wardName || undefined,
      })) || [],
    });
    setFormError(null);
    setFormOpen(true);
    selectProvince('');
  };

  const closeForm = () => {
    if (saving) return;
    setFormOpen(false);
    setEditing(null);
    setFormError(null);
  };

  const handleAddRegionToForm = () => {
    if (!selectedProvince) return;
    
    // Avoid duplicates
    const exists = form.regions.find(r => 
      r.provinceCode === selectedProvince.code && 
      (r.wardCode === selectedWard?.code || (!r.wardCode && !selectedWard))
    );
    
    if (exists) {
      setFormError('Khu vực này đã được thêm vào danh sách.');
      return;
    }

    setForm(prev => ({
      ...prev,
      regions: [
        ...prev.regions,
        {
          provinceCode: selectedProvince.code,
          provinceName: selectedProvince.name,
          wardCode: selectedWard?.code,
          wardName: selectedWard?.name,
        }
      ]
    }));
    setFormError(null);
    selectProvince('');
  };

  const handleRemoveRegionFromForm = (index: number) => {
    setForm(prev => ({
      ...prev,
      regions: prev.regions.filter((_, i) => i !== index)
    }));
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

    if (!form.isDefault && form.regions.length === 0) {
      setFormError('Vui lòng thêm ít nhất một khu vực áp dụng hoặc chọn "Là mức phí mặc định".');
      return;
    }

    const payload = {
      name: form.name.trim(),
      fee: feeNum,
      isDefault: form.isDefault,
      regions: form.isDefault ? [] : form.regions,
      ...(editing ? { isActive: form.isActive } : {}),
    };

    setSaving(true);
    try {
      if (editing) {
        await shippingService.updateRule(editing.id, payload as any);
      } else {
        await shippingService.createRule(payload as any);
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
        key: 'regions',
        header: 'Khu vực áp dụng',
        render: (row) => (
          <div className="flex flex-col gap-1">
            {row.isDefault ? (
              <span className="body-sm text-on-surface-variant">Áp dụng toàn quốc</span>
            ) : row.regions?.length > 0 ? (
              <span className="body-sm text-on-surface-variant">{row.regions.length} khu vực</span>
            ) : (
              <span className="body-sm text-error">Chưa cấu hình</span>
            )}
          </div>
        ),
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
        className="max-w-2xl"
      >
        <form className="flex flex-col gap-md" onSubmit={(event) => void handleSubmit(event)}>
          {formError && (
            <p className="body-md text-error" role="alert">
              {formError}
            </p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
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
          </div>

          <label className="inline-flex items-center gap-sm body-md text-on-surface mt-xs">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, isDefault: event.target.checked }))
              }
            />
            Là mức phí mặc định (Áp dụng toàn quốc cho những nơi chưa có quy tắc)
          </label>
          
          {editing && (
            <label className="inline-flex items-center gap-sm body-md text-on-surface mt-xs">
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

          {!form.isDefault && (
            <div className="flex flex-col gap-sm mt-sm border-t border-outline-variant pt-md">
              <h3 className="label-lg text-on-surface">Khu vực áp dụng</h3>
              
              <div className="flex flex-col sm:flex-row items-end gap-sm">
                <div className="flex-1">
                  <label className="label-sm text-on-surface-variant mb-1 block">Tỉnh/Thành</label>
                  <select
                    className="h-10 w-full rounded border border-outline-variant px-3 bg-surface-container-lowest"
                    value={selectedProvince?.code ?? ''}
                    onChange={(e) => selectProvince(e.target.value)}
                    disabled={loadingProvinces}
                  >
                    <option value="">-- Chọn Tỉnh/Thành --</option>
                    {provinces.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="label-sm text-on-surface-variant mb-1 block">Quận/Huyện/Xã (Tùy chọn)</label>
                  <select
                    className="h-10 w-full rounded border border-outline-variant px-3 bg-surface-container-lowest"
                    value={selectedWard?.code ?? ''}
                    onChange={(e) => selectWard(e.target.value)}
                    disabled={!selectedProvince || loadingProvinces}
                  >
                    <option value="">-- Tất cả --</option>
                    {wards.map((w) => (
                      <option key={w.code} value={w.code}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="button" onClick={handleAddRegionToForm} disabled={!selectedProvince} style={{ height: '40px' }}>
                  Thêm
                </Button>
              </div>

              <div className="mt-xs max-h-[200px] overflow-y-auto rounded-lg border border-outline-variant bg-surface-container-lowest">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-on-surface-variant label-sm sticky top-0">
                    <tr>
                      <th className="p-2 px-3">Khu vực đã chọn</th>
                      <th className="p-2 px-3 w-[80px]">Xóa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant body-sm">
                    {form.regions.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="p-4 text-center text-on-surface-variant">
                          Chưa thêm khu vực nào
                        </td>
                      </tr>
                    ) : (
                      form.regions.map((r, i) => (
                        <tr key={`${r.provinceCode}-${r.wardCode || 'all'}`}>
                          <td className="p-2 px-3 text-on-surface">
                            {r.provinceName}
                            {r.wardName ? ` - ${r.wardName}` : ' (Toàn bộ)'}
                          </td>
                          <td className="p-2 px-3">
                            <button
                              type="button"
                              className="text-error hover:underline"
                              onClick={() => handleRemoveRegionFromForm(i)}
                            >
                              Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-sm pt-sm mt-sm border-t border-outline-variant pt-4">
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
