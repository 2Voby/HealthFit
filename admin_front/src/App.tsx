import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Button } from '@/components/ui/button'
import { QuizEditorPage } from '@/features/quiz-editor/pages/QuizEditorPage'

function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Vaca</h1>
      <Button>Get started</Button>
    </div>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/quiz/:quizId/edit" element={<QuizEditorPage />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
