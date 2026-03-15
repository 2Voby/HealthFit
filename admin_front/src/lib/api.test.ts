import { describe, it, expect, vi, beforeEach } from 'vitest'
import { api } from './api'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function jsonResponse(data: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'OK',
    text: () => Promise.resolve(JSON.stringify(data)),
  }
}

function errorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    statusText: 'Error',
    text: () => Promise.resolve(body),
  }
}

describe('api', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  it('GET sends correct method and credentials', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ id: 1 }))

    const result = await api.get<{ id: number }>('/test')

    expect(result).toEqual({ id: 1 })
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/test'),
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
      }),
    )
  })

  it('POST sends JSON body', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ ok: true }))

    await api.post('/items', { name: 'Test' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      }),
    )
  })

  it('PATCH sends correct method', async () => {
    mockFetch.mockResolvedValue(jsonResponse({ updated: true }))

    await api.patch('/items/1', { name: 'Updated' })

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/1'),
      expect.objectContaining({ method: 'PATCH' }),
    )
  })

  it('DELETE sends correct method', async () => {
    mockFetch.mockResolvedValue({ ok: true, status: 204, statusText: 'No Content', text: () => Promise.resolve('') })

    await api.delete('/items/1')

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/1'),
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('throws error on non-OK response', async () => {
    mockFetch.mockResolvedValue(errorResponse(400, 'Bad Request'))

    await expect(api.get('/fail')).rejects.toThrow('Bad Request')
  })

  it('throws error with statusText fallback when body is empty', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: () => Promise.resolve(''),
    })

    await expect(api.get('/fail')).rejects.toThrow()
  })

  it('handles empty response body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 204,
      statusText: 'No Content',
      text: () => Promise.resolve(''),
    })

    const result = await api.delete('/items/1')
    expect(result).toBeUndefined()
  })
})
