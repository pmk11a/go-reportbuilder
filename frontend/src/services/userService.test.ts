import { describe, it, expect, vi, beforeEach } from 'vitest'
import { userService } from './userService'
import { fetchHelper } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  fetchHelper: vi.fn(),
}))

describe('userService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches user list', async () => {
    const mockData = {
      success: true,
      data: [{ id: 1, name: 'IUser 1' }],
      pagination: { total: 1 }
    }
    vi.mocked(fetchHelper).mockResolvedValue(mockData)

    const result = await userService.list({ page: 1, limit: 10 })

    expect(result.success).toBe(true)
    expect(result.data).toHaveLength(1)
    expect(fetchHelper).toHaveBeenCalledWith('/users', { params: { page: 1, limit: 10 } })
  })

  it('fetches user by id', async () => {
    vi.mocked(fetchHelper).mockResolvedValue({ success: true, data: { id: 1, name: 'IUser 1' } })

    const result = await userService.getById(1)

    expect(result.success).toBe(true)
    expect(fetchHelper).toHaveBeenCalledWith('/users/1')
  })

  it('creates a user', async () => {
    const userData = { name: 'New IUser' }
    vi.mocked(fetchHelper).mockResolvedValue({ success: true, data: { id: 2, ...userData } })

    const result = await userService.create(userData)

    expect(result.success).toBe(true)
    expect(fetchHelper).toHaveBeenCalledWith('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  })

  it('updates a user', async () => {
    const userData = { name: 'Updated' }
    vi.mocked(fetchHelper).mockResolvedValue({ success: true, data: { id: 1, ...userData } })

    const result = await userService.update(1, userData)

    expect(result.success).toBe(true)
    expect(fetchHelper).toHaveBeenCalledWith('/users/1', {
      method: 'PUT',
      body: JSON.stringify(userData)
    })
  })

  it('deletes a user', async () => {
    vi.mocked(fetchHelper).mockResolvedValue({ success: true })

    const result = await userService.delete(1)

    expect(result.success).toBe(true)
    expect(fetchHelper).toHaveBeenCalledWith('/users/1', { method: 'DELETE' })
  })
})
