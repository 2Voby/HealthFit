import { describe, it, expect } from 'vitest'
import { parseAttributeName, groupAttributes } from './constants'
import type { AttributeResponse } from '@/types/api'

describe('parseAttributeName', () => {
  it('parses key-value format', () => {
    expect(parseAttributeName('age-11-20')).toEqual({ key: 'age', value: '11-20' })
  })

  it('handles single dash', () => {
    expect(parseAttributeName('gender-male')).toEqual({ key: 'gender', value: 'male' })
  })

  it('handles no dash', () => {
    expect(parseAttributeName('standalone')).toEqual({ key: 'standalone', value: 'standalone' })
  })

  it('handles multiple dashes (only splits on first)', () => {
    expect(parseAttributeName('goal-weight_loss')).toEqual({ key: 'goal', value: 'weight_loss' })
  })
})

describe('groupAttributes', () => {
  const ts = '2025-01-01T00:00:00Z'

  it('groups attributes by key', () => {
    const attrs: AttributeResponse[] = [
      { id: 1, name: 'age-11-20', created_at: ts, updated_at: ts },
      { id: 2, name: 'age-21-30', created_at: ts, updated_at: ts },
      { id: 3, name: 'gender-male', created_at: ts, updated_at: ts },
    ]

    const groups = groupAttributes(attrs)
    expect(groups.size).toBe(2)
    expect(groups.get('age')).toHaveLength(2)
    expect(groups.get('gender')).toHaveLength(1)
  })

  it('returns empty map for empty input', () => {
    const groups = groupAttributes([])
    expect(groups.size).toBe(0)
  })

  it('handles attributes without dashes', () => {
    const attrs: AttributeResponse[] = [
      { id: 1, name: 'standalone', created_at: ts, updated_at: ts },
    ]

    const groups = groupAttributes(attrs)
    expect(groups.get('standalone')).toHaveLength(1)
  })
})
