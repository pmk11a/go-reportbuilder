import { describe, it, expect, vi, beforeEach } from 'vitest'
import { berkasService } from './berkasService'
import { fetchHelper } from '@/lib/api'

// Mock fetchHelper
vi.mock('@/lib/api', () => ({
  fetchHelper: vi.fn(),
}))

describe('berkasService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getPeriode', () => {
    it('fetches active period successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          USERID: 'user123',
          BULAN: '06',
          TAHUN: '2026'
        }
      }

      vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

      const result = await berkasService.getPeriode()

      expect(result.success).toBe(true)
      expect(result.data?.USERID).toBe('user123')
      expect(result.data?.BULAN).toBe('06')
      expect(result.data?.TAHUN).toBe('2026')
      expect(fetchHelper).toHaveBeenCalledWith('/berkas/get-periode')
    })

    it('throws error when fetching active period fails', async () => {
      vi.mocked(fetchHelper).mockRejectedValue(new Error('Failed to fetch period'))

      await expect(berkasService.getPeriode()).rejects.toThrow('Failed to fetch period')
    })
  })

  describe('setPeriode', () => {
    it('updates active period successfully', async () => {
      const mockResponse = {
        success: true,
        message: 'Period updated successfully'
      }

      vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

      const result = await berkasService.setPeriode('07', '2026')

      expect(result.success).toBe(true)
      expect(result.message).toBe('Period updated successfully')
      expect(fetchHelper).toHaveBeenCalledWith('/berkas/set-periode', {
        method: 'PUT',
        body: JSON.stringify({ BULAN: '07', TAHUN: '2026' })
      })
    })

    it('throws error when updating active period fails', async () => {
      vi.mocked(fetchHelper).mockRejectedValue(new Error('Failed to update period'))

      await expect(berkasService.setPeriode('07', '2026')).rejects.toThrow('Failed to update period')
    })
  })
})
