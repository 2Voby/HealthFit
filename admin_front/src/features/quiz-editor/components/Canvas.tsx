import { useCallback } from 'react'
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
import type { NodeKind } from '../types'

export function Canvas() {
  const nodes = useEditorStore((s) => s.nodes)
  const edges = useEditorStore((s) => s.edges)
  const onNodesChange = useEditorStore((s) => s.onNodesChange)
  const onEdgesChange = useEditorStore((s) => s.onEdgesChange)
  const onConnect = useEditorStore((s) => s.onConnect)
  const setViewport = useEditorStore((s) => s.setViewport)
  const addNode = useEditorStore((s) => s.addNode)

  const { screenToFlowPosition } = useReactFlow()

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
      nodes={nodes}
      edges={edges}
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
