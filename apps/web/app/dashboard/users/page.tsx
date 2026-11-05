import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { UsersView } from "@/components/users-table"

export default async function UsersPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <UsersView />
}
