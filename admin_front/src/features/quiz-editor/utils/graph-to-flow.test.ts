import { describe, it, expect } from 'vitest'
import { graphToFlow, mapQuestionTypeToApi } from './graph-to-flow'
import type { QuizNode, QuizEdge } from '../types'

describe('mapQuestionTypeToApi', () => {
  it('maps single_choice to singe_choise', () => {
    expect(mapQuestionTypeToApi('single_choice')).toBe('singe_choise')
  })

  it('maps multi_choice to multiple_choise', () => {
    expect(mapQuestionTypeToApi('multi_choice')).toBe('multiple_choise')
  })

  it('maps input_number to manual_input', () => {
    expect(mapQuestionTypeToApi('input_number')).toBe('manual_input')
  })

  it('maps input_text to text', () => {
    expect(mapQuestionTypeToApi('input_text')).toBe('text')
  })

  it('defaults to singe_choise for unknown type', () => {
    expect(mapQuestionTypeToApi('unknown')).toBe('singe_choise')
  })
})

describe('graphToFlow', () => {
  it('returns empty arrays for empty graph', () => {
    const result = graphToFlow([], [])
    expect(result.question_ids).toEqual([])
    expect(result.transitions).toEqual([])
  })

  it('collects question_ids from question nodes with backendQuestionId', () => {
    const nodes: QuizNode[] = [
      {
        id: 'q1', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 10 },
      },
      {
        id: 'q2', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q2', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 20 },
      },
    ]

    const result = graphToFlow(nodes, [])
    expect(result.question_ids).toEqual([10, 20])
  })

  it('collects question_ids from info_page nodes', () => {
    const nodes: QuizNode[] = [
      {
        id: 'ip1', type: 'info_page', position: { x: 0, y: 0 },
        data: { kind: 'info_page', title: 'Info', message: '', backendQuestionId: 30 },
      },
    ]

    const result = graphToFlow(nodes, [])
    expect(result.question_ids).toEqual([30])
  })

  it('skips nodes without backendQuestionId', () => {
    const nodes: QuizNode[] = [
      {
        id: 'q1', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false, answers: [] },
      },
    ]

    const result = graphToFlow(nodes, [])
    expect(result.question_ids).toEqual([])
  })

  it('builds transitions from edges with backend IDs', () => {
    const nodes: QuizNode[] = [
      {
        id: 'q1', type: 'question', position: { x: 0, y: 0 },
        data: {
          kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false,
          answers: [{ id: 'a1', text: 'Yes', attributes: [], backendId: 100 }],
          backendQuestionId: 10,
        },
      },
      {
        id: 'q2', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q2', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 20 },
      },
    ]
    const edges: QuizEdge[] = [
      { id: 'e1', source: 'q1', sourceHandle: 'a1', target: 'q2', type: 'conditional', data: {} },
    ]

    const result = graphToFlow(nodes, edges)
    expect(result.transitions).toHaveLength(1)
    expect(result.transitions[0]).toEqual({
      from_question_id: 10,
      to_question_id: 20,
      condition_type: 'answer_any',
      answer_ids: [100],
      priority: 100,
    })
  })

  it('builds always transition when no sourceHandle', () => {
    const nodes: QuizNode[] = [
      {
        id: 'q1', type: 'info_page', position: { x: 0, y: 0 },
        data: { kind: 'info_page', title: 'Info', message: '', backendQuestionId: 10 },
      },
      {
        id: 'q2', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q2', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 20 },
      },
    ]
    const edges: QuizEdge[] = [
      { id: 'e1', source: 'q1', target: 'q2', type: 'conditional', data: {} },
    ]

    const result = graphToFlow(nodes, edges)
    expect(result.transitions).toHaveLength(1)
    expect(result.transitions[0].condition_type).toBe('always')
    expect(result.transitions[0].answer_ids).toEqual([])
  })

  it('skips virtual finish edges (target starting with _finish_)', () => {
    const nodes: QuizNode[] = [
      {
        id: 'q1', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 10 },
      },
      {
        id: '_finish_q1', type: 'offer', position: { x: 0, y: 0 },
        data: { kind: 'offer' },
      },
    ]
    const edges: QuizEdge[] = [
      { id: 'e1', source: 'q1', target: '_finish_q1', type: 'conditional', data: {} },
    ]

    const result = graphToFlow(nodes, edges)
    expect(result.transitions).toEqual([])
  })

  it('skips transitions with unresolved answer backend IDs', () => {
    const nodes: QuizNode[] = [
      {
        id: 'q1', type: 'question', position: { x: 0, y: 0 },
        data: {
          kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false,
          answers: [{ id: 'a1', text: 'Yes', attributes: [] }], // no backendId
          backendQuestionId: 10,
        },
      },
      {
        id: 'q2', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q2', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 20 },
      },
    ]
    const edges: QuizEdge[] = [
      { id: 'e1', source: 'q1', sourceHandle: 'a1', target: 'q2', type: 'conditional', data: {} },
    ]

    const result = graphToFlow(nodes, edges)
    expect(result.transitions).toEqual([])
  })

  it('skips transitions where target has no backendQuestionId', () => {
    const nodes: QuizNode[] = [
      {
        id: 'q1', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 10 },
      },
      {
        id: 'q2', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q2', questionType: 'single_choice', requires: false, answers: [] },
      },
    ]
    const edges: QuizEdge[] = [
      { id: 'e1', source: 'q1', target: 'q2', type: 'conditional', data: {} },
    ]

    const result = graphToFlow(nodes, edges)
    expect(result.transitions).toEqual([])
  })

  it('skips edges from offer nodes', () => {
    const nodes: QuizNode[] = [
      {
        id: 'o1', type: 'offer', position: { x: 0, y: 0 },
        data: { kind: 'offer' },
      },
      {
        id: 'q1', type: 'question', position: { x: 0, y: 0 },
        data: { kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false, answers: [], backendQuestionId: 10 },
      },
    ]
    const edges: QuizEdge[] = [
      { id: 'e1', source: 'o1', target: 'q1', type: 'conditional', data: {} },
    ]

    const result = graphToFlow(nodes, edges)
    expect(result.transitions).toEqual([])
  })
})
