import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/session"

/**
 * Server-side route gating (ADR-0003). Reads the signed session cookie to
 * redirect unauthenticated visitors away from protected routes and
 * authenticated visitors away from login/register. This gates navigation only;
 * data authorization lives in the API.
 */
const protectedPrefix = "/dashboard"
const authPrefixes = ["/login", "/register"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await getSession()

  const isProtected =
    pathname === protectedPrefix || pathname.startsWith(`${protectedPrefix}/`)
  const isAuthRoute = authPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (isProtected && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl))
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
