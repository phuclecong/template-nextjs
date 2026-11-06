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

## `@workspace/ui` — the design system

[UI - Design system](./packages/ui/README.md)

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

## Command

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

## Deployment

See [docs/deployment.md](./docs/deployment.md) for how to deploy `apps/web` to Vercel.
No production environment is provisioned by this repository.
