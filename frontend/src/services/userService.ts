import { fetchHelper } from '@/lib/api'
import type { IAPIResponse, IPaginatedResponse } from '@/types/api';;
import type { IUser } from '@/types/user';

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
}

export const userService = {
  /**
   * Fetches a paginated list of users
   */
  async list( params?: UserListParams ): Promise<IPaginatedResponse<IUser>> {
    return await fetchHelper<IPaginatedResponse<IUser>>( '/users', { params } )
  },

  /**
   * Fetches a single user by ID
   */
  async getById( id: string | number ): Promise<IAPIResponse<IUser>> {
    return await fetchHelper<IAPIResponse<IUser>>( `/users/${ id }` )
  },

  /**
   * Creates a new user
   */
  async create( data: Partial<IUser> ): Promise<IAPIResponse<IUser>> {
    return await fetchHelper<IAPIResponse<IUser>>( '/users', {
      method: 'POST',
      body: JSON.stringify( data ),
    } )
  },

  /**
   * Updates an existing user
   */
  async update( id: string | number, data: Partial<IUser> ): Promise<IAPIResponse<IUser>> {
    return await fetchHelper<IAPIResponse<IUser>>( `/users/${ id }`, {
      method: 'PUT',
      body: JSON.stringify( data ),
    } )
  },

  /**
   * Deletes a user
   */
  async delete( id: string | number ): Promise<IAPIResponse<void>> {
    return await fetchHelper<IAPIResponse<void>>( `/users/${ id }`, {
      method: 'DELETE'
    } )
  },
}
