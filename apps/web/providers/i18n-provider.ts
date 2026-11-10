import type { I18nProvider } from "@refinedev/core"
import i18n from "@/utils/i18n"

/**
 * Refine i18nProvider backed by the shared i18next instance (ADR-0002,
 * ADR-0004). Components read translations via react-i18next's `useTranslation`
 * so the tree re-renders on `changeLanguage`; this provider exists so Refine's
 * own `useTranslate`/`useSetLocale` surface stays consistent with the same
 * engine.
 */
export const i18nProvider: I18nProvider = {
  translate: (key, options, defaultMessage) => {
    const translated = i18n.t(key, options)
    if (typeof translated === "string" && translated) return translated
    return defaultMessage ?? key
  },
  changeLocale: (locale) => i18n.changeLanguage(locale),
  getLocale: () => i18n.language,
}
