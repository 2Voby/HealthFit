import { api } from '@/lib/api'
import { buildPaginationQuery } from '@/lib/query-params'
import type {
  AttributeCreateRequest,
  AttributeResponse,
  AttributesListResponse,
  AttributeUpdateRequest,
  PaginationParams,
} from '@/types/api'

const BASE = '/v1/attributes'

export const attributesService = {
  list(params?: PaginationParams) {
    return api.get<AttributesListResponse>(`${BASE}/${buildPaginationQuery(params)}`)
  },

  get(id: number) {
    return api.get<AttributeResponse>(`${BASE}/${id}`)
  },

  create(data: AttributeCreateRequest) {
    return api.post<AttributeResponse>(`${BASE}/`, data)
  },

  update(id: number, data: AttributeUpdateRequest) {
    return api.patch<AttributeResponse>(`${BASE}/${id}`, data)
  },

  delete(id: number) {
    return api.delete<void>(`${BASE}/${id}`)
  },
}
