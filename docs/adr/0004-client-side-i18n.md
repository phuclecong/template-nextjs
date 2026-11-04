# Client-side i18n without a URL locale prefix

Locale is resolved client-side via Refine's `i18nProvider` (i18next) and persisted to a cookie + localStorage; URLs carry no locale segment. This deviates from Next 16's recommended `[lang]` path routing because the app is an authenticated, client-side dashboard with minimal SEO, and a `[lang]` segment would fight Refine's client routing.
