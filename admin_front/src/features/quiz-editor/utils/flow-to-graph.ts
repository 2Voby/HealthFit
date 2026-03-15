import type { FlowResponse, FlowQuestionResponse } from '@/types/api'
import type { QuizGraph, QuizNode, QuizEdge, QuestionNodeData, Answer } from '../types'
import { generateId } from './id'
import { applyDagreLayout } from './dag'

function mapQuestionType(apiType: string): QuestionNodeData['questionType'] {
  switch (apiType) {
    case 'singe_choise': return 'single_choice'
    case 'multiple_choise': return 'multi_choice'
    case 'manual_input': return 'input_number'
    default: return 'single_choice'
  }
}

function isInfoPage(fq: FlowQuestionResponse): boolean {
  return fq.question.type === 'text'
}

export function flowToGraph(flow: FlowResponse): QuizGraph & { quizId: string; quizName: string } {
  const questionIdMap = new Map<number, string>()
  const answerIdMap = new Map<number, string>()

  const nodes: QuizNode[] = flow.questions.map((fq) => {
    const nodeId = `q-${fq.question_id}`
    questionIdMap.set(fq.question_id, nodeId)

    // API type 'text' maps to info_page node
    if (isInfoPage(fq)) {
      return {
        id: nodeId,
        type: 'info_page' as const,
        position: { x: 0, y: 0 },
        data: {
          kind: 'info_page' as const,
          title: fq.question.text,
          message: '',
          backendQuestionId: fq.question_id,
        },
      }
    }

    const answers: Answer[] = fq.question.answers.map((a) => {
      const answerId = generateId()
      answerIdMap.set(a.id, answerId)
      return {
        id: answerId,
        text: a.text,
        attributes: a.attributes,
        backendId: a.id,
      }
    })

    return {
      id: nodeId,
      type: 'question' as const,
      position: { x: 0, y: 0 },
      data: {
        kind: 'question' as const,
        text: fq.question.text,
        questionType: mapQuestionType(fq.question.type),
        requires: fq.question.requires,
        answers,
        backendQuestionId: fq.question_id,
      },
    }
  })

  const edges: QuizEdge[] = flow.transitions
    .filter((t) => t.to_question_id !== null)
    .map((t) => {
      const sourceNodeId = questionIdMap.get(t.from_question_id)
      const targetNodeId = questionIdMap.get(t.to_question_id!)
      if (!sourceNodeId || !targetNodeId) return null

      const sourceHandleId = t.answer_ids.length > 0
        ? answerIdMap.get(t.answer_ids[0]) ?? null
        : null

      return {
        id: `e-${t.id}`,
        source: sourceNodeId,
        sourceHandle: sourceHandleId,
        target: targetNodeId,
        type: 'conditional' as const,
        data: {},
      }
    })
    .filter((e): e is NonNullable<typeof e> => e !== null) as QuizEdge[]

  const layoutedNodes = nodes.length > 0 ? applyDagreLayout(nodes, edges) : nodes

  return {
    quizId: `flow-${flow.id}`,
    quizName: flow.name,
    nodes: layoutedNodes,
    edges,
    viewport: { x: 0, y: 0, zoom: 0.85 },
  }
}
