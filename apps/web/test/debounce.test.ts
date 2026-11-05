import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { debounce } from "@/lib/debounce"

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("defers the call until the quiet period elapses", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced("a")
    debounced("b")
    debounced("c")

    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(299)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith("c")
  })

  it("cancels a pending call", () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 300)

    debounced("a")
    debounced.cancel()
    vi.advanceTimersByTime(300)

    expect(fn).not.toHaveBeenCalled()
  })
})
