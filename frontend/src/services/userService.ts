import { fetchHelper } from '@/lib/api'
import type { IAPIResponse } from '@/types/api'
import type {
  IUser,
  IUserListParams,
  ICreateUserPayload,
  IUpdateUserPayload,
  IUserPermissionsData,
  IUserPermission,
  IUserCoaAccess,
} from '@/types/user'

export const userService = {
  /**
   * Fetches a paginated list of legacy DBFLPASS users
   */
  async list(params?: IUserListParams): Promise<IAPIResponse<any>> {
    return await fetchHelper<IAPIResponse<any>>('/admin/users', { params })
  },

  /**
   * Fetches a single user by ID
   */
  async getById(id: string | number): Promise<IAPIResponse<IUser>> {
    return await fetchHelper<IAPIResponse<IUser>>(`/admin/users/detail?id=${id}`)
  },

  /**
   * Creates a new user in the legacy DBFLPASS table
   */
  async create(data: ICreateUserPayload): Promise<IAPIResponse<IUser>> {
    return await fetchHelper<IAPIResponse<IUser>>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /**
   * Updates an existing user in the legacy DBFLPASS table
   */
  async update(id: string | number, data: IUpdateUserPayload): Promise<IAPIResponse<IUser>> {
    return await fetchHelper<IAPIResponse<IUser>>(`/admin/users/detail?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /**
   * Deletes a user from the legacy DBFLPASS table
   */
  async delete(id: string | number): Promise<IAPIResponse<void>> {
    return await fetchHelper<IAPIResponse<void>>(`/admin/users/detail?id=${id}`, {
      method: 'DELETE',
    })
  },

  /**
   * Fetches the combined legacy permission payload (menu + report + coa) for a
   * specific user. Kept for backward compatibility — newer call sites should
   * use the per-tab getters below so that switching tabs in the edit dialog
   * does not refetch unrelated data.
   */
  async getPermissions(id: string | number): Promise<IAPIResponse<IUserPermissionsData>> {
    return await fetchHelper<IAPIResponse<IUserPermissionsData>>(`/admin/users/permissions?id=${id}`)
  },

  /**
   * Fetches ONLY the menu-permission tab for a user.
   * Backend: GET /api/admin/users/{id}/permissions/menu
   * BFF:     GET /api/admin/users/permissions/menu?id={id}
   */
  async getUserMenuPermissions(id: string | number): Promise<IAPIResponse<IUserPermission[]>> {
    return await fetchHelper<IAPIResponse<IUserPermission[]>>(
      `/admin/users/permissions/menu?id=${id}`
    )
  },

  /**
   * Fetches ONLY the report-permission tab for a user.
   * Backend: GET /api/admin/users/{id}/permissions/report
   * BFF:     GET /api/admin/users/permissions/report?id={id}
   */
  async getUserReportPermissions(id: string | number): Promise<IAPIResponse<IUserPermission[]>> {
    return await fetchHelper<IAPIResponse<IUserPermission[]>>(
      `/admin/users/permissions/report?id=${id}`
    )
  },

  /**
   * Fetches ONLY the COA access tab for a user.
   * Backend: GET /api/admin/users/{id}/permissions/coa
   * BFF:     GET /api/admin/users/permissions/coa?id={id}
   */
  async getUserCoaAccess(id: string | number): Promise<IAPIResponse<IUserCoaAccess[]>> {
    return await fetchHelper<IAPIResponse<IUserCoaAccess[]>>(
      `/admin/users/permissions/coa?id={id}`.replace('{id}', String(id))
    )
  },

  /**
   * Updates legacy menu, report, and COA permissions for a specific user in
   * one transaction (unchanged contract).
   */
  async updatePermissions(
    id: string | number,
    data: IUserPermissionsData
  ): Promise<IAPIResponse<void>> {
    return await fetchHelper<IAPIResponse<void>>(`/admin/users/permissions?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}
