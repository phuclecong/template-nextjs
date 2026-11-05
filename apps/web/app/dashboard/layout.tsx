import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { SIDEBAR_COOKIE_NAME } from "@workspace/ui/lib/constants"

import { getSession } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard-shell"

/**
 * Shared layout for every `/dashboard/*` route: the single place the session
 * is resolved and unauthenticated visitors are bounced to login. It also reads
 * the persisted sidebar state cookie (written by `SidebarProvider`) so the
 * collapsed/expanded preference survives a reload.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session) redirect("/login")

  // Read the sidebar's persisted open/collapsed state (written by the
  // SidebarProvider client component) so it survives a reload.
  const store = await cookies()
  const defaultOpen = store.get(SIDEBAR_COOKIE_NAME)?.value !== "false"

  return (
    <DashboardShell
      user={{ name: session.name, email: session.email, role: session.role }}
      defaultOpen={defaultOpen}
    >
      {children}
    </DashboardShell>
  )
}
