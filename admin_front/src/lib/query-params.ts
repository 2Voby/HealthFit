import type { PaginationParams } from '@/types/api'

export function buildPaginationQuery(params?: PaginationParams): string {
  if (!params) return ''
  const sp = new URLSearchParams()
  if (params.offset != null) sp.set('offset', String(params.offset))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const str = sp.toString()
  return str ? `?${str}` : ''
}
