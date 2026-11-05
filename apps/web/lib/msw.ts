import { setupWorker } from "msw/browser"
import { dataHandlers } from "@workspace/api/data-handlers"
import { resetDb } from "@workspace/api/collections"

/**
 * Boots the in-browser MSW worker that serves the mock API for client-side
 * data fetching (ADR-0001, ADR-0005). Seeded once; repeated calls return the
 * same promise so StrictMode double-effects don't re-register the worker.
 */
let workerPromise: Promise<void> | null = null

export function startMockWorker(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (!workerPromise) {
    workerPromise = (async () => {
      await resetDb()
      const worker = setupWorker(...dataHandlers)
      await worker.start({ onUnhandledFrame: "bypass" })
    })()
  }
  return workerPromise
}
