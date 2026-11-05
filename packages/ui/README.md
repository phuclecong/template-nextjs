# `@workspace/ui` — the design system

Domain-agnostic UI primitives for the template dashboard. These are the
lowest-level building blocks: they know nothing about Tasks, Users, or the
dashboard, and they never import from `apps/web`.

## Primitives

| Primitive | Import | Built on |
| --------- | ------ | -------- |
| Button    | `@workspace/ui/components/button`    | Base UI `Button` |
| Dialog    | `@workspace/ui/components/dialog`    | Base UI `Dialog` |
| Input / Textarea | `@workspace/ui/components/input` | native `<input>` / `<textarea>` |
| Select    | `@workspace/ui/components/select`    | native `<select>` |
| Table (+ `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableFooter`, `TableCaption`) | `@workspace/ui/components/table` | native table elements |
| Form (`Field`, `Label`) | `@workspace/ui/components/form` | native `<div>` / `<label>` |
| Toast (`Toaster`, `toast`) | `@workspace/ui/components/sonner` | sonner |

Every primitive forwards native props, so it drops into plain `<form>`/table
usage without an adapter. Shared tokens live in `src/lib`:

- `lib/utils.ts` — `cn` (compiled Tailwind class merging).
- `lib/field.ts` — `fieldBase`, the shared chrome for form controls.

## The boundary rule

`packages/ui` must stay domain-agnostic: it **must not import from
`apps/web`**. This is enforced by `no-restricted-imports` in
`packages/ui/eslint.config.js` (and by the fact that `@/` — the app alias —
does not resolve here). Feature components that compose the primitives live in
`apps/web/components`.

## Adding a primitive

1. Add `src/components/<name>.tsx`, importing `cn` from `../lib/utils`.
2. Add `src/components/<name>.stories.tsx` with representative stories.
3. That's it — the `./components/*` export map and the Storybook glob pick it
   up automatically.

## Storybook

```bash
# from the repo root
pnpm storybook           # dev server at http://localhost:6006
pnpm build-storybook     # static build into packages/ui/storybook-static
```

`pnpm build` runs `turbo build` **and** `turbo build-storybook`, so the design
system's Storybook is part of the monorepo build.
