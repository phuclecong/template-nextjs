import type { CrudFilter } from "@refinedev/core"
import {
  taskPrioritySchema,
  taskStatusSchema,
  type Role,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
  type UserRecord,
} from "@workspace/api/collections"

export type { Role, TaskPriority, TaskRecord, TaskStatus }

/** All Task Statuses in display order, derived from the API contract. */
export const STATUS_OPTIONS = taskStatusSchema.options

/** All Task Priorities in display order, derived from the API contract. */
export const PRIORITY_OPTIONS = taskPrioritySchema.options

/** The slice of a User the task views need: an id and a display name. */
export type UserOption = Pick<UserRecord, "id" | "name">

/** The identity the task views read from the auth provider. */
export type CurrentUser = Pick<UserRecord, "id" | "role">

/** The TaskRecord fields that are optional and nullable in the API contract. */
type NullableTaskField = "description" | "priority" | "assigneeId" | "dueDate"

/**
 * Makes the listed fields required, collapsing `undefined` into the remaining
 * union (`string | null`, `TaskPriority | null`, …). Used once the API's
 * optional nullable fields have been normalized for payloads and rows.
 */
type ResolvedNullable<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: Exclude<T[P], undefined>
}

/** A Task enriched for display in the table. */
export type TaskRow = ResolvedNullable<
  Omit<TaskRecord, "createdAt" | "updatedAt">,
  NullableTaskField
> & {
  assigneeName: string
  canModify: boolean
}

/** The fields the write path sends when creating or updating a Task. */
export type TaskInput = ResolvedNullable<
  Omit<TaskRecord, "id" | "createdAt" | "updatedAt">,
  NullableTaskField
>

/** Keys the task table reads from the URL query string. */
type TaskFilterKey = "status" | "priority" | "assignee" | "dueFrom" | "dueTo"

/** URL filter values for the task table. */
export type TaskFilters = Record<TaskFilterKey, string>

/**
 * Convert the search query and URL filter values into the `CrudFilter[]` that
 * `@refinedev/core`'s `useList` understands. Empty values are skipped.
 */
export function toCrudFilters(q: string, filters: TaskFilters): CrudFilter[] {
  const result: CrudFilter[] = []
  if (q) result.push({ field: "q", operator: "contains", value: q })
  if (filters.status)
    result.push({ field: "status", operator: "eq", value: filters.status })
  if (filters.priority)
    result.push({ field: "priority", operator: "eq", value: filters.priority })
  if (filters.assignee)
    result.push({
      field: "assigneeId",
      operator: "eq",
      value: filters.assignee,
    })
  if (filters.dueFrom)
    result.push({ field: "dueDate", operator: "gte", value: filters.dueFrom })
  if (filters.dueTo)
    result.push({ field: "dueDate", operator: "lte", value: filters.dueTo })
  return result
}
