import { create } from 'zustand'
import type { AttributeResponse } from '@/types/api'
import { MOCK_ATTRIBUTES, parseAttributeName, groupAttributes } from '../constants'

interface AttributesState {
  attributes: AttributeResponse[]
  nextId: number

  addAttribute: (name: string) => void
  updateAttribute: (id: number, name: string) => void
  removeAttribute: (id: number) => void
  getAttributeName: (id: number) => string | undefined
  getAttributeDisplay: (id: number) => { key: string; value: string } | undefined

  /** Add a new value under an existing key, e.g. addValue("age", "51-60") creates "age-51-60" */
  addValue: (key: string, value: string) => void
  /** Get grouped attributes as Map<key, AttributeResponse[]> */
  getGrouped: () => Map<string, AttributeResponse[]>
}

export const useAttributesStore = create<AttributesState>((set, get) => ({
  attributes: [...MOCK_ATTRIBUTES],
  nextId: Math.max(...MOCK_ATTRIBUTES.map((a) => a.id)) + 1,

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

  getAttributeDisplay: (id) => {
    const attr = get().attributes.find((a) => a.id === id)
    if (!attr) return undefined
    return parseAttributeName(attr.name)
  },

  addValue: (key, value) => {
    const name = `${key}-${value}`
    get().addAttribute(name)
  },

  getGrouped: () => {
    return groupAttributes(get().attributes)
  },
}))
