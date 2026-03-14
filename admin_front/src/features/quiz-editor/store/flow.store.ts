import { create } from 'zustand'
import type { FlowResponse, FlowHistoryEntryResponse } from '@/types/api'
import { MOCK_FLOWS } from '../mocks/flows'
import { MOCK_FLOW_HISTORY } from '../mocks/flow-history'
import { flowToGraph } from '../utils/flow-to-graph'
import { useEditorStore } from './editor.store'

interface FlowState {
  flows: FlowResponse[]
  activeFlowId: number | null
  history: Record<number, FlowHistoryEntryResponse[]>
  nextFlowId: number

  selectFlow: (flowId: number) => void
  getActiveFlow: () => FlowResponse | undefined
  rollbackToRevision: (flowId: number, revision: number) => void
  createFlow: (name: string) => void
  renameFlow: (flowId: number, name: string) => void
  deleteFlow: (flowId: number) => void
  duplicateFlow: (flowId: number) => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [...MOCK_FLOWS],
  activeFlowId: null,
  history: { ...MOCK_FLOW_HISTORY },
  nextFlowId: Math.max(...MOCK_FLOWS.map((f) => f.id)) + 1,

  selectFlow: (flowId) => {
    const flow = get().flows.find((f) => f.id === flowId)
    if (!flow) return

    const graph = flowToGraph(flow)
    useEditorStore.getState().loadGraph(graph)
    set({ activeFlowId: flowId })
  },

  getActiveFlow: () => {
    const { flows, activeFlowId } = get()
    return flows.find((f) => f.id === activeFlowId)
  },

  rollbackToRevision: (flowId, revision) => {
    const { history } = get()
    const flowHistory = history[flowId]
    if (!flowHistory) return

    const entry = flowHistory.find((h) => h.revision === revision)
    if (!entry) return

    const latestRevision = Math.max(...flowHistory.map((h) => h.revision))
    const newRevision = latestRevision + 1

    const rollbackEntry: FlowHistoryEntryResponse = {
      id: Date.now(),
      flow_id: flowId,
      revision: newRevision,
      action: 'rollback',
      source_revision: revision,
      changed_by_user_id: 1,
      snapshot: { ...entry.snapshot },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    set((s) => ({
      history: {
        ...s.history,
        [flowId]: [...(s.history[flowId] ?? []), rollbackEntry],
      },
    }))

    const flow = get().flows.find((f) => f.id === flowId)
    if (flow) {
      const graph = flowToGraph(flow)
      useEditorStore.getState().loadGraph(graph)
    }
  },

  createFlow: (name) => {
    const ts = new Date().toISOString()
    const { nextFlowId } = get()

    const newFlow: FlowResponse = {
      id: nextFlowId,
      name,
      is_active: false,
      start_question_id: null,
      questions: [],
      transitions: [],
      created_at: ts,
      updated_at: ts,
    }

    const historyEntry: FlowHistoryEntryResponse = {
      id: Date.now(),
      flow_id: nextFlowId,
      revision: 1,
      action: 'create',
      source_revision: null,
      changed_by_user_id: 1,
      snapshot: { name, is_active: false, question_ids: [], transitions: [] },
      created_at: ts,
      updated_at: ts,
    }

    set((s) => ({
      flows: [...s.flows, newFlow],
      nextFlowId: s.nextFlowId + 1,
      history: { ...s.history, [nextFlowId]: [historyEntry] },
    }))

    // Auto-select the new flow
    get().selectFlow(nextFlowId)
  },

  renameFlow: (flowId, name) => {
    set((s) => ({
      flows: s.flows.map((f) =>
        f.id === flowId ? { ...f, name, updated_at: new Date().toISOString() } : f,
      ),
    }))
  },

  deleteFlow: (flowId) => {
    const { flows, activeFlowId } = get()
    if (flows.length <= 1) return // don't delete last flow

    const remaining = flows.filter((f) => f.id !== flowId)

    set((s) => {
      const newHistory = { ...s.history }
      delete newHistory[flowId]
      return { flows: remaining, history: newHistory }
    })

    // If deleted flow was active, select another
    if (activeFlowId === flowId && remaining.length > 0) {
      get().selectFlow(remaining[0].id)
    }
  },

  duplicateFlow: (flowId) => {
    const flow = get().flows.find((f) => f.id === flowId)
    if (!flow) return

    const ts = new Date().toISOString()
    const { nextFlowId } = get()

    const newFlow: FlowResponse = {
      ...flow,
      id: nextFlowId,
      name: `${flow.name} (copy)`,
      is_active: false,
      created_at: ts,
      updated_at: ts,
    }

    const historyEntry: FlowHistoryEntryResponse = {
      id: Date.now(),
      flow_id: nextFlowId,
      revision: 1,
      action: 'create',
      source_revision: null,
      changed_by_user_id: 1,
      snapshot: {
        name: newFlow.name,
        is_active: false,
        question_ids: flow.questions.map((q) => q.question_id),
        transitions: flow.transitions.map((t) => ({
          from_question_id: t.from_question_id,
          to_question_id: t.to_question_id,
          condition_type: t.condition_type,
          answer_ids: t.answer_ids,
          priority: t.priority,
        })),
      },
      created_at: ts,
      updated_at: ts,
    }

    set((s) => ({
      flows: [...s.flows, newFlow],
      nextFlowId: s.nextFlowId + 1,
      history: { ...s.history, [nextFlowId]: [historyEntry] },
    }))

    get().selectFlow(nextFlowId)
  },
}))
