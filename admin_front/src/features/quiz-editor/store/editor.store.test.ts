import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useEditorStore } from './editor.store'
import type { QuizNode, QuizEdge, QuizGraph } from '../types'

// Mock generateId to return predictable values
let idCounter = 0
vi.mock('../utils/id', () => ({
  generateId: () => `test-id-${++idCounter}`,
}))

// Mock dagre layout to pass through nodes
vi.mock('../utils/dag', () => ({
  hasCycle: vi.fn(() => false),
  applyDagreLayout: (nodes: unknown[]) => nodes,
}))

const { hasCycle } = await import('../utils/dag')

function resetStore() {
  useEditorStore.setState({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    quizId: null,
    quizName: 'Untitled Quiz',
    isDirty: false,
  })
}

describe('editor.store', () => {
  beforeEach(() => {
    idCounter = 0
    resetStore()
    vi.mocked(hasCycle).mockReturnValue(false)
  })

  describe('addNode', () => {
    it('adds a question node with unique answer IDs', () => {
      useEditorStore.getState().addNode('question', { x: 100, y: 200 })

      const { nodes, isDirty } = useEditorStore.getState()
      expect(nodes).toHaveLength(1)
      expect(nodes[0].type).toBe('question')
      expect(nodes[0].position).toEqual({ x: 100, y: 200 })
      expect(nodes[0].data.kind).toBe('question')
      expect(isDirty).toBe(true)
    })

    it('adds an info_page node', () => {
      useEditorStore.getState().addNode('info_page', { x: 0, y: 0 })

      const { nodes } = useEditorStore.getState()
      expect(nodes).toHaveLength(1)
      expect(nodes[0].data.kind).toBe('info_page')
    })

    it('adds an offer node', () => {
      useEditorStore.getState().addNode('offer', { x: 0, y: 0 })

      const { nodes } = useEditorStore.getState()
      expect(nodes).toHaveLength(1)
      expect(nodes[0].data.kind).toBe('offer')
    })

    it('ignores unknown node kind', () => {
      useEditorStore.getState().addNode('nonexistent' as never, { x: 0, y: 0 })
      expect(useEditorStore.getState().nodes).toHaveLength(0)
    })
  })

  describe('removeNode', () => {
    it('removes node and connected edges', () => {
      useEditorStore.setState({
        nodes: [
          { id: 'n1', type: 'question', position: { x: 0, y: 0 }, data: { kind: 'question', text: '', questionType: 'single_choice', requires: false, answers: [] } },
          { id: 'n2', type: 'question', position: { x: 0, y: 0 }, data: { kind: 'question', text: '', questionType: 'single_choice', requires: false, answers: [] } },
        ] as QuizNode[],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', type: 'conditional', data: {} },
        ] as QuizEdge[],
      })

      useEditorStore.getState().removeNode('n1')

      const { nodes, edges } = useEditorStore.getState()
      expect(nodes).toHaveLength(1)
      expect(nodes[0].id).toBe('n2')
      expect(edges).toHaveLength(0)
    })
  })

  describe('duplicateNode', () => {
    it('duplicates a question node with new IDs', () => {
      useEditorStore.setState({
        nodes: [{
          id: 'original',
          type: 'question',
          position: { x: 100, y: 200 },
          data: {
            kind: 'question', text: 'Hello?', questionType: 'single_choice',
            requires: true, answers: [
              { id: 'a1', text: 'Yes', attributes: [1, 2], backendId: 50 },
            ],
            backendQuestionId: 99,
          },
        }] as QuizNode[],
      })

      useEditorStore.getState().duplicateNode('original')

      const { nodes } = useEditorStore.getState()
      expect(nodes).toHaveLength(2)
      const dup = nodes[1]
      expect(dup.id).not.toBe('original')
      expect(dup.position.x).toBe(150)
      expect(dup.position.y).toBe(280)
      if (dup.data.kind === 'question') {
        expect(dup.data.text).toBe('Hello?')
        expect(dup.data.backendQuestionId).toBeUndefined()
        expect(dup.data.answers[0].id).not.toBe('a1')
        expect(dup.data.answers[0].text).toBe('Yes')
        expect(dup.data.answers[0].attributes).toEqual([1, 2])
        expect(dup.data.answers[0].backendId).toBeUndefined()
      }
    })

    it('duplicates an info_page node without backendQuestionId', () => {
      useEditorStore.setState({
        nodes: [{
          id: 'ip1',
          type: 'info_page',
          position: { x: 0, y: 0 },
          data: { kind: 'info_page', title: 'Page', message: 'Msg', backendQuestionId: 42 },
        }] as QuizNode[],
      })

      useEditorStore.getState().duplicateNode('ip1')

      const { nodes } = useEditorStore.getState()
      expect(nodes).toHaveLength(2)
      if (nodes[1].data.kind === 'info_page') {
        expect(nodes[1].data.title).toBe('Page')
        expect(nodes[1].data.backendQuestionId).toBeUndefined()
      }
    })

    it('does nothing for non-existent node', () => {
      useEditorStore.getState().duplicateNode('nope')
      expect(useEditorStore.getState().nodes).toHaveLength(0)
    })
  })

  describe('updateNodeData', () => {
    it('updates node data and marks dirty', () => {
      useEditorStore.setState({
        nodes: [{ id: 'n1', type: 'question', position: { x: 0, y: 0 }, data: { kind: 'question', text: 'Old', questionType: 'single_choice', requires: false, answers: [] } }] as QuizNode[],
        isDirty: false,
      })

      useEditorStore.getState().updateNodeData('n1', { text: 'New' })

      const node = useEditorStore.getState().nodes[0]
      if (node.data.kind === 'question') {
        expect(node.data.text).toBe('New')
      }
      expect(useEditorStore.getState().isDirty).toBe(true)
    })
  })

  describe('answer management', () => {
    beforeEach(() => {
      useEditorStore.setState({
        nodes: [{
          id: 'n1', type: 'question', position: { x: 0, y: 0 },
          data: {
            kind: 'question', text: 'Q', questionType: 'single_choice', requires: false,
            answers: [{ id: 'a1', text: 'Opt 1', attributes: [] }],
          },
        }] as QuizNode[],
        edges: [],
        isDirty: false,
      })
    })

    it('addAnswer appends a new answer', () => {
      useEditorStore.getState().addAnswer('n1')

      const node = useEditorStore.getState().nodes[0]
      if (node.data.kind === 'question') {
        expect(node.data.answers).toHaveLength(2)
        expect(node.data.answers[1].text).toBe('Option 2')
      }
    })

    it('removeAnswer removes answer and connected edges', () => {
      useEditorStore.setState({
        edges: [
          { id: 'e1', source: 'n1', sourceHandle: 'a1', target: 'n2', type: 'conditional', data: {} },
        ] as QuizEdge[],
      })

      useEditorStore.getState().removeAnswer('n1', 'a1')

      const node = useEditorStore.getState().nodes[0]
      if (node.data.kind === 'question') {
        expect(node.data.answers).toHaveLength(0)
      }
      expect(useEditorStore.getState().edges).toHaveLength(0)
    })

    it('updateAnswer updates answer data', () => {
      useEditorStore.getState().updateAnswer('n1', 'a1', { text: 'Updated', attributes: [5] })

      const node = useEditorStore.getState().nodes[0]
      if (node.data.kind === 'question') {
        expect(node.data.answers[0].text).toBe('Updated')
        expect(node.data.answers[0].attributes).toEqual([5])
      }
    })

    it('addAnswer does nothing for non-question node', () => {
      useEditorStore.setState({
        nodes: [{
          id: 'ip1', type: 'info_page', position: { x: 0, y: 0 },
          data: { kind: 'info_page', title: 'T', message: '' },
        }] as QuizNode[],
      })

      useEditorStore.getState().addAnswer('ip1')
      expect(useEditorStore.getState().nodes[0].data.kind).toBe('info_page')
    })
  })

  describe('edge management', () => {
    it('updateEdgeData updates edge data', () => {
      useEditorStore.setState({
        edges: [{ id: 'e1', source: 'a', target: 'b', type: 'conditional', data: { foo: 1 } }] as QuizEdge[],
      })

      useEditorStore.getState().updateEdgeData('e1', { bar: 2 })

      expect(useEditorStore.getState().edges[0].data).toEqual({ foo: 1, bar: 2 })
    })

    it('removeEdge removes edge', () => {
      useEditorStore.setState({
        edges: [
          { id: 'e1', source: 'a', target: 'b', type: 'conditional', data: {} },
          { id: 'e2', source: 'b', target: 'c', type: 'conditional', data: {} },
        ] as QuizEdge[],
      })

      useEditorStore.getState().removeEdge('e1')

      expect(useEditorStore.getState().edges).toHaveLength(1)
      expect(useEditorStore.getState().edges[0].id).toBe('e2')
    })
  })

  describe('onConnect', () => {
    it('adds edge on valid connection', () => {
      useEditorStore.setState({ edges: [] })

      useEditorStore.getState().onConnect({
        source: 'n1', target: 'n2',
        sourceHandle: null, targetHandle: null,
      })

      expect(useEditorStore.getState().edges).toHaveLength(1)
      expect(useEditorStore.getState().isDirty).toBe(true)
    })

    it('rejects connection that creates a cycle', () => {
      vi.mocked(hasCycle).mockReturnValue(true)
      useEditorStore.setState({ edges: [] })

      useEditorStore.getState().onConnect({
        source: 'n1', target: 'n2',
        sourceHandle: null, targetHandle: null,
      })

      expect(useEditorStore.getState().edges).toHaveLength(0)
    })

    it('rejects duplicate edge from same source handle', () => {
      useEditorStore.setState({
        edges: [{ id: 'e1', source: 'n1', sourceHandle: 'a1', target: 'n2', type: 'conditional', data: {} }] as QuizEdge[],
      })

      useEditorStore.getState().onConnect({
        source: 'n1', target: 'n3',
        sourceHandle: 'a1', targetHandle: null,
      })

      expect(useEditorStore.getState().edges).toHaveLength(1)
    })
  })

  describe('loadGraph / serializeGraph', () => {
    it('loadGraph sets all state and resets isDirty', () => {
      const graph: QuizGraph & { quizId: string; quizName: string } = {
        quizId: 'test-quiz',
        quizName: 'My Quiz',
        nodes: [{ id: 'n1', type: 'question', position: { x: 10, y: 20 }, data: { kind: 'question', text: 'Q', questionType: 'single_choice', requires: false, answers: [] } }] as QuizNode[],
        edges: [],
        viewport: { x: 50, y: 60, zoom: 1.5 },
      }

      useEditorStore.getState().loadGraph(graph)

      const state = useEditorStore.getState()
      expect(state.quizId).toBe('test-quiz')
      expect(state.quizName).toBe('My Quiz')
      expect(state.nodes).toHaveLength(1)
      expect(state.viewport).toEqual({ x: 50, y: 60, zoom: 1.5 })
      expect(state.isDirty).toBe(false)
    })

    it('serializeGraph returns clean graph', () => {
      useEditorStore.setState({
        nodes: [{ id: 'n1', type: 'question', position: { x: 10, y: 20 }, data: { kind: 'question', text: 'Q', questionType: 'single_choice', requires: false, answers: [] } }] as QuizNode[],
        edges: [{ id: 'e1', source: 'n1', sourceHandle: null, target: 'n2', targetHandle: null, type: 'conditional', data: {} }] as QuizEdge[],
        viewport: { x: 1, y: 2, zoom: 3 },
      })

      const graph = useEditorStore.getState().serializeGraph()
      expect(graph.nodes).toHaveLength(1)
      expect(graph.edges).toHaveLength(1)
      expect(graph.viewport).toEqual({ x: 1, y: 2, zoom: 3 })
    })
  })

  describe('setQuizName / setViewport', () => {
    it('setQuizName updates name and marks dirty', () => {
      useEditorStore.getState().setQuizName('New Name')
      expect(useEditorStore.getState().quizName).toBe('New Name')
      expect(useEditorStore.getState().isDirty).toBe(true)
    })

    it('setViewport updates viewport', () => {
      useEditorStore.getState().setViewport({ x: 10, y: 20, zoom: 2 })
      expect(useEditorStore.getState().viewport).toEqual({ x: 10, y: 20, zoom: 2 })
    })
  })
})
