import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sharedFilterService } from './sharedFilterService'
import { fetchHelper } from '@/lib/api'

// Mock fetchHelper
vi.mock('@/lib/api', () => ({
  fetchHelper: vi.fn()
}))

describe('sharedFilterService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error in tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('fetches customers successfully', async () => {
    const mockResponse = {
      data: {
        data: [{ KODECUSTSUPP: 'C01', NAMACUSTSUPP: 'Test Cust', ALAMAT1: 'Addr', Kota: 'City' }],
        current_page: 1,
        last_page: 1,
        total: 1
      }
    }

    vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

    const result = await sharedFilterService.getCustomers(0, 'Test', 1)

    expect(result.data[0].NAMACUSTSUPP).toBe('Test Cust')
    expect(fetchHelper).toHaveBeenCalledWith('/customers', {
      params: { jenis: 0, search: 'Test', page: 1 }
    })
  })

  it('throws on getCustomers error', async () => {
    vi.mocked(fetchHelper).mockRejectedValue(new Error('Network Error'))

    await expect(sharedFilterService.getCustomers(0)).rejects.toThrow('Network Error')
  })

  it('fetches perkiraan successfully', async () => {
    const mockResponse = {
      data: [{ id: 'P01', text: 'Perkiraan 1' }]
    }

    vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

    const result = await sharedFilterService.getPerkiraan('P0')

    expect(result[0].text).toBe('Perkiraan 1')
    expect(fetchHelper).toHaveBeenCalledWith('/perkiraan', {
      params: { q: 'P0' }
    })
  })

  it('throws on getPerkiraan error', async () => {
    vi.mocked(fetchHelper).mockRejectedValue(new Error('Network Error'))

    await expect(sharedFilterService.getPerkiraan('P0')).rejects.toThrow('Network Error')
  })

  it('fetches kelompok kas successfully', async () => {
    const mockResponse = {
      data: [{ id: 'K01', text: 'Kas 1' }]
    }

    vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

    const result = await sharedFilterService.getKelompokKas('KAS', 'Kas')

    expect(result[0].id).toBe('K01')
    expect(fetchHelper).toHaveBeenCalledWith('/perkiraan/kelompok-kas', {
      params: { type: 'KAS', query: 'Kas' }
    })
  })

  it('throws on getKelompokKas error', async () => {
    vi.mocked(fetchHelper).mockRejectedValue(new Error('Network Error'))

    await expect(sharedFilterService.getKelompokKas('KAS')).rejects.toThrow('Network Error')
  })
})
