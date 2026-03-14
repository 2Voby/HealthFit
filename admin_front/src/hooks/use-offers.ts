import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { offersService } from '@/services/offers.service'
import type {
  OfferCreateRequest,
  OfferUpdateRequest,
  OfferSelectionRequest,
  PaginationParams,
} from '@/types/api'

const KEYS = {
  all: ['offers'] as const,
  list: (params?: PaginationParams) => [...KEYS.all, 'list', params] as const,
  detail: (id: number) => [...KEYS.all, 'detail', id] as const,
}

export function useOffers(params?: PaginationParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => offersService.list(params),
  })
}

export function useOffer(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => offersService.get(id),
  })
}

export function useCreateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: OfferCreateRequest) => offersService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: OfferUpdateRequest }) =>
      offersService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteOffer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => offersService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useSelectOffers() {
  return useMutation({
    mutationFn: (data: OfferSelectionRequest) => offersService.select(data),
  })
}
