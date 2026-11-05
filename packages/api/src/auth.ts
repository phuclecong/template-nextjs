import type { Role } from "./collections"

export interface TokenClaims {
  sub: string
  role: Role
  type: "access" | "refresh"
}

function base64UrlEncode(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlDecode(input: string): string {
  const binary = atob(input.replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

/**
 * Signs a mock bearer token. This is intentionally NOT a cryptographically
 * signed JWT: the mock only needs to round-trip the user id and role so the
 * handlers can resolve the caller. The FastAPI backend will issue real JWTs.
 */
export function signToken(claims: TokenClaims): string {
  return `mock.${base64UrlEncode(JSON.stringify(claims))}`
}

export function verifyToken(token: string): TokenClaims | null {
  if (!token.startsWith("mock.")) return null
  try {
    const claims = JSON.parse(base64UrlDecode(token.slice(5))) as TokenClaims
    if (
      typeof claims.sub !== "string" ||
      (claims.role !== "admin" && claims.role !== "member") ||
      (claims.type !== "access" && claims.type !== "refresh")
    ) {
      return null
    }
    return claims
  } catch {
    return null
  }
}
