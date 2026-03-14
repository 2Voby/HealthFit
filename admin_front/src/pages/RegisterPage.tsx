import { Link, useNavigate } from 'react-router-dom'

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

export function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUser({ id: '1', email: 'admin@betterme.world', name: 'Admin' })
    navigate('/')
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
              <Label htmlFor="name">Ім'я</Label>
              <Input id="name" placeholder="Ваше ім'я" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input id="password" type="password" placeholder="******" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Підтвердіть пароль</Label>
              <Input id="confirmPassword" type="password" placeholder="******" />
            </div>
            <Button type="submit" className="w-full">
              Зареєструватися
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
