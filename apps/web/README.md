# `web` — the Refine + Next.js dashboard app

The user-facing app: an authenticated dashboard with Tasks, Users, and Settings
pages. Domain-specific code (Tasks, Users, auth, settings) lives here. It may
import from the three workspace packages, but never the reverse:

| Package                 | What it owns                                                   |
| ----------------------- | -------------------------------------------------------------- |
| `@workspace/ui`         | Presentational primitives (Button, Dialog, Field, Sidebar, …)  |
| `@workspace/shared-lib` | App-agnostic table infra (`DataTable`, `useTableState`)        |
| `@workspace/api`        | The OpenAPI contract, zod schemas, and the MSW-backed mock API |

## Stack

Next.js 16 (App Router) · React 19 · [Refine](https://refine.dev) (the single
data/auth backbone) · TanStack Query / Table / Virtual · react-hook-form + zod ·
i18next (en/vi) · MSW (mock API) · Tailwind / shadcn.

## Layout

| Directory     | What lives there                                                          |
| ------------- | ------------------------------------------------------------------------- |
| `app/`        | Routes, the root layout, the `Providers` tree, and Server Actions         |
| `components/` | Cross-cutting app shell — `DashboardShell`, `AppSidebar`, theme/MSW gates |
| `features/`   | Vertical slices per resource (`tasks/`, `users/`, `auth/`, `settings/`)   |
| `providers/`  | Refine providers — data, auth, access-control, i18n, notifications, audit |
| `utils/`      | Session, auth transport, i18n engine, HTTP error/currency helpers         |
| `test/`       | Vitest unit tests, one per provider/utility                               |
| `e2e/`        | Playwright specs and shared helpers                                       |

## Routing

| Route                 | Renders                                                |
| --------------------- | ------------------------------------------------------ |
| `/`                   | Redirects to `/dashboard` or `/login` based on session |
| `/login`, `/register` | Auth forms (`features/auth`)                           |
| `/dashboard`          | Redirects to `/dashboard/tasks` (`next.config.ts`)     |
| `/dashboard/tasks`    | `TasksView` (fullest table example)                    |
| `/dashboard/users`    | `UsersView` (minimal table example)                    |
| `/dashboard/settings` | `SettingsView` (theme, locale, currency, password)     |
| `/api/session`        | Returns the signed session for Refine's auth `check`   |

`/dashboard/*` routes share `app/dashboard/layout.tsx`, which resolves the
session, bounces unauthenticated visitors to `/login`, and passes the
collapsed/expanded sidebar preference into `DashboardShell`.

## Feature folders

Each user-facing feature is a vertical slice under `features/<feature>/`
(ADR-0006): an `index.tsx` view as the public entry, with `components/`,
`hooks/`, and `utils/` added only where needed. A feature's view, table,
filters, hooks, and local domain types change together, so they live together.

| Feature    | Shape                                                         |
| ---------- | ------------------------------------------------------------- |
| `tasks`    | Fullest — filters, selection, bulk actions, dialogs, row hook |
| `users`    | Minimal — one filter, inline `useList`, no selection          |
| `auth`     | `LoginForm` / `RegisterForm` (inline forms, no dialogs)       |
| `settings` | Inline forms + theme/locale controls, no table                |

New resources follow the same recipe — see the `create-table`, `create-form`,
and `create-dialog` skills in [`.claude/skills/`](../../.claude/skills/).

## Data and providers

Refine is the single backbone for cross-cutting concerns (ADR-0002); everything
is wired once in `app/providers.tsx` and client pages fetch through Refine hooks
(`useList`, `useGetIdentity`, `useCustomMutation`, …) — Server Components stay
thin (ADR-0005).

| Provider                  | What it does                                                            |
| ------------------------- | ----------------------------------------------------------------------- |
| `data-provider`           | `simple-rest` pointed at `/api`; attaches the in-memory access token    |
| `auth-provider`           | Login/register/logout via Server Actions; in-memory token + user        |
| `access-control-provider` | Admin/member matrix: admin = all; member = list users, act on own tasks |
| `notification-provider`   | Refine's notification bus → sonner toasts                               |
| `i18n-provider`           | Delegates to the shared i18next engine (ADR-0004)                       |
| `audit-log-provider`      | Stub with a real interface; echoes writes, no persistence yet           |

**Mock vs. real backend.** With `API_URL` unset, the app runs fully against an
in-browser MSW worker (booted in `components/msw-provider.tsx`). Set `API_URL`
and `next.config.ts` rewrites `/api/*` to it server-side (no CORS), and the auth
transport in `utils/auth-client.ts` calls the real backend.

## Auth

Two-layer auth (ADR-0003): a signed, httpOnly session cookie gates navigation,
and the API enforces data authorization.

- **Server Actions** (`app/actions/auth.ts`) sign the cookie and return an
  access token that Refine holds in memory — never `localStorage`.
- **`proxy.ts`** redirects unauthenticated visitors away from `/dashboard` and
  authenticated visitors away from `/login` / `/register`.
- **`utils/session.ts`** signs/verifies the cookie (HS256 via `jose`); it
  requires `SESSION_SECRET` in production.

## i18n

Client-side i18next (ADR-0004), resolved without a URL segment. Dictionaries
live in `utils/translations/en.ts` and `vi.ts`; `vi` is typed
`Translation = typeof en`, so the two must share every key — drift fails
typecheck. Add both whenever you add user-facing strings.

## Commands

Run from the repo root with `--filter`:

| Command                       | What it does                |
| ----------------------------- | --------------------------- |
| `pnpm --filter web dev`       | Start the dev server        |
| `pnpm --filter web build`     | Production build            |
| `pnpm --filter web typecheck` | `tsc --noEmit`              |
| `pnpm --filter web lint`      | ESLint                      |
| `pnpm --filter web format`    | Prettier                    |
| `pnpm --filter web test`      | Vitest unit tests           |
| `pnpm --filter web test:e2e`  | Playwright end-to-end tests |
