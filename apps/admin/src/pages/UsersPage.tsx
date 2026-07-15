import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Badge,
  Button,
  ConfirmDialog,
  Pagination,
  Select,
  Spinner,
  Table,
  type TableColumn,
} from '../components/ui';
import { usersService } from '../services/users.service';
import type { PageMeta, User } from '../types';
import { formatDate } from '../utils/format';
import type { BadgeVariant } from '../components/ui/Badge';
import { useAuthStore } from '../stores/auth.store';

const DEFAULT_META: PageMeta = { page: 1, limit: 20, total: 0, totalPages: 0 };

const ROLES = ['ADMIN', 'CONTENT_MANAGER', 'INVENTORY_MANAGER', 'ORDER_MANAGER', 'CUSTOMER'];

function statusVariant(user: User): BadgeVariant {
  if (user.deletedAt) return 'error';
  if (user.lockedUntil) return 'warning';
  return user.isActive ? 'success' : 'error';
}

function statusLabel(user: User): string {
  if (user.deletedAt) return 'deleted';
  if (user.lockedUntil) return 'locked';
  return user.isActive ? 'active' : 'inactive';
}

export function UsersPage() {
  const { t } = useTranslation();
  const currentUserId = useAuthStore((s) => s.user?.id);

  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PageMeta>(DEFAULT_META);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('');
  const [isLockedFilter, setIsLockedFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  useEffect(() => {
    setPage(1);
  }, [roleFilter, isActiveFilter, isLockedFilter]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, unknown> = { page, limit: 20 };
      if (roleFilter) params.role = roleFilter;
      if (isActiveFilter === 'true') params.isActive = true;
      if (isActiveFilter === 'false') params.isActive = false;
      if (isLockedFilter === 'true') params.isLocked = true;

      const result = await usersService.list(params);
      setUsers(result.data);
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
      setUsers([]);
      setMeta(DEFAULT_META);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter, isActiveFilter, isLockedFilter, t]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const handleRoleChange = async (userId: string, role: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await usersService.update(userId, { role });
      await loadUsers();
    } catch {
      // Keep UI for retry.
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleToggleActive = async (userId: string, isActive: boolean) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await usersService.update(userId, { isActive });
      await loadUsers();
    } catch {
      // Keep UI for retry.
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleUnlock = async (userId: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await usersService.unlock(userId);
      await loadUsers();
    } catch {
      // Keep UI for retry.
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleRestore = async (userId: string) => {
    setActionLoading((prev) => ({ ...prev, [userId]: true }));
    try {
      await usersService.restore(userId);
      await loadUsers();
    } catch {
      // Keep UI for retry.
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetId = deleteTarget.id;
    setActionLoading((prev) => ({ ...prev, [targetId]: true }));
    setDeleteTarget(null);
    try {
      await usersService.remove(targetId);
      await loadUsers();
    } catch {
      // Keep UI for retry.
    } finally {
      setActionLoading((prev) => ({ ...prev, [targetId]: false }));
    }
  };

  const ROLES_FOR_SELECT = useMemo(() => ROLES.filter((r) => r !== 'CUSTOMER'), []);

  const columns = useMemo<TableColumn<User>[]>(
    () => [
      {
        key: 'name',
        header: t('users.columns.name'),
        render: (row) => (
          <div className="min-w-0">
            <div className="label-md text-on-surface">{row.name}</div>
            <div className="body-sm text-on-surface-variant">{row.email}</div>
          </div>
        ),
      },
      {
        key: 'role',
        header: t('users.columns.role'),
        render: (row) => {
          const isSelf = row.id === currentUserId;
          return (
            <Select
              value={row.role}
              onChange={(event) => void handleRoleChange(row.id, event.target.value)}
              disabled={isSelf || actionLoading[row.id]}
              aria-label={t('users.actions.changeRole')}
              className="w-40"
            >
              {ROLES_FOR_SELECT.map((r) => (
                <option key={r} value={r}>
                  {t(`roles.${r}`)}
                </option>
              ))}
            </Select>
          );
        },
      },
      {
        key: 'status',
        header: t('common.status'),
        render: (row) => (
          <Badge variant={statusVariant(row)}>{t(`users.status.${statusLabel(row)}`)}</Badge>
        ),
      },
      {
        key: 'createdAt',
        header: t('users.columns.createdAt'),
        render: (row) => formatDate(row.createdAt),
      },
      {
        key: 'actions',
        header: t('common.actions'),
        cellClassName: 'whitespace-nowrap',
        render: (row) => {
          const isSelf = row.id === currentUserId;
          return (
            <div className="flex items-center gap-xs">
              {!row.deletedAt && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    isLoading={actionLoading[row.id]}
                    loadingLabel={t('common.loading')}
                    disabled={isSelf || actionLoading[row.id]}
                    onClick={() => void handleToggleActive(row.id, !row.isActive)}
                  >
                    {row.isActive ? t('users.actions.toggleActive') : t('users.actions.toggleActive')}
                  </Button>
                  {row.lockedUntil && (
                    <Button
                      type="button"
                      size="sm"
                      variant="primary"
                      isLoading={actionLoading[row.id]}
                      loadingLabel={t('common.loading')}
                      disabled={actionLoading[row.id]}
                      onClick={() => void handleUnlock(row.id)}
                    >
                      {t('users.actions.unlock')}
                    </Button>
                  )}
                </>
              )}
              {row.deletedAt ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  isLoading={actionLoading[row.id]}
                  loadingLabel={t('common.loading')}
                  disabled={actionLoading[row.id]}
                  onClick={() => void handleRestore(row.id)}
                >
                  {t('users.actions.restore')}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  isLoading={actionLoading[row.id]}
                  loadingLabel={t('common.loading')}
                  disabled={isSelf || actionLoading[row.id]}
                  onClick={() => setDeleteTarget(row)}
                >
                  {t('common.delete')}
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [actionLoading, currentUserId, t],
  );

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md">
        <h2 id="users-page-title" className="headline-lg text-on-surface">
          {t('pages.users.title')}
        </h2>
      </div>

      <div className="flex flex-wrap items-end gap-md">
        <div className="w-40">
          <Select
            label={t('users.filters.role')}
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
          >
            <option value="">{t('users.filters.allRoles')}</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {t(`roles.${r}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="w-40">
          <Select
            label={t('users.filters.isActive')}
            value={isActiveFilter}
            onChange={(event) => setIsActiveFilter(event.target.value)}
          >
            <option value="">{t('users.filters.allStatus')}</option>
            <option value="true">{t('users.filters.active')}</option>
            <option value="false">{t('users.filters.inactive')}</option>
          </Select>
        </div>

        <div className="w-40">
          <Select
            label={t('users.filters.isLocked')}
            value={isLockedFilter}
            onChange={(event) => setIsLockedFilter(event.target.value)}
          >
            <option value="">{t('users.filters.allLocked')}</option>
            <option value="true">{t('users.filters.locked')}</option>
            <option value="false">{t('users.filters.notLocked')}</option>
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
            data={users}
            rowKey="id"
            caption={t('pages.users.title')}
            emptyState={t('common.empty')}
          />
          <Pagination page={meta.page} totalPages={meta.totalPages} onPageChange={setPage} />
        </>
      )}

      {deleteTarget && (
        <ConfirmDialog
          isOpen
          title={t('users.actions.deleteConfirm', { name: deleteTarget.name })}
          description={t('users.actions.deleteWarning')}
          variant="danger"
          confirmLabel={t('common.delete')}
          isLoading={actionLoading[deleteTarget.id]}
          onConfirm={() => void handleDelete()}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

export default UsersPage;
