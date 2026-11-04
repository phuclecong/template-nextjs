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

const titleSeeds = [
  "Draft the release notes",
  "Review the login flow",
  "Fix the table pagination",
  "Refactor the auth provider",
  "Write unit tests for search",
  "Document the API contract",
  "Design the empty state",
  "Ship the onboarding flow",
  "Update the color palette",
  "Investigate the flaky test",
  "Optimize the list rendering",
  "Add sorting to the table",
  "Polish the search suggestions",
  "Handle due-date formatting",
  "Audit the access-control matrix",
] as const

const statusCycle: TaskStatus[] = ["todo", "in-progress", "done", "blocked"]
const priorityCycle: (TaskPriority | null)[] = ["low", "medium", "high", null]

function seedDueDate(index: number): string | null {
  if (index % 3 === 0) return null
  const date = new Date(Date.UTC(2026, 0, 1))
  date.setUTCDate(date.getUTCDate() + index)
  return date.toISOString().slice(0, 10)
}

/** Ensures the two demo users exist without touching any registered users. */
export async function ensureSeedUsers(): Promise<void> {
  if (!users.findFirst((query) => query.where({ id: "usr_admin" }))) {
    await users.create({
      id: "usr_admin",
      name: "Ada Admin",
      email: "admin@example.com",
      role: "admin",
      password: "adminpass",
      createdAt: nowIso(),
    })
  }
  if (!users.findFirst((query) => query.where({ id: "usr_member" }))) {
    await users.create({
      id: "usr_member",
      name: "Mia Member",
      email: "member@example.com",
      role: "member",
      password: "memberpass",
      createdAt: nowIso(),
    })
  }
}

/** Seeds users and a large Task set (assumes an empty store; call after clear). */
export async function seedDb(): Promise<void> {
  await ensureSeedUsers()

  // The first two tasks are kept stable (ids, assignees, titles) because the
  // smoke tests reference them directly.
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

  const extraTasks = 148
  for (let i = 0; i < extraTasks; i++) {
    const num = i + 3
    const timestamp = nowIso()
    await tasks.create({
      id: `tsk_${String(num).padStart(3, "0")}`,
      title: `${titleSeeds[i % titleSeeds.length]!} #${num}`,
      description: i % 2 === 0 ? `Description for task #${num}` : null,
      status: statusCycle[i % statusCycle.length]!,
      priority: priorityCycle[i % priorityCycle.length] ?? null,
      assigneeId: i % 5 === 0 ? null : i % 2 === 0 ? "usr_admin" : "usr_member",
      dueDate: seedDueDate(i),
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }
}

/** Clears and re-seeds the store. Safe to call repeatedly. */
export async function resetDb(): Promise<void> {
  users.clear()
  tasks.clear()
  await seedDb()
}
