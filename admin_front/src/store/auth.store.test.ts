import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './auth.store'
import type { UserResponse } from '@/types/api'

describe('auth.store', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null })
  })

  it('starts with null user', () => {
    expect(useAuthStore.getState().user).toBeNull()
  })

  it('setUser sets the user', () => {
    const user: UserResponse = { id: 1, login: 'admin', authorities: ['ADMIN'] }
    useAuthStore.getState().setUser(user)
    expect(useAuthStore.getState().user).toEqual(user)
  })

  it('clearUser resets to null', () => {
    useAuthStore.getState().setUser({ id: 1, login: 'admin', authorities: [] })
    useAuthStore.getState().clearUser()
    expect(useAuthStore.getState().user).toBeNull()
  })
})
