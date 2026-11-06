import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest"
import { setupServer } from "msw/node"
import { handlers, resetDb } from "../src/index"

const server = setupServer(...handlers)

const BASE_URL = "http://localhost"

interface ApiOptions {
  method?: string
  token?: string
  body?: unknown
}

async function api(path: string, options: ApiOptions = {}): Promise<Response> {
  const { method = "GET", token, body } = options
  const headers = new Headers()
  if (token) headers.set("authorization", `Bearer ${token}`)
  if (body !== undefined) headers.set("content-type", "application/json")

  return fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

async function login(
  email: string,
  password: string
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await api("/api/auth/login", {
    method: "POST",
    body: { email, password },
  })
  expect(response.status).toBe(200)
  return (await response.json()) as {
    accessToken: string
    refreshToken: string
  }
}

beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(async () => {
  await resetDb()
})

describe("auth", () => {
  it("registers an account and logs in", async () => {
    const register = await api("/api/auth/register", {
      method: "POST",
      body: { name: "New User", email: "new@example.com", password: "secret" },
    })
    expect(register.status).toBe(201)
    const registered = (await register.json()) as {
      accessToken: string
      refreshToken: string
      user: { id: string; email: string; role: string }
    }
    expect(registered.accessToken).toBeTruthy()
    expect(registered.refreshToken).toBeTruthy()
    expect(registered.user.role).toBe("member")
    expect(registered.user.email).toBe("new@example.com")

    const loginRes = await api("/api/auth/login", {
      method: "POST",
      body: { email: "new@example.com", password: "secret" },
    })
    expect(loginRes.status).toBe(200)
  })

  it("rejects a duplicate email with 409", async () => {
    const res = await api("/api/auth/register", {
      method: "POST",
      body: { name: "Dup", email: "admin@example.com", password: "secret" },
    })
    expect(res.status).toBe(409)
  })

  it("rejects a wrong password with 401", async () => {
    const res = await api("/api/auth/login", {
      method: "POST",
      body: { email: "member@example.com", password: "wrong" },
    })
    expect(res.status).toBe(401)
  })

  it("refreshes an access token", async () => {
    const { refreshToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    })
    expect(res.status).toBe(200)
    const data = (await res.json()) as { accessToken: string }
    expect(data.accessToken).toBeTruthy()
  })

  it("logs out", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/auth/logout", {
      method: "POST",
      token: accessToken,
    })
    expect(res.status).toBe(204)
  })
})

describe("users", () => {
  it("requires auth to list users (401)", async () => {
    const res = await api("/api/users")
    expect(res.status).toBe(401)
  })

  it("lists users without exposing passwords", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/users", { token: accessToken })
    expect(res.status).toBe(200)
    const list = (await res.json()) as Array<Record<string, unknown>>
    expect(list.length).toBe(2)
    for (const user of list) {
      expect(user).not.toHaveProperty("password")
      expect(user).toHaveProperty("id")
      expect(user).toHaveProperty("email")
      expect(user).toHaveProperty("role")
    }
  })

  it("forbids a member from changing a role (403)", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/users/usr_admin/role", {
      method: "PATCH",
      token: accessToken,
      body: { role: "member" },
    })
    expect(res.status).toBe(403)
  })

  it("lets an admin change a role", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/users/usr_member/role", {
      method: "PATCH",
      token: accessToken,
      body: { role: "admin" },
    })
    expect(res.status).toBe(200)
    const updated = (await res.json()) as { role: string }
    expect(updated.role).toBe("admin")
  })

  it("forbids a member from deleting a user (403)", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/users/usr_admin", {
      method: "DELETE",
      token: accessToken,
    })
    expect(res.status).toBe(403)
  })

  it("lets an admin delete a user", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/users/usr_member", {
      method: "DELETE",
      token: accessToken,
    })
    expect(res.status).toBe(204)

    const listRes = await api("/api/users", { token: accessToken })
    const list = (await listRes.json()) as Array<{ id: string }>
    expect(list.some((user) => user.id === "usr_member")).toBe(false)
  })
})

describe("tasks", () => {
  it("requires auth to list tasks (401)", async () => {
    const res = await api("/api/tasks")
    expect(res.status).toBe(401)
  })

  it("lists seeded tasks", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks", { token: accessToken })
    expect(res.status).toBe(200)
    const list = (await res.json()) as Array<{ title: string; status: string }>
    expect(list.length).toBe(150)
    expect(list.map((task) => task.title)).toContain(
      "Author the OpenAPI contract"
    )
  })

  it("filters, sorts, and paginates tasks via query params", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")

    const filtered = await api("/api/tasks?q=author&_start=0&_end=10", {
      token: accessToken,
    })
    expect(filtered.status).toBe(200)
    const filteredList = (await filtered.json()) as Array<{ title: string }>
    expect(filteredList).toHaveLength(1)
    expect(filteredList[0]?.title).toBe("Author the OpenAPI contract")
    expect(filtered.headers.get("x-total-count")).toBe("1")

    const page = await api(
      "/api/tasks?_start=0&_end=5&_sort=title&_order=asc",
      { token: accessToken }
    )
    expect(page.status).toBe(200)
    const pageList = (await page.json()) as Array<{ title: string }>
    expect(pageList).toHaveLength(5)
    expect(page.headers.get("x-total-count")).toBe("150")

    const sorted = [...pageList.map((task) => task.title)].sort((a, b) =>
      a.localeCompare(b)
    )
    expect(pageList.map((task) => task.title)).toEqual(sorted)
  })

  it("filters by status, priority, assignee, and unassigned", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")

    const byStatus = await api("/api/tasks?status=done", { token: accessToken })
    const statusList = (await byStatus.json()) as Array<{ status: string }>
    expect(statusList.length).toBeGreaterThan(0)
    for (const task of statusList) expect(task.status).toBe("done")

    const byPriority = await api("/api/tasks?priority=high", {
      token: accessToken,
    })
    const priorityList = (await byPriority.json()) as Array<{ priority: string }>
    for (const task of priorityList) expect(task.priority).toBe("high")

    const byAssignee = await api("/api/tasks?assigneeId=usr_admin", {
      token: accessToken,
    })
    const assigneeList = (await byAssignee.json()) as Array<{
      assigneeId: string | null
    }>
    expect(assigneeList.length).toBeGreaterThan(0)
    for (const task of assigneeList) expect(task.assigneeId).toBe("usr_admin")

    const unassigned = await api("/api/tasks?assigneeId=unassigned", {
      token: accessToken,
    })
    const unassignedList = (await unassigned.json()) as Array<{
      assigneeId: string | null
    }>
    expect(unassignedList.length).toBeGreaterThan(0)
    for (const task of unassignedList) expect(task.assigneeId).toBeNull()
  })

  it("combines filters with AND", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/tasks?status=done&priority=high", {
      token: accessToken,
    })
    const list = (await res.json()) as Array<{
      status: string
      priority: string
    }>
    expect(list.length).toBeGreaterThan(0)
    for (const task of list) {
      expect(task.status).toBe("done")
      expect(task.priority).toBe("high")
    }
  })

  it("filters by an inclusive due-date range and excludes null due dates", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")

    const exact = await api(
      "/api/tasks?dueDate_gte=2026-01-05&dueDate_lte=2026-01-05",
      { token: accessToken }
    )
    const exactList = (await exact.json()) as Array<{ dueDate: string | null }>
    expect(exactList).toHaveLength(1)
    expect(exactList[0]?.dueDate).toBe("2026-01-05")

    const range = await api(
      "/api/tasks?dueDate_gte=2026-01-05&dueDate_lte=2026-01-10",
      { token: accessToken }
    )
    const rangeList = (await range.json()) as Array<{ dueDate: string | null }>
    expect(rangeList.length).toBeGreaterThan(0)
    for (const task of rangeList) {
      expect(task.dueDate).not.toBeNull()
      expect(task.dueDate! >= "2026-01-05").toBe(true)
      expect(task.dueDate! <= "2026-01-10").toBe(true)
    }
  })

  it("requires auth to bulk update (401)", async () => {
    const res = await api("/api/tasks/bulk", {
      method: "PATCH",
      body: { ids: ["tsk_001"], status: "done" },
    })
    expect(res.status).toBe(401)
  })

  it("rejects a bulk update without any field (400)", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/tasks/bulk", {
      method: "PATCH",
      token: accessToken,
      body: { ids: ["tsk_001"] },
    })
    expect(res.status).toBe(400)
  })

  it("bulk-updates tasks and reports missing ids as failed", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/tasks/bulk", {
      method: "PATCH",
      token: accessToken,
      body: { ids: ["tsk_001", "tsk_002", "missing"], status: "done" },
    })
    expect(res.status).toBe(200)
    const result = (await res.json()) as {
      updated: number
      failed: { id: string; reason: string }[]
    }
    expect(result.updated).toBe(2)
    expect(result.failed).toEqual([{ id: "missing", reason: "not_found" }])
  })

  it("lets a member bulk-update only their own tasks", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks/bulk", {
      method: "PATCH",
      token: accessToken,
      body: { ids: ["tsk_001", "tsk_002"], status: "blocked" },
    })
    expect(res.status).toBe(200)
    const result = (await res.json()) as {
      updated: number
      failed: { id: string; reason: string }[]
    }
    expect(result.updated).toBe(1)
    expect(result.failed).toEqual([{ id: "tsk_001", reason: "forbidden" }])
  })

  it("clears priority and assignee with null in a bulk update", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/tasks/bulk", {
      method: "PATCH",
      token: accessToken,
      body: { ids: ["tsk_001"], priority: null, assigneeId: null },
    })
    expect(res.status).toBe(200)
    const result = (await res.json()) as { updated: number }
    expect(result.updated).toBe(1)

    const after = await api("/api/tasks?q=author", { token: accessToken })
    const list = (await after.json()) as Array<{
      id: string
      priority: string | null
      assigneeId: string | null
    }>
    const task = list.find((item) => item.id === "tsk_001")
    expect(task?.priority).toBeNull()
    expect(task?.assigneeId).toBeNull()
  })

  it("creates a task assigned to the creator", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks", {
      method: "POST",
      token: accessToken,
      body: { title: "Write smoke tests" },
    })
    expect(res.status).toBe(201)
    const task = (await res.json()) as {
      id: string
      title: string
      assigneeId: string
      status: string
    }
    expect(task.title).toBe("Write smoke tests")
    expect(task.assigneeId).toBe("usr_member")
    expect(task.status).toBe("todo")
  })

  it("creates an unassigned task when assigneeId is null", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks", {
      method: "POST",
      token: accessToken,
      body: { title: "Unassigned task", assigneeId: null },
    })
    expect(res.status).toBe(201)
    const task = (await res.json()) as { assigneeId: string | null }
    expect(task.assigneeId).toBeNull()
  })

  it("lets a member update their own task", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks/tsk_002", {
      method: "PATCH",
      token: accessToken,
      body: { status: "done" },
    })
    expect(res.status).toBe(200)
    const task = (await res.json()) as { status: string }
    expect(task.status).toBe("done")
  })

  it("lets a user clear a task's priority to null (nullable field)", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks/tsk_002", {
      method: "PATCH",
      token: accessToken,
      body: { priority: null },
    })
    expect(res.status).toBe(200)
    const task = (await res.json()) as { priority: string | null }
    expect(task.priority).toBeNull()
  })

  it("forbids a member from updating another user's task (403)", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks/tsk_001", {
      method: "PATCH",
      token: accessToken,
      body: { title: "Hijack" },
    })
    expect(res.status).toBe(403)
  })

  it("lets an admin update any task", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/tasks/tsk_002", {
      method: "PATCH",
      token: accessToken,
      body: { title: "Renamed by admin" },
    })
    expect(res.status).toBe(200)
    const task = (await res.json()) as { title: string }
    expect(task.title).toBe("Renamed by admin")
  })

  it("forbids a member from deleting another user's task (403)", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/tasks/tsk_001", {
      method: "DELETE",
      token: accessToken,
    })
    expect(res.status).toBe(403)
  })

  it("lets an admin delete any task", async () => {
    const { accessToken } = await login("admin@example.com", "adminpass")
    const res = await api("/api/tasks/tsk_001", {
      method: "DELETE",
      token: accessToken,
    })
    expect(res.status).toBe(204)
  })
})

describe("password", () => {
  it("requires auth (401)", async () => {
    const res = await api("/api/password", {
      method: "PUT",
      body: { currentPassword: "x", newPassword: "y" },
    })
    expect(res.status).toBe(401)
  })

  it("updates the password and reflects it on next login", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/password", {
      method: "PUT",
      token: accessToken,
      body: { currentPassword: "memberpass", newPassword: "newpass" },
    })
    expect(res.status).toBe(204)

    const oldLogin = await api("/api/auth/login", {
      method: "POST",
      body: { email: "member@example.com", password: "memberpass" },
    })
    expect(oldLogin.status).toBe(401)

    const newLogin = await api("/api/auth/login", {
      method: "POST",
      body: { email: "member@example.com", password: "newpass" },
    })
    expect(newLogin.status).toBe(200)
  })

  it("rejects a wrong current password (401)", async () => {
    const { accessToken } = await login("member@example.com", "memberpass")
    const res = await api("/api/password", {
      method: "PUT",
      token: accessToken,
      body: { currentPassword: "wrong", newPassword: "newpass" },
    })
    expect(res.status).toBe(401)
  })
})
