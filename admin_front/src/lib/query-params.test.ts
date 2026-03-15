import { describe, it, expect } from 'vitest'
import { buildPaginationQuery } from './query-params'

describe('buildPaginationQuery', () => {
  it('returns empty string for undefined params', () => {
    expect(buildPaginationQuery()).toBe('')
  })

  it('returns empty string for empty params', () => {
    expect(buildPaginationQuery({})).toBe('')
  })

  it('builds query with offset only', () => {
    expect(buildPaginationQuery({ offset: 10 })).toBe('?offset=10')
  })

  it('builds query with limit only', () => {
    expect(buildPaginationQuery({ limit: 25 })).toBe('?limit=25')
  })

  it('builds query with both offset and limit', () => {
    const result = buildPaginationQuery({ offset: 5, limit: 20 })
    expect(result).toContain('offset=5')
    expect(result).toContain('limit=20')
    expect(result.startsWith('?')).toBe(true)
  })

  it('handles zero values', () => {
    expect(buildPaginationQuery({ offset: 0, limit: 0 })).toBe('?offset=0&limit=0')
  })
})
