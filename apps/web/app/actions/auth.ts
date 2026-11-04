"use server"

import {
  loginUser,
  registerUser,
  type AuthResponseBody,
  type PublicUser,
} from "@workspace/api/service"
import {
  createSession,
  destroySession,
  type SessionPayload,
} from "@/lib/session"

/**
 * Server Actions for the auth spine (ADR-0003). They authenticate against the
 * mock backend (`@workspace/api`), mint a signed httpOnly session cookie, and
 * return the access token/identity so Refine's authProvider can hold them in
 * memory. Navigation is left to the client (Refine) so these stay pure
 * returners.
 *
 * The mock backend is an in-memory store in the server process, so register →
 * login round-trips the same process. That is intentional for the mock stage;
 * the FastAPI backend will replace it, and the cookie carries identity so the
 * server never re-looks-up the user after login.
 */

export type AuthSuccess = {
  success: true
  accessToken: string
  user: PublicUser
}

export type AuthFailure = {
  success: false
  error: string
}

export type AuthActionResult = AuthSuccess | AuthFailure

function isAuthResponse(body: unknown): body is AuthResponseBody {
  if (typeof body !== "object" || body === null) return false
  const candidate = body as Record<string, unknown>
  return (
    typeof candidate.accessToken === "string" &&
    typeof candidate.refreshToken === "string" &&
    typeof candidate.user === "object" &&
    candidate.user !== null
  )
}

function toSessionPayload(body: AuthResponseBody): SessionPayload {
  return {
    sub: body.user.id,
    role: body.user.role,
    name: body.user.name,
    email: body.user.email,
    accessToken: body.accessToken,
  }
}

export async function loginAction(input: {
  email: string
  password: string
}): Promise<AuthActionResult> {
  const result = await loginUser(input.email, input.password)
  if (result.status !== 200 || !isAuthResponse(result.body)) {
    return { success: false, error: "Invalid email or password." }
  }
  await createSession(toSessionPayload(result.body))
  return {
    success: true,
    accessToken: result.body.accessToken,
    user: result.body.user,
  }
}

export async function registerAction(input: {
  name: string
  email: string
  password: string
}): Promise<AuthActionResult> {
  const result = await registerUser(input.name, input.email, input.password)
  if (result.status === 409) {
    return {
      success: false,
      error: "An account with this email already exists.",
    }
  }
  if (result.status !== 201 || !isAuthResponse(result.body)) {
    return { success: false, error: "Please fill in name, email and password." }
  }
  await createSession(toSessionPayload(result.body))
  return {
    success: true,
    accessToken: result.body.accessToken,
    user: result.body.user,
  }
}

export async function logoutAction(): Promise<void> {
  await destroySession()
}
