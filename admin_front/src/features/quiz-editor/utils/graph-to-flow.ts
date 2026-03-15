import type { QuizNode, QuizEdge } from '../types'
import type { FlowUpdateRequest, FlowTransitionCreateRequest } from '@/types/api'

function mapQuestionTypeToApi(frontendType: string): string {
  switch (frontendType) {
    case 'single_choice': return 'singe_choise'
    case 'multi_choice': return 'multiple_choise'
    case 'input_number': return 'manual_input'
    case 'input_text': return 'text'
    default: return 'singe_choise'
  }
}

export function graphToFlow(
  nodes: QuizNode[],
  edges: QuizEdge[],
): FlowUpdateRequest {
  const nodeById = new Map(nodes.map((n) => [n.id, n]))

  // Collect question IDs from question and info_page nodes
  const question_ids: number[] = []
  for (const node of nodes) {
    if (node.data.kind === 'question' && node.data.backendQuestionId !== undefined) {
      question_ids.push(node.data.backendQuestionId)
    } else if (node.data.kind === 'info_page' && node.data.backendQuestionId !== undefined) {
      question_ids.push(node.data.backendQuestionId)
    }
  }

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

  // Helper to get backendQuestionId from any node kind
  function getBackendQuestionId(node: QuizNode): number | undefined {
    if (node.data.kind === 'question') return node.data.backendQuestionId
    if (node.data.kind === 'info_page') return node.data.backendQuestionId
    return undefined
  }

  // Build transitions from edges
  const transitions: FlowTransitionCreateRequest[] = []
  for (const edge of edges) {
    const sourceNode = nodeById.get(edge.source)
    const targetNode = nodeById.get(edge.target)

    if (!sourceNode || !targetNode) continue
    if (sourceNode.data.kind !== 'question' && sourceNode.data.kind !== 'info_page') continue

    const fromQuestionId = getBackendQuestionId(sourceNode)
    const toQuestionId = getBackendQuestionId(targetNode)

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

export { mapQuestionTypeToApi }
