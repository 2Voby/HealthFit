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
import { useRegister } from '@/hooks/use-auth'

export function RegisterPage() {
  const navigate = useNavigate()
  const registerMutation = useRegister()
  const loginRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)
  const confirmRef = useRef<HTMLInputElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const login = loginRef.current?.value ?? ''
    const password = passwordRef.current?.value ?? ''
    const confirm = confirmRef.current?.value ?? ''
    if (password !== confirm) {
      toast.error('Passwords do not match')
      return
    }
    registerMutation.mutate(
      { login, password },
      {
        onSuccess: () => {
          toast.success('Registered! Please log in.')
          navigate('/login')
        },
        onError: (err) => {
          toast.error(err.message || 'Registration failed')
        },
      },
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Реєстрація</CardTitle>
          <CardDescription>Створіть новий акаунт</CardDescription>
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
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Підтвердіть пароль</Label>
              <Input id="confirmPassword" type="password" placeholder="******" ref={confirmRef} required />
            </div>
            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Реєстрація...' : 'Зареєструватися'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            Вже є акаунт?{' '}
            <Link to="/login" className="text-primary underline underline-offset-4">
              Увійти
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
