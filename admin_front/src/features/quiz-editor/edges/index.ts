import type { EdgeTypes, DefaultEdgeOptions } from '@xyflow/react'
import { ConditionalEdge } from './ConditionalEdge'

export const edgeTypes: EdgeTypes = {
  conditional: ConditionalEdge,
}

export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: 'conditional',
}
