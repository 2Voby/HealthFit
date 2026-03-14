import { useEffect } from 'react'
import { ReactFlowProvider } from '@xyflow/react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Canvas } from '../components/Canvas'
import { NodePalette } from '../components/NodePalette'
import { TopBar } from '../components/TopBar'
import { useEditorStore } from '../store/editor.store'
import { MOCK_QUIZ } from '../mocks'

export function QuizEditorPage() {
  useEffect(() => {
    useEditorStore.getState().loadGraph(MOCK_QUIZ)
  }, [])

  return (
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
        </div>
      </div>
    </ReactFlowProvider>
  )
}
