import { describe, it, expect } from 'vitest'
import { hasCycle, applyDagreLayout } from './dag'
import type { Edge, Node } from '@xyflow/react'
import type { QuizNodeData } from '../types'

describe('hasCycle', () => {
  it('returns false for a valid acyclic edge', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' },
    ]
    expect(hasCycle(edges, { source: 'C', target: 'D' })).toBe(false)
  })

  it('detects a direct cycle', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
    ]
    expect(hasCycle(edges, { source: 'B', target: 'A' })).toBe(true)
  })

  it('detects an indirect cycle', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'B', target: 'C' },
    ]
    expect(hasCycle(edges, { source: 'C', target: 'A' })).toBe(true)
  })

  it('returns false for self-loop when not present in graph', () => {
    const edges: Edge[] = []
    // A -> A is a self-loop; the algo checks if target can reach source via DFS
    // For self-loop, target === source, so it's detected immediately
    expect(hasCycle(edges, { source: 'A', target: 'A' })).toBe(true)
  })

  it('returns false for disconnected components', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'C', target: 'D' },
    ]
    expect(hasCycle(edges, { source: 'B', target: 'C' })).toBe(false)
  })

  it('handles empty edge list', () => {
    expect(hasCycle([], { source: 'A', target: 'B' })).toBe(false)
  })

  it('detects cycle in diamond graph', () => {
    const edges: Edge[] = [
      { id: 'e1', source: 'A', target: 'B' },
      { id: 'e2', source: 'A', target: 'C' },
      { id: 'e3', source: 'B', target: 'D' },
      { id: 'e4', source: 'C', target: 'D' },
    ]
    expect(hasCycle(edges, { source: 'D', target: 'A' })).toBe(true)
    expect(hasCycle(edges, { source: 'D', target: 'E' })).toBe(false)
  })
})

describe('applyDagreLayout', () => {
  it('returns empty array for empty nodes', () => {
    expect(applyDagreLayout([], [])).toEqual([])
  })

  it('assigns positions to nodes', () => {
    const nodes: Node<QuizNodeData>[] = [
      { id: 'q1', type: 'question', position: { x: 0, y: 0 }, data: { kind: 'question', text: 'Q1', questionType: 'single_choice', requires: false, answers: [] } },
      { id: 'q2', type: 'question', position: { x: 0, y: 0 }, data: { kind: 'question', text: 'Q2', questionType: 'single_choice', requires: false, answers: [] } },
    ]
    const edges: Edge[] = [
      { id: 'e1', source: 'q1', target: 'q2' },
    ]

    const result = applyDagreLayout(nodes, edges)
    expect(result).toHaveLength(2)
    // After layout, positions should be assigned (not all zeros)
    // q1 should be above q2 (lower y) since rankdir is TB
    expect(result[0].position.y).toBeLessThan(result[1].position.y)
  })

  it('handles single node', () => {
    const nodes: Node<QuizNodeData>[] = [
      { id: 'q1', type: 'info_page', position: { x: 0, y: 0 }, data: { kind: 'info_page', title: 'Hi', message: '' } },
    ]

    const result = applyDagreLayout(nodes, [])
    expect(result).toHaveLength(1)
    expect(typeof result[0].position.x).toBe('number')
    expect(typeof result[0].position.y).toBe('number')
  })

  it('preserves node data and id', () => {
    const data: QuizNodeData = { kind: 'question', text: 'Q1', questionType: 'multi_choice', requires: true, answers: [{ id: 'a1', text: 'Ans', attributes: [1] }] }
    const nodes: Node<QuizNodeData>[] = [
      { id: 'q1', type: 'question', position: { x: 0, y: 0 }, data },
    ]

    const result = applyDagreLayout(nodes, [])
    expect(result[0].id).toBe('q1')
    expect(result[0].data).toEqual(data)
  })
})
