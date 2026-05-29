import { fetchHelper } from '@/lib/api'
import type { IAuthResponse } from '@/types/auth'
import type { IAPIResponse } from '@/types/api';;

export const authService = {
  /**
   * Performs user login
   */
  async login( username: string, password: string ): Promise<IAPIResponse<IAuthResponse>> {
    try {
      const response = await fetchHelper<IAPIResponse<IAuthResponse>>( '/auth/login', {
        method: 'POST',
        body: JSON.stringify( { username, password } ),
        skipAuth: true,
      } )
      return response
    } catch ( error: any ) {
      return {
        success: false,
        message: error.message || 'Login failed'
      }
    }
  },

  /**
   * Performs user logout
   */
  async logout(): Promise<IAPIResponse<void>> {
    try {
      return await fetchHelper<IAPIResponse<void>>( '/auth/logout', {
        method: 'POST',
        skipAuth: true,
      } )
    } catch ( error: any ) {
      return {
        success: false,
        message: error.message || 'Logout failed'
      }
    }
  },

  /**
   * Gets the currently authenticated user
   */
  async getCurrentUser(): Promise<IAPIResponse<any>> {
    try {
      return await fetchHelper<IAPIResponse<any>>( '/auth/me' )
    } catch ( error: any ) {
      return {
        success: false,
        message: error.message || 'Failed to fetch current user'
      }
    }
  },

  /**
   * Changes the user's password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<IAPIResponse<void>> {
    try {
      return await fetchHelper<IAPIResponse<void>>('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      })
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Change password failed'
      }
    }
  }
}
