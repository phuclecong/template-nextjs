import type { AccessControlProvider } from "@refinedev/core"
import { ensureAuthUser } from "./auth-provider"

/**
 * Refine accessControlProvider (ADR-0002): the admin/member matrix. Admin has
 * full access; a member may list users but cannot change roles or delete
 * users, and otherwise acts on their own tasks. Finer-grained ownership
 * (a member editing only their own task) is enforced by the API, not
 * re-implemented here — this provider gates whole actions per resource.
 */
export const accessControlProvider: AccessControlProvider = {
  can: async ({ resource, action }) => {
    const user = await ensureAuthUser()
    if (!user) return { can: false }
    if (user.role === "admin") return { can: true }
    if (resource === "users") return { can: action === "list" }
    return { can: true }
  },
}
