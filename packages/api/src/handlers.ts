import { readFileSync } from "node:fs"
import { fromOpenApi } from "@msw/source/open-api"
import { http, HttpResponse, type JsonBodyType } from "msw"
import { signToken, verifyToken } from "./auth.js"
import {
  tasks,
  users,
  type Role,
  type TaskPriority,
  type TaskStatus,
  type UserEntity,
} from "./collections.js"

// The OpenAPI spec is the single source of truth. `fromOpenApi` generates a
// handler for every documented operation, which serves as the spec-derived
// fallback; the data-backed handlers below take precedence so the mock is
// stateful (reads/writes the @msw/data collections).
const spec = readFileSync(new URL("../openapi.yaml", import.meta.url), "utf8")

export const specHandlers = await fromOpenApi(spec)

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

function toPublicUser(user: UserEntity) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

function authResponse(user: UserEntity) {
  return {
    accessToken: signToken({ sub: user.id, role: user.role, type: "access" }),
    refreshToken: signToken({ sub: user.id, role: user.role, type: "refresh" }),
    user: toPublicUser(user),
  }
}

function getAuthUser(request: Request): UserEntity | null {
  const header = request.headers.get("authorization")
  if (!header?.startsWith("Bearer ")) return null
  const claims = verifyToken(header.slice("Bearer ".length))
  if (!claims || claims.type !== "access") return null
  return users.findFirst((query) => query.where({ id: claims.sub })) ?? null
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

const dataHandlers = [
  // ---- auth ----
  http.post("*/api/auth/register", async ({ request }) => {
    const body = await readJson(request)
    if (
      !body ||
      typeof body.name !== "string" ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return fail(
        "invalid_request",
        "name, email and password are required.",
        400
      )
    }
    const email = body.email.toLowerCase()
    if (users.findFirst((query) => query.where({ email }))) {
      return fail(
        "email_taken",
        "An account with this email already exists.",
        409
      )
    }
    const user = await users.create({
      id: `usr_${crypto.randomUUID()}`,
      name: body.name,
      email,
      role: "member",
      password: body.password,
      createdAt: new Date().toISOString(),
    })
    return ok(authResponse(user), 201)
  }),

  http.post("*/api/auth/login", async ({ request }) => {
    const body = await readJson(request)
    if (
      !body ||
      typeof body.email !== "string" ||
      typeof body.password !== "string"
    ) {
      return fail("invalid_request", "email and password are required.", 400)
    }
    const email = body.email.toLowerCase()
    const user = users.findFirst((query) => query.where({ email }))
    if (!user || user.password !== body.password) {
      return fail("invalid_credentials", "Incorrect email or password.", 401)
    }
    return ok(authResponse(user))
  }),

  http.post("*/api/auth/refresh", async ({ request }) => {
    const body = await readJson(request)
    if (!body || typeof body.refreshToken !== "string") {
      return fail("invalid_request", "refreshToken is required.", 400)
    }
    const claims = verifyToken(body.refreshToken)
    if (!claims || claims.type !== "refresh") {
      return fail("unauthorized", "Invalid refresh token.", 401)
    }
    const user = users.findFirst((query) => query.where({ id: claims.sub }))
    if (!user) return fail("unauthorized", "Invalid refresh token.", 401)
    return ok({
      accessToken: signToken({ sub: user.id, role: user.role, type: "access" }),
    })
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
  http.get("*/api/tasks", ({ request }) => {
    if (!getAuthUser(request)) {
      return fail("unauthorized", "Authentication required.", 401)
    }
    return ok(tasks.all())
  }),

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
        typeof body.assigneeId === "string" ? body.assigneeId : actor.id,
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

export const handlers = [...dataHandlers, ...specHandlers]
