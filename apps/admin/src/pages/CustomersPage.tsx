import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Input, Pagination, Select, Spinner, Table, Textarea, type TableColumn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { customersService, type CustomerDetail } from '../services/customers.service';
import type { PageMeta, User } from '../types';
import type { CustomerAddress } from '../services/customers.service';
import { formatDate } from '../utils/format';

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

function statusVariant(customer: User): 'success' | 'warning' | 'error' {
  if (customer.lockedUntil) return 'warning';
  return customer.isActive ? 'success' : 'error';
}

export default function CustomersPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canManage = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const [customers, setCustomers] = useState<User[]>([]);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [isActive, setIsActive] = useState('');
  const [isLocked, setIsLocked] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<CustomerDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState({ name: '', phone: '', internalNote: '', isActive: true });
  const [addressDrafts, setAddressDrafts] = useState<Record<string, CustomerAddress>>({});
  const [savingAddress, setSavingAddress] = useState<string | null>(null);

  useEffect(() => setPage(1), [isActive, isLocked]);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { page: number; limit: number; isActive?: boolean; isLocked?: boolean } = { page, limit: 20 };
      if (isActive) params.isActive = isActive === 'true';
      if (isLocked) params.isLocked = isLocked === 'true';
      const result = await customersService.list(params);
      setCustomers(result.data);
      setMeta({ page: result.meta?.page ?? page, limit: result.meta?.limit ?? 20, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages ?? 1 });
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError'));
      setCustomers([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [isActive, isLocked, page, t]);

  useEffect(() => { void loadCustomers(); }, [loadCustomers]);

  const openDetail = async (customer: User) => {
    setDetailLoading(true);
    setError(null);
    try {
      const detail = await customersService.get(customer.id);
      setSelected(detail);
      setDraft({ name: detail.name, phone: detail.phone ?? '', internalNote: detail.internalNote ?? '', isActive: detail.isActive });
      setAddressDrafts(Object.fromEntries((detail.addresses ?? []).map((address) => [address.id, { ...address }])));
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError'));
    } finally {
      setDetailLoading(false);
    }
  };

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try { await action(); await loadCustomers(); if (selected?.id === id) await openDetail({ ...selected }); }
    catch (err) { setError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError')); }
    finally { setActionLoading((prev) => ({ ...prev, [id]: false })); }
  };

  const saveDetail = async () => {
    if (!selected || !canManage) return;
    setSaving(true);
    try {
      await customersService.update(selected.id, { name: draft.name.trim(), phone: draft.phone.trim(), internalNote: draft.internalNote.trim() || null, isActive: draft.isActive });
      await loadCustomers();
      await openDetail(selected);
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError'));
    } finally { setSaving(false); }
  };

  const saveAddress = async (address: CustomerAddress) => {
    if (!selected || !canManage) return;
    const draftAddress = addressDrafts[address.id];
    if (!draftAddress) return;
    setSavingAddress(address.id);
    setError(null);
    try {
      await customersService.updateAddress(selected.id, address.id, {
        name: draftAddress.name.trim(),
        phone: draftAddress.phone.trim(),
        provinceCode: draftAddress.provinceCode.trim(),
        provinceName: draftAddress.provinceName.trim(),
        wardCode: draftAddress.wardCode.trim(),
        wardName: draftAddress.wardName.trim(),
        detail: draftAddress.detail.trim(),
        isDefault: draftAddress.isDefault,
      });
      await openDetail(selected);
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError'));
    } finally { setSavingAddress(null); }
  };

  const updateAddressDraft = (addressId: string, patch: Partial<CustomerAddress>) => {
    setAddressDrafts((current) => ({
      ...current,
      [addressId]: { ...current[addressId], ...patch },
    }));
  };

  const columns = useMemo<TableColumn<User>[]>(() => [
    { key: 'name', header: t('pages.customers.columns.name'), render: (row) => <div><div className="label-md text-on-surface">{row.name}</div><div className="body-sm text-on-surface-variant">{row.email}</div></div> },
    { key: 'phone', header: t('pages.customers.columns.phone'), render: (row) => row.phone || '—' },
    { key: 'status', header: t('common.status'), render: (row) => <Badge variant={statusVariant(row)}>{row.isActive ? t('pages.customers.status.active') : t('pages.customers.status.inactive')}</Badge> },
    { key: 'createdAt', header: t('pages.customers.columns.createdAt'), render: (row) => formatDate(row.createdAt) },
    { key: 'actions', header: t('common.actions'), cellClassName: 'whitespace-nowrap', render: (row) => <div className="flex flex-wrap gap-sm"><Button type="button" size="sm" variant="outline" onClick={() => void openDetail(row)}>{t('pages.customers.actions.view')}</Button>{row.lockedUntil && <Button type="button" size="sm" variant="primary" isLoading={actionLoading[row.id]} loadingLabel={t('common.loading')} onClick={() => void runAction(row.id, () => customersService.unlock(row.id))}>{t('pages.customers.actions.unlock')}</Button>}</div> },
  ], [actionLoading, t]);

  return <div className="flex flex-col gap-lg">
    <div className="flex flex-col gap-sm border-b border-outline-variant pb-md"><h2 className="headline-lg text-on-surface">{t('pages.customers.title')}</h2><p className="body-md text-on-surface-variant">{t('pages.customers.description')}</p></div>
    <div className="flex flex-wrap items-end gap-md"><div className="w-40"><Select label={t('pages.customers.filters.isActive')} value={isActive} onChange={(event) => setIsActive(event.target.value)}><option value="">{t('pages.customers.filters.allStatus')}</option><option value="true">{t('pages.customers.status.active')}</option><option value="false">{t('pages.customers.status.inactive')}</option></Select></div><div className="w-40"><Select label={t('pages.customers.filters.isLocked')} value={isLocked} onChange={(event) => setIsLocked(event.target.value)}><option value="">{t('pages.customers.filters.allLocked')}</option><option value="true">{t('pages.customers.status.locked')}</option><option value="false">{t('pages.customers.status.notLocked')}</option></Select></div></div>
    {error && <p className="body-md text-error" role="alert">{error}</p>}
    {loading ? <div className="flex justify-center py-xl" role="status"><Spinner label={t('common.loading')} /></div> : <><Table columns={columns} data={customers} rowKey="id" caption={t('pages.customers.title')} emptyState={t('common.empty')} /><Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} /></>}
    {selected && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-on-surface/40 p-md" role="dialog" aria-modal="true" aria-labelledby="customer-detail-title"><div className="my-8 w-full max-w-2xl rounded-lg bg-surface-container-lowest p-lg shadow-xl"><div className="mb-lg flex items-start justify-between gap-md"><div><h3 id="customer-detail-title" className="headline-md text-on-surface">{selected.name}</h3><p className="body-sm text-on-surface-variant">{selected.email}</p></div><Button type="button" variant="ghost" aria-label={t('common.cancel')} onClick={() => setSelected(null)}>×</Button></div>{detailLoading ? <div className="flex justify-center py-xl"><Spinner label={t('common.loading')} /></div> : <div className="flex flex-col gap-md"><Input label={t('pages.customers.form.name')} value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} disabled={!canManage} /><Input label={t('pages.customers.form.phone')} value={draft.phone} onChange={(event) => setDraft((prev) => ({ ...prev, phone: event.target.value }))} disabled={!canManage} /><Textarea label={t('pages.customers.form.internalNote')} value={draft.internalNote} onChange={(event) => setDraft((prev) => ({ ...prev, internalNote: event.target.value }))} disabled={!canManage} /><label className="inline-flex items-center gap-sm body-md text-on-surface"><input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((prev) => ({ ...prev, isActive: event.target.checked }))} disabled={!canManage} />{t('pages.customers.form.isActive')}</label>{canManage && <div className="flex justify-end gap-sm"><Button type="button" variant="outline" onClick={() => setSelected(null)}>{t('common.cancel')}</Button><Button type="button" isLoading={saving} loadingLabel={t('common.loading')} onClick={() => void saveDetail()}>{t('common.save')}</Button></div>}<section><h4 className="title-md mb-sm text-on-surface">{t('pages.customers.addressesTitle')}</h4><div className="flex flex-col gap-md">{selected.addresses?.length ? selected.addresses.map((address) => { const draftAddress = addressDrafts[address.id] ?? address; return <div key={address.id} className="rounded border border-outline-variant p-md"><div className="grid grid-cols-1 gap-md sm:grid-cols-2"><Input label={t('pages.customers.addressForm.name')} value={draftAddress.name} onChange={(event) => updateAddressDraft(address.id, { name: event.target.value })} disabled={!canManage || savingAddress === address.id} /><Input label={t('pages.customers.addressForm.phone')} value={draftAddress.phone} onChange={(event) => updateAddressDraft(address.id, { phone: event.target.value })} disabled={!canManage || savingAddress === address.id} /><Input label={t('pages.customers.addressForm.provinceName')} value={draftAddress.provinceName} onChange={(event) => updateAddressDraft(address.id, { provinceName: event.target.value })} disabled={!canManage || savingAddress === address.id} /><Input label={t('pages.customers.addressForm.wardName')} value={draftAddress.wardName} onChange={(event) => updateAddressDraft(address.id, { wardName: event.target.value })} disabled={!canManage || savingAddress === address.id} /></div><Textarea label={t('pages.customers.addressForm.detail')} value={draftAddress.detail} onChange={(event) => updateAddressDraft(address.id, { detail: event.target.value })} disabled={!canManage || savingAddress === address.id} /><label className="inline-flex items-center gap-sm body-sm text-on-surface"><input type="checkbox" checked={draftAddress.isDefault} onChange={(event) => updateAddressDraft(address.id, { isDefault: event.target.checked })} disabled={!canManage || savingAddress === address.id} />{t('pages.customers.addressForm.isDefault')}</label>{canManage && <div className="flex justify-end"><Button type="button" size="sm" isLoading={savingAddress === address.id} loadingLabel={t('common.loading')} onClick={() => void saveAddress(address)}>{t('pages.customers.addressForm.save')}</Button></div>}</div>; }) : <p className="body-sm text-on-surface-variant">{t('common.empty')}</p>}</div></section><section><h4 className="title-md mb-sm text-on-surface">{t('pages.customers.ordersTitle')}</h4><div className="flex flex-col gap-xs">{selected.orders?.length ? selected.orders.map((order) => <div key={order.id} className="flex items-center justify-between border-b border-outline-variant py-sm body-sm"><span>{order.orderNumber}</span><span>{formatDate(order.createdAt)}</span><span>{order.total.toLocaleString('vi-VN')} ₫</span></div>) : <p className="body-sm text-on-surface-variant">{t('common.empty')}</p>}</div></section></div>}</div></div>}
  </div>;
}
