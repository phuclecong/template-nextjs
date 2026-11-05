import type { Locale } from "@/lib/i18n"

/**
 * Locale-aware currency formatting (ADR-0004, GLOSSARY "Locale"). English shows
 * USD with two decimals; Vietnamese shows VND, which `Intl` already treats as
 * zero-decimal.
 */

type CurrencyCode = "USD" | "VND"

function currencyForLocale(locale: Locale): CurrencyCode {
  return locale === "vi" ? "VND" : "USD"
}

export function formatCurrency(amount: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyForLocale(locale),
  }).format(amount)
}
