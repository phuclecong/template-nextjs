# Skills — how to use them

Skills are packaged instructions for Claude Code: a focused recipe the agent follows when a task matches. They live in [`.claude/skills/`](../.claude/skills/) at the repo root, so they're available in every agent session in this repo.

This page show you how to _drive_ the three CRUD skills — `create-table`, `create-form`, and `create-dialog`.

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
