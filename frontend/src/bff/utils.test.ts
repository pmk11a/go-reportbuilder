import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getEnv, BffResponseBuilder, makeBackendRequest } from './utils'

describe('BFF Utils', () => {
  describe('getEnv', () => {
    it('returns default value if env not found', () => {
      expect(getEnv('NON_EXISTENT', 'default')).toBe('default')
    })

    it('returns value from process.env if available', () => {
      vi.stubGlobal('process', { env: { TEST_KEY: 'test_value' } })
      expect(getEnv('TEST_KEY')).toBe('test_value')
      vi.unstubAllGlobals()
    })
  })

  describe('BffResponseBuilder', () => {
    it('builds a success response correctly', async () => {
      const response = BffResponseBuilder.success('Success message', { id: 1 })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body).toEqual({
        success: true,
        message: 'Success message',
        data: { id: 1 }
      })
    })

    it('builds an error response correctly', async () => {
      const response = BffResponseBuilder.error('Error message', 400)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body).toEqual({
        success: false,
        message: 'Error message',
        data: null
      })
    })

    it('sets cookies correctly', () => {
      const builder = new BffResponseBuilder()
      builder.setCookie('test_cookie', 'test_value', 3600)
      const response = builder.send(true, 'ok')
      
      expect(response.headers.get('Set-Cookie')).toContain('test_cookie=test_value')
    })
  })

  describe('makeBackendRequest', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    it('forwards requests to backend and unwraps data', async () => {
      const mockBackendResponse = {
        success: true,
        message: 'Backend OK',
        data: { result: 'data' }
      }

      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockBackendResponse
      } as unknown as Response)

      const result = await makeBackendRequest('/test-endpoint')

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ result: 'data' })
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/test-endpoint'),
        expect.any(Object)
      )
    })

    it('handles network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValue(new Error('Network Failure'))

      const result = await makeBackendRequest('/fail')

      expect(result.success).toBe(false)
      expect(result.status).toBe(500)
      expect(result.message).toBe('Network Error: Network Failure')
    })
  })
})
