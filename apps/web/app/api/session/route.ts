import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"

/**
 * Read-only session bridge for Refine's authProvider (`check`/`getIdentity`).
 * Reads the signed cookie set by the Server Actions and returns the identity
 * plus the access token so the client can hold it in memory.
 */
export async function GET(): Promise<NextResponse> {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ authenticated: false })
  }
  return NextResponse.json({
    authenticated: true,
    accessToken: session.accessToken,
    user: {
      id: session.sub,
      name: session.name,
      email: session.email,
      role: session.role,
    },
  })
}
