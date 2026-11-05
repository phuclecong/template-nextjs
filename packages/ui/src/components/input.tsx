import type { ComponentProps } from "react"

import { fieldBase } from "../lib/field"
import { cn } from "../lib/utils"

/**
 * Domain-agnostic text input. A thin, styled wrapper around the native
 * `<input>` element: it forwards every native prop (including `id`,
 * `aria-*`, `value`, and event handlers) so it drops into plain `<form>`
 * usage without an adapter.
 */
function Input({ className, type, ...props }: ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldBase,
        "selection:bg-primary selection:text-primary-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * Domain-agnostic multiline input. Thin styled wrapper around the native
 * `<textarea>` element; forwards all native props.
 */
function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, className)}
      {...props}
    />
  )
}

export { Input, Textarea }
