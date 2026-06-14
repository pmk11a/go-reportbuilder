import { loginFn, logoutFn, meFn, changePasswordFn } from '@/server/functions/auth'
import type { IAuthResponse } from '@/domains/auth/auth'
import type { IAPIResponse } from '@/shared/types/api'

export const authService = {
  async login(username: string, password: string): Promise<IAPIResponse<IAuthResponse>> {
    const result = await loginFn({ data: { username, password } })
    return {
      success: true,
      status: 200,
      message: 'Login successful',
      data: result as any,
    }
  },

  async logout(): Promise<IAPIResponse<void>> {
    await logoutFn()
    return {
      success: true,
      status: 200,
      message: 'Logged out successfully',
      data: null as any,
    }
  },

  async getCurrentUser(): Promise<IAPIResponse<any>> {
    const user = await meFn()
    return {
      success: true,
      status: 200,
      message: 'Success',
      data: user,
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<IAPIResponse<void>> {
    await changePasswordFn({
      data: {
        current_password: oldPassword,
        new_password: newPassword,
        confirm_password: newPassword,
      },
    })
    return {
      success: true,
      status: 200,
      message: 'Password changed successfully',
      data: null as any,
    }
  },
}
