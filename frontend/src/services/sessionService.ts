import { fetchHelper } from '@/lib/api'
import type { IAPIResponse } from '@/types/api'

export interface ISessionInfo {
  session_id: string
  login_time: number      // Unix milliseconds
  expires_at: number      // Unix milliseconds
  login_ip: string
  browser: string
  status: string
}

export interface ISessionListResponse {
  sessions: ISessionInfo[]
  current_session_id: string  // ID of the current session (for highlighting)
}

/**
 * sessionService provides methods to query and manage user sessions.
 * All endpoints require admin role (enforced by backend middleware).
 */
export const sessionService = {
  /**
   * Fetches all active sessions for a specific user.
   * Backend: GET /api/admin/users/{userId}/sessions
   * BFF:     GET /api/admin/users/{userId}/sessions
   */
  async getUserSessions(userId: string | number): Promise<IAPIResponse<ISessionListResponse>> {
    return await fetchHelper<IAPIResponse<ISessionListResponse>>(
      `/admin/users/${userId}/sessions`
    )
  },

  /**
   * Revokes a single session for a user (force logout from one device).
   * Backend: DELETE /api/admin/users/{userId}/sessions/{sessionId}
   * BFF:     DELETE /api/admin/users/{userId}/sessions/{sessionId}
   */
  async revokeSession(
    userId: string | number,
    sessionId: string
  ): Promise<IAPIResponse<void>> {
    return await fetchHelper<IAPIResponse<void>>(
      `/admin/users/${userId}/sessions/${sessionId}`,
      { method: 'DELETE' }
    )
  },

  /**
   * Revokes all sessions for a user (force logout from all devices).
   * Backend: DELETE /api/admin/users/{userId}/sessions
   * BFF:     DELETE /api/admin/users/{userId}/sessions
   */
  async revokeAllSessions(userId: string | number): Promise<IAPIResponse<void>> {
    return await fetchHelper<IAPIResponse<void>>(
      `/admin/users/${userId}/sessions`,
      { method: 'DELETE' }
    )
  },
}
