import { getMenuListFn, getMenuDetailFn, getMenuParentsFn, createMenuFn, updateMenuFn, deleteMenuFn } from '@/server/functions/admin/menu'
import type { IAPIResponse } from '@/types/api'
import type { IDbMenu } from '@/types/menu'

export const menuService = {
  async getPaginatedMenus(page: number = 1, limit: number = 10, search: string = ''): Promise<IAPIResponse<any>> {
    const query = `?page=${page}&limit=${limit}${search ? `&search=${search}` : ''}`
    const result = await getMenuListFn({ data: { query } })
    return { success: true, status: 200, message: 'Success', data: result.data, meta: result.meta } as any
  },

  async getParentMenus(level: number): Promise<IAPIResponse<IDbMenu[]>> {
    const result = await getMenuParentsFn()
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getMenuByKode(kode: string): Promise<IAPIResponse<IDbMenu>> {
    const result = await getMenuDetailFn({ data: { kode } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async createMenu(data: IDbMenu): Promise<IAPIResponse<IDbMenu>> {
    const result = await createMenuFn({ data: { body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async updateMenu(kode: string, data: IDbMenu): Promise<IAPIResponse<IDbMenu>> {
    const result = await updateMenuFn({ data: { kode, body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async deleteMenu(kode: string): Promise<IAPIResponse<null>> {
    const result = await deleteMenuFn({ data: { kode } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },
}
