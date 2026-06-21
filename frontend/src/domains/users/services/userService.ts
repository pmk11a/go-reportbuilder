import {
  getUsersFn,
  getUserDetailFn,
  createUserFn,
  updateUserFn,
  deleteUserFn,
  getUserPermissionsFn,
  updateUserPermissionsFn,
} from '@/server/functions/admin/users'
import type { IAPIResponse } from '@/shared/types/api'
import type {
  IDbflpass,
  IUserListParams,
  ICreateUserPayload,
  IUpdateUserPayload,
  IUserPermissionsData,
  IUserPermission,
  IUserCoaAccess,
} from '@/domains/users/types/user'

function buildQuery(params?: Record<string, any>): string | undefined {
  if (!params) return undefined
  const sp = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined) sp.append(k, String(v))
  })
  const s = sp.toString()
  return s ? `?${s}` : undefined
}

export const userService = {
  async list(params?: IUserListParams): Promise<IAPIResponse<any>> {
    const result = await getUsersFn({ data: { query: buildQuery(params) } })
    return { success: true, status: 200, message: 'Success', data: result.data, meta: result.meta } as any
  },

  async getById(id: string | number): Promise<IAPIResponse<IDbflpass>> {
    const result = await getUserDetailFn({ data: { id: String(id) } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async create(data: ICreateUserPayload): Promise<IAPIResponse<IDbflpass>> {
    const result = await createUserFn({ data: { body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async update(id: string | number, data: IUpdateUserPayload): Promise<IAPIResponse<IDbflpass>> {
    const result = await updateUserFn({ data: { id: String(id), body: data } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async delete(id: string | number): Promise<IAPIResponse<void>> {
    await deleteUserFn({ data: { id: String(id) } })
    return { success: true, status: 200, message: 'Success', data: null as any }
  },

  async getPermissions(id: string | number): Promise<IAPIResponse<IUserPermissionsData>> {
    const result = await getUserPermissionsFn({ data: { id: String(id) } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getUserMenuPermissions(id: string | number): Promise<IAPIResponse<IUserPermission[]>> {
    const result = await getUserPermissionsFn({ data: { id: String(id), type: 'menu' } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getUserReportPermissions(id: string | number): Promise<IAPIResponse<IUserPermission[]>> {
    const result = await getUserPermissionsFn({ data: { id: String(id), type: 'report' } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async getUserCoaAccess(id: string | number): Promise<IAPIResponse<IUserCoaAccess[]>> {
    const result = await getUserPermissionsFn({ data: { id: String(id), type: 'coa' } })
    return { success: true, status: 200, message: 'Success', data: result } as any
  },

  async updatePermissions(id: string | number, data: IUserPermissionsData): Promise<IAPIResponse<void>> {
    await updateUserPermissionsFn({ data: { id: String(id), body: data } })
    return { success: true, status: 200, message: 'Success', data: null as any }
  },
}
