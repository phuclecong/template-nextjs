# Refine as the single data and auth backbone

Refine (`@refinedev/core`) owns the cross-cutting providers — data, auth, access-control, notifications, i18n, audit-log — and wraps TanStack Query for caching and invalidation. TanStack Table is used only for table rendering, and zustand holds only cross-cutting UI state. Without this boundary the stack would double up (Refine + raw TanStack Query + zustand all touching server state), so each library is given exactly one role.
