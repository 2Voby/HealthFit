import { useRef, useCallback } from 'react'
import { questionsService } from '@/services/questions.service'
import { mapQuestionTypeToApi } from '../utils/graph-to-flow'
import { useEditorStore } from '../store/editor.store'
import type { QuestionUpdateRequest, QuestionAnswerCreateRequest } from '@/types/api'

const DEBOUNCE_MS = 800
const pendingTimers = new Map<number, ReturnType<typeof setTimeout>>()

function saveQuestion(backendId: number) {
  const node = useEditorStore.getState().nodes.find(
    (n) => n.data.kind === 'question' && n.data.backendQuestionId === backendId,
  )
  if (!node || node.data.kind !== 'question') return

  const answers: QuestionAnswerCreateRequest[] = node.data.answers.map((a) => ({
    text: a.text,
    attributes: a.attributes,
  }))
  const update: QuestionUpdateRequest = {
    text: node.data.text,
    type: mapQuestionTypeToApi(node.data.questionType) as QuestionUpdateRequest['type'],
    requires: node.data.requires,
    answers,
  }
  questionsService.update(backendId, update).catch(() => {
    // silent — next edit will retry
  })
}

function saveInfoPage(backendId: number) {
  const node = useEditorStore.getState().nodes.find(
    (n) => n.data.kind === 'info_page' && n.data.backendQuestionId === backendId,
  )
  if (!node || node.data.kind !== 'info_page') return

  const update: QuestionUpdateRequest = {
    text: node.data.title,
    type: 'text',
  }
  questionsService.update(backendId, update).catch(() => {})
}

export function useDebouncedSaveQuestion() {
  return useCallback((backendId: number | undefined) => {
    if (!backendId) return
    const existing = pendingTimers.get(backendId)
    if (existing) clearTimeout(existing)
    pendingTimers.set(
      backendId,
      setTimeout(() => {
        pendingTimers.delete(backendId)
        saveQuestion(backendId)
      }, DEBOUNCE_MS),
    )
  }, [])
}

export function useDebouncedSaveInfoPage() {
  return useCallback((backendId: number | undefined) => {
    if (!backendId) return
    const existing = pendingTimers.get(backendId)
    if (existing) clearTimeout(existing)
    pendingTimers.set(
      backendId,
      setTimeout(() => {
        pendingTimers.delete(backendId)
        saveInfoPage(backendId)
      }, DEBOUNCE_MS),
    )
  }, [])
}

/** Flush: immediately save a question (e.g. on blur) */
export function flushSaveQuestion(backendId: number | undefined) {
  if (!backendId) return
  const existing = pendingTimers.get(backendId)
  if (existing) {
    clearTimeout(existing)
    pendingTimers.delete(backendId)
  }
  saveQuestion(backendId)
}

export function flushSaveInfoPage(backendId: number | undefined) {
  if (!backendId) return
  const existing = pendingTimers.get(backendId)
  if (existing) {
    clearTimeout(existing)
    pendingTimers.delete(backendId)
  }
  saveInfoPage(backendId)
}
