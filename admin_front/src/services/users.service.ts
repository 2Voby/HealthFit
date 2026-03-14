import { api } from '@/lib/api'
import { buildPaginationQuery } from '@/lib/query-params'
import type {
  UserCreateRequest,
  UserResponse,
  UsersListResponse,
  UserUpdateRequest,
  PaginationParams,
} from '@/types/api'

const BASE = '/v1/users'

export const usersService = {
  list(params?: PaginationParams) {
    return api.get<UsersListResponse>(`${BASE}/${buildPaginationQuery(params)}`)
  },

  get(id: number) {
    return api.get<UserResponse>(`${BASE}/${id}`)
  },

  create(data: UserCreateRequest) {
    return api.post<UserResponse>(`${BASE}/`, data)
  },

  update(id: number, data: UserUpdateRequest) {
    return api.patch<UserResponse>(`${BASE}/${id}`, data)
  },

  delete(id: number) {
    return api.delete<void>(`${BASE}/${id}`)
  },
}
