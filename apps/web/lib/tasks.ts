import type { CrudFilter } from "@refinedev/core"
import {
  taskPrioritySchema,
  taskStatusSchema,
  type Role,
  type TaskPriority,
  type TaskRecord,
  type TaskStatus,
} from "@workspace/api/collections"

export type { Role, TaskPriority, TaskRecord, TaskStatus }

/** All Task Statuses in display order, derived from the API contract. */
export const STATUS_OPTIONS = taskStatusSchema.options

/** All Task Priorities in display order, derived from the API contract. */
export const PRIORITY_OPTIONS = taskPrioritySchema.options

/** The slice of a User the task views need: an id and a display name. */
export type UserOption = { id: string; name: string }

/** A Task enriched for display in the table. */
export type TaskRow = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority | null
  assigneeId: string | null
  assigneeName: string
  dueDate: string | null
  canModify: boolean
}

/** The fields the write path sends when creating or updating a Task. */
export type TaskInput = {
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority | null
  assigneeId: string | null
  dueDate: string | null
}

/** URL filter values for the task table. */
export type TaskFilters = {
  status: string
  priority: string
  assignee: string
  dueFrom: string
  dueTo: string
}

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
    result.push({ field: "assigneeId", operator: "eq", value: filters.assignee })
  if (filters.dueFrom)
    result.push({ field: "dueDate", operator: "gte", value: filters.dueFrom })
  if (filters.dueTo)
    result.push({ field: "dueDate", operator: "lte", value: filters.dueTo })
  return result
}
