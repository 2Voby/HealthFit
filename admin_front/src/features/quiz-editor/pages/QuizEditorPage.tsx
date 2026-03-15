import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Canvas } from '../components/Canvas'
import { NodePalette } from '../components/NodePalette'
import { TopBar } from '../components/TopBar'
import { RightPanel } from '../components/RightPanel'
import { DndContextWrapper } from '../components/DndContext'
import { useFlowStore } from '../store/flow.store'
import { useFlows } from '@/hooks/use-flows'

export function QuizEditorPage() {
  const activeFlowId = useFlowStore((s) => s.activeFlowId)
  const selectFlow = useFlowStore((s) => s.selectFlow)
  const { data: flowsData } = useFlows({ limit: 200 })

  useEffect(() => {
    if (!flowsData || activeFlowId !== null) return
    const flows = flowsData.items
    if (flows.length === 0) return
    const activeFlow = flows.find((f) => f.is_active) ?? flows[0]
    selectFlow(activeFlow)
  }, [flowsData, activeFlowId, selectFlow])

  return (
    <DndContextWrapper>
      <ReactFlowProvider>
        <div className="flex h-screen flex-col">
          <TopBar />
          <div className="flex flex-1 overflow-hidden">
            <NodePalette />
            <div className="flex-1">
              <ErrorBoundary>
                <Canvas />
              </ErrorBoundary>
            </div>
            <RightPanel />
          </div>
        </div>
      </ReactFlowProvider>
    </DndContextWrapper>
  )
}
