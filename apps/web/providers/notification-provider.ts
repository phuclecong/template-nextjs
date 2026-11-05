import type { NotificationProvider } from "@refinedev/core"
import { toast } from "@workspace/ui/components/sonner"

/**
 * Refine notificationProvider (ADR-0002). Wires Refine's notification bus to
 * sonner toasts, so data-hook mutations surface success/error feedback without
 * touching call sites.
 */
export const notificationProvider: NotificationProvider = {
  open: ({ message, type, description }) => {
    const options = description ? { description } : undefined
    if (type === "success") {
      toast.success(message, options)
    } else if (type === "error") {
      toast.error(message, options)
    } else {
      toast(message, options)
    }
  },
  close: (key) => {
    toast.dismiss(key)
  },
}
