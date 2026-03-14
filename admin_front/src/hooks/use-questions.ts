import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { questionsService } from '@/services/questions.service'
import type {
  QuestionCreateRequest,
  QuestionUpdateRequest,
  PaginationParams,
} from '@/types/api'

const KEYS = {
  all: ['questions'] as const,
  list: (params?: PaginationParams) => [...KEYS.all, 'list', params] as const,
  detail: (id: number) => [...KEYS.all, 'detail', id] as const,
}

export function useQuestions(params?: PaginationParams) {
  return useQuery({
    queryKey: KEYS.list(params),
    queryFn: () => questionsService.list(params),
  })
}

export function useQuestion(id: number) {
  return useQuery({
    queryKey: KEYS.detail(id),
    queryFn: () => questionsService.get(id),
  })
}

export function useCreateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: QuestionCreateRequest) => questionsService.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useUpdateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuestionUpdateRequest }) =>
      questionsService.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}

export function useDeleteQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => questionsService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.all }),
  })
}
