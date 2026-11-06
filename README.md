# Nextjs monorepo template

A runnable reference dashboard — Users, Tasks, and Settings pages — built on Refine + Next.js 16 + React 19 + TypeScript + Tailwind/shadcn. The backend is mocked from a contract-first OpenAPI 3.0 spec via MSW, so the front end is fully functional today and the spec hands off to FastAPI later. It demonstrates a reusable component system, role-based access control (admin/member), i18n (en/vi with currency formatting), a performant virtualized task table with debounced search, WCAG 2.2 AA accessibility, and a full test harness (Vitest + Playwright + Storybook).

## Project structure

```bash
├── apps/
│   └── web/                  # Refine + Next.js 16 app
├── packages/
│   └── ui/                   # Shared shadcn/ui components
│       └── src/
│           └── components/
├── docs/
│   └── deployment.md         # Vercel deployment guide
├── package.json
├── pnpm-workspace.yaml
└── ...
```

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

`packages/ui` must stay domain-agnostic: it **must not import from
`apps/web`**. This is enforced by `no-restricted-imports` in
`packages/ui/eslint.config.js` (and by the fact that `@/` — the app alias —
does not resolve here). Feature components that compose the primitives live in
`apps/web/components`.

## Adding a primitive

1. Add `src/components/<name>.tsx`, importing `cn` from `"cn"`.
2. Add `src/components/<name>.stories.tsx` with representative stories.
3. That's it — the `./components/*` export map and the Storybook glob pick it
   up automatically.

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
