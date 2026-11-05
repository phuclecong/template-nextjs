import { cookies } from "next/headers"
import { SignJWT, jwtVerify } from "jose"

/**
 * Signed, httpOnly session cookie (ADR-0003). The cookie carries the minimal
 * identity plus the mock access token so the server can gate routes in
 * `proxy.ts` and hand the access token back to Refine's in-memory auth store.
 * It gates navigation only — data authorization lives in the API.
 */

export interface SessionPayload {
  sub: string
  role: "admin" | "member"
  name: string
  email: string
  accessToken: string
}

const COOKIE_NAME = "session"
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 days
const devSecret = new TextEncoder().encode("dev-only-insecure-session-secret")

/** Resolve the signing key, refusing to run with the dev fallback in prod. */
function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (secret) return new TextEncoder().encode(secret)
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET is required in production.")
  }
  return devSecret
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secretKey())
}

export async function verifySessionToken(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    })
    if (
      typeof payload.sub !== "string" ||
      (payload.role !== "admin" && payload.role !== "member") ||
      typeof payload.accessToken !== "string"
    ) {
      return null
    }
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await signSession(payload)
  const store = await cookies()
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(Date.now() + MAX_AGE_SECONDS * 1000),
    path: "/",
  })
}

export async function destroySession(): Promise<void> {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return verifySessionToken(store.get(COOKIE_NAME)?.value)
}
