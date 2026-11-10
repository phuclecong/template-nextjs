"use client"

import type { ReactNode } from "react"

import { AlertDialog } from "./alert-dialog"
import { Button } from "./button"

/**
 * Presentational confirmation dialog: the user must explicitly confirm or
 * cancel, with no Escape/backdrop/header-close dismissal (it composes
 * `AlertDialog`). It owns only layout — the caller supplies already-translated
 * labels and `onConfirm`, and keeps the actual mutation (e.g. refine's
 * `useDelete`) at the call site.
 */
function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "danger",
  loading = false,
  onConfirm,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  confirmLabel: ReactNode
  cancelLabel: ReactNode
  tone?: "danger" | "default"
  loading?: boolean
  onConfirm: () => void
}) {
  return (
    <AlertDialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button
          type="button"
          variant={tone === "danger" ? "destructive" : "default"}
          disabled={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </AlertDialog>
  )
}

export { ConfirmDialog }
