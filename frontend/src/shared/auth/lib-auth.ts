export const AUTH_KEY = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  user: 'user',
}

export function getAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_KEY.accessToken)
}

export function getRefreshToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(AUTH_KEY.refreshToken)
}

export function setAccessToken(token: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(AUTH_KEY.accessToken, token)
}

export function setRefreshToken(token: string): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(AUTH_KEY.refreshToken, token)
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
}

export function clearAuthTokens(): void {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(AUTH_KEY.accessToken)
  localStorage.removeItem(AUTH_KEY.refreshToken)
  localStorage.removeItem(AUTH_KEY.user)
}

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp ? payload.exp * 1000 < Date.now() : false
  } catch {
    return true
  }
}

export function decodeToken(token: string): Record<string, any> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export function isAuthenticated(): boolean {
  const token = getAccessToken()
  return !!token && !isTokenExpired(token)
}
