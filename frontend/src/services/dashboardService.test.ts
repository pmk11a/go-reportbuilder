import { describe, it, expect, vi, beforeEach } from 'vitest'
import { dashboardService } from './dashboardService'
import { fetchHelper } from '@/lib/api'

vi.mock('@/lib/api', () => ({
  fetchHelper: vi.fn(),
}))

describe('dashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches dashboard stats successfully', async () => {
    const mockStats = {
      success: true,
      data: {
        total_users: 100,
        active_users: 80,
        recent_activities: []
      }
    }
    vi.mocked(fetchHelper).mockResolvedValue(mockStats)

    const result = await dashboardService.getStats()

    expect(result.success).toBe(true)
    expect(result.data?.total_users).toBe(100)
    expect(fetchHelper).toHaveBeenCalledWith('/dashboard/stats')
  })

  it('handles errors when fetching stats', async () => {
    vi.mocked(fetchHelper).mockRejectedValue(new Error('Fetch failed'))

    const result = await dashboardService.getStats()

    expect(result.success).toBe(false)
    expect(result.message).toBe('Fetch failed')
  })
})
