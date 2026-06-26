/** Normalize prospect list responses from /prospects and /search/prospects */
export function parseProspectListResponse(res: unknown): {
  rows: Record<string, unknown>[]
  total: number
} {
  const body = res as {
    data?: unknown
    prospects?: unknown[]
    pagination?: { total?: number }
  }

  let rows: unknown[] = []
  if (Array.isArray(body?.data)) {
    rows = body.data
  } else if (body?.data && typeof body.data === "object") {
    const nested = body.data as { data?: unknown[]; prospects?: unknown[] }
    rows = nested.prospects ?? nested.data ?? []
  } else if (Array.isArray(body?.prospects)) {
    rows = body.prospects
  }

  const total = body?.pagination?.total ?? rows.length
  return { rows: rows as Record<string, unknown>[], total }
}
