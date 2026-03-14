import { api } from '@/lib/api'
import { buildPaginationQuery } from '@/lib/query-params'
import type {
  QuestionCreateRequest,
  QuestionResponse,
  QuestionsListResponse,
  QuestionUpdateRequest,
  PaginationParams,
} from '@/types/api'

const BASE = '/v1/questions'

export const questionsService = {
  list(params?: PaginationParams) {
    return api.get<QuestionsListResponse>(`${BASE}/${buildPaginationQuery(params)}`)
  },

  get(id: number) {
    return api.get<QuestionResponse>(`${BASE}/${id}`)
  },

  create(data: QuestionCreateRequest) {
    return api.post<QuestionResponse>(`${BASE}/`, data)
  },

  update(id: number, data: QuestionUpdateRequest) {
    return api.patch<QuestionResponse>(`${BASE}/${id}`, data)
  },

  delete(id: number) {
    return api.delete<void>(`${BASE}/${id}`)
  },
}
