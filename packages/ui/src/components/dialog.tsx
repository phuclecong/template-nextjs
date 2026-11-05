"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "../lib/utils"

/**
 * Domain-agnostic modal dialog built on Base UI's `Dialog` (Base UI is the
 * design system's primitive layer). Base UI owns the hard accessibility parts
 * — focus trap, `role="dialog"`/`aria-modal`, Escape-to-close, and
 * outside-click dismissal — while this component supplies the design system's
 * tokens.
 *
 * Controlled: the caller owns `open` and receives `onClose` for every close
 * path (Escape, backdrop, and the header close button).
 */
function Dialog({
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
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/40" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 border border-border bg-background p-6 shadow-lg outline-none",
            className
          )}
        >
          <div className="mb-4 flex items-center justify-between gap-4">
            <DialogPrimitive.Title className="text-base font-medium text-foreground">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring/50"
            >
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          {description !== undefined ? (
            <DialogPrimitive.Description className="mb-4 text-sm text-muted-foreground">
              {description}
            </DialogPrimitive.Description>
          ) : null}
          {children}
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export { Dialog }
