import { getUserSessionsFn, revokeSessionFn, revokeAllSessionsFn } from '@/server/functions/admin/sessions'
import type { IAPIResponse } from '@/shared/types/api'

export interface ISessionInfo {
  session_id: string
  login_time: number
  expires_at: number
  login_ip: string
  browser: string
  status: string
}

export interface ISessionListResponse {
  sessions: ISessionInfo[]
  current_session_id: string
}

export const sessionService = {
  async getUserSessions(userId: string | number): Promise<IAPIResponse<ISessionListResponse>> {
    const result = await getUserSessionsFn({ data: { userId: String(userId) } })
    return result as IAPIResponse<ISessionListResponse>
  },

  async revokeSession(userId: string | number, sessionId: string): Promise<IAPIResponse<void>> {
    await revokeSessionFn({ data: { userId: String(userId), sessionId } })
    return { success: true, status: 200, message: 'Success', data: null as any }
  },

  async revokeAllSessions(userId: string | number): Promise<IAPIResponse<void>> {
    await revokeAllSessionsFn({ data: { userId: String(userId) } })
    return { success: true, status: 200, message: 'Success', data: null as any }
  },
}
