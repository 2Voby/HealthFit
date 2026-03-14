import { create } from 'zustand'
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  type Viewport,
} from '@xyflow/react'
import type {
  QuizNode,
  QuizEdge,
  QuizNodeData,
  QuizGraph,
  NodeKind,
  Answer,
  TransitionEdgeData,
} from '../types'
import { NODE_KINDS } from '../constants'
import { generateId } from '../utils/id'
import { hasCycle, applyDagreLayout } from '../utils/dag'

interface EditorState {
  nodes: QuizNode[]
  edges: QuizEdge[]
  viewport: Viewport
  quizId: string | null
  quizName: string
  isDirty: boolean

  onNodesChange: OnNodesChange<QuizNode>
  onEdgesChange: OnEdgesChange<QuizEdge>
  onConnect: OnConnect

  addNode: (kind: NodeKind, position: { x: number; y: number }) => void
  updateNodeData: (nodeId: string, data: Partial<QuizNodeData>) => void
  removeNode: (nodeId: string) => void

  addAnswer: (nodeId: string) => void
  removeAnswer: (nodeId: string, answerId: string) => void
  updateAnswer: (nodeId: string, answerId: string, patch: Partial<Answer>) => void

  updateEdgeData: (edgeId: string, data: Partial<TransitionEdgeData>) => void
  removeEdge: (edgeId: string) => void

  setViewport: (viewport: Viewport) => void
  setQuizName: (name: string) => void

  autoLayout: () => void
  loadGraph: (graph: QuizGraph & { quizId?: string; quizName?: string }) => void
  serializeGraph: () => QuizGraph
}

export const useEditorStore = create<EditorState>((set, get) => ({
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  quizId: null,
  quizName: 'Untitled Quiz',
  isDirty: false,

  onNodesChange: (changes) => {
    // Don't mark dirty for internal ReactFlow events (dimensions, select)
    const userChange = changes.some(
      (c) => c.type === 'position' || c.type === 'remove' || c.type === 'add',
    )
    set((s) => ({
      nodes: applyNodeChanges(changes, s.nodes),
      ...(userChange ? { isDirty: true } : {}),
    }))
  },

  onEdgesChange: (changes) => {
    const userChange = changes.some((c) => c.type === 'remove' || c.type === 'add')
    set((s) => ({
      edges: applyEdgeChanges(changes, s.edges),
      ...(userChange ? { isDirty: true } : {}),
    }))
  },

  onConnect: (connection) => {
    const { edges } = get()
    if (hasCycle(edges, { source: connection.source, target: connection.target })) {
      return // reject cycle
    }
    // Only one outgoing edge per answer handle
    if (connection.sourceHandle) {
      const hasExisting = edges.some(
        (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle,
      )
      if (hasExisting) return
    }
    set((s) => ({
      edges: addEdge(
        { ...connection, type: 'conditional', data: { conditionType: 'always', answerIds: [], priority: 100 } },
        s.edges,
      ),
      isDirty: true,
    }))
  },

  addNode: (kind, position) => {
    const meta = NODE_KINDS.find((nk) => nk.kind === kind)
    if (!meta) return

    // Deep clone defaultData so each node gets unique answer IDs
    const data = JSON.parse(JSON.stringify(meta.defaultData)) as QuizNodeData
    if (data.kind === 'question') {
      data.answers = data.answers.map((a) => ({ ...a, id: generateId() }))
    }

    const node: QuizNode = {
      id: generateId(),
      type: kind,
      position,
      data,
    }

    set((s) => ({ nodes: [...s.nodes, node], isDirty: true }))
  },

  updateNodeData: (nodeId, data) => {
    set((s) => ({
      nodes: s.nodes.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } as QuizNodeData } : n,
      ),
      isDirty: true,
    }))
  },

  removeNode: (nodeId) => {
    set((s) => ({
      nodes: s.nodes.filter((n) => n.id !== nodeId),
      edges: s.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      isDirty: true,
    }))
  },

  addAnswer: (nodeId) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId || n.data.kind !== 'question') return n
        return {
          ...n,
          data: {
            ...n.data,
            answers: [
              ...n.data.answers,
              { id: generateId(), text: `Option ${n.data.answers.length + 1}`, attributes: [] },
            ],
          },
        }
      }),
      isDirty: true,
    }))
  },

  removeAnswer: (nodeId, answerId) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId || n.data.kind !== 'question') return n
        return {
          ...n,
          data: {
            ...n.data,
            answers: n.data.answers.filter((a) => a.id !== answerId),
          },
        }
      }),
      // Remove edges connected to this answer handle
      edges: s.edges.filter((e) => !(e.source === nodeId && e.sourceHandle === answerId)),
      isDirty: true,
    }))
  },

  updateAnswer: (nodeId, answerId, patch) => {
    set((s) => ({
      nodes: s.nodes.map((n) => {
        if (n.id !== nodeId || n.data.kind !== 'question') return n
        return {
          ...n,
          data: {
            ...n.data,
            answers: n.data.answers.map((a) =>
              a.id === answerId ? { ...a, ...patch } : a,
            ),
          },
        }
      }),
      isDirty: true,
    }))
  },

  updateEdgeData: (edgeId, data) => {
    set((s) => ({
      edges: s.edges.map((e) =>
        e.id === edgeId ? { ...e, data: { ...e.data, ...data } as TransitionEdgeData } : e,
      ),
      isDirty: true,
    }))
  },

  removeEdge: (edgeId) => {
    set((s) => ({
      edges: s.edges.filter((e) => e.id !== edgeId),
      isDirty: true,
    }))
  },

  setViewport: (viewport) => set({ viewport }),

  setQuizName: (name) => set({ quizName: name, isDirty: true }),

  autoLayout: () => {
    const { nodes, edges } = get()
    const layouted = applyDagreLayout(nodes, edges)
    set({ nodes: layouted, isDirty: true })
  },

  loadGraph: (graph) => {
    set({
      nodes: graph.nodes,
      edges: graph.edges,
      viewport: graph.viewport,
      quizId: graph.quizId ?? null,
      quizName: graph.quizName ?? 'Untitled Quiz',
      isDirty: false,
    })
  },

  serializeGraph: () => {
    const { nodes, edges, viewport } = get()
    return {
      nodes: nodes.map(({ id, type, position, data }) => ({
        id,
        type,
        position,
        data,
      })) as QuizNode[],
      edges: edges.map(({ id, source, sourceHandle, target, targetHandle, type, data }) => ({
        id,
        source,
        sourceHandle,
        target,
        targetHandle,
        type,
        data,
      })) as QuizEdge[],
      viewport,
    }
  },
}))
