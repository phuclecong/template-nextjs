"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "react-i18next"
import { useLogout } from "@refinedev/core"
import {
  ChevronRightIcon,
  ClipboardListIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@workspace/ui/components/sidebar"

interface AppSidebarUser {
  name: string
  email: string
  role: "admin" | "member"
}

/**
 * The dashboard navigation. Two collapsible sections — "Manage" (Tasks, Users)
 * and "Preferences" (Settings) — rendered as static links (ADR-0002 keeps the
 * shell hand-rolled rather than Refine resource-driven), with the active item
 * derived from the current route and the User's identity in the footer.
 */
const NAV_SECTIONS = [
  {
    key: "manage",
    labelKey: "shell.section.manage",
    items: [
      {
        key: "tasks",
        labelKey: "shell.nav.tasks",
        url: "/dashboard/tasks",
        icon: ClipboardListIcon,
      },
      {
        key: "users",
        labelKey: "shell.nav.users",
        url: "/dashboard/users",
        icon: UsersIcon,
      },
    ],
  },
  {
    key: "preferences",
    labelKey: "shell.section.preferences",
    items: [
      {
        key: "settings",
        labelKey: "shell.nav.settings",
        url: "/dashboard/settings",
        icon: SettingsIcon,
      },
    ],
  },
]

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: AppSidebarUser }) {
  const { t } = useTranslation()
  const pathname = usePathname()
  const { state } = useSidebar()
  const { mutate: logout, isPending } = useLogout()

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: (result) => {
        window.location.assign(result.redirectTo ?? "/login")
      },
    })
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href="/dashboard/tasks" />}>
              <LayoutDashboardIcon />
              <span className="truncate">{t("shell.title")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {NAV_SECTIONS.map((section) => (
          <Collapsible
            key={section.key}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel
                render={
                  state === "collapsed" ? undefined : <CollapsibleTrigger />
                }
                className="group/label text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                {t(section.labelKey)}{" "}
                <ChevronRightIcon className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.key}>
                        <SidebarMenuButton
                          isActive={pathname === item.url}
                          tooltip={t(item.labelKey)}
                          render={<Link href={item.url} />}
                        >
                          <item.icon />
                          <span>{t(item.labelKey)}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
                <UsersIcon />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start">
                <DropdownMenuLabel className="truncate">
                  {user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled={isPending} onClick={handleLogout}>
                  <LogOutIcon />
                  {t("shell.signOut")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
