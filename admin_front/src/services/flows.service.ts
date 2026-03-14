import { api } from '@/lib/api'
import { buildPaginationQuery } from '@/lib/query-params'
import type {
  FlowCreateRequest,
  FlowResponse,
  FlowsListResponse,
  FlowUpdateRequest,
  FlowHistoryListResponse,
  FlowHistoryEntryResponse,
  PaginationParams,
} from '@/types/api'

const BASE = '/v1/flows'

export const flowsService = {
  list(params?: PaginationParams) {
    return api.get<FlowsListResponse>(`${BASE}/${buildPaginationQuery(params)}`)
  },

  get(id: number) {
    return api.get<FlowResponse>(`${BASE}/${id}`)
  },

  getActive() {
    return api.get<FlowResponse>(`${BASE}/active`)
  },

  create(data: FlowCreateRequest) {
    return api.post<FlowResponse>(`${BASE}/`, data)
  },

  update(id: number, data: FlowUpdateRequest) {
    return api.patch<FlowResponse>(`${BASE}/${id}`, data)
  },

  delete(id: number) {
    return api.delete<void>(`${BASE}/${id}`)
  },

  listHistory(flowId: number, params?: PaginationParams) {
    return api.get<FlowHistoryListResponse>(
      `${BASE}/${flowId}/history${buildPaginationQuery(params)}`,
    )
  },

  getHistoryEntry(flowId: number, revision: number) {
    return api.get<FlowHistoryEntryResponse>(`${BASE}/${flowId}/history/${revision}`)
  },

  rollback(flowId: number, revision: number) {
    return api.post<FlowResponse>(`${BASE}/${flowId}/rollback/${revision}`)
  },
}
