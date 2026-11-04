import type { AuditLogProvider } from "@refinedev/core"

/**
 * Refine auditLogProvider (ADR-0002). Stub: audit logging has no persistence
 * yet, so it echoes writes and returns an empty history. The interface is real,
 * so a durable sink can be swapped in without touching call sites.
 */
export const auditLogProvider: AuditLogProvider = {
  create: async (params) => params,
  get: async () => [],
  update: async (params) => params,
}
