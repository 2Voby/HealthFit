import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useEffect } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QuizEditorPage } from '@/features/quiz-editor/pages/QuizEditorPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { useAuthStore } from '@/store/auth.store'
import { useMe } from '@/hooks/use-auth'

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser)
  const clearUser = useAuthStore((s) => s.clearUser)
  const { data, isError, isSuccess } = useMe()

  useEffect(() => {
    if (isSuccess && data) setUser(data)
    if (isError) clearUser()
  }, [isSuccess, isError, data, setUser, clearUser])

  return <>{children}</>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthBootstrap>
          <Routes>
            <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
            <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
            <Route path="/" element={<RequireAuth><QuizEditorPage /></RequireAuth>} />
          </Routes>
        </AuthBootstrap>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
