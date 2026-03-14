import type { Node, Edge, Viewport } from '@xyflow/react'

export type QuestionType = 'single_choice' | 'multi_choice' | 'input_number' | 'input_text'

export interface Answer {
  id: string
  text: string
  value: string
}

export interface QuestionNodeData {
  [key: string]: unknown
  kind: 'question'
  text: string
  questionType: QuestionType
  attribute: string
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
}

export type QuizNodeData = QuestionNodeData | InfoPageNodeData | OfferNodeData

export type NodeKind = QuizNodeData['kind']

export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'in' | 'contains'

export interface EdgeCondition {
  attribute: string
  operator: ConditionOperator
  value: string | number | string[]
}

export interface ConditionalEdgeData {
  conditions: EdgeCondition[]
  [key: string]: unknown
}

export type QuizNode = Node<QuizNodeData>
export type QuizEdge = Edge<ConditionalEdgeData>

export interface QuizGraph {
  nodes: QuizNode[]
  edges: QuizEdge[]
  viewport: Viewport
}