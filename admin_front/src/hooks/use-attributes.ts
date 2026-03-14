import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { attributesService } from '@/services/attributes.service'
import type {
  AttributeCreateRequest,
  AttributeUpdateRequest,
  PaginationParams,
} from '@/types/api'

const KEYS = {
  all: ['attributes'] as const,
  list: (params?: PaginationParams) => [...KEYS.all, 'list', params] as const,
  detail: (id: number) => [...KEYS.all, 'detail', id] as const,
}

export function useAttributes(params?: PaginationParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => attributesService.list(params),
  })
}

export function useAttribute(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => attributesService.get(id),
  })
}

export function useCreateAttribute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AttributeCreateRequest) => attributesService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateAttribute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AttributeUpdateRequest }) =>
      attributesService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteAttribute() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => attributesService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
