import { describe, it, expect, vi, beforeEach } from 'vitest'
import { authService } from './authService'
import { fetchHelper } from '@/lib/api'

// Mock fetchHelper
vi.mock('@/lib/api', () => ({
  fetchHelper: vi.fn(),
  APIError: class extends Error {
    constructor(public status: number, public data: any) {
      super('API Error')
    }
  }
}))

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('performs login successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Login successful',
      data: { user: { id: 1, name: 'Admin' }, token: 'abc' }
    }

    vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

    const result = await authService.login('admin', 'password')

    expect(result.success).toBe(true)
    expect(result.data?.user.name).toBe('Admin')
    expect(fetchHelper).toHaveBeenCalledWith('/auth/login', expect.objectContaining({
      method: 'POST',
      skipAuth: true
    }))
  })

  it('throws on login failure', async () => {
    vi.mocked(fetchHelper).mockRejectedValue(new Error('Invalid credentials'))

    await expect(authService.login('wrong', 'wrong')).rejects.toThrow('Invalid credentials')
  })

  it('performs logout successfully', async () => {
    vi.mocked(fetchHelper).mockResolvedValue({ success: true })

    const result = await authService.logout()

    expect(result.success).toBe(true)
    expect(fetchHelper).toHaveBeenCalledWith('/auth/logout', expect.objectContaining({ method: 'POST' }))
  })
})
