import { fetchHelper } from '@/lib/api'
import type { IAuthResponse } from '@/types/auth'
import type { IAPIResponse } from '@/types/api';;

export const authService = {
  /**
   * Performs user login
   */
  async login(username: string, password: string): Promise<IAPIResponse<IAuthResponse>> {
    return await fetchHelper<IAPIResponse<IAuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      skipAuth: true,
    })
  },

  /**
   * Performs user logout
   */
  async logout(): Promise<IAPIResponse<void>> {
    return await fetchHelper<IAPIResponse<void>>('/auth/logout', {
      method: 'POST',
      skipAuth: true,
    })
  },

  /**
   * Gets the currently authenticated user
   */
  async getCurrentUser(): Promise<IAPIResponse<any>> {
    return await fetchHelper<IAPIResponse<any>>('/auth/me')
  },

  /**
   * Changes the user's password
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<IAPIResponse<void>> {
    return await fetchHelper<IAPIResponse<void>>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
    })
  }
}
