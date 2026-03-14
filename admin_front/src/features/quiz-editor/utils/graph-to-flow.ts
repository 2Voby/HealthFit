import type { QuizNode, QuizEdge } from '../types'
import type { FlowUpdateRequest, FlowTransitionCreateRequest } from '@/types/api'

export function graphToFlow(
  nodes: QuizNode[],
  edges: QuizEdge[],
): FlowUpdateRequest {
  // Build maps for quick lookup
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  // Collect question IDs from nodes that have a backendQuestionId
  const question_ids: number[] = nodes
    .filter((n) => n.data.kind === 'question' && n.data.backendQuestionId !== undefined)
    .map((n) => (n.data as { backendQuestionId: number }).backendQuestionId)

  // Build answer ID map: frontendAnswerId -> backendAnswerId
  const answerBackendIdMap = new Map<string, number>()
  for (const node of nodes) {
    if (node.data.kind === 'question') {
      for (const answer of node.data.answers) {
        if (answer.backendId !== undefined) {
          answerBackendIdMap.set(answer.id, answer.backendId)
        }
      }
    }
  }

  // Build transitions from edges
  const transitions: FlowTransitionCreateRequest[] = []
  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source)
    const targetNode = nodeById.get(edge.target)

    if (!sourceNode || !targetNode) continue
    if (sourceNode.data.kind !== 'question') continue

    const fromQuestionId = sourceNode.data.backendQuestionId
    const toQuestionId =
      targetNode.data.kind === 'question' ? targetNode.data.backendQuestionId : undefined

    if (fromQuestionId === undefined) continue

    const answerIds: number[] = []
    if (edge.sourceHandle) {
      const backendAnswerId = answerBackendIdMap.get(edge.sourceHandle)
      if (backendAnswerId !== undefined) answerIds.push(backendAnswerId)
    }

    transitions.push({
      from_question_id: fromQuestionId,
      to_question_id: toQuestionId ?? null,
      condition_type: answerIds.length > 0 ? 'answer_any' : 'always',
      answer_ids: answerIds,
      priority: 100,
    })
  }

  return { question_ids, transitions }
}
