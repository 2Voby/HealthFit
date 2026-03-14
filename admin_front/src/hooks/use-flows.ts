import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { flowsService } from '@/services/flows.service'
import type { FlowCreateRequest, FlowUpdateRequest, PaginationParams } from '@/types/api'

const ALL_FLOWS = ['flows'] as const

const KEYS = {
  all: ALL_FLOWS,
  list: (params?: PaginationParams) => [...ALL_FLOWS, 'list', params] as const,
  detail: (id: number) => [...ALL_FLOWS, 'detail', id] as const,
  active: [...ALL_FLOWS, 'active'] as const,
  history: (flowId: number, params?: PaginationParams) =>
    [...ALL_FLOWS, 'history', flowId, params] as const,
}

export function useFlows(params?: PaginationParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => flowsService.list(params),
  })
}

export function useFlow(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => flowsService.get(id),
    enabled: id > 0,
  })
}

export function useActiveFlow() {
  return useQuery({
    queryKey: KEYS.active,
    queryFn: () => flowsService.getActive(),
    retry: false,
  })
}

export function useCreateFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: FlowCreateRequest) => flowsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: FlowUpdateRequest }) =>
      flowsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => flowsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useFlowHistory(flowId: number | null, params?: PaginationParams) {
  return useQuery({
    queryKey: KEYS.history(flowId ?? 0, params),
    queryFn: () => flowsService.listHistory(flowId!, params),
    enabled: flowId !== null && flowId > 0,
  })
}

export function useRollbackFlow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ flowId, revision }: { flowId: number; revision: number }) =>
      flowsService.rollback(flowId, revision),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
