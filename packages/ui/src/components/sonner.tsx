"use client"

import type { ComponentProps } from "react"
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"

/**
 * Toast primitive. Owns the design system's toast surface by wrapping sonner:
 * `Toaster` is the mounted surface (rendered once by the app) and `toast` is
 * the imperative API consumed by providers/callers.
 */
function Toaster(props: ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster {...props} position="top-right" />
}

export { Toaster, sonnerToast as toast }
