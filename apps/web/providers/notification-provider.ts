import type { NotificationProvider } from "@refinedev/core"

/**
 * Refine notificationProvider (ADR-0002). Minimal wiring: forwards to the
 * console until a real toast surface (e.g. sonner) lands with the UI polish
 * work. Keeping the interface real means no call-site changes are needed then.
 */
export const notificationProvider: NotificationProvider = {
  open: ({ message, type, description }) => {
    if (type === "error") {
      console.error(`[refine:${type}] ${message}`, description ?? "")
    } else {
      console.log(`[refine:${type}] ${message}`, description ?? "")
    }
  },
  close: () => {},
}
