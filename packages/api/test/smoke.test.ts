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
    expect(list.length).toBe(2)
    expect(list.map((task) => task.title)).toContain(
      "Author the OpenAPI contract"
    )
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
