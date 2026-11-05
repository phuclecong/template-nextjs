import type { ComponentProps } from "react"

import { fieldBase } from "../lib/field"
import { cn } from "../lib/utils"

/**
 * Domain-agnostic select. A thin styled wrapper around the native `<select>`
 * element (kept native on purpose: native selects are keyboard- and
 * assistive-tech-friendly and remain `selectOption`-compatible in tests).
 * Forwards all native props and renders `<option>` children as-is.
 */
function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(fieldBase, className)}
      {...props}
    />
  )
}

export { Select }
