---
name: create-table
description: Create or rework a data table in this repo. Use when the user asks to create, add, or rework a table for a resource.
---

# Create a table

The stack is fixed — every table is a server-paginated, sortable, filterable, URL-driven `DataTable` + `useTableState` from `@workspace/shared-lib`. Copy the closest feature folder rather than inventing:

- **Minimal** — `apps/web/features/users/`: one filter (`role`), inline `useList`, no selection or bulk actions.
- **Fullest** — `apps/web/features/tasks/`: five filters, a `select` column, bulk actions, a row-mapping hook, dialogs.

A feature folder holds `components/`, `hooks/`, `utils/`, and an `index.tsx`; the route `apps/web/app/dashboard/<resource>/page.tsx` renders `<ResourceView />` from that `index.tsx`.

## Steps

1. **Mock list handler** — in `packages/api/src/data-handlers.ts`, add `list<Resource>` mirroring `listTasks` (sort + filter + paginate) or `listUsers` (sort + paginate), and register it in `dataHandlers`. Read simple-rest `_start`, `_end`, `_sort`, `_order` plus `q` and any filter params; return `HttpResponse.json(page, { headers: { "x-total-count": String(total) } })`. When `_end` is absent, return every row — smoke tests call unpaginated. *Done when* `pnpm --filter @workspace/api test` passes with a new filter/sort/pagination smoke test in `packages/api/test/smoke.test.ts`.

2. **Utils** — add `apps/web/features/<resource>/utils/index.ts`: option lists from the zod schemas in `@workspace/api/collections` (`<field>Schema.options`), a filter-values type (one key per filter key), the row type, and `to<Resource>CrudFilters(q, filters)`. *Done when* it typechecks.

3. **Row hook** (skip if rows need no enrichment) — add `apps/web/features/<resource>/hooks/use-<resource>.ts` mirroring `use-tasks.ts`: `useList` the resource, map each record to a display row (resolve names, compute permissions), return `{ rows, total, isLoading }`. *Done when* it typechecks.

4. **Table component** — add `apps/web/features/<resource>/components/<resource>-table.tsx`:
   - `useTableState({ defaultSortField, filterKeys })` with `filterKeys` a module-level `as const` array.
   - Fetch via the row hook, or inline `useList` with `pagination: { currentPage: page, pageSize }`, `sorters`, `filters`.
   - `columns` as `ColumnDef<T>[]`; a column sorts only when its `accessorKey` matches a field in the handler's sort whitelist, otherwise set `enableSorting: false` (action/select columns use `id`, no `accessorKey`).
   - `DataTable` wired with `getRowId`, `sorting`/`onSortingChange`, `rowSelection`/`onRowSelectionChange`, `pagination`.
   *Done when* it typechecks and lints clean.

5. **Filter bar** (skip if no filters) — add `apps/web/features/<resource>/components/<resource>-filter-bar.tsx` mirroring `users-filter-bar.tsx` (search + one select) or `task-filters-bar.tsx` (search + selects + date inputs). *Done when* it typechecks and lints clean.

6. **Bulk actions** (skip if none) — only when rows are selected and edited together:
   - Add a `select` checkbox column (header + cell) so `useTableState`'s `selectedIds` is non-empty; see `tasks-table.tsx`.
   - Backend: add `bulkUpdate<Resource>` to `data-handlers.ts` mirroring `bulkUpdateTasks` — read `{ ids, ...patch }`, update each in-scope row (respect per-row permission), return `{ updated, failed }`.
   - Hook: add `hooks/use-<resource>-bulk-actions.ts` mirroring `use-task-bulk-actions.ts` — `useCustomMutation` → `applyBulk(patch)` that invalidates the list and clears selection on success.
   - Component: add `components/<resource>-bulk-actions.tsx` mirroring `task-bulk-actions.tsx` — one control per editable field, `disabled={!hasSelection}`.
   *Done when* it typechecks and lints clean and the bulk-update smoke test passes.

7. **View + route** — add `apps/web/features/<resource>/index.tsx` (`<ResourceView />`: read the current identity, render the table) and `apps/web/app/dashboard/<resource>/page.tsx` (render `<ResourceView />`), mirroring `features/tasks/index.tsx`. *Done when* it typechecks and lints clean.

8. **Translations** — add the resource section to `apps/web/utils/translations/en.ts` and `vi.ts`. `vi` is typed `Translation = typeof en`, so both dictionaries must share every key; drift fails typecheck. *Done when* it typechecks.

9. **Verify** — `pnpm --filter web typecheck`, `pnpm --filter web lint`, `pnpm --filter @workspace/api test`, and confirm every rule in **Conventions** holds (typecheck won't catch a missing handler sort or a filter-key/backend-field mismatch). If the resource has a Playwright spec, run `pnpm --filter web test:e2e`.

## Conventions

- **Server-side only** — `DataTable` sets `manualSorting` and `manualPagination`; the mock handler must sort and paginate.
- **Sort whitelist** — the handler sorts only its `sortable<Resource>Fields` and falls back to the primary field; unknown `_sort` values are ignored. A column is sortable only when its `accessorKey` matches a whitelisted field.
- **Filter keys ≠ backend fields** — `useTableState`'s `filterKeys` are URL keys; `to<Resource>CrudFilters` maps each to a backend field (`assignee` → `assigneeId`, `dueFrom`/`dueTo` → `dueDate` with `gte`/`lte`) and `q` → `{ field: "q", operator: "contains" }`. The handler reads the mapped names.
- **URL-driven state** — `useTableState` reads/writes `q`, filters, sort, and page from the URL; `updateParams({ key: value, page: "" })` writes and resets to page 1, and an empty value deletes the param.
- **Selection** — `DataTable` requires `rowSelection`/`onRowSelectionChange`; pass `useTableState`'s and gate with `enableRowSelection={() => false}` (no selection) or `(row) => row.original.canModify` (per-row).
- **Bulk updates** — nullable fields clear with `null` (`applyBulk({ dueDate: null })`); the backend returns `{ updated, failed }` and the hook reports partial failures as an error toast.
