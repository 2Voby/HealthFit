import { beforeEach, describe, it, expect, vi } from 'vitest'
import type { FlowResponse } from '@/types/api'

// Mock dagre layout to avoid complex positioning logic in tests
vi.mock('./dag', () => ({
  applyDagreLayout: (nodes: unknown[]) => nodes,
}))

// Mock generateId to return predictable values
let idCounter = 0
vi.mock('./id', () => ({
  generateId: () => `mock-id-${++idCounter}`,
}))

import { flowToGraph } from './flow-to-graph'

function makeFlow(overrides: Partial<FlowResponse> = {}): FlowResponse {
  return {
    id: 1,
    name: 'Test Flow',
    is_active: true,
    start_question_id: null,
    questions: [],
    transitions: [],
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('flowToGraph', () => {
  beforeEach(() => {
    idCounter = 0
  })

  it('returns empty graph for flow with no questions', () => {
    const result = flowToGraph(makeFlow())
    expect(result.quizId).toBe('flow-1')
    expect(result.quizName).toBe('Test Flow')
    expect(result.nodes).toEqual([])
    expect(result.edges).toEqual([])
    expect(result.viewport).toEqual({ x: 0, y: 0, zoom: 0.85 })
  })

  it('maps question with singe_choise type to single_choice', () => {
    const flow = makeFlow({
      questions: [{
        question_id: 1,
        position: 0,
        question: {
          id: 1, text: 'What?', type: 'singe_choise', requires: false,
          answers: [{ id: 10, text: 'Yes', attributes: [1, 2], created_at: '', updated_at: '' }],
          created_at: '', updated_at: '',
        },
      }],
    })

    const result = flowToGraph(flow)
    expect(result.nodes).toHaveLength(1)
    const node = result.nodes[0]
    expect(node.id).toBe('q-1')
    expect(node.type).toBe('question')
    expect(node.data.kind).toBe('question')
    if (node.data.kind === 'question') {
      expect(node.data.questionType).toBe('single_choice')
      expect(node.data.text).toBe('What?')
      expect(node.data.requires).toBe(false)
      expect(node.data.backendQuestionId).toBe(1)
      expect(node.data.answers).toHaveLength(1)
      expect(node.data.answers[0].text).toBe('Yes')
      expect(node.data.answers[0].attributes).toEqual([1, 2])
      expect(node.data.answers[0].backendId).toBe(10)
    }
  })

  it('maps question with multiple_choise type to multi_choice', () => {
    const flow = makeFlow({
      questions: [{
        question_id: 2,
        position: 0,
        question: {
          id: 2, text: 'Pick many', type: 'multiple_choise', requires: true,
          answers: [], created_at: '', updated_at: '',
        },
      }],
    })

    const result = flowToGraph(flow)
    if (result.nodes[0].data.kind === 'question') {
      expect(result.nodes[0].data.questionType).toBe('multi_choice')
      expect(result.nodes[0].data.requires).toBe(true)
    }
  })

  it('maps question with text type to info_page node', () => {
    const flow = makeFlow({
      questions: [{
        question_id: 3,
        position: 0,
        question: {
          id: 3, text: 'Welcome!', type: 'text', requires: false,
          answers: [], created_at: '', updated_at: '',
        },
      }],
    })

    const result = flowToGraph(flow)
    expect(result.nodes).toHaveLength(1)
    const node = result.nodes[0]
    expect(node.type).toBe('info_page')
    expect(node.data.kind).toBe('info_page')
    if (node.data.kind === 'info_page') {
      expect(node.data.title).toBe('Welcome!')
      expect(node.data.backendQuestionId).toBe(3)
    }
  })

  it('creates edges for transitions between questions', () => {
    const flow = makeFlow({
      questions: [
        {
          question_id: 1, position: 0,
          question: {
            id: 1, text: 'Q1', type: 'singe_choise', requires: false,
            answers: [{ id: 10, text: 'A', attributes: [], created_at: '', updated_at: '' }],
            created_at: '', updated_at: '',
          },
        },
        {
          question_id: 2, position: 1,
          question: {
            id: 2, text: 'Q2', type: 'singe_choise', requires: false,
            answers: [], created_at: '', updated_at: '',
          },
        },
      ],
      transitions: [{
        id: 100,
        from_question_id: 1,
        to_question_id: 2,
        condition_type: 'answer_any' as const,
        answer_ids: [10],
        priority: 100,
        created_at: '', updated_at: '',
      }],
    })

    const result = flowToGraph(flow)
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].source).toBe('q-1')
    expect(result.edges[0].target).toBe('q-2')
    expect(result.edges[0].sourceHandle).toBe('mock-id-1') // mapped answer ID
  })

  it('creates finish (offer) nodes for null transitions', () => {
    const flow = makeFlow({
      questions: [{
        question_id: 1, position: 0,
        question: {
          id: 1, text: 'Q1', type: 'singe_choise', requires: false,
          answers: [{ id: 10, text: 'A', attributes: [], created_at: '', updated_at: '' }],
          created_at: '', updated_at: '',
        },
      }],
      transitions: [{
        id: 200,
        from_question_id: 1,
        to_question_id: null,
        condition_type: 'answer_any' as const,
        answer_ids: [10],
        priority: 100,
        created_at: '', updated_at: '',
      }],
    })

    const result = flowToGraph(flow)
    // Should have original question + finish node
    expect(result.nodes).toHaveLength(2)
    const finishNode = result.nodes.find((n) => n.id.startsWith('_finish_'))
    expect(finishNode).toBeDefined()
    expect(finishNode!.type).toBe('offer')
    expect(finishNode!.data.kind).toBe('offer')

    // Should have edge to finish
    expect(result.edges).toHaveLength(1)
    expect(result.edges[0].target).toBe(finishNode!.id)
  })

  it('skips transitions referencing unknown question IDs', () => {
    const flow = makeFlow({
      questions: [{
        question_id: 1, position: 0,
        question: {
          id: 1, text: 'Q1', type: 'singe_choise', requires: false,
          answers: [], created_at: '', updated_at: '',
        },
      }],
      transitions: [{
        id: 300,
        from_question_id: 999, // doesn't exist
        to_question_id: 1,
        condition_type: 'always' as const,
        answer_ids: [],
        priority: 100,
        created_at: '', updated_at: '',
      }],
    })

    const result = flowToGraph(flow)
    expect(result.edges).toEqual([])
  })
})
