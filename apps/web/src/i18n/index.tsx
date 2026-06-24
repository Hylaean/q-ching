import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { STRINGS, type Locale } from './strings';

const STORAGE_KEY = 'q-ching:locale';

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'en' || saved === 'fr') return saved;
  } catch {
    /* localStorage may be unavailable */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

export interface I18n {
  locale: Locale;
  setLocale: (l: Locale) => void;
  /** Translate a key, interpolating {placeholders} from `vars`. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18n | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  useEffect(() => {
    try {
      document.documentElement.lang = locale;
    } catch {
      /* no document */
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = STRINGS[locale] ?? STRINGS.en;
      let s = dict[key] ?? STRINGS.en[key] ?? key;
      if (vars) {
        for (const k of Object.keys(vars)) {
          s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(vars[k]));
        }
      }
      return s;
    },
    [locale],
  );

  const value = useMemo<I18n>(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18n {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within <I18nProvider>');
  return ctx;
}

export type { Locale };
