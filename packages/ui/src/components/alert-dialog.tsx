"use client"

import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"

/**
 * Domain-agnostic confirmation dialog built on Base UI's `AlertDialog`.
 *
 * An alert dialog is a modal that forces an explicit decision: Base UI renders
 * it with `role="alertdialog"`, locks focus to the popup, and ignores Escape
 * and outside clicks, so there is no header close button or backdrop dismissal.
 * Use it when the user must choose between actions (e.g. confirm or cancel a
 * destructive delete) rather than dismiss a view.
 *
 * Controlled: the caller owns `open` and receives `onClose` only from the
 * explicit Cancel path wired into `children`.
 */
function AlertDialog({
  open,
  onClose,
  title,
  description,
  className,
  children,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <AlertDialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <AlertDialogPrimitive.Portal>
        <AlertDialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <AlertDialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-6 shadow-lg outline-none",
            className
          )}
        >
          <AlertDialogPrimitive.Title className="mb-4 text-base font-medium text-foreground">
            {title}
          </AlertDialogPrimitive.Title>
          {description !== undefined ? (
            <AlertDialogPrimitive.Description className="text-sm text-muted-foreground">
              {description}
            </AlertDialogPrimitive.Description>
          ) : null}
          {children}
        </AlertDialogPrimitive.Popup>
      </AlertDialogPrimitive.Portal>
    </AlertDialogPrimitive.Root>
  )
}

export { AlertDialog }
