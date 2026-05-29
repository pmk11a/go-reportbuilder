import { describe, it, expect, vi, beforeEach } from 'vitest'
import { menuService } from './menuService'
import { fetchHelper } from '@/lib/api'
import { IDbMenu } from '@/types/menu';

// Mock fetchHelper
vi.mock('@/lib/api', () => ({
  fetchHelper: vi.fn()
}))

describe('menuService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockMenu: IDbMenu = {
    KODEMENU: 'M01',
    Keterangan: 'Dashboard',
    L0: 0,
    ACCESS: 0,
    OL: 0,
    Icon: 'home'
  }

  it('fetches all menus successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Success',
      data: [mockMenu]
    }

    vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

    const result = await menuService.getPaginatedMenus()

    expect(result.success).toBe(true)
    expect(result.data?.[0].KODEMENU).toBe('M01')
    expect(fetchHelper).toHaveBeenCalledWith('/admin/menu?page=1&limit=10')
  })

  it('creates a menu successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Created',
      data: mockMenu
    }

    vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

    const result = await menuService.createMenu(mockMenu)

    expect(result.success).toBe(true)
    expect(fetchHelper).toHaveBeenCalledWith('/admin/menu', {
      method: 'POST',
      body: JSON.stringify(mockMenu)
    })
  })

  it('deletes a menu successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Deleted',
      data: null
    }

    vi.mocked(fetchHelper).mockResolvedValue(mockResponse)

    const result = await menuService.deleteMenu('M01')

    expect(result.success).toBe(true)
    expect(fetchHelper).toHaveBeenCalledWith('/admin/menu/detail?kode=M01', {
      method: 'DELETE'
    })
  })
})
