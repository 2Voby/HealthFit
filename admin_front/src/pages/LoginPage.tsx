import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  function handleMockLogin() {
    setUser({ id: '1', email: 'admin@bebrame.com', name: 'Admin' })
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Вхід</CardTitle>
          <CardDescription>Мок-авторизація (без бекенду)</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" onClick={handleMockLogin}>
            Увійти як Admin
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
