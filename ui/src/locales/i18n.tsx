import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import en from "./en/translation.json";
import zh from "./zh/translation.json";

export type Locale = "en" | "zh";

type NestedKeyOf<T> = T extends object
  ? {
      [K in keyof T & string]: T[K] extends object ? `${K}.${NestedKeyOf<T[K]>}` : K;
    }[keyof T & string]
  : never;

export type TranslationKey = NestedKeyOf<typeof en>;

const translations: Record<Locale, object> = { en, zh };

function flatten(obj: Record<string, unknown>, prefix = ""): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value as Record<string, unknown>, fullKey));
    } else {
      result[fullKey] = String(value);
    }
  }
  return result;
}

const flatTranslations: Record<Locale, Record<string, string>> = {
  en: flatten(en as unknown as Record<string, unknown>),
  zh: flatten(zh as unknown as Record<string, unknown>),
};

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

function translate(locale: Locale, key: string, params?: Record<string, string | number>): string {
  let text = flatTranslations[locale]?.[key] ?? getNestedValue(translations[locale] as unknown as Record<string, unknown>, key);
  if (text === key) {
    text = flatTranslations.en[key] ?? key;
  }
  if (params) {
    for (const [paramKey, paramValue] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue));
    }
  }
  return text;
}

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = "paperclip-locale";

function detectLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "zh") return stored;
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("zh")) return "zh";
  return "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale]
  );

  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useTranslation must be used within I18nProvider");
  return ctx;
}

export { type Locale as LocaleType };
