import type { ComponentProps, ReactNode } from "react"

import { cn } from "../lib/utils"

/**
 * Form primitives. `Label` and `Field` consolidate the design system's
 * recurring "label + control + optional hint/error" layout so feature forms
 * don't hand-roll the same flex column and label association.
 *
 * These stay intentionally shallow: they wrap native `<label>`/`<div>` and
 * forward props, so the control rendered inside a `Field` (an `Input`,
 * `Select`, `Textarea`, or anything else) keeps its own `id`/`aria-*`.
 */
function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-sm leading-none font-medium text-foreground select-none",
        className
      )}
      {...props}
    />
  )
}

type FieldProps = {
  /** Optional label text; when set, renders a `<Label htmlFor={htmlFor}>`. */
  label?: ReactNode
  /** Ties the label to the control's `id` for click + a11y association. */
  htmlFor?: string
  /** Helper text shown when there is no error. */
  hint?: ReactNode
  /** Error text shown with `role="alert"` styling. */
  error?: ReactNode
  className?: string
  children: ReactNode
}

function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label !== undefined ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export { Field, Label }
