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
  if (Array.isArray(res)) {
    rows = res
  } else if (Array.isArray(body?.data)) {
    rows = body.data
  } else if (body?.data && typeof body.data === "object") {
    const nested = body.data as { data?: unknown[]; prospects?: unknown[] }
    const nestedRows = nested.prospects ?? nested.data ?? []
    rows = Array.isArray(nestedRows) ? nestedRows : Object.values(nestedRows)
  } else if (Array.isArray(body?.prospects)) {
    rows = body.prospects
  } else if (body?.prospects && typeof body.prospects === "object") {
    rows = Object.values(body.prospects)
  }

  const total = body?.pagination?.total ?? rows.length
  return { rows: rows as Record<string, unknown>[], total }
}

/** Coerce array-like values (incl. qs object {0:id,1:id}) into string[] */
export function normalizeIdList(value: unknown): string[] {
  if (value == null) return []
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === "object") return Object.values(value).map(String).filter(Boolean)
  if (typeof value === "string") {
    if (value.includes(",")) {
      return value.split(",").map((s) => s.trim()).filter(Boolean)
    }
    return value.trim() ? [value.trim()] : []
  }
  return []
}

/** Extract _id from prospect rows or id strings */
export function extractProspectIds(value: unknown): string[] {
  const list = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? Object.values(value)
      : []

  return list
    .map((item) => {
      if (typeof item === "string") return item
      if (item && typeof item === "object" && "_id" in item) {
        return String((item as { _id: unknown })._id)
      }
      return ""
    })
    .filter(Boolean)
}

const PROSPECT_ID_BATCH_SIZE = 50

/** Fetch prospects by id in batches (comma-separated ids avoids qs array→object bug) */
export async function fetchProspectsByIds(
  ids: unknown,
  apiGet: (url: string) => Promise<unknown>,
  batchSize = PROSPECT_ID_BATCH_SIZE
): Promise<Record<string, unknown>[]> {
  const unique = [...new Set(normalizeIdList(ids))]
  if (!unique.length) return []

  const allRows: Record<string, unknown>[] = []
  for (let i = 0; i < unique.length; i += batchSize) {
    const chunk = unique.slice(i, i + batchSize)
    const params = new URLSearchParams()
    params.set("ids", chunk.join(","))
    params.set("limit", String(chunk.length))
    const res = await apiGet(`/prospects?${params.toString()}`)
    const { rows } = parseProspectListResponse(res)
    allRows.push(...rows)
  }
  return allRows
}
