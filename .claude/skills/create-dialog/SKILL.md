---
name: create-dialog
description: Create or rework a dialog in this repo. Use when the user asks to create, add, or rework a dialog, modal, or confirmation dialog.
---

# Create a dialog

The shell is fixed — every dialog is a controlled modal driven by `useDialog` (state) and one of two primitives from `@workspace/ui`: `Dialog` (dismissable) or `AlertDialog`/`ConfirmDialog` (forced decision). Copy the closest example rather than inventing:

- **Confirmation** — `apps/web/features/tasks/components/task-dialogs.tsx` (`DeleteTaskDialog`) or inline in `apps/web/features/users/components/users-table.tsx`: `ConfirmDialog` over `AlertDialog`.
- **Dismissable** — `apps/web/features/tasks/components/task-dialogs.tsx` (`TaskFormDialog`): `Dialog` wrapping a form.

A dialog that holds a **form** spans two skills: this one for the shell, the create-form skill for the form content.

## Steps

1. **State** — hold `useDialog<T>()` in the parent component that renders the trigger; the row's edit/delete button calls `open(row)`. `open()` with no argument is create mode (`data` stays `null`); `close()` clears `data`. *Done when* it typechecks.

2. **Shell** —
   - **Confirmation** (destructive or irreversible): `ConfirmDialog` with `open`, `onClose`, `title`, `description`, `confirmLabel`, `cancelLabel`, `tone` (`"danger"` default), `loading`, `onConfirm`. It composes `AlertDialog`, which forces an explicit choice — no Escape, backdrop, or close-button dismissal. Use `AlertDialog` directly only for a custom confirm layout.
   - **Dismissable** (a form or view the user can back out of): `Dialog` with `open`, `onClose`, `title`, and the content as `children`; Escape, backdrop, and the close button all call `onClose`.
   *Done when* it typechecks and lints clean.

3. **Content** — a **form** goes inside the shell (create-form skill). A **confirmation** keeps its mutation at the call site — `useDelete<TRecord>({})` mutated with `{ resource, id, invalidates: ["resourceAll"], successNotification, errorNotification }` and `{ onSuccess: close }` — either inline in the parent or in a `<Resource>DeleteDialog` wrapper. *Done when* it typechecks and the delete round-trips against the mock API.

4. **Remount on reopen** — pass `key={version}` from `useDialog` to content whose state is read only on mount (a form's `defaultValues`), so reopening for a different row re-reads it. *Done when* reopening for a second row shows that row's data.

5. **Translations** — add the section to `apps/web/utils/translations/en.ts` and `vi.ts`. `vi` is typed `Translation = typeof en`, so both dictionaries must share every key; drift fails typecheck. *Done when* it typechecks.

6. **Verify** — `pnpm --filter web typecheck`, `pnpm --filter web lint`, and confirm every rule in **Conventions** holds. If the dialog has a Playwright spec, run `pnpm --filter web test:e2e`.

## Conventions

- **Controlled** — the caller owns `open` and receives `onClose`; the dialog has no `show()`/`hide()` of its own.
- **State lives in the parent** — `useDialog` is held where the trigger renders (the table), not inside the dialog; the dialog is a pure view of `{ open, data, onClose }`.
- **Create mode is `open()`** — no argument leaves `data` `null`, which the content reads as "new".
- **Confirmation has no dismiss path** — `ConfirmDialog`/`AlertDialog` force a choice; use `Dialog` only when backing out is harmless.
- **`key={version}` remounts** — `useDialog.version` increments on every `open`; keying mount-only content by it resets that content.
- **Mutations invalidate** — mutations set `invalidates: ["resourceAll"]` and use `describeError(error)` for the error notification.
