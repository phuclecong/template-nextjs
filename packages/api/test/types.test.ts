import { describe, expectTypeOf, it } from "vitest"
import type { components } from "../src/generated/api.js"

describe("generated client types", () => {
  it("matches the contract for User and Task", () => {
    type User = components["schemas"]["User"]
    type Task = components["schemas"]["Task"]

    expectTypeOf<User>().toMatchTypeOf<{
      id: string
      name: string
      email: string
      role: "admin" | "member"
      createdAt: string
    }>()

    expectTypeOf<Task>().toHaveProperty("title")
    expectTypeOf<Task>().toHaveProperty("status")
    expectTypeOf<Task>().toHaveProperty("assigneeId")
  })
})
