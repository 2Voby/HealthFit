import { create } from 'zustand'
import type { FlowResponse } from '@/types/api'
import { flowToGraph } from '../utils/flow-to-graph'
import { useEditorStore } from './editor.store'

interface FlowState {
  activeFlowId: number | null
  selectFlow: (flow: FlowResponse) => void
  setActiveFlowId: (id: number | null) => void
}

export const useFlowStore = create<FlowState>((set) => ({
  activeFlowId: null,

  selectFlow: (flow) => {
    const graph = flowToGraph(flow)
    useEditorStore.getState().loadGraph(graph)
    set({ activeFlowId: flow.id })
  },

  setActiveFlowId: (id) => set({ activeFlowId: id }),
}))
