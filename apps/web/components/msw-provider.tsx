"use client"

import { useEffect, useState } from "react"
import { startMockWorker } from "@/lib/msw"

/**
 * Client-only gate that boots the MSW worker before rendering children, so the
 * first client-side data fetch is already intercepted. Imported via
 * `next/dynamic({ ssr: false })` to keep `msw/browser` out of the server bundle.
 */
export function MswGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    startMockWorker().then(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return ready ? <>{children}</> : null
}
