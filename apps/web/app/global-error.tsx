"use client"

import { useEffect } from "react"

/**
 * Root-level error boundary. Replaces the root layout when it (or a provider
 * above the segment boundaries) crashes, so it must supply its own <html> and
 * <body>. It cannot rely on the Refine/i18n providers, hence hard-coded copy.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100svh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxWidth: "24rem",
              fontFamily: "system-ui, sans-serif",
              fontSize: "0.875rem",
            }}
          >
            <h1 style={{ fontSize: "1.125rem", fontWeight: 500 }}>
              Something went wrong
            </h1>
            <p style={{ color: "oklch(0.45 0.02 260)" }}>
              An unexpected error occurred. Please try again.
            </p>
            <div>
              <button
                type="button"
                onClick={() => unstable_retry()}
                style={{
                  cursor: "pointer",
                  border: "1px solid currentColor",
                  background: "transparent",
                  padding: "0.375rem 0.625rem",
                  fontSize: "0.75rem",
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </main>
      </body>
    </html>
  )
}
