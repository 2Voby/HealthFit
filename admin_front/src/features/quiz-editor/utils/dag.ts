import dagre from '@dagrejs/dagre'
import type { Edge, Node } from '@xyflow/react'
import type { QuizNodeData } from '../types'

interface ProposedEdge {
  source: string
  target: string
}

export function hasCycle(
  edges: Edge[],
  proposedEdge: ProposedEdge,
): boolean {
  const adj = new Map<string, string[]>()

  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, [])
    adj.get(e.source)!.push(e.target)
  }

  if (!adj.has(proposedEdge.source)) adj.set(proposedEdge.source, [])
  adj.get(proposedEdge.source)!.push(proposedEdge.target)

  // DFS from proposed target to see if we can reach proposed source
  const visited = new Set<string>()
  const stack = [proposedEdge.target]

  while (stack.length > 0) {
    const node = stack.pop()!
    if (node === proposedEdge.source) return true
    if (visited.has(node)) continue
    visited.add(node)
    const neighbors = adj.get(node) ?? []
    for (const n of neighbors) {
      stack.push(n)
    }
  }

  return false
}

const NODE_HEIGHT_MAP: Record<string, number> = {
  question: 400,
  info_page: 200,
  offer: 350,
}

const NODE_WIDTH = 280

export function applyDagreLayout(
  nodes: Node<QuizNodeData>[],
  edges: Edge[],
): Node<QuizNodeData>[] {
  if (nodes.length === 0) return nodes

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 120 })

  for (const node of nodes) {
    const kind = (node.data as QuizNodeData).kind
    g.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT_MAP[kind] ?? 200,
    })
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target)
  }

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    const kind = (node.data as QuizNodeData).kind
    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - (NODE_HEIGHT_MAP[kind] ?? 200) / 2,
      },
    }
  })
}
