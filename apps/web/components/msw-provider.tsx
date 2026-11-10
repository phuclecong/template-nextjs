"use client"

import { useEffect, useState } from "react"
import { startMockWorker } from "@/utils/msw"

/**
 * Client-only gate that boots the MSW worker before rendering children, so the
 * first client-side data fetch is already intercepted. Imported via
 * `next/dynamic({ ssr: false })` to keep `msw/browser` out of the server
 * bundle. When `mockMode` is false (a real `API_URL` is configured) it renders
 * children immediately without the worker.
 */
export function MswGate({
  mockMode,
  children,
}: {
  mockMode: boolean
  children: React.ReactNode
}) {
  const [ready, setReady] = useState(!mockMode)

  useEffect(() => {
    if (!mockMode) return
    let cancelled = false
    startMockWorker().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [mockMode])

  return ready ? <>{children}</> : null
}
