"use client"

import { useCallback, useState } from "react"

/** The value returned by {@link useDialog}. */
export type DialogState<T> = {
  /** Whether the dialog is open. */
  isOpen: boolean
  /** The entity the dialog operates on; `null` when closed or in create mode. */
  data: T | null
  /** Open the dialog. Omit the argument for create mode. */
  open: (data?: T) => void
  /** Close the dialog and clear `data`. */
  close: () => void
  /** Increments on every `open`; use as `key={version}` to remount on reopen. */
  version: number
}

/**
 * State for a single controlled dialog: whether it is open, an optional
 * payload, and a `version` that increments on every open. The version lets a
 * form-style dialog remount on reopen via `key={version}`, resetting state that
 * is only read on mount (e.g. react-hook-form `defaultValues`).
 *
 * Open with no argument for a "create" dialog (`data` stays `null`); pass the
 * entity for an "edit" or "delete" dialog. `close()` clears `data` so the next
 * open always starts fresh. Pure state — the caller wires the values into the
 * `Dialog` component.
 */
export function useDialog<T>(): DialogState<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<T | null>(null)
  const [version, setVersion] = useState(0)

  const open = useCallback((next?: T) => {
    setData(next ?? null)
    setIsOpen(true)
    setVersion((n) => n + 1)
  }, [])

  const close = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  return { isOpen, data, open, close, version }
}
