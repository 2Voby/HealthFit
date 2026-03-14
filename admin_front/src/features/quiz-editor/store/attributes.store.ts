import { create } from 'zustand'
import type { AttributeResponse } from '@/types/api'
import { MOCK_ATTRIBUTES } from '../constants'

interface AttributesState {
  attributes: AttributeResponse[]
  nextId: number
  addAttribute: (name: string) => void
  updateAttribute: (id: number, name: string) => void
  removeAttribute: (id: number) => void
  getAttributeName: (id: number) => string | undefined
}

export const useAttributesStore = create<AttributesState>((set, get) => ({
  attributes: [...MOCK_ATTRIBUTES],
  nextId: MOCK_ATTRIBUTES.length + 1,

  addAttribute: (name) => {
    const ts = new Date().toISOString()
    set((s) => ({
      attributes: [
        ...s.attributes,
        { id: s.nextId, name, created_at: ts, updated_at: ts },
      ],
      nextId: s.nextId + 1,
    }))
  },

  updateAttribute: (id, name) => {
    set((s) => ({
      attributes: s.attributes.map((a) =>
        a.id === id ? { ...a, name, updated_at: new Date().toISOString() } : a,
      ),
    }))
  },

  removeAttribute: (id) => {
    set((s) => ({
      attributes: s.attributes.filter((a) => a.id !== id),
    }))
  },

  getAttributeName: (id) => {
    return get().attributes.find((a) => a.id === id)?.name
  },
}))
