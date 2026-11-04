import { Collection } from "@msw/data"
import { z } from "zod"

export const roleSchema = z.enum(["admin", "member"])
export const taskStatusSchema = z.enum([
  "todo",
  "in-progress",
  "done",
  "blocked",
])
export const taskPrioritySchema = z.enum(["low", "medium", "high"])

export type Role = z.infer<typeof roleSchema>
export type TaskStatus = z.infer<typeof taskStatusSchema>
export type TaskPriority = z.infer<typeof taskPrioritySchema>

export const userRecordSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: roleSchema,
  password: z.string(),
  createdAt: z.string(),
})

export const taskRecordSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  status: taskStatusSchema,
  priority: taskPrioritySchema.nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type UserRecord = z.infer<typeof userRecordSchema>
export type TaskRecord = z.infer<typeof taskRecordSchema>

export const users = new Collection({ schema: userRecordSchema })
export const tasks = new Collection({ schema: taskRecordSchema })

// A record as stored by @msw/data: the schema shape plus internal symbol keys.
export type UserEntity = Awaited<ReturnType<typeof users.create>>
export type TaskEntity = Awaited<ReturnType<typeof tasks.create>>

function nowIso(): string {
  return new Date().toISOString()
}

/**
 * Resets the in-memory store to a known seed. Safe to call repeatedly; each
 * call clears the collections and re-creates the sample Users and Tasks.
 */
export async function resetDb(): Promise<void> {
  users.clear()
  tasks.clear()

  await users.create({
    id: "usr_admin",
    name: "Ada Admin",
    email: "admin@example.com",
    role: "admin",
    password: "adminpass",
    createdAt: nowIso(),
  })
  await users.create({
    id: "usr_member",
    name: "Mia Member",
    email: "member@example.com",
    role: "member",
    password: "memberpass",
    createdAt: nowIso(),
  })

  await tasks.create({
    id: "tsk_001",
    title: "Author the OpenAPI contract",
    description: "Single source of truth for the API.",
    status: "done",
    priority: "high",
    assigneeId: "usr_admin",
    dueDate: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
  await tasks.create({
    id: "tsk_002",
    title: "Build the MSW mock",
    description: null,
    status: "in-progress",
    priority: "medium",
    assigneeId: "usr_member",
    dueDate: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  })
}
