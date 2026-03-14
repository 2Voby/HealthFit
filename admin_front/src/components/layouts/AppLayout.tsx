import { Outlet, useNavigate, NavLink } from 'react-router-dom'
import { LayoutDashboard, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/store/auth.store'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const navigate = useNavigate()
  const { user, clearUser } = useAuthStore()

  async function handleLogout() {
    try {
      await api.post('/auth/logout')
    } catch {
      // ignore — clear local state anyway
    }
    clearUser()
    navigate('/login')
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="flex w-56 flex-col border-r bg-muted/40">
        <div className="flex h-14 items-center px-4 font-semibold">
          BebraMe
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                isActive && 'bg-accent'
              )
            }
          >
            <LayoutDashboard className="h-4 w-4" />
            Дашборд
          </NavLink>
        </nav>
        <Separator />
        <div className="p-2">
          {user && (
            <p className="mb-2 truncate px-3 text-xs text-muted-foreground">
              {user.email}
            </p>
          )}
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Вийти
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
