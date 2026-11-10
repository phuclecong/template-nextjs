/**
 * Extracts a human-readable message from a simple-rest/axios error. The mock
 * API rejects with a `{ code, message }` body, which axios surfaces on
 * `error.response.data`; the simple-rest provider's own interceptor also copies
 * it onto `error.message` for its default client. Handles both shapes.
 */
export function describeError(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined
  const candidate = error as {
    message?: unknown
    response?: { data?: { message?: unknown } }
  }
  const apiMessage = candidate.response?.data?.message
  if (typeof apiMessage === "string" && apiMessage) return apiMessage
  if (typeof candidate.message === "string" && candidate.message) {
    return candidate.message
  }
  return undefined
}
