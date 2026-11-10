---
name: create-form
description: Create or rework a form in this repo. Use when the user asks to create, add, or rework a form.
---

# Create a form

The stack is fixed — every form is `react-hook-form` + `zodResolver` (zod) rendered through the `Field` / `FieldLabel` / `FieldError` primitives from `@workspace/ui`. Copy the closest example rather than inventing:

- **Dialog form** (create/edit a resource) — `apps/web/features/tasks/components/task-dialogs.tsx` (`TaskFormDialog`): fullest — one dialog for create and edit, selects, nullable fields, resource mutation.
- **Inline form** (no dialog) — `apps/web/features/auth/components/login-form.tsx` (simplest) or `apps/web/features/settings/index.tsx` (`ChangePasswordForm`, custom endpoint).

## Steps

1. **Schema + form** — build the zod schema in `useMemo(..., [t])` so validation messages localize; reuse the API contract schemas in `@workspace/api/collections` for enum fields (`taskStatusSchema`, `taskPrioritySchema`). Create the form with `useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues })`, importing option lists and types from the feature's `utils`. *Done when* it typechecks.

2. **Fields** — one `Controller` per field; each renders `<Field data-invalid={fieldState.invalid}>` wrapping `<FieldLabel htmlFor={id}>`, the input primitive with `aria-invalid={fieldState.invalid}`, and `<FieldError errors={[fieldState.error]} />`. Spread `{...field}` onto `Input`/`Textarea`; wire `Select` with `value={field.value}` + `onValueChange={field.onChange}`. *Done when* it typechecks.

3. **Container** —
   - **Dialog** (create/edit): mount the form in a `Dialog` shell driven by `useDialog` (see the create-dialog skill), keyed by `version` so `defaultValues` re-reads on reopen. Convert between form values and the payload with `toFormValues(row)` / `toPayload(values)`.
   - **Inline**: render the `<form>` directly in the page/section.
   *Done when* it typechecks and lints clean.

4. **Submit** — one of:
   - **Resource** (`useCreate` / `useUpdate`): mutate with `{ resource, values, invalidates: ["resourceAll"], successNotification, errorNotification }` and `{ onSuccess: onClose }` (dialog) or `form.reset()` (inline); `useUpdate` also passes `id`.
   - **Auth** (`useLogin` / `useRegister`): mutate with `onSuccess: result => result.success ? window.location.assign(result.redirectTo ?? "/dashboard") : setError(result.error)`, and `onError: setError`.
   - **Custom endpoint** (`useCustomMutation`): `useCustomMutation<TData, HttpError, TPayload>({})`, mutate with `{ url, method, values, ...notifications }`.
   Disable the submit button while pending — `.mutation.isPending` (resource/custom) or `isPending` (auth). *Done when* it typechecks and the mutation matches the example's notification + invalidation + `onSuccess` wiring.

5. **Translations** — add the section to `apps/web/utils/translations/en.ts` and `vi.ts`. `vi` is typed `Translation = typeof en`, so both dictionaries must share every key; drift fails typecheck. *Done when* it typechecks.

6. **Verify** — `pnpm --filter web typecheck`, `pnpm --filter web lint`, and confirm every rule in **Conventions** holds. If the form has a Playwright spec, run `pnpm --filter web test:e2e`.

## Conventions

- **Schema depends on `t`** — build it inside `useMemo(..., [t])`; validation messages are localized and won't follow the language otherwise.
- **`noValidate`** — the `<form>` sets `noValidate` so zod + react-hook-form own validation, not the browser.
- **`""` sentinel for nullable fields** — optional fields use `""` in the form and `null` in the payload; `toFormValues`/`toPayload` do the conversion, selects render `<SelectItem value="">` for "none", and the schema accepts `""` via `z.union([schema, z.literal("")])`.
- **Select doesn't spread `{...field}`** — wire `value` + `onValueChange` manually; `Input`/`Textarea` spread.
- **Mutations invalidate** — resource mutations set `invalidates: ["resourceAll"]` so the table refreshes; error notifications use `describeError(error)` for the description.
