import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { useAuthStore } from '@/store/auth.store'
import { useLogin } from '@/hooks/use-auth'

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const loginMutation = useLogin()
  const loginRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const login = loginRef.current?.value ?? ''
    const password = passwordRef.current?.value ?? ''
    loginMutation.mutate(
      { login, password },
      {
        onSuccess: (user) => {
          setUser(user)
          navigate('/')
        },
        onError: (err) => {
          toast.error(err.message || 'Login failed')
        },
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Вхід</CardTitle>
          <CardDescription>Увійдіть у свій акаунт</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login">Логін</Label>
              <Input id="login" type="text" placeholder="your_login" ref={loginRef} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" placeholder="******" ref={passwordRef} required />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Вхід...' : 'Увійти'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Немає акаунту?{' '}
            <Link to="/register" className="text-primary underline underline-offset-4">
              Зареєструватися
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
