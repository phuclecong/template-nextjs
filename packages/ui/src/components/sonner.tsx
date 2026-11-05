"use client"

import "sonner/dist/styles.css"

import type { ComponentProps } from "react"
import { Toaster as SonnerToaster, toast as sonnerToast } from "sonner"

/**
 * Toast primitive. Owns the design system's toast surface by wrapping sonner:
 * `Toaster` is the mounted surface (rendered once by the app) and `toast` is
 * the imperative API consumed by providers/callers. The sonner stylesheet is
 * imported here, so consumers get a styled surface with no extra setup.
 */
function Toaster(props: ComponentProps<typeof SonnerToaster>) {
  return <SonnerToaster {...props} />
}

export { Toaster, sonnerToast as toast }
