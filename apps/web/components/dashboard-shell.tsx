"use client"

import Link from "next/link"
import { useGetIdentity, useLogout } from "@refinedev/core"
import { Button } from "@workspace/ui/components/button"

interface DashboardUser {
  name: string
  email: string
  role: "admin" | "member"
}

interface Identity {
  name: string
  role: string
}

export function DashboardShell({ user }: { user: DashboardUser }) {
  const { mutate: logout, isPending } = useLogout()
  const { data: identity } = useGetIdentity<Identity>()

  const name = identity?.name ?? user.name

  return (
    <main className="flex min-h-svh flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium">Dashboard</h1>
          <p className="text-muted-foreground">
            Signed in as {name} ({user.role})
          </p>
        </div>
        <Button
          variant="outline"
          disabled={isPending}
          onClick={() =>
            logout(undefined, {
              onSuccess: (result) => {
                window.location.assign(result.redirectTo ?? "/login")
              },
            })
          }
        >
          Sign out
        </Button>
      </header>
      <nav>
        <Link href="/dashboard/tasks" className="text-primary underline">
          Tasks
        </Link>
      </nav>
    </main>
  )
}
