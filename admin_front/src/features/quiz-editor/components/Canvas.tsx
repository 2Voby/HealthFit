import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useReactFlow,
  type IsValidConnection,
} from '@xyflow/react'
import { useEditorStore } from '../store/editor.store'
import { nodeTypes } from '../nodes'
import { edgeTypes, defaultEdgeOptions } from '../edges'
import { hasCycle } from '../utils/dag'
import type { NodeKind, QuizNode, QuizEdge } from '../types'

const FINISH_OFFSET_Y = 80

export function Canvas() {
  const nodes = useEditorStore((s) => s.nodes)
  const edges = useEditorStore((s) => s.edges)
  const onNodesChange = useEditorStore((s) => s.onNodesChange)
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange)
  const onConnect = useEditorStore((s) => s.onConnect)
  const setViewport = useEditorStore((s) => s.setViewport)
  const addNode = useEditorStore((s) => s.addNode)

  const quizId = useEditorStore((s) => s.quizId)
  const autoLayout = useEditorStore((s) => s.autoLayout)
  const { screenToFlowPosition, fitView } = useReactFlow()

  // Auto-layout and fit view when switching flows
  const prevQuizId = useRef(quizId)
  useEffect(() => {
    if (quizId && quizId !== prevQuizId.current) {
      autoLayout()
      requestAnimationFrame(() => fitView({ duration: 300 }))
    }
    prevQuizId.current = quizId
  }, [quizId, autoLayout, fitView])

  // Compute finish indicators for leaf nodes
  const { allNodes, allEdges } = useMemo(() => {
    const outgoingEdges = new Set<string>()
    for (const edge of edges) {
      // Track which nodes have outgoing edges
      outgoingEdges.add(edge.source)
      // Track which answer handles have outgoing edges
      if (edge.sourceHandle) {
        outgoingEdges.add(`${edge.source}:${edge.sourceHandle}`)
      }
    }

    const finishNodes: QuizNode[] = []
    const finishEdges: QuizEdge[] = []

    for (const node of nodes) {
      // Skip offer/finish nodes
      if (node.data.kind === 'offer') continue

      const isQuestion = node.data.kind === 'question'
      const isInfoPage = node.data.kind === 'info_page'

      if (isQuestion && node.data.kind === 'question') {
        const isChoiceType = node.data.questionType === 'single_choice' || node.data.questionType === 'multi_choice'

        if (isChoiceType) {
          // Each unconnected answer gets its own finish indicator
          const unconnected = node.data.answers.filter(
            (a: { id: string }) => !outgoingEdges.has(`${node.id}:${a.id}`),
          )
          for (const answer of unconnected as { id: string }[]) {
            const finishId = `_finish_${node.id}_${answer.id}`
            finishNodes.push({
              id: finishId,
              type: 'offer',
              position: { x: node.position.x + 200, y: node.position.y + 250 },
              data: { kind: 'offer' } as QuizNode['data'],
              selectable: false,
              draggable: false,
            } as QuizNode)
            finishEdges.push({
              id: `_fe_${node.id}_${answer.id}`,
              source: node.id,
              sourceHandle: answer.id,
              target: finishId,
              type: 'conditional',
              style: { strokeDasharray: '5 5', opacity: 0.4 },
              data: {},
            } as QuizEdge)
          }
        } else {
          // For non-choice (input) questions: check if node has no outgoing edge at all
          if (!outgoingEdges.has(node.id)) {
            const finishId = `_finish_${node.id}`
            finishNodes.push({
              id: finishId,
              type: 'offer',
              position: { x: node.position.x + 60, y: node.position.y + 200 },
              data: { kind: 'offer' } as QuizNode['data'],
              selectable: false,
              draggable: false,
            } as QuizNode)
            finishEdges.push({
              id: `_fe_${node.id}`,
              source: node.id,
              target: finishId,
              type: 'conditional',
              style: { strokeDasharray: '5 5', opacity: 0.4 },
              data: {},
            } as QuizEdge)
          }
        }
      } else if (isInfoPage) {
        // Info page: check if it has no outgoing edge
        if (!outgoingEdges.has(node.id)) {
          const finishId = `_finish_${node.id}`
          finishNodes.push({
            id: finishId,
            type: 'offer',
            position: { x: node.position.x + 60, y: node.position.y + 200 },
            data: { kind: 'offer' } as QuizNode['data'],
            selectable: false,
            draggable: false,
          } as QuizNode)
          finishEdges.push({
            id: `_fe_${node.id}`,
            source: node.id,
            target: finishId,
            type: 'conditional',
            style: { strokeDasharray: '5 5', opacity: 0.4 },
            data: {},
          } as QuizEdge)
        }
      }
    }

    return {
      allNodes: [...nodes, ...finishNodes],
      allEdges: [...edges, ...finishEdges],
    }
  }, [nodes, edges])

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      const kind = event.dataTransfer.getData('application/quiz-node-kind') as NodeKind
      if (!kind) return

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      addNode(kind, position)
    },
    [screenToFlowPosition, addNode],
  )

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      if (connection.source === connection.target) return false
      // Block connecting to finish indicators
      if (connection.target.startsWith('_finish_')) return false
      // Only one outgoing edge per answer handle
      if (connection.sourceHandle) {
        const hasExisting = edges.some(
          (e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle,
        )
        if (hasExisting) return false
      }
      return !hasCycle(edges, {
        source: connection.source,
        target: connection.target,
      })
    },
    [edges],
  )

  return (
    <ReactFlow
      nodes={allNodes}
      edges={allEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onMoveEnd={(_, vp) => setViewport(vp)}
      fitView
      snapToGrid
      snapGrid={[16, 16]}
      deleteKeyCode={['Backspace', 'Delete']}
      isValidConnection={isValidConnection}
      proOptions={{ hideAttribution: true }}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <Controls position="bottom-left" showInteractive={false} />
      <MiniMap
        position="bottom-right"
        pannable
        zoomable
        nodeColor={(node) => {
          switch (node.type) {
            case 'question':
              return '#3b82f6'
            case 'info_page':
              return '#22c55e'
            case 'offer':
              return '#f59e0b'
            default:
              return '#94a3b8'
          }
        }}
      />
    </ReactFlow>
  )
}
