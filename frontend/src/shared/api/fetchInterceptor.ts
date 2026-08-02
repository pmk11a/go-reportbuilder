// import { fromCrossJSON, createSerovalJSONPlugin } from 'seroval/plugins'

const isDev = typeof window !== 'undefined' && import.meta.env.DEV

export function installFetchInterceptor() {
  if (!isDev || typeof window === 'undefined') return

  const originalFetch = window.fetch

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

    if (!url.includes('/_serverFn/')) {
      return originalFetch.call(window, input, init)
    }

    try {
      const response = await originalFetch.call(window, input, init)

      if (response.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        const store = window.localStorage.getItem('auth-storage');
        if (store) {
          try {
            const parsed = JSON.parse(store);
            if (parsed && parsed.state) {
              parsed.state.user = null;
              parsed.state.isInitialized = false;
              window.localStorage.setItem('auth-storage', JSON.stringify(parsed));
            }
          } catch (e) { }
        }
        window.location.href = '/login?expired=true'
        return response
      }

      return response
    } catch (error) {
      throw error
    }
  }
}
