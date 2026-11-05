# Deployment

This repository is a Turborepo monorepo whose deployable unit is the `apps/web`
Next.js app (with `@workspace/ui` and `@workspace/api` as workspace packages).

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

| Variable          | Required | Purpose                                                        |
| ----------------- | -------- | -------------------------------------------------------------- |
| `SESSION_SECRET`  | yes (prod) | Signing key for the httpOnly session cookie (JWT HS256).    |
| `API_URL`         | optional | Real backend origin. When set, `/api/*` is proxied server-side and the in-browser mock is disabled. When unset, the app runs against the in-browser MSW mock. |

`SESSION_SECRET` must be a long, random value (e.g.
`openssl rand -base64 32`). `lib/session.ts` refuses to run in production with
the dev fallback.

## Steps

1. Import the repository into Vercel.
2. Set **Root Directory** to `apps/web`.
3. Add `SESSION_SECRET` in **Project → Settings → Environment Variables**.
4. (Optional) Add `API_URL` to point at a real backend; omit it to keep the
   in-browser mock.
5. Deploy.

## Mock mode vs. real backend

- **Mock mode** (`API_URL` unset): `apps/web` serves its own auth Server
  Actions backed by `@workspace/api` in-process, and the browser runs an MSW
  worker that intercepts `/api/*`. Nothing external is needed.
- **Real backend** (`API_URL` set): `next.config.ts` adds a rewrite so the
  browser's `/api/*` requests are proxied to the backend (no CORS), and the
  auth Server Actions call the backend over HTTP.
