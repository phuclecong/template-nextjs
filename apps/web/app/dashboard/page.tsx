import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return (
    <DashboardShell
      user={{ name: session.name, email: session.email, role: session.role }}
    />
  )
}
