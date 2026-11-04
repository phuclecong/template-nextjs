# Two-layer authentication: JWT bearer for the API, session cookie for route gating

The API contract uses JWT bearer (access + refresh) because it hands off to FastAPI, and the access token lives in memory under Refine's `authProvider`. Next 16 route protection is server-side, so login runs through a Server Action that obtains the token *and* sets a signed httpOnly session cookie that `proxy.ts` reads to gate routes. The cookie gates navigation only — it is not a second auth system; authorization for data lives in the API (and, later, FastAPI).
