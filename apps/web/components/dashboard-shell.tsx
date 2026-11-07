"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@workspace/ui/components/breadcrumb"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"
import { TooltipProvider } from "@workspace/ui/components/tooltip"

import { AppSidebar } from "@/components/app-sidebar"
import type { DashboardUser } from "@/lib/session"

/**
 * Route segment → translation key, used to label breadcrumb crumbs for the
 * known `/dashboard/*` pages. Unknown segments fall back to the raw slug.
 */
const SEGMENT_LABELS: Record<string, string> = {
  tasks: "shell.nav.tasks",
  users: "shell.nav.users",
  settings: "shell.nav.settings",
}

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
  const pathname = usePathname()

  // Everything after the leading "dashboard" segment, e.g. ["tasks"].
  const routeSegments = pathname.split("/").filter(Boolean).slice(1)

  const crumbs = [
    {
      href: "/dashboard/tasks",
      label: t("shell.title"),
      isCurrent: routeSegments.length === 0,
    },
    ...routeSegments.map((segment, index) => ({
      href: `/dashboard/${routeSegments.slice(0, index + 1).join("/")}`,
      label: t(SEGMENT_LABELS[segment] ?? segment),
      isCurrent: index === routeSegments.length - 1,
    })),
  ]

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
          <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-muted/90 bg-background px-4">
            <SidebarTrigger
              className="-ml-1"
              label={t("shell.toggleSidebar")}
            />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.map((crumb, index) => (
                  <React.Fragment key={`${crumb.href}-${index}`}>
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {crumb.isCurrent ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink render={<Link href={crumb.href} />}>
                          {crumb.label}
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
