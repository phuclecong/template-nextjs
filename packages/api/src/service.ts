import { signToken, verifyToken } from "./auth"
import {
  ensureSeedUsers,
  users,
  type Role,
  type UserEntity,
} from "./collections"

/**
 * The mock backend's business logic, shared by the MSW handlers (browser +
 * Node smoke tests) and the Next.js server actions (which authenticate against
 * the same in-memory store). This module is deliberately framework-free: no
 * MSW, no `Request`/`Response`, no top-level `await`, so it can be imported
 * into the Next.js server runtime without dragging in the handler machinery.
 */

export interface PublicUser {
  id: string
  name: string
  email: string
  role: Role
  createdAt: string
}

export interface AuthResponseBody {
  accessToken: string
  refreshToken: string
  user: PublicUser
}

export interface ServiceResult {
  status: number
  body: unknown
}

export function toPublicUser(user: UserEntity): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

function authResponse(user: UserEntity): AuthResponseBody {
  return {
    accessToken: signToken({ sub: user.id, role: user.role, type: "access" }),
    refreshToken: signToken({ sub: user.id, role: user.role, type: "refresh" }),
    user: toPublicUser(user),
  }
}

function error(code: string, message: string, status: number): ServiceResult {
  return { status, body: { code, message } }
}

/** Resolves the caller for a bearer access token, or null when invalid. */
export function getUserByAccessToken(
  token: string | null | undefined
): UserEntity | null {
  if (!token) return null
  const claims = verifyToken(token)
  if (!claims || claims.type !== "access") return null
  return users.findFirst((query) => query.where({ id: claims.sub })) ?? null
}

export async function registerUser(
  name: unknown,
  email: unknown,
  password: unknown
): Promise<ServiceResult> {
  if (
    typeof name !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string"
  ) {
    return error(
      "invalid_request",
      "name, email and password are required.",
      400
    )
  }
  const normalizedEmail = email.toLowerCase()
  if (users.findFirst((query) => query.where({ email: normalizedEmail }))) {
    return error(
      "email_taken",
      "An account with this email already exists.",
      409
    )
  }
  const user = await users.create({
    id: `usr_${crypto.randomUUID()}`,
    name,
    email: normalizedEmail,
    role: "member",
    password,
    createdAt: new Date().toISOString(),
  })
  return { status: 201, body: authResponse(user) }
}

export async function loginUser(
  email: unknown,
  password: unknown
): Promise<ServiceResult> {
  if (typeof email !== "string" || typeof password !== "string") {
    return error("invalid_request", "email and password are required.", 400)
  }
  // The mock's demo accounts must exist server-side for login even when the
  // store already holds a freshly registered user.
  await ensureSeedUsers()
  const normalizedEmail = email.toLowerCase()
  const user = users.findFirst((query) =>
    query.where({ email: normalizedEmail })
  )
  if (!user || user.password !== password) {
    return error("invalid_credentials", "Incorrect email or password.", 401)
  }
  return { status: 200, body: authResponse(user) }
}

export function refreshAccessToken(refreshToken: unknown): ServiceResult {
  if (typeof refreshToken !== "string") {
    return error("invalid_request", "refreshToken is required.", 400)
  }
  const claims = verifyToken(refreshToken)
  if (!claims || claims.type !== "refresh") {
    return error("unauthorized", "Invalid refresh token.", 401)
  }
  const user = users.findFirst((query) => query.where({ id: claims.sub }))
  if (!user) return error("unauthorized", "Invalid refresh token.", 401)
  return {
    status: 200,
    body: {
      accessToken: signToken({ sub: user.id, role: user.role, type: "access" }),
    },
  }
}
