import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Spinner, Toast } from '../components/ui';
import { settingsService } from '../services/settings.service';
import type { Setting } from '../types';

interface EditableState {
  [key: string]: string;
}

// Map setting keys to their i18n key
const SETTING_GROUPS: { groupKey: string; keys: string[] }[] = [
  { groupKey: 'general', keys: ['store_name'] },
  { groupKey: 'shipping', keys: ['shipping_fee'] },
];

export function SettingsPage() {
  const { t } = useTranslation();

  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState<EditableState>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const settingsMap = new Map(settings.map((s) => [s.key, s]));

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await settingsService.list();
      setSettings(result);
      // Init dirty state with current values
      const init: EditableState = {};
      for (const s of result) {
        init[s.key] = s.value;
      }
      setDirty(init);
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setError(message);
      setSettings([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const handleSave = async (key: string) => {
    const value = dirty[key] ?? '';
    setSaving((prev) => ({ ...prev, [key]: true }));
    try {
      await settingsService.update(key, value);
      setSettings((prev) => prev.map((s) => (s.key === key ? { ...s, value } : s)));
      setToast({ message: t('pages.settings.updated', { key: t(`pages.settings.key.${key}` as const) }), type: 'success' });
    } catch (err) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : t('common.genericError');
      setToast({ message, type: 'error' });
    } finally {
      setSaving((prev) => ({ ...prev, [key]: false }));
    }
  };

  const hasChanged = (key: string) => {
    const original = settingsMap.get(key)?.value ?? '';
    return (dirty[key] ?? '') !== original;
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex flex-col gap-sm border-b border-outline-variant pb-md">
        <h2 id="settings-page-title" className="headline-lg text-on-surface">
          {t('pages.settings.title')}
        </h2>
        <p className="body-md text-on-surface-variant">{t('pages.settings.description')}</p>
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
        <div className="flex flex-col gap-xl">
          {SETTING_GROUPS.map((group) => {
            const visibleKeys = group.keys.filter((k) => settingsMap.has(k));
            if (visibleKeys.length === 0) return null;

            return (
              <div key={group.groupKey}>
                <h3 className="headline-sm text-on-surface mb-md">
                  {t(`pages.settings.group.${group.groupKey as 'general' | 'shipping'}` as const)}
                </h3>
                <div className="flex flex-col gap-md">
                  {visibleKeys.map((key) => {
                    const current = dirty[key] ?? '';
                    const isDirty = hasChanged(key);
                    const isSaving = saving[key];

                    return (
                      <div
                        key={key}
                        className="flex flex-col gap-sm rounded-lg border border-outline-variant bg-surface-container-lowest p-md md:flex-row md:items-end md:gap-md"
                      >
                        <div className="flex-1">
                          <p className="label-md text-on-surface mb-xs">
                            {t(`pages.settings.key.${key as 'store_name' | 'shipping_fee'}` as const)}
                          </p>
                          <Input
                            value={current}
                            onChange={(event) =>
                              setDirty((prev) => ({ ...prev, [key]: event.target.value }))
                            }
                            aria-label={t(`pages.settings.key.${key as 'store_name' | 'shipping_fee'}` as const)}
                          />
                          {isDirty && (
                            <p className="body-sm text-warning mt-xs">
                              {t('common.genericError')} {/* just a visual indicator */}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => void handleSave(key)}
                          isLoading={isSaving}
                          loadingLabel={t('common.loading')}
                          disabled={!isDirty || isSaving}
                        >
                          {t('pages.settings.save')}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <Toast
          title={toast.message}
          variant={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  );
}

export default SettingsPage;
