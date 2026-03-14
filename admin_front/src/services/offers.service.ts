import { api } from '@/lib/api'
import { buildPaginationQuery } from '@/lib/query-params'
import type {
  OfferCreateRequest,
  OfferResponse,
  OffersListResponse,
  OfferUpdateRequest,
  OfferSelectionRequest,
  OfferSelectionResponse,
  PaginationParams,
} from '@/types/api'

const BASE = '/v1/offers'

export const offersService = {
  list(params?: PaginationParams) {
    return api.get<OffersListResponse>(`${BASE}/${buildPaginationQuery(params)}`)
  },

  get(id: number) {
    return api.get<OfferResponse>(`${BASE}/${id}`)
  },

  create(data: OfferCreateRequest) {
    return api.post<OfferResponse>(`${BASE}/`, data)
  },

  update(id: number, data: OfferUpdateRequest) {
    return api.patch<OfferResponse>(`${BASE}/${id}`, data)
  },

  delete(id: number) {
    return api.delete<void>(`${BASE}/${id}`)
  },

  select(data: OfferSelectionRequest) {
    return api.post<OfferSelectionResponse>(`${BASE}/selection`, data)
  },
}
