import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import AddressForm from '../checkout/AddressForm';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Toast from '../ui/Toast';
import Skeleton from '../ui/Skeleton';
import { addressesService } from '../../services/addresses.service';
import type { Address, CreateAddressPayload } from '../../types';

const MAX_ADDRESSES = 10;

type Mode = { kind: 'list' } | { kind: 'add' } | { kind: 'edit'; address: Address };

export default function AddressBook() {
  const { t } = useTranslation();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [submitting, setSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    return addressesService
      .getAll()
      .then((data) => setAddresses(data))
      .catch((err: { message?: string }) => setError(err.message ?? t('common.error')))
      .finally(() => setLoading(false));
  }, [t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCreate = async (payload: CreateAddressPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await addressesService.create(payload);
      setMode({ kind: 'list' });
      await load();
    } catch (err) {
      setError((err as { message?: string })?.message ?? t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (id: string, payload: CreateAddressPayload) => {
    setSubmitting(true);
    setError(null);
    try {
      await addressesService.update(id, payload);
      setMode({ kind: 'list' });
      await load();
    } catch (err) {
      setError((err as { message?: string })?.message ?? t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setError(null);
    try {
      await addressesService.remove(id);
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError((err as { message?: string })?.message ?? t('common.error'));
    }
  };

  const handleSetDefault = async (id: string) => {
    setError(null);
    try {
      await addressesService.setDefault(id);
      await load();
    } catch (err) {
      setError((err as { message?: string })?.message ?? t('common.error'));
    }
  };

  if (mode.kind === 'add') {
    return (
      <div className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h3 className="title-md text-on-surface">{t('account.address.add')}</h3>
          <Button variant="ghost" size="sm" onClick={() => setMode({ kind: 'list' })}>
            {t('common.back')}
          </Button>
        </div>
        <AddressForm onSubmit={handleCreate} submitting={submitting} />
      </div>
    );
  }

  if (mode.kind === 'edit') {
    return (
      <div className="flex flex-col gap-md">
        <div className="flex items-center justify-between">
          <h3 className="title-md text-on-surface">{t('account.address.edit')}</h3>
          <Button variant="ghost" size="sm" onClick={() => setMode({ kind: 'list' })}>
            {t('common.back')}
          </Button>
        </div>
        <AddressForm
          initial={mode.address}
          submitting={submitting}
          onSubmit={(payload) => handleUpdate(mode.address.id, payload)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      {error && (
        <Toast variant="error" className="self-start">
          {error}
        </Toast>
      )}

      {loading ? (
        <div className="flex flex-col gap-sm">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <p className="body-md text-on-surface-variant">{t('account.address.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-sm">
          <AnimatePresence initial={false}>
            {addresses.map((address) => (
              <motion.li
                key={address.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md"
              >
                <div className="flex flex-wrap items-center gap-sm">
                  <span className="title-sm text-on-surface">{address.name}</span>
                  <span className="body-sm text-on-surface-variant">{address.phone}</span>
                  {address.isDefault && <Badge>{t('account.address.default')}</Badge>}
                </div>
                <p className="mt-xs body-sm text-on-surface-variant">
                  {address.detail}, {address.wardName}, {address.districtName}, {address.provinceName}
                </p>
                <div className="mt-sm flex flex-wrap gap-xs">
                  {!address.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address.id)}
                    >
                      {t('account.address.setDefault')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setMode({ kind: 'edit', address })}
                  >
                    {t('account.address.edit')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error"
                    onClick={() => setPendingDelete(address)}
                  >
                    {t('account.address.delete')}
                  </Button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      {!loading && addresses.length >= MAX_ADDRESSES ? (
        <p className="body-sm text-on-surface-variant">{t('account.address.max')}</p>
      ) : (
        !loading && (
          <Button variant="primary" size="md" className="self-start" onClick={() => setMode({ kind: 'add' })}>
            {t('account.address.add')}
          </Button>
        )
      )}

      {pendingDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-md"
          role="dialog"
          aria-modal="true"
          aria-label={t('account.address.deleteConfirm')}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-sm rounded-xl bg-surface-container-lowest p-lg shadow-[var(--shadow-level-2)]"
          >
            <p className="body-md text-on-surface">{t('account.address.deleteConfirm')}</p>
            <div className="mt-lg flex justify-end gap-xs">
              <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>
                {t('common.cancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-error text-white hover:bg-error/90"
                onClick={() => handleDelete(pendingDelete.id)}
              >
                {t('account.address.confirmDelete')}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
