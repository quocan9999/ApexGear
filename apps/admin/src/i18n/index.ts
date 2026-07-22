import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './en.json';
import vi from './vi.json';

const LANGUAGE_STORAGE_KEY = 'admin.language';
const SUPPORTED_LANGUAGES = ['en', 'vi'] as const;

type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function storedLanguage(): SupportedLanguage {
  if (typeof window === 'undefined') return 'vi';
  const saved = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return SUPPORTED_LANGUAGES.includes(saved as SupportedLanguage)
    ? (saved as SupportedLanguage)
    : 'vi';
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: storedLanguage(),
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (language) => {
  if (typeof window === 'undefined') return;
  if (SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
});

export default i18n;
