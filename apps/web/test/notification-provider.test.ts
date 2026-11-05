import { beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The notification provider is the single path from Refine's notification bus
 * to sonner. These tests pin the "one notification → one toast" contract so
 * API errors surface exactly once (no duplicated toasts).
 */
const toast = vi.hoisted(() => {
  const call = vi.fn()
  return Object.assign(call, {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  })
})

vi.mock("@workspace/ui/components/sonner", () => ({ toast }))

import { notificationProvider } from "@/providers/notification-provider"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("notificationProvider", () => {
  it("routes a success notification to a single success toast", () => {
    notificationProvider.open({ type: "success", message: "Saved" })

    expect(toast.success).toHaveBeenCalledTimes(1)
    expect(toast.success).toHaveBeenCalledWith("Saved", undefined)
    expect(toast.error).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })

  it("routes an error notification to a single error toast with its description", () => {
    notificationProvider.open({
      type: "error",
      message: "Failed to update",
      description: "Network error",
    })

    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith("Failed to update", {
      description: "Network error",
    })
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast).not.toHaveBeenCalled()
  })

  it("routes other notification types to a single default toast", () => {
    notificationProvider.open({ type: "progress", message: "Heads up" })

    expect(toast).toHaveBeenCalledTimes(1)
    expect(toast).toHaveBeenCalledWith("Heads up", undefined)
    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
  })

  it("dismisses a toast by key", () => {
    notificationProvider.close("toast-key")

    expect(toast.dismiss).toHaveBeenCalledTimes(1)
    expect(toast.dismiss).toHaveBeenCalledWith("toast-key")
  })
})
