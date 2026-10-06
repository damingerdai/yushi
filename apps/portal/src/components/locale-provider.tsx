"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { LOCALE_COOKIE, type Locale, translate } from "@/lib/i18n";

const LocaleContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (message: string, values?: Record<string, string | number>) => string;
} | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const [locale, updateLocale] = useState(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute(
      "content",
      translate(
        locale,
        "Review diffs and patches, and generate clear commit messages with AI",
      ),
    );
  }, [locale]);
  function setLocale(next: Locale) {
    updateLocale(next);
    try {
      // biome-ignore lint/suspicious/noDocumentCookie: Persist this non-sensitive preference in browsers without Cookie Store support.
      document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    } catch {
      // Switching still works for this session when browser storage is blocked.
    }
  }
  return (
    <LocaleContext.Provider
      value={{
        locale,
        setLocale,
        t: (message, values) => translate(locale, message, values),
      }}
    >
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useLocale must be used within LocaleProvider");
  return context;
}
