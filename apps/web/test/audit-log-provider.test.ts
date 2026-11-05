import { describe, expect, it } from "vitest"
import { auditLogProvider } from "@/providers/audit-log-provider"

describe("auditLogProvider (stub)", () => {
  it("echoes create payloads until a durable sink is wired in", async () => {
    const params = {
      resource: "tasks",
      action: "create",
      data: { title: "x" },
      meta: {},
    }

    await expect(auditLogProvider.create(params)).resolves.toBe(params)
  })

  it("echoes update payloads", async () => {
    const params = { id: "tsk_1", name: "update" }

    await expect(auditLogProvider.update(params)).resolves.toBe(params)
  })

  it("returns an empty history", async () => {
    await expect(auditLogProvider.get({ resource: "tasks" })).resolves.toEqual([])
  })
})
