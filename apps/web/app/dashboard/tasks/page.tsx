import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { TasksView } from "@/components/tasks-table"

export default async function TasksPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <TasksView />
}
