import { describe, expect, it } from "vitest"
import { describeError } from "@/utils/http-error"

describe("describeError", () => {
  it("prefers the API message carried on the response body", () => {
    const error = {
      response: { data: { message: "Email already exists." } },
    }

    expect(describeError(error)).toBe("Email already exists.")
  })

  it("falls back to error.message when there is no response body", () => {
    expect(describeError(new Error("boom"))).toBe("boom")
  })

  it("prefers the response body message over error.message", () => {
    const error = {
      message: "Request failed",
      response: { data: { message: "Upstream said no." } },
    }

    expect(describeError(error)).toBe("Upstream said no.")
  })

  it("returns undefined for missing or non-object errors", () => {
    expect(describeError(undefined)).toBeUndefined()
    expect(describeError(null)).toBeUndefined()
    expect(describeError("nope")).toBeUndefined()
    expect(describeError({})).toBeUndefined()
  })
})
