"use client"

import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@workspace/ui/components/button"

/**
 * Route-segment error boundary (Next.js `error.tsx`). Catches render errors
 * thrown below the root layout and shows a graceful fallback with a retry,
 * instead of unmounting the whole tree. It renders inside the Refine/i18n
 * providers, so it can translate its copy.
 */
export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const { t } = useTranslation()

  useEffect(() => {
    // Log to an error-reporting service; `digest` links to server logs.
    console.error(error)
  }, [error])

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col gap-4 text-sm">
        <h1 className="text-lg font-medium">{t("error.title")}</h1>
        <p className="text-muted-foreground">{t("error.body")}</p>
        <div>
          <Button type="button" onClick={() => unstable_retry()}>
            {t("error.retry")}
          </Button>
        </div>
      </div>
    </main>
  )
}
