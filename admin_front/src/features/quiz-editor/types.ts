import type { Node, Edge, Viewport } from '@xyflow/react'

export type QuestionType = 'single_choice' | 'multi_choice' | 'input_number' | 'input_text'

export type FlowTransitionConditionType = 'always' | 'answer_any' | 'answer_all'

export interface Answer {
  id: string
  text: string
  attributes: number[]
}

export interface QuestionNodeData {
  [key: string]: unknown
  kind: 'question'
  text: string
  questionType: QuestionType
  requires: boolean
  answers: Answer[]
}

export interface InfoPageNodeData {
  [key: string]: unknown
  kind: 'info_page'
  title: string
  message: string
}

export interface OfferNodeData {
  [key: string]: unknown
  kind: 'offer'
  offerId: string
  label: string
  requires_all: number[]
  requires_optional: number[]
  excludes: number[]
}

export type QuizNodeData = QuestionNodeData | InfoPageNodeData | OfferNodeData

export type NodeKind = QuizNodeData['kind']

export interface TransitionEdgeData {
  conditionType: FlowTransitionConditionType
  answerIds: string[]
  priority: number
  [key: string]: unknown
}

export type QuizNode = Node<QuizNodeData>
export type QuizEdge = Edge<TransitionEdgeData>

export interface QuizGraph {
  nodes: QuizNode[]
  edges: QuizEdge[]
  viewport: Viewport
}
