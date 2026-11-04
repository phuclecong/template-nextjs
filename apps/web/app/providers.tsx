"use client"

import { Refine } from "@refinedev/core"
import routerProvider from "@refinedev/nextjs-router/app"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Suspense, useState } from "react"

import { authProvider } from "@/providers/auth-provider"
import { accessControlProvider } from "@/providers/access-control-provider"
import { auditLogProvider } from "@/providers/audit-log-provider"
import { dataProvider } from "@/providers/data-provider"
import { i18nProvider } from "@/providers/i18n-provider"
import { notificationProvider } from "@/providers/notification-provider"

/**
 * Single Refine backbone (ADR-0002): every cross-cutting provider is wired
 * here — data, auth, access-control, notifications, i18n, and audit-log.
 */
export function Providers({ children }: { children: React.ReactNode }) {
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
          {children}
        </Refine>
      </Suspense>
    </QueryClientProvider>
  )
}
