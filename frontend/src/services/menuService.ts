import { fetchHelper } from '@/lib/api'
import type { IAPIResponse } from '@/types/api';;
import type { IDbMenu } from '@/types/menu';

export const menuService = {
  /**
   * Fetches paginated menus
   */
  async getPaginatedMenus(page: number = 1, limit: number = 10, search: string = ''): Promise<IAPIResponse<any>> {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search ? { search } : {})
      })
      return await fetchHelper<IAPIResponse<any>>(`/admin/menu?${queryParams.toString()}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch menus'
      }
    }
  },

  /**
   * Fetches parent menus by level
   */
  async getParentMenus(level: number): Promise<IAPIResponse<IDbMenu[]>> {
    try {
      return await fetchHelper<IAPIResponse<IDbMenu[]>>(`/admin/menu/parents?level=${level}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch parent menus'
      }
    }
  },

  /**
   * Fetches a single menu by KODEMENU
   */
  async getMenuByKode(kode: string): Promise<IAPIResponse<IDbMenu>> {
    try {
      return await fetchHelper<IAPIResponse<IDbMenu>>(`/admin/menu/detail?kode=${kode}`)
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to fetch menu details'
      }
    }
  },

  /**
   * Creates a new menu
   */
  async createMenu(data: IDbMenu): Promise<IAPIResponse<IDbMenu>> {
    try {
      return await fetchHelper<IAPIResponse<IDbMenu>>('/admin/menu', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to create menu'
      }
    }
  },

  /**
   * Updates an existing menu
   */
  async updateMenu(kode: string, data: IDbMenu): Promise<IAPIResponse<IDbMenu>> {
    try {
      return await fetchHelper<IAPIResponse<IDbMenu>>(`/admin/menu/detail?kode=${kode}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to update menu'
      }
    }
  },

  /**
   * Deletes a menu
   */
  async deleteMenu(kode: string): Promise<IAPIResponse<null>> {
    try {
      return await fetchHelper<IAPIResponse<null>>(`/admin/menu/detail?kode=${kode}`, {
        method: 'DELETE'
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to delete menu'
      }
    }
  }
}
