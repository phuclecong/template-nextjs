---
name: create-table
description: Create or rework a data table in this repo — a server-paginated, sortable, filterable, URL-driven table built on @workspace/shared-lib DataTable + useTableState. Use when the user asks to create, add, build, or rework a table for a resource.
---

# Create a table

The stack is fixed; copy the closest canonical example rather than inventing:

- **Table**: `apps/web/components/tasks-table.tsx` (fullest) or `users-table.tsx` (minimal).
- **Mock list handler**: `listTasks` / `listUsers` in `packages/api/src/data-handlers.ts`.
- **Lib helpers**: `apps/web/lib/tasks.ts` / `apps/web/lib/users.ts`.
- **Filter bar**: `apps/web/components/task-filters-bar.tsx` / `users-filter-bar.tsx`.
- **Bulk actions**: `apps/web/hooks/use-task-bulk-actions.ts` + `apps/web/components/task-bulk-actions.tsx` (backend `bulkUpdateTasks`).

## Steps

1. **Mock list handler** — in `packages/api/src/data-handlers.ts` add `list<Resource>` mirroring `listTasks` (sort + filter + paginate) or `listUsers` (sort + paginate). Read the simple-rest params `_start`, `_end`, `_sort`, `_order` plus `q` and any filter params, and return `HttpResponse.json(page, { headers: { "x-total-count": String(total) } })`. When `_end` is absent return every row — smoke tests call unpaginated. *Done when* `pnpm --filter @workspace/api test` passes (add a filter/sort/pagination smoke test for new behaviour).

2. **Lib helper** — add `apps/web/lib/<resource>.ts`: option lists from the zod schema in `@workspace/api/collections` (`<field>Schema.options`), a filter-values type, and `to<Resource>CrudFilters(q, filters)` mapping `q` → `{ field: "q", operator: "contains" }` and each filter → `{ field, operator: "eq" }`. *Done when* it typechecks.

3. **Filter bar** (skip if no filters) — add `apps/web/components/<resource>-filter-bar.tsx` mirroring `users-filter-bar.tsx`. *Done when* it typechecks and lints clean.

4. **Table component** — add `apps/web/components/<resource>-table.tsx`:
   - `useTableState({ defaultSortField, filterKeys })` — `filterKeys` must be a module-level `as const` array.
   - `useList` with `pagination: { currentPage: page, pageSize }`, `sorters`, `filters`.
   - `columns` as `ColumnDef<T>[]` — sortable columns use `accessorKey`; non-sortable ones (actions) use `id` + `enableSorting: false`.
   - `DataTable` wired with `getRowId`, `sorting`/`onSortingChange`, `rowSelection`/`onRowSelectionChange`, `pagination`.
   *Done when* it typechecks and lints clean.

5. **Bulk actions** (skip if none) — only when rows are selected and edited together:
   - Add a `select` checkbox column (header + cell) so `useTableState`'s `selectedIds` is non-empty; see the `select` column in `tasks-table.tsx`.
   - Backend: add `bulkUpdate<Resource>` to `packages/api/src/data-handlers.ts` mirroring `bulkUpdateTasks` — read `{ ids, ...patch }`, update each in-scope row (respect per-row permission), return `{ updated, failed }`.
   - Hook: add `apps/web/hooks/use-<resource>-bulk-actions.ts` mirroring `use-task-bulk-actions.ts` — `useCustomMutation` → `applyBulk(patch)` that invalidates the list and clears selection on success.
   - Component: add `apps/web/components/<resource>-bulk-actions.tsx` mirroring `task-bulk-actions.tsx` — one control per editable field, `disabled={!hasSelection}`.
   *Done when* it typechecks and lints clean and the bulk smoke test passes.

6. **Translations** — add the resource section to `apps/web/lib/translations/en.ts` and `vi.ts`. `vi` is typed `Translation = typeof en`, so both dictionaries must share every key; drift fails typecheck. *Done when* it typechecks.

7. **Verify** — `pnpm --filter web typecheck`, `pnpm --filter web lint`, `pnpm --filter @workspace/api test`. If the resource has a Playwright spec, run `pnpm --filter web test:e2e`.

## Conventions

- **Server-side only** — `DataTable` sets `manualSorting` and `manualPagination`; the mock handler must sort and paginate. Client-side sorting/pagination won't work.
- **URL-driven state** — `useTableState` reads/writes search (`q`), filters, sort, and page from the URL. `updateParams({ key: value, page: "" })` writes and resets to page 1; an empty value deletes the param.
- **Selection** — `DataTable` requires `rowSelection`/`onRowSelectionChange`; pass `useTableState`'s and set `enableRowSelection={() => false}` when the table has no selection.
- **Bulk updates** — nullable fields clear with `null` (`applyBulk({ dueDate: null })`); the backend returns `{ updated, failed }` and the hook reports partial failures as an error toast.
