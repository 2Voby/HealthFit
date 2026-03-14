import { api } from '@/lib/api'
import type { LoginRequest, RegisterRequest, UserResponse } from '@/types/api'

const BASE = '/v1/auth'

export const authService = {
  register(data: RegisterRequest) {
    return api.post<UserResponse>(`${BASE}/register`, data)
  },

  login(data: LoginRequest) {
    return api.post<UserResponse>(`${BASE}/login`, data)
  },

  logout() {
    return api.post<void>(`${BASE}/logout`)
  },

  me() {
    return api.get<UserResponse>(`${BASE}/me`)
  },
}
