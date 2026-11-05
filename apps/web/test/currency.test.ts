import { describe, expect, it } from "vitest"
import { formatCurrency } from "@/lib/currency"

describe("formatCurrency", () => {
  it("formats USD with two decimals for English", () => {
    expect(formatCurrency(1234567.89, "en")).toBe("$1,234,567.89")
    expect(formatCurrency(1000, "en")).toBe("$1,000.00")
    expect(formatCurrency(0, "en")).toBe("$0.00")
  })

  it("formats zero-decimal VND for Vietnamese", () => {
    expect(formatCurrency(1234567.89, "vi")).toBe("1.234.568 ₫")
    expect(formatCurrency(1000, "vi")).toBe("1.000 ₫")
    expect(formatCurrency(0, "vi")).toBe("0 ₫")
  })
})
