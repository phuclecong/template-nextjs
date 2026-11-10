# Nextjs monorepo template

A runnable reference dashboard — Users, Tasks, and Settings pages — built on Refine + Next.js 16 + React 19 + TypeScript + Tailwind/shadcn. The backend is mocked from a contract-first OpenAPI 3.0 spec via MSW, so the front end is fully functional today and the spec hands off to FastAPI later. It demonstrates a reusable component system, role-based access control (admin/member), i18n (en/vi with currency formatting), a performant virtualized task table with debounced search, WCAG 2.2 AA accessibility, and a full test harness (Vitest + Playwright + Storybook).

## Project structure

```bash
├── apps/
│   └── web/                  # Refine + Next.js 16 app
├── packages/
│   └── ui/                   # Shared shadcn/ui components
│   └── api/                  # OpenAPI 3.0 contract + MSW-backed client
├── docs/
│   └── deployment.md         # Vercel deployment guide
├── package.json
├── pnpm-workspace.yaml
└── ...
```

---

# Command

| Command           | Description                                      |
| ----------------- | ------------------------------------------------ |
| `pnpm install`    | Install dependencies for all workspaces.         |
| `pnpm dev`        | Start the `apps/web` Next.js development server. |
| `pnpm build`      | Build `apps/web` for production.                 |
| `pnpm lint`       | Run linting across the monorepo.                 |
| `pnpm test`       | Run Vitest unit tests.                           |
| `pnpm test:e2e`   | Run Playwright end-to-end tests.                 |
| `pnpm test:e2eui` | Run Playwright end-to-end tests in UI mode.      |
| `pnpm storybook`  | Start Storybook for `packages/ui`.               |

---

<details>
<summary>App Web</summary>

# [`app/web` — the Refine + Next.js dashboard app](./apps/web/)

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

</details>

---

<details>
<summary>Design system</summary>

# [`@workspace/ui` — the design system](./packages/ui/README.md)

Domain-agnostic UI primitives for the template dashboard. These are the lowest-level building blocks: they know nothing about Tasks, Users, or the dashboard, and they never import from `apps/web`.

## Primitives

| Primitive                                                                                                 | Import                              | Built on              |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------- |
| Button                                                                                                    | `@workspace/ui/components/button`   | Base UI `Button`      |
| Dialog                                                                                                    | `@workspace/ui/components/dialog`   | Base UI `Dialog`      |
| Input                                                                                                     | `@workspace/ui/components/input`    | Base UI `Input`       |
| Textarea                                                                                                  | `@workspace/ui/components/textarea` | native `<textarea>`   |
| Select                                                                                                    | `@workspace/ui/components/select`   | Base UI `Select`      |
| Table (+ `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableFooter`, `TableCaption`) | `@workspace/ui/components/table`    | native table elements |
| Toast (`Toaster`, `toast`)                                                                                | `@workspace/ui/components/sonner`   | sonner                |
| ...                                                                                                       | ...                                 | ...                   |

Every primitive forwards native props, so it drops into plain `<form>`/table usage without an adapter. Shared tokens live in `src/lib`:

- `lib/utils.ts` — `cn` (compiled Tailwind class merging).

## The boundary rule

`packages/ui` must stay domain-agnostic: it **must not import from `apps/web`**. This is enforced by `no-restricted-imports` in `packages/ui/eslint.config.js` (and by the fact that `@/` — the app alias — does not resolve here). Feature components that compose the primitives live in `apps/web/components`.

## Adding a primitive

1. Add `src/components/<name>.tsx`, importing `cn` from `"cn"`.
2. Add `src/components/<name>.stories.tsx` with representative stories.
3. That's it — the `./components/*` export map and the Storybook glob pick it up automatically.

## Storybook

```bash
# from the repo root
pnpm storybook           # dev server at http://localhost:6006
pnpm build-storybook     # static build into packages/ui/storybook-static
```

`pnpm build` runs `turbo build` **and** `turbo build-storybook`, so the design system's Storybook is part of the monorepo build.

## Adding shadcn components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```

</details>

---

<details>
<summary>Mock API</summary>

# [`@workspace/api`](./packages/api/README.md)

Contract-first mock API layer for the template monorepo.

## Purpose

`openapi.yaml` is the single source of truth for the dashboard's API. This package turns that contract into three artifacts:

1. **MSW handlers** — a stateful mock backend (in-memory via `@msw/data`) that serves the API in the browser and in Node smoke tests.
2. **TypeScript types** — client types generated into `src/generated/api.d.ts` via `openapi-typescript`.
3. **Framework-free business logic** — the auth/service layer shared by the mock handlers and the Next.js server actions.

## Structure

```txt
packages/api/
├── openapi.yaml               # Single source of truth for the API contract
├── src/
│   ├── index.ts               # Public entry point (re-exports)
│   ├── service.ts             # Framework-free auth business logic
│   ├── handlers.ts            # Spec-derived + data-backed handlers (Node)
│   ├── data-handlers.ts       # Stateful, hand-written MSW handlers (browser-safe)
│   ├── collections.ts         # Zod schemas + @msw/data collections + seeding
│   ├── auth.ts                # Mock bearer token sign/verify
│   └── generated/api.d.ts     # Generated client types (from openapi.yaml)
├── test/
│   ├── smoke.test.ts          # End-to-end API smoke tests (MSW node server)
│   └── types.test.ts          # Compile-time checks of the generated types
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Usage

### In the browser (mock worker)

`data-handlers` is browser-safe — no `node:fs`, no `fromOpenApi`, no top-level `await` — so it can be bundled into the MSW worker:

```ts
import { setupWorker } from "msw/browser"
import { dataHandlers } from "@workspace/api/data-handlers"
import { resetDb } from "@workspace/api/collections"

await resetDb()
const worker = setupWorker(...dataHandlers)
await worker.start()
```

### In Node (smoke tests)

`handlers` composes the data-backed handlers with a spec-generated fallback:

```ts
import { setupServer } from "msw/node"
import { handlers, resetDb } from "@workspace/api"

const server = setupServer(...handlers)
server.listen()
await resetDb()
```

### Server-side business logic

`service` is framework-free — no MSW, no `Request`/`Response`, no top-level `await` — so it can be imported into the Next.js server runtime:

```ts
import {
  loginUser,
  registerUser,
  getUserByAccessToken,
} from "@workspace/api/service"

const result = await loginUser("member@example.com", "memberpass")
// { status: 200, body: { accessToken, refreshToken, user } }
```

### Shared types and schemas

```ts
import type { Role } from "@workspace/api/collections"
import { taskPrioritySchema, taskStatusSchema } from "@workspace/api/collections"
import type { AuthResponseBody, PublicUser } from "@workspace/api/service"
```

## Demo accounts

The store seeds two accounts (`ensureSeedUsers` / `seedDb`):

| Email                | Password     | Role     |
| -------------------- | ------------ | -------- |
| `admin@example.com`  | `adminpass`  | `admin`  |
| `member@example.com` | `memberpass` | `member` |

Tokens are mock bearer tokens (prefixed `mock.`) that round-trip the user id and role. They are **not** cryptographically signed — the FastAPI backend issues real JWTs.

## API surface

All routes are under `/api` and use bearer auth unless noted.

| Method | Path              | Auth           | Description                                    |
| ------ | ----------------- | -------------- | ---------------------------------------------- |
| POST   | `/auth/register`  | —              | Register; `201`, `409` on duplicate email      |
| POST   | `/auth/login`     | —              | Log in with email + password                   |
| POST   | `/auth/refresh`   | —              | Exchange a refresh token for an access token   |
| POST   | `/auth/logout`    | bearer         | `204`                                          |
| GET    | `/users`          | bearer         | List users (passwords stripped)                |
| PATCH  | `/users/:id/role` | admin          | Change a user's role                           |
| DELETE | `/users/:id`      | admin          | Delete a user                                  |
| GET    | `/tasks`          | bearer         | List tasks with filters, sort, and pagination  |
| POST   | `/tasks`          | bearer         | Create a task (assigned to the caller)         |
| PATCH  | `/tasks/bulk`     | bearer         | Update several tasks; per-id failures reported |
| PATCH  | `/tasks/:id`      | owner or admin | Update a task                                  |
| DELETE | `/tasks/:id`      | owner or admin | Delete a task                                  |
| PUT    | `/password`       | bearer         | Change the caller's password                   |

`GET /tasks` accepts `q`, `status`, `priority`, `assigneeId` (or the literal `"unassigned"`), `dueDate_gte`, `dueDate_lte`, `_start`, `_end`, `_sort`, and `_order`. Sortable fields are `title`, `status`, `priority`, and `dueDate`. Responses include an `x-total-count` header.

## Scripts

```bash
pnpm --filter @workspace/api generate:types  # regenerate src/generated/api.d.ts
pnpm --filter @workspace/api lint
pnpm --filter @workspace/api format
pnpm --filter @workspace/api typecheck
pnpm --filter @workspace/api test
```

## Conventions

- `openapi.yaml` is the single source of truth. After editing it, regenerate the types with `generate:types`.
- Keep `data-handlers.ts` free of `node:fs`, `fromOpenApi`, and top-level `await` so it bundles for the browser.
- Keep `service.ts` framework-free (no MSW, no `Request`/`Response`) so it runs in the Next.js server.
- Put business logic in `service.ts`; handlers only translate HTTP ↔ service results.
- Record schemas live in `collections.ts` (Zod) alongside the `@msw/data` collections.
- Only the `exports` map in `package.json` is public API; import those subpaths rather than deep files.

</details>

---

<details>
<summary>Deployment</summary>

# [Deloyment](./docs/deployment.md)

This repository is a Turborepo monorepo whose deployable unit is the `apps/web` Next.js app (with `@workspace/ui` and `@workspace/api` as workspace packages).

> **Status:** no production environment is provisioned in this repository, and
> none is created by the tooling. This document describes how to deploy
> `apps/web` to [Vercel](https://vercel.com) when a host is set up. CI (see
> [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) runs lint,
> typecheck, test, and build on every PR, but does **not** deploy.

## Target

Deploy only `apps/web`. Vercel detects a Next.js app in a monorepo via
`next build` in the app directory and supports Turborepo automatically
(see [Vercel's Turborepo docs](https://vercel.com/docs/monorepos/turborepo)).
Configure the project with:

- **Root directory:** `apps/web`
- **Build command:** `pnpm --filter web build` (or the default `next build`)
- **Output directory:** `.next` (default)

The app supports the full Next.js Node.js server runtime (App Router, Server
Actions, route handlers), so use the default serverless/Node deployment — not
a static export.

## Environment variables

| Variable         | Required   | Purpose                                                                                                                                                       |
| ---------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SESSION_SECRET` | yes (prod) | Signing key for the httpOnly session cookie (JWT HS256).                                                                                                      |
| `API_URL`        | optional   | Real backend origin. When set, `/api/*` is proxied server-side and the in-browser mock is disabled. When unset, the app runs against the in-browser MSW mock. |

`SESSION_SECRET` must be a long, random value (e.g.`openssl rand -base64 32`). `lib/session.ts` refuses to run in production with the dev fallback.

## Steps

1. Import the repository into Vercel.
2. Set **Root Directory** to `apps/web`.
3. Add `SESSION_SECRET` in **Project → Settings → Environment Variables**.
4. (Optional) Add `API_URL` to point at a real backend; omit it to keep the in-browser mock.
5. Deploy.

## Mock mode vs. real backend

- **Mock mode** (`API_URL` unset): `apps/web` serves its own auth Server Actions backed by `@workspace/api` in-process, and the browser runs an MSW worker that intercepts `/api/*`. Nothing external is needed.
- **Real backend** (`API_URL` set): `next.config.ts` adds a rewrite so the browser's `/api/*` requests are proxied to the backend (no CORS), and the auth Server Actions call the backend over HTTP.

</details>

---

<details>
<summary>Skills</summary>

# [Skills](./docs/skills.md)

Skills are packaged instructions for Claude Code: a focused recipe the agent follows when a task matches. They live in [`.claude/skills/`](../.claude/skills/) at the repo root, so they're available in every agent session in this repo.

This page teaches you how to _drive_ the three CRUD skills — `create-table`, `create-form`, and `create-dialog`. (For how to _write_ a skill, see [Writing a new skill](#writing-a-new-skill).)

## Two ways to use a skill

1. **Just say what you want** — the agent matches your request against each skill's description and loads the right one automatically. "Add a users table" reaches for `create-table`; you don't have to name it.
2. **Type the slash command** — `/create-table`, `/create-form`, or `/create-dialog` — when you want to force the choice.

Both routes end in the same place: the agent reads the skill and follows its steps. Use natural language most of the time; reach for the slash command when a request is ambiguous and you want to pin down which recipe runs.

## The one mental model: a resource

Everything these skills build hangs off a **resource** (a task, a user, …). One resource usually means three pieces of UI that work together:

| Piece         | Skill           | What it is                                                                                   |
| ------------- | --------------- | -------------------------------------------------------------------------------------------- |
| The list      | `create-table`  | Server-paginated, sortable, filterable, URL-driven `DataTable`                               |
| Create / edit | `create-form`   | react-hook-form + zod form, in a dialog or inline                                            |
| Confirmations | `create-dialog` | A modal shell — dismissable `Dialog`, or `ConfirmDialog`/`AlertDialog` for a forced decision |

So "add a users feature" is rarely one skill. It's a table (list), a form (create/edit), and a dialog or two (the form's shell + a delete confirmation). Say it plainly and the agent will pull in all three at the seams where they meet.

## What each skill does

### `create-table`

**Produces** a `DataTable` + `useTableState` from `@workspace/shared-lib`, wired server-side: sorting, filtering, and pagination all go through the mock API and live in the URL.

**Say things like:**

- "Add a `projects` table to the dashboard."
- "Rework the tasks table to add a `status` filter."
- "Give the users table a select column and bulk actions."

**What the agent does** — copies the closest existing feature folder rather than inventing:

- **Minimal example** — `apps/web/features/users/` (one filter, no selection).
- **Fullest example** — `apps/web/features/tasks/` (five filters, selection, bulk actions, dialogs).

It adds a mock list handler in `packages/api/src/data-handlers.ts`, a `utils/` folder with filter option lists and types, a row hook, the table component, a filter bar, bulk actions (only if rows are selected and edited together), the view + route, and English/Vietnamese translations.

**Verify** — the agent runs `pnpm --filter web typecheck`, `pnpm --filter web lint`, and `pnpm --filter @workspace/api test`. Check the resource appears in the sidebar route and that sort, filter, and pagination actually round-trip to the API.

### `create-form`

**Produces** a `react-hook-form` + `zodResolver` form rendered through the `Field` / `FieldLabel` / `FieldError` primitives from `@workspace/ui`.

**Say things like:**

- "Add a create/edit form for projects."
- "Turn the login form into a React Hook Form."
- "Add a change-password form to settings."

**Two shapes**, matched to the closest example:

- **Dialog form** (create/edit) — `apps/web/features/tasks/components/task-dialogs.tsx` (`TaskFormDialog`).
- **Inline form** (no dialog) — `apps/web/features/auth/components/login-form.tsx` or the settings `ChangePasswordForm`.

**What the agent does** — builds a zod schema (localized via `useMemo(..., [t])`), one `Controller` per field, then wires **submit** to one of three mutation paths: resource (`useCreate`/`useUpdate`), auth (`useLogin`/`useRegister`), or a custom endpoint (`useCustomMutation`). Mutations invalidate the list so the table refreshes.

**Verify** — `pnpm --filter web typecheck` and `pnpm --filter web lint`. Fill the form and confirm validation messages, the empty→null handling for optional fields, and the success/error notifications.

### `create-dialog`

**Produces** a controlled modal driven by `useDialog` and one of two `@workspace/ui` primitives:

- `ConfirmDialog` (over `AlertDialog`) — a forced decision with no dismiss path. Use for destructive/irreversible actions like delete.
- `Dialog` — dismissable (Escape, backdrop, close button). Use when backing out is harmless, e.g. a form the user can abandon.

**Say things like:**

- "Add a delete confirmation to the users table."
- "Open the task form in a dialog."
- "Rework the edit dialog to reset when reopened."

**What the agent does** — holds `useDialog` in the parent (the table), wires a trigger button to `open(row)`, renders the shell, and keeps a confirmation's mutation at the call site. It keys mount-only content by `useDialog.version` so a reopened dialog re-reads its data.

**Verify** — `pnpm --filter web typecheck` and `pnpm --filter web lint`. Check the dialog opens for the right row, and that a confirmation genuinely can't be dismissed by clicking outside.

## How they compose

The skills are built to meet cleanly. Knowing the seams lets you request whole features in one sentence:

- **Table + dialog** — a table's row actions open dialogs. Start with `create-table`; it leaves the edit/delete buttons to be wired to dialogs.
- **Form + dialog** — a create/edit form that opens in a modal is _two_ skills: `create-dialog` supplies the shell and `useDialog` state, `create-form` supplies the fields, validation, and submit mutation. Each skill names the other at the seam, so the agent loads both.
- **Confirmation alone** — a delete confirmation is just `create-dialog` (the `ConfirmDialog`).

## A first feature, end to end

The shortest reliable way to ask for a new resource is to describe it, not the plumbing:

> "Add a `projects` feature: a table on the dashboard with a status filter, a create/edit form in a dialog, and a delete confirmation."

The agent will:

1. `create-table` the list (handler, filter bar, view, route).
2. `create-dialog` the two shells (the form's `Dialog`, the delete `ConfirmDialog`).
3. `create-form` the fields inside the form shell.
4. Add `en`/`vi` translations throughout.
5. Run typecheck, lint, and API tests and hand you the result.

You bring the domain facts (field names, which are required, what's filterable); the agent brings the fixed stack and the closest example to copy.

## Tips

- **Name the resource and its fields.** "A `projects` table with a `status` filter" beats "a table." The agent maps your fields to schemas and filters; the less it has to guess, the fewer follow-up questions.
- **Say which shape you want** when it matters: dialog vs. inline form, dismissable vs. forced-choice dialog.
- **Trust the copy, not invention** — every skill points the agent at a closest example folder. If you want a different behavior than the example, say so explicitly.
- **Expect the verification commands** — typecheck, lint, API tests, and a Playwright spec if the resource has one. Red on any of them is a real failure to report, not noise.

</details>
