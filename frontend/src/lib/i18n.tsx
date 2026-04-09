"use client";

import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  APP_LOCALE_STORAGE_KEY,
  APP_LOCALE_TAGS,
  DEFAULT_APP_LOCALE,
  type AppLocale,
  type LocaleContent,
  localeContent,
  resolvePreferredLocale,
} from "@/lib/i18n-config";

type I18nContextValue = {
  locale: AppLocale;
  localeTag: string;
  copy: LocaleContent;
  setLocale: Dispatch<SetStateAction<AppLocale>>;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({children}: {children: ReactNode}) {
  const [locale, setLocale] = useState<AppLocale>(DEFAULT_APP_LOCALE);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(APP_LOCALE_STORAGE_KEY);
    const nextLocale = resolvePreferredLocale(storedLocale ?? window.navigator.language);
    setLocale(nextLocale);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(APP_LOCALE_STORAGE_KEY, locale);
    document.documentElement.lang = APP_LOCALE_TAGS[locale];
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      localeTag: APP_LOCALE_TAGS[locale],
      copy: localeContent[locale],
      setLocale,
    }),
    [locale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider.");
  }

  return context;
}
