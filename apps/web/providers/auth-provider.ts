import type { AuthActionResponse, AuthProvider } from "@refinedev/core"
import {
  loginAction,
  logoutAction,
  registerAction,
  type AuthActionResult,
} from "@/app/actions/auth"

/**
 * Refine authProvider (ADR-0002, ADR-0003). Login/register/logout run through
 * Server Actions that set a signed httpOnly cookie; the access token is held
 * here in memory only (never localStorage). `check`/`getIdentity` read the
 * cookie back through `GET /api/session`.
 */

export interface SessionUser {
  id: string
  name: string
  email: string
  role: "admin" | "member"
}

interface SessionResponse {
  authenticated: boolean
  accessToken?: string
  user?: SessionUser
}

let inMemoryToken: string | null = null
let inMemoryUser: SessionUser | null = null

export function getAuthToken(): string | null {
  return inMemoryToken
}

export function getAuthUser(): SessionUser | null {
  return inMemoryUser
}

export function resetAuthState(): void {
  inMemoryToken = null
  inMemoryUser = null
}

async function fetchSession(): Promise<SessionResponse> {
  try {
    const response = await fetch("/api/session")
    if (!response.ok) return { authenticated: false }
    return (await response.json()) as SessionResponse
  } catch {
    return { authenticated: false }
  }
}

function applySession(session: SessionResponse): boolean {
  if (session.authenticated && session.user) {
    inMemoryToken = session.accessToken ?? null
    inMemoryUser = session.user
    return true
  }
  inMemoryToken = null
  inMemoryUser = null
  return false
}

export async function ensureAuthUser(): Promise<SessionUser | null> {
  if (inMemoryUser) return inMemoryUser
  const session = await fetchSession()
  return applySession(session) ? inMemoryUser : null
}

function toAuthResult(result: AuthActionResult): AuthActionResponse {
  if (!result.success) {
    return { success: false, error: new Error(result.error) }
  }
  inMemoryToken = result.accessToken
  inMemoryUser = result.user
  return { success: true, redirectTo: "/dashboard" }
}

export const authProvider: AuthProvider = {
  async login(params: { email?: string; password?: string }) {
    return toAuthResult(
      await loginAction({
        email: params.email ?? "",
        password: params.password ?? "",
      })
    )
  },

  async register(params: { name?: string; email?: string; password?: string }) {
    return toAuthResult(
      await registerAction({
        name: params.name ?? "",
        email: params.email ?? "",
        password: params.password ?? "",
      })
    )
  },

  async logout() {
    await logoutAction()
    inMemoryToken = null
    inMemoryUser = null
    return { success: true, redirectTo: "/login" }
  },

  async check() {
    const session = await fetchSession()
    if (applySession(session)) {
      return { authenticated: true }
    }
    return { authenticated: false, redirectTo: "/login" }
  },

  async onError() {
    return { logout: true, redirectTo: "/login" }
  },

  async getIdentity() {
    const session = await fetchSession()
    return applySession(session) ? inMemoryUser : null
  },

  async getPermissions() {
    const user = await ensureAuthUser()
    return user?.role ?? null
  },
}
