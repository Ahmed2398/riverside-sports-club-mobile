import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { translations, Locale, TranslationKeys } from './translations';

const LOCALE_KEY = 'rsc_locale';
const isWeb = Platform.OS === 'web';

type I18nContextValue = {
  locale: Locale;
  isRTL: boolean;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    (async () => {
      try {
        const stored = isWeb ? localStorage.getItem(LOCALE_KEY) : await SecureStore.getItemAsync(LOCALE_KEY);
        if (stored === 'en' || stored === 'ar') {
          applyLocale(stored);
        }
      } catch {}
    })();
  }, []);

  const applyLocale = (newLocale: Locale) => {
    const isRTL = newLocale === 'ar';
    if (I18nManager.isRTL !== isRTL) {
      I18nManager.forceRTL(isRTL);
    }
    if (isWeb && typeof document !== 'undefined') {
      document.dir = isRTL ? 'rtl' : 'ltr';
    }
    setLocaleState(newLocale);
  };

  const setLocale = useCallback((newLocale: Locale) => {
    applyLocale(newLocale);
    if (isWeb) localStorage.setItem(LOCALE_KEY, newLocale);
    else SecureStore.setItemAsync(LOCALE_KEY, newLocale).catch(() => {});
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'ar' : 'en');
  }, [locale, setLocale]);

  const value: I18nContextValue = {
    locale,
    isRTL: locale === 'ar',
    t: translations[locale],
    setLocale,
    toggleLocale,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export function useTranslation(): TranslationKeys {
  return useI18n().t;
}

export function localizedText(bilingual: { ar: string; en: string }, locale: Locale): string {
  return bilingual[locale];
}
