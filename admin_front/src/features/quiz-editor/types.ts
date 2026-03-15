import type { Node, Edge, Viewport } from '@xyflow/react'

export type QuestionType = 'single_choice' | 'multi_choice' | 'input_number' | 'input_text'

export interface Answer {
  id: string
  text: string
  attributes: number[]
  backendId?: number
}

export interface QuestionNodeData {
  [key: string]: unknown
  kind: 'question'
  text: string
  questionType: QuestionType
  requires: boolean
  answers: Answer[]
  backendQuestionId?: number
}

export interface InfoPageNodeData {
  [key: string]: unknown
  kind: 'info_page'
  title: string
  message: string
  backendQuestionId?: number
}

export interface OfferNodeData {
  [key: string]: unknown
  kind: 'offer'
}

export type QuizNodeData = QuestionNodeData | InfoPageNodeData | OfferNodeData

export type NodeKind = QuizNodeData['kind']

export interface TransitionEdgeData {
  [key: string]: unknown
}

export type QuizNode = Node<QuizNodeData>
export type QuizEdge = Edge<TransitionEdgeData>

export interface QuizGraph {
  nodes: QuizNode[]
  edges: QuizEdge[]
  viewport: Viewport
}
