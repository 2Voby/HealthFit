import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersService } from '@/services/users.service'
import type {
  UserCreateRequest,
  UserUpdateRequest,
  PaginationParams,
} from '@/types/api'

const KEYS = {
  all: ['users'] as const,
  list: (params?: PaginationParams) => [...KEYS.all, 'list', params] as const,
  detail: (id: number) => [...KEYS.all, 'detail', id] as const,
}

export function useUsers(params?: PaginationParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => usersService.list(params),
  })
}

export function useUser(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => usersService.get(id),
  })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: UserCreateRequest) => usersService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UserUpdateRequest }) =>
      usersService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => usersService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
