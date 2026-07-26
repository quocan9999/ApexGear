import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Input, Modal, Pagination, Select, Spinner, Table, type TableColumn } from '../components/ui';
import { useAuth } from '../hooks/useAuth';
import { staffService, type StaffUser } from '../services/staff.service';
import type { PageMeta, Role } from '../types';
import { formatDate } from '../utils/format';

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };
const STAFF_ROLES: Array<Exclude<Role, 'CUSTOMER' | 'SUPER_ADMIN'>> = ['ADMIN', 'CONTENT_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER'];

function canManageTarget(actorRole: Role | undefined, target: StaffUser, actorId: string | undefined) {
  if (!actorRole || target.id === actorId || target.role === 'SUPER_ADMIN') return false;
  if (actorRole === 'SUPER_ADMIN') return true;
  return actorRole === 'ADMIN' && ['CONTENT_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER'].includes(target.role);
}

export default function StaffPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({ email: '', name: '', role: 'CONTENT_MANAGER' as Exclude<Role, 'CUSTOMER' | 'SUPER_ADMIN'> });

  const loadStaff = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await staffService.list({ page, limit: 20, ...(isSuperAdmin && includeDeleted ? { includeDeleted: true } : {}) });
      setStaff(result.data); setMeta({ page: result.meta?.page ?? page, limit: result.meta?.limit ?? 20, total: result.meta?.total ?? result.data.length, totalPages: result.meta?.totalPages ?? 1 });
    } catch (err) {
      setError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError')); setStaff([]); setMeta(DEFAULT_META);
    } finally { setLoading(false); }
  }, [includeDeleted, isSuperAdmin, page, t]);

  useEffect(() => { void loadStaff(); }, [loadStaff]);
  useEffect(() => { if (!isSuperAdmin) setIncludeDeleted(false); }, [isSuperAdmin]);

  const runAction = async (id: string, action: () => Promise<unknown>) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try { await action(); await loadStaff(); }
    catch (err) { setError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError')); }
    finally { setActionLoading((prev) => ({ ...prev, [id]: false })); }
  };

  const submitCreate = async (event: FormEvent) => {
    event.preventDefault(); setFormError(null); setSaving(true);
    try { await staffService.create(form); setFormOpen(false); setForm({ email: '', name: '', role: 'CONTENT_MANAGER' }); await loadStaff(); }
    catch (err) { setFormError(err && typeof err === 'object' && 'message' in err ? String((err as { message?: string }).message) : t('common.genericError')); }
    finally { setSaving(false); }
  };

  const columns = useMemo<TableColumn<StaffUser>[]>(() => [
    { key: 'name', header: t('pages.staff.columns.name'), render: (row) => <div><div className="label-md text-on-surface">{row.name}</div><div className="body-sm text-on-surface-variant">{row.email}</div></div> },
    { key: 'role', header: t('pages.staff.columns.role'), render: (row) => <span className="label-sm">{t(`roles.${row.role}`)}</span> },
    { key: 'status', header: t('common.status'), render: (row) => <div className="flex flex-wrap gap-xs"><Badge variant={row.deletedAt ? 'error' : row.activationStatus === 'PENDING_ACTIVATION' ? 'warning' : row.isActive ? 'success' : 'error'}>{row.deletedAt ? t('pages.staff.status.deleted') : row.activationStatus === 'PENDING_ACTIVATION' ? t('pages.staff.status.pending') : row.isActive ? t('pages.staff.status.active') : t('pages.staff.status.inactive')}</Badge></div> },
    { key: 'createdAt', header: t('pages.staff.columns.createdAt'), render: (row) => formatDate(row.createdAt) },
    { key: 'actions', header: t('common.actions'), cellClassName: 'whitespace-nowrap', render: (row) => { const canManage = canManageTarget(user?.role, row, user?.id); return <div className="flex flex-wrap gap-sm">{canManage && row.activationStatus === 'PENDING_ACTIVATION' && !row.deletedAt && <Button type="button" size="sm" variant="outline" isLoading={actionLoading[row.id]} loadingLabel={t('common.loading')} onClick={() => void runAction(row.id, () => staffService.resendInvite(row.id))}>{t('pages.staff.actions.resendInvite')}</Button>}{canManage && !row.deletedAt && <Button type="button" size="sm" variant="outline" isLoading={actionLoading[row.id]} loadingLabel={t('common.loading')} onClick={() => void runAction(row.id, () => staffService.update(row.id, { isActive: !row.isActive }))}>{row.isActive ? t('pages.staff.actions.deactivate') : t('pages.staff.actions.activate')}</Button>}{isSuperAdmin && row.deletedAt && <Button type="button" size="sm" variant="outline" isLoading={actionLoading[row.id]} loadingLabel={t('common.loading')} onClick={() => void runAction(row.id, () => staffService.restore(row.id))}>{t('pages.staff.actions.restore')}</Button>}{canManage && !row.deletedAt && <Button type="button" size="sm" variant="danger" isLoading={actionLoading[row.id]} loadingLabel={t('common.loading')} onClick={() => void runAction(row.id, () => staffService.remove(row.id))}>{t('pages.staff.actions.delete')}</Button>}</div>; } },
  ], [actionLoading, isSuperAdmin, t, user?.id, user?.role]);

  return <div className="flex flex-col gap-lg">
    <div className="flex flex-col gap-sm border-b border-outline-variant pb-md md:flex-row md:items-center md:justify-between"><div><h2 className="headline-lg text-on-surface">{t('pages.staff.title')}</h2><p className="body-md text-on-surface-variant">{t('pages.staff.description')}</p></div><Button type="button" onClick={() => { setFormError(null); setFormOpen(true); }}>{t('pages.staff.create')}</Button></div>
    {isSuperAdmin && <label className="inline-flex items-center gap-sm body-md text-on-surface"><input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />{t('pages.staff.filters.includeDeleted')}</label>}
    {error && <p className="body-md text-error" role="alert">{error}</p>}
    {loading ? <div className="flex justify-center py-xl" role="status"><Spinner label={t('common.loading')} /></div> : <><Table columns={columns} data={staff} rowKey="id" caption={t('pages.staff.title')} emptyState={t('common.empty')} /><Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} /></>}
    <Modal isOpen={formOpen} onClose={() => { if (!saving) setFormOpen(false); }} title={t('pages.staff.form.title')}><form className="flex flex-col gap-md" onSubmit={(event) => void submitCreate(event)}>{formError && <p className="body-md text-error" role="alert">{formError}</p>}<Input label={t('pages.staff.form.name')} value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} required /><Input label={t('pages.staff.form.email')} type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} required /><Select label={t('pages.staff.form.role')} value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as typeof prev.role }))}>{STAFF_ROLES.map((role) => <option key={role} value={role}>{t(`roles.${role}`)}</option>)}</Select><p className="body-sm text-on-surface-variant">{t('pages.staff.form.inviteHint')}</p><div className="flex justify-end gap-sm"><Button type="button" variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>{t('common.cancel')}</Button><Button type="submit" isLoading={saving} loadingLabel={t('common.loading')}>{t('common.create')}</Button></div></form></Modal>
  </div>;
}
