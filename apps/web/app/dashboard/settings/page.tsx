import { redirect } from "next/navigation"
import { getSession } from "@/lib/session"
import { SettingsView } from "@/components/settings-view"

export default async function SettingsPage() {
  const session = await getSession()
  if (!session) redirect("/login")

  return <SettingsView />
}
