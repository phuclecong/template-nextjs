import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { en } from "@/utils/translations/en"
import { vi } from "@/utils/translations/vi"

/**
 * Client-side i18next engine (ADR-0004). Locale is resolved without a URL
 * segment, persisted to both localStorage and a cookie, and held in i18next so
 * react-i18next's `useTranslation` re-renders the tree on `changeLanguage`.
 * The Refine `i18nProvider` delegates to this same instance (see
 * `providers/i18n-provider.ts`).
 *
 * The engine initializes with the default locale ("en") on both server and
 * client; `applyPersistedLocale` then applies the stored locale in a client
 * effect, after hydration, so a persisted non-default locale doesn't cause an
 * SSR/hydration text mismatch.
 */

export type Locale = "en" | "vi"

const STORAGE_KEY = "locale"
const COOKIE_NAME = "locale"
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365

export function isLocale(value: unknown): value is Locale {
  return value === "en" || value === "vi"
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en"
  try {
    const fromStorage = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(fromStorage)) return fromStorage

    const fromCookie = document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
      ?.split("=")[1]
    if (isLocale(fromCookie)) return fromCookie
  } catch {
    // Storage access can be blocked; fall through to the default.
  }
  return "en"
}

export function persistLocale(locale: string): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
    document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`
  } catch {
    // Persistence is best-effort; the in-memory locale still applies.
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    vi: { translation: vi },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

i18n.on("languageChanged", (locale) => {
  persistLocale(locale)
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale
  }
})

/** Applies the persisted locale on the client, after hydration. */
export function applyPersistedLocale(): void {
  if (typeof window === "undefined") return
  const stored = readStoredLocale()
  if (stored !== i18n.language) {
    void i18n.changeLanguage(stored)
  }
}

export default i18n
