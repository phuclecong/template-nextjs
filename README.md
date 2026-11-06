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

| Command                                  | Description                                      |
| ---------------------------------------- | ------------------------------------------------ |
| `pnpm install`                           | Install dependencies for all workspaces.         |
| `pnpm dev`                               | Start the `apps/web` Next.js development server. |
| `pnpm build`                             | Build `apps/web` for production.                 |
| `pnpm lint`                              | Run linting across the monorepo.                 |
| `pnpm test`                              | Run Vitest unit tests.                           |
| `pnpm test:e2e`                          | Run Playwright end-to-end tests.                 |
| `pnpm --filter ./apps/web test:e2e --ui` | Run Playwright end-to-end tests in UI mode.      |
| `pnpm storybook`                         | Start Storybook for `packages/ui`.               |

---

# `@workspace/ui` — the design system

[`@workspace/ui` — the design system](./packages/ui/README.md)

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

---

# `@workspace/api` - Contract-first mock API

[`@workspace/api`](./packages/api/README.md)

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

# Deployment

[docs/deployment.md](./docs/deployment.md)

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
