import { http, HttpResponse, type JsonBodyType } from "msw"
import {
  tasks,
  users,
  type Role,
  type TaskEntity,
  type TaskPriority,
  type TaskStatus,
  type UserEntity,
} from "./collections"
import {
  getUserByAccessToken,
  loginUser,
  refreshAccessToken,
  registerUser,
  toPublicUser,
  type ServiceResult,
} from "./service"

// Stateful, hand-written handlers. Kept free of `node:fs`, `fromOpenApi`, and
// top-level `await` so this module can be bundled into the browser MSW worker;
// `handlers.ts` composes these with the spec-generated fallback for Node.

type JsonBody = Record<string, unknown>

async function readJson(request: Request): Promise<JsonBody | null> {
  try {
    const value: unknown = await request.json()
    return typeof value === "object" && value !== null
      ? (value as JsonBody)
      : null
  } catch {
    return null
  }
}

function ok(body: unknown, status = 200): Response {
  return HttpResponse.json(body as JsonBodyType, { status })
}

function fail(code: string, message: string, status: number): Response {
  return HttpResponse.json({ code, message }, { status })
}

function respond(result: ServiceResult): Response {
  return ok(result.body, result.status)
}

function getAuthUser(request: Request): UserEntity | null {
  const header = request.headers.get("authorization")
  const token = header?.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null
  return getUserByAccessToken(token)
}

function pathParam(
  value: string | readonly string[] | undefined
): string | undefined {
  if (typeof value === "string") return value
  return value?.[0]
}

function isRole(value: unknown): value is Role {
  return value === "admin" || value === "member"
}

function isStatus(value: unknown): value is TaskStatus {
  return (
    value === "todo" ||
    value === "in-progress" ||
    value === "done" ||
    value === "blocked"
  )
}

function isPriority(value: unknown): value is TaskPriority {
  return value === "low" || value === "medium" || value === "high"
}

const sortableTaskFields = ["title", "status", "priority", "dueDate"] as const
type SortableTaskField = (typeof sortableTaskFields)[number]

function isSortableTaskField(value: string | null): value is SortableTaskField {
  return (
    value !== null && (sortableTaskFields as readonly string[]).includes(value)
  )
}

function compareTaskValues(
  a: TaskEntity,
  b: TaskEntity,
  field: SortableTaskField
): number {
  const av = a[field]
  const bv = b[field]
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  return String(av).localeCompare(String(bv))
}

/** Lists tasks with simple-rest compatible `_start`/`_end`/`_sort`/`_order`/`q`. */
function listTasks(request: Request): Response {
  if (!getAuthUser(request)) {
    return fail("unauthorized", "Authentication required.", 401)
  }

  const url = new URL(request.url)
  const q = url.searchParams.get("q")?.trim().toLowerCase()
  const start = Number(url.searchParams.get("_start") ?? 0)
  const endParam = url.searchParams.get("_end")
  const end = endParam ? Number(endParam) : undefined
  const sortParam = url.searchParams.get("_sort")
  const descending = url.searchParams.get("_order") === "desc"
  const sortField: SortableTaskField = isSortableTaskField(sortParam)
    ? sortParam
    : "title"

  let items = tasks.all().slice()
  if (q) {
    items = items.filter((task) => task.title.toLowerCase().includes(q))
  }
  items.sort((a, b) => {
    const result = compareTaskValues(a, b, sortField)
    return descending ? -result : result
  })

  const total = items.length
  const page = end === undefined ? items : items.slice(start, end)
  return HttpResponse.json(page as JsonBodyType, {
    status: 200,
    headers: { "x-total-count": String(total) },
  })
}

export const dataHandlers = [
  // ---- auth ----
  http.post("*/api/auth/register", async ({ request }) => {
    const body = await readJson(request)
    return respond(await registerUser(body?.name, body?.email, body?.password))
  }),

  http.post("*/api/auth/login", async ({ request }) => {
    const body = await readJson(request)
    return respond(await loginUser(body?.email, body?.password))
  }),

  http.post("*/api/auth/refresh", async ({ request }) => {
    const body = await readJson(request)
    return respond(refreshAccessToken(body?.refreshToken))
  }),

  http.post("*/api/auth/logout", ({ request }) => {
    if (!getAuthUser(request)) {
      return fail("unauthorized", "Authentication required.", 401)
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // ---- users ----
  http.get("*/api/users", ({ request }) => {
    if (!getAuthUser(request)) {
      return fail("unauthorized", "Authentication required.", 401)
    }
    return ok(users.all().map(toPublicUser))
  }),

  http.patch("*/api/users/:id/role", async ({ request, params }) => {
    const actor = getAuthUser(request)
    if (!actor) return fail("unauthorized", "Authentication required.", 401)
    if (actor.role !== "admin") {
      return fail("forbidden", "Admin role required.", 403)
    }
    const id = pathParam(params.id)
    const target = id
      ? users.findFirst((query) => query.where({ id }))
      : undefined
    if (!target) return fail("not_found", "User not found.", 404)

    const body = await readJson(request)
    if (!body || !isRole(body.role)) {
      return fail(
        "invalid_request",
        'A role of "admin" or "member" is required.',
        400
      )
    }
    const role = body.role
    const updated = await users.update(target, {
      data(draft) {
        draft.role = role
      },
      strict: true,
    })
    return ok(toPublicUser(updated))
  }),

  http.delete("*/api/users/:id", ({ request, params }) => {
    const actor = getAuthUser(request)
    if (!actor) return fail("unauthorized", "Authentication required.", 401)
    if (actor.role !== "admin") {
      return fail("forbidden", "Admin role required.", 403)
    }
    const id = pathParam(params.id)
    const target = id
      ? users.findFirst((query) => query.where({ id }))
      : undefined
    if (!target) return fail("not_found", "User not found.", 404)
    users.delete(target)
    return new HttpResponse(null, { status: 204 })
  }),

  // ---- tasks ----
  http.get("*/api/tasks", ({ request }) => listTasks(request)),

  http.post("*/api/tasks", async ({ request }) => {
    const actor = getAuthUser(request)
    if (!actor) return fail("unauthorized", "Authentication required.", 401)
    const body = await readJson(request)
    if (!body || typeof body.title !== "string" || body.title.trim() === "") {
      return fail("invalid_request", "A title is required.", 400)
    }
    const timestamp = new Date().toISOString()
    const task = await tasks.create({
      id: `tsk_${crypto.randomUUID()}`,
      title: body.title,
      description:
        typeof body.description === "string" ? body.description : null,
      status: isStatus(body.status) ? body.status : "todo",
      priority: isPriority(body.priority) ? body.priority : null,
      assigneeId:
        body.assigneeId === null
          ? null
          : typeof body.assigneeId === "string"
            ? body.assigneeId
            : actor.id,
      dueDate: typeof body.dueDate === "string" ? body.dueDate : null,
      createdAt: timestamp,
      updatedAt: timestamp,
    })
    return ok(task, 201)
  }),

  http.patch("*/api/tasks/:id", async ({ request, params }) => {
    const actor = getAuthUser(request)
    if (!actor) return fail("unauthorized", "Authentication required.", 401)
    const id = pathParam(params.id)
    const target = id
      ? tasks.findFirst((query) => query.where({ id }))
      : undefined
    if (!target) return fail("not_found", "Task not found.", 404)
    if (actor.role !== "admin" && target.assigneeId !== actor.id) {
      return fail("forbidden", "You can only update your own tasks.", 403)
    }

    const body = await readJson(request)
    const updated = await tasks.update(target, {
      data(draft) {
        if (typeof body?.title === "string" && body.title.trim() !== "") {
          draft.title = body.title
        }
        if (
          typeof body?.description === "string" ||
          body?.description === null
        ) {
          draft.description = body.description
        }
        if (isStatus(body?.status)) draft.status = body.status
        if (isPriority(body?.priority) || body?.priority === null) {
          draft.priority = body.priority
        }
        if (typeof body?.assigneeId === "string" || body?.assigneeId === null) {
          draft.assigneeId = body.assigneeId
        }
        if (typeof body?.dueDate === "string" || body?.dueDate === null) {
          draft.dueDate = body.dueDate
        }
        draft.updatedAt = new Date().toISOString()
      },
      strict: true,
    })
    return ok(updated)
  }),

  http.delete("*/api/tasks/:id", ({ request, params }) => {
    const actor = getAuthUser(request)
    if (!actor) return fail("unauthorized", "Authentication required.", 401)
    const id = pathParam(params.id)
    const target = id
      ? tasks.findFirst((query) => query.where({ id }))
      : undefined
    if (!target) return fail("not_found", "Task not found.", 404)
    if (actor.role !== "admin" && target.assigneeId !== actor.id) {
      return fail("forbidden", "You can only delete your own tasks.", 403)
    }
    tasks.delete(target)
    return new HttpResponse(null, { status: 204 })
  }),

  // ---- password ----
  http.put("*/api/password", async ({ request }) => {
    const actor = getAuthUser(request)
    if (!actor) return fail("unauthorized", "Authentication required.", 401)
    const body = await readJson(request)
    if (
      !body ||
      typeof body.currentPassword !== "string" ||
      typeof body.newPassword !== "string"
    ) {
      return fail(
        "invalid_request",
        "currentPassword and newPassword are required.",
        400
      )
    }
    if (actor.password !== body.currentPassword) {
      return fail("invalid_credentials", "Current password is incorrect.", 401)
    }
    const newPassword = body.newPassword
    await users.update(actor, {
      data(draft) {
        draft.password = newPassword
      },
      strict: true,
    })
    return new HttpResponse(null, { status: 204 })
  }),
]
