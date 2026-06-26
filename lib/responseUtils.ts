export const API_UNAVAILABLE_MSG =
  "Unable to connect to the server. Please try again or contact support."

export const ENRICHMENT_NETWORK_ERROR_MSG =
  "Enrichment failed — Unable to connect to server. Please try again."

/** True when a fetch/API call failed due to connectivity, not an HTTP error body */
export function isNetworkError(err: unknown): boolean {
  const parts: string[] = []
  if (err instanceof Error) parts.push(err.message)
  if (err && typeof err === "object") {
    const e = err as { message?: string; code?: string; data?: { message?: string } }
    if (e.code) parts.push(e.code)
    if (e.data?.message) parts.push(e.data.message)
  }
  const lower = parts.join(" ").toLowerCase()
  return (
    lower.includes("fetch failed") ||
    lower.includes("cannot reach") ||
    lower.includes("cannot connect") ||
    lower.includes("networkerror") ||
    lower.includes("failed to fetch") ||
    lower.includes("econnrefused") ||
    lower.includes("unable to connect") ||
    lower.includes("network request failed")
  )
}

/** User-facing enrichment error — friendly text for network failures */
export function formatEnrichmentError(
  err: unknown,
  fallback = "Enrichment failed. Please try again."
): string {
  if (isNetworkError(err)) return ENRICHMENT_NETWORK_ERROR_MSG
  const e = err as { data?: { message?: string }; message?: string } | undefined
  const msg = e?.data?.message || e?.message
  if (msg && !isNetworkError({ message: msg })) {
    return msg.startsWith("Enrichment failed") ? msg : `Enrichment failed — ${msg}`
  }
  return fallback.startsWith("Enrichment failed") ? fallback : `Enrichment failed — ${fallback}`
}

export interface ParsedResponseBody {
  data: unknown
  text: string
  isJson: boolean
}

/** Read response as text first, then parse JSON when possible */
export async function readResponseBody(res: Response): Promise<ParsedResponseBody> {
  const text = await res.text()
  const trimmed = text.trim()

  if (!trimmed) {
    return { data: null, text: "", isJson: false }
  }

  try {
    return { data: JSON.parse(trimmed), text: trimmed, isJson: true }
  } catch {
    return { data: null, text: trimmed, isJson: false }
  }
}

/** Pull a human-readable message from JSON or plain-text error bodies */
export function extractErrorMessage(
  res: Response,
  body: ParsedResponseBody,
  fallback?: string
): string {
  if (body.isJson && body.data !== null && typeof body.data === "object") {
    const payload = body.data as {
      message?: string
      error?: string
      errors?: Array<{ message?: string; msg?: string }>
    }

    if (payload.message) return payload.message
    if (payload.error) return payload.error

    const firstFieldError = payload.errors?.[0]
    if (firstFieldError?.message) return firstFieldError.message
    if (firstFieldError?.msg) return firstFieldError.msg
  }

  if (body.text) {
    const lower = body.text.toLowerCase()
    if (
      lower.includes("internal server") ||
      lower.includes("econnrefused") ||
      lower.includes("bad gateway") ||
      lower.includes("service unavailable")
    ) {
      return API_UNAVAILABLE_MSG
    }

    const plain = body.text
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()

    if (plain.length > 0 && plain.length <= 500) {
      return plain
    }
  }

  return fallback ?? `Request failed (${res.status})`
}

/** Parse JSON body; throws with the real error message when body is not JSON */
export async function parseFetchJson<T = unknown>(res: Response): Promise<T> {
  const body = await readResponseBody(res)

  if (body.isJson && body.data !== null) {
    return body.data as T
  }

  throw new Error(extractErrorMessage(res, body))
}

/** Parse JSON API response; throws with backend message when !res.ok */
export async function parseApiResponse<T = unknown>(res: Response): Promise<T> {
  const body = await readResponseBody(res)

  // 304 Not Modified has an empty body — treat as retryable, not "server down"
  if (res.status === 304) {
    throw new Error("Cached response not usable (304). Retry the request.")
  }

  if (!body.isJson || body.data === null) {
    throw new Error(extractErrorMessage(res, body, `Request failed (${res.status})`))
  }

  if (!res.ok) {
    throw new Error(extractErrorMessage(res, body, `Request failed (${res.status})`))
  }

  return body.data as T
}
