"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Locale = "ar" | "en";

const STORAGE_KEY = "jawla-locale";

type LanguageContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  isArabic: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("ar");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (stored === "ar" || stored === "en") setLocaleState(stored);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
    window.localStorage.setItem(STORAGE_KEY, locale);
  }, [locale, mounted]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, isArabic: locale === "ar" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
