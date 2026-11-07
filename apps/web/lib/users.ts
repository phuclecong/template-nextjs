import type { CrudFilter } from "@refinedev/core"
import { roleSchema } from "@workspace/api/collections"

/** All User Roles in display order, derived from the API contract. */
export const ROLE_OPTIONS = roleSchema.options

/** URL filter values for the user table. */
export type UserFilters = {
  role: string
}

/**
 * Convert the search query and URL filter values into the `CrudFilter[]` that
 * `@refinedev/core`'s `useList` understands. Empty values are skipped.
 */
export function toUserCrudFilters(q: string, filters: UserFilters): CrudFilter[] {
  const result: CrudFilter[] = []
  if (q) result.push({ field: "q", operator: "contains", value: q })
  if (filters.role)
    result.push({ field: "role", operator: "eq", value: filters.role })
  return result
}
