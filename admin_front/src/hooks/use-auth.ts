import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import type { LoginRequest, RegisterRequest } from '@/types/api'

const KEYS = {
  me: ['auth', 'me'] as const,
}

export function useMe() {
  return useQuery({
    queryKey: KEYS.me,
    queryFn: () => authService.me(),
    retry: false,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.me }),
  })
}

export function useRegister() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.me }),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.me }),
  })
}
