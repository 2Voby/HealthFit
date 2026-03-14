import type { NodeTypes } from '@xyflow/react'
import { QuestionNode } from './QuestionNode'
import { InfoPageNode } from './InfoPageNode'
import { OfferNode } from './OfferNode'

export const nodeTypes: NodeTypes = {
  question: QuestionNode,
  info_page: InfoPageNode,
  offer: OfferNode,
}
