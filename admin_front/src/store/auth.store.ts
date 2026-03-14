import { create } from 'zustand'
import type { UserResponse } from '@/types/api'

interface AuthState {
  user: UserResponse | null
  setUser: (user: UserResponse) => void
  clearUser: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))
