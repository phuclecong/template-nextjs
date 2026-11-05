"use client"

import { useTranslation } from "react-i18next"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { AppSidebar } from "@/components/app-sidebar"
import type { DashboardUser } from "@/lib/session"

/**
 * Client shell for every `/dashboard/*` route: a collapsible sidebar (icon
 * rail on desktop, Sheet drawer on mobile) plus a content inset with a sticky
 * header. The server layout resolves the session and the persisted sidebar
 * state and passes them in as props.
 */
export function DashboardShell({
  user,
  defaultOpen = true,
  children,
}: {
  user: DashboardUser
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <AppSidebar
          user={user}
          collapsible="icon"
          title={t("shell.sidebar")}
          description={t("shell.sidebarDescription")}
        />
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b bg-background px-4">
            <SidebarTrigger className="-ml-1" label={t("shell.toggleSidebar")} />
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
