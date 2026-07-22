import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', shortLabel: 'EN', label: 'English' },
  { code: 'vi', shortLabel: 'VI', label: 'Tiếng Việt' },
] as const;

export default function LanguageSwitcher() {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const currentLanguage = i18n.resolvedLanguage === 'en' ? 'en' : 'vi';

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const handleSelect = (language: 'en' | 'vi') => {
    void i18n.changeLanguage(language);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        aria-label={t('language.open')}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="relative block h-5 w-5 text-[11px] font-semibold leading-none">
          <span className="absolute left-0 top-0">文</span>
          <span className="absolute bottom-0 right-0">A</span>
          <span className="absolute left-1 top-[0.6rem] h-px w-4 -rotate-12 bg-current" />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t('language.menu')}
          className="absolute right-0 top-12 z-40 w-44 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-xs shadow-level-3"
        >
          {LANGUAGES.map((language) => {
            const selected = currentLanguage === language.code;
            return (
              <button
                key={language.code}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => handleSelect(language.code)}
                className={
                  selected
                    ? 'label-md flex w-full items-center gap-sm rounded-lg bg-primary-container px-sm py-sm text-left text-on-primary-container'
                    : 'label-md flex w-full items-center gap-sm rounded-lg px-sm py-sm text-left text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface'
                }
              >
                <span className="font-bold">{language.shortLabel}</span>
                <span>{language.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
