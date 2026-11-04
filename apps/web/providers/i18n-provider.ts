import type { I18nProvider } from "@refinedev/core"

/**
 * Refine i18nProvider (ADR-0002, ADR-0004). English is the default locale.
 * ADR-0004's i18next engine and cookie/localStorage persistence land with the
 * locale feature; until then this minimal English table satisfies the
 * provider contract without a dependency.
 */
const english: Record<string, string> = {}

let locale = "en"

export const i18nProvider: I18nProvider = {
  translate: (key, _options, defaultMessage) =>
    english[key] ?? defaultMessage ?? key,
  changeLocale: (next) => {
    locale = next
    return Promise.resolve()
  },
  getLocale: () => locale,
}
