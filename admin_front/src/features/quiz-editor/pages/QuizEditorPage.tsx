import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Canvas } from '../components/Canvas'
import { NodePalette } from '../components/NodePalette'
import { TopBar } from '../components/TopBar'
import { AttributesPanel } from '../components/AttributesPanel'
import { DndContextWrapper } from '../components/DndContext'
import { useFlowStore } from '../store/flow.store'

export function QuizEditorPage() {
  useEffect(() => {
    const { flows, selectFlow } = useFlowStore.getState()
    if (flows.length > 0) {
      selectFlow(flows[0].id)
    }
  }, [])

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
            <AttributesPanel />
          </div>
        </div>
      </ReactFlowProvider>
    </DndContextWrapper>
  )
}
