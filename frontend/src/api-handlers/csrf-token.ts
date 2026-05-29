import { generateCsrfToken } from '@/bff/csrf'

/**
 * BFF API Route: GET /api/csrf-token
 *
 * Bootstrap endpoint for CSRF protection.
 * Called once on app initialization to obtain a valid CSRF token.
 *
 * Returns the token in both:
 * - Response body (for JS to read and store)
 * - A readable cookie (as backup / double-submit verification)
 *
 * This is the ONLY /api/* endpoint exempt from CSRF validation.
 */
export const APIRoute = {
  GET: async () => {
    const token = generateCsrfToken()

    const headers = new Headers({
      'Content-Type': 'application/json',
      // Set as readable cookie (NOT HttpOnly — JS needs to read it)
      'Set-Cookie': `csrf_token=${token}; Path=/; SameSite=Strict; Max-Age=1800`,
      // Prevent caching of CSRF tokens
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'CSRF token generated',
        data: { token },
      }),
      { status: 200, headers }
    )
  },
}
