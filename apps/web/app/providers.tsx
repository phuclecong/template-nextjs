"use client"

import { Refine } from "@refinedev/core"
import routerProvider from "@refinedev/nextjs-router/app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import dynamic from "next/dynamic"
import { Suspense, useState } from "react"
import { Toaster } from "sonner"

import { authProvider } from "@/providers/auth-provider"
import { accessControlProvider } from "@/providers/access-control-provider"
import { auditLogProvider } from "@/providers/audit-log-provider"
import { dataProvider } from "@/providers/data-provider"
import { i18nProvider } from "@/providers/i18n-provider"
import { notificationProvider } from "@/providers/notification-provider"

// Client-only gate that boots the MSW worker before children render, so the
// first data fetch is already intercepted (and `msw/browser` stays out of the
// server bundle).
const MswGate = dynamic(
  () => import("@/components/msw-provider").then((mod) => mod.MswGate),
  { ssr: false }
)

/**
 * Single Refine backbone (ADR-0002): every cross-cutting provider is wired
 * here — data, auth, access-control, notifications, i18n, and audit-log.
 */
export function Providers({
  mockMode,
  children,
}: {
  mockMode: boolean
  children: React.ReactNode
}) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={null}>
        <Refine
          routerProvider={routerProvider}
          dataProvider={dataProvider}
          authProvider={authProvider}
          accessControlProvider={accessControlProvider}
          notificationProvider={notificationProvider}
          i18nProvider={i18nProvider}
          auditLogProvider={auditLogProvider}
          options={{ syncWithLocation: true, disableTelemetry: true }}
        >
          <MswGate mockMode={mockMode}>{children}</MswGate>
        </Refine>
      </Suspense>
      <Toaster position="bottom-right" richColors />
    </QueryClientProvider>
  )
}
