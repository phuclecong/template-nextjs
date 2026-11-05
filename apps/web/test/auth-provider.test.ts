import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { loginAction, registerAction, logoutAction } = vi.hoisted(() => ({
  loginAction: vi.fn(),
  registerAction: vi.fn(),
  logoutAction: vi.fn(),
}))

vi.mock("@/app/actions/auth", () => ({
  loginAction,
  registerAction,
  logoutAction,
}))

import {
  authProvider,
  getAuthToken,
  getAuthUser,
  resetAuthState,
} from "@/providers/auth-provider"

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  resetAuthState()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function sessionJson(overrides: Record<string, unknown> = {}) {
  return {
    authenticated: true,
    accessToken: "mock.access",
    user: {
      id: "usr_1",
      name: "Ada Admin",
      email: "admin@example.com",
      role: "admin",
    },
    ...overrides,
  }
}

function okJson(body: unknown) {
  return { ok: true, json: async () => body }
}

describe("authProvider", () => {
  it("login stores the access token in memory and redirects to the dashboard", async () => {
    loginAction.mockResolvedValue({
      success: true,
      accessToken: "mock.access",
      user: {
        id: "usr_1",
        name: "Ada Admin",
        email: "admin@example.com",
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    })

    const result = await authProvider.login({
      email: "admin@example.com",
      password: "adminpass",
    })

    expect(loginAction).toHaveBeenCalledWith({
      email: "admin@example.com",
      password: "adminpass",
    })
    expect(result.success).toBe(true)
    expect(result.redirectTo).toBe("/dashboard")
    expect(getAuthToken()).toBe("mock.access")
    expect(getAuthUser()?.role).toBe("admin")
  })

  it("login surfaces invalid credentials as an error", async () => {
    loginAction.mockResolvedValue({
      success: false,
      error: "Invalid email or password.",
    })

    const result = await authProvider.login({
      email: "admin@example.com",
      password: "wrong",
    })

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect(getAuthToken()).toBeNull()
  })

  it("logout clears the in-memory session and redirects to login", async () => {
    loginAction.mockResolvedValue({
      success: true,
      accessToken: "mock.access",
      user: {
        id: "usr_1",
        name: "Ada Admin",
        email: "admin@example.com",
        role: "admin",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    })
    await authProvider.login({ email: "a@b.c", password: "x" })
    logoutAction.mockResolvedValue(undefined)

    const result = await authProvider.logout(undefined)

    expect(logoutAction).toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(result.redirectTo).toBe("/login")
    expect(getAuthToken()).toBeNull()
    expect(getAuthUser()).toBeNull()
  })

  it("check resolves authenticated when a session exists", async () => {
    fetchMock.mockResolvedValue(okJson(sessionJson()))

    const result = await authProvider.check()

    expect(fetchMock).toHaveBeenCalledWith("/api/session")
    expect(result.authenticated).toBe(true)
    expect(getAuthUser()?.role).toBe("admin")
    expect(getAuthToken()).toBe("mock.access")
  })

  it("check resolves unauthenticated and clears memory without a session", async () => {
    fetchMock.mockResolvedValue(okJson({ authenticated: false }))

    const result = await authProvider.check()

    expect(result.authenticated).toBe(false)
    expect(result.redirectTo).toBe("/login")
    expect(getAuthToken()).toBeNull()
    expect(getAuthUser()).toBeNull()
  })

  it("getIdentity returns the current user from the session", async () => {
    fetchMock.mockResolvedValue(okJson(sessionJson()))

    const identity = await authProvider.getIdentity?.()

    expect(identity).toMatchObject({ id: "usr_1", role: "admin" })
  })

  it("register creates an account and stores the session", async () => {
    registerAction.mockResolvedValue({
      success: true,
      accessToken: "mock.access",
      user: {
        id: "usr_2",
        name: "New User",
        email: "new@example.com",
        role: "member",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    })

    const result = await authProvider.register?.({
      name: "New User",
      email: "new@example.com",
      password: "secret",
    })

    expect(registerAction).toHaveBeenCalledWith({
      name: "New User",
      email: "new@example.com",
      password: "secret",
    })
    expect(result?.success).toBe(true)
    expect(result?.redirectTo).toBe("/dashboard")
    expect(getAuthUser()?.role).toBe("member")
  })
})
