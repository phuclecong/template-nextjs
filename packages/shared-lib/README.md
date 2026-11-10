# `@workspace/shared-lib` — shared app infrastructure

Reusable, framework-coupled modules that are not part of the design system.
They are app-agnostic (they know nothing about Tasks, Users, or the dashboard)
and must never import from `apps/web`.

## Modules

| Module       | Import                             | What it is                             |
| ------------ | ---------------------------------- | -------------------------------------- |
| `components` | `@workspace/shared-lib/components` | Server-paginated `DataTable` shell     |
| `hooks`      | `@workspace/shared-lib/hooks`      | `useTableState` URL-driven table state |
| `libs`       | `@workspace/shared-lib/libs`       | Small shared utilities (`debounce`)    |

## The boundary rule

`packages/shared-lib` must stay app-agnostic: it **must not import from
`apps/web`**. This is enforced by `no-restricted-imports` in
`packages/shared-lib/eslint.config.js`. Domain-specific code (Tasks, Users)
lives in `apps/web`; presentational primitives live in `packages/ui`.

## Layout

| Directory         | What lives there                          |
| ----------------- | ----------------------------------------- |
| `src/components/` | Reusable React components (`DataTable`)   |
| `src/hooks/`      | Reusable React hooks (`useTableState`)    |
| `src/libs/`       | Framework-agnostic utilities (`debounce`) |

Each directory exposes its public API through an `index.ts`, paired with a
matching entry in `package.json` `exports` (e.g.
`"./hooks": "./src/hooks/index.ts"`).
