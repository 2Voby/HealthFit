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

  selectFlow: (flowId: number) => void
  getActiveFlow: () => FlowResponse | undefined
  rollbackToRevision: (flowId: number, revision: number) => void
}

export const useFlowStore = create<FlowState>((set, get) => ({
  flows: [...MOCK_FLOWS],
  activeFlowId: null,
  history: { ...MOCK_FLOW_HISTORY },

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

    // Reload the flow with snapshot data
    const flow = get().flows.find((f) => f.id === flowId)
    if (flow) {
      const graph = flowToGraph(flow)
      useEditorStore.getState().loadGraph(graph)
    }
  },
}))
