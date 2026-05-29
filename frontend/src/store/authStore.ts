import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@/services/authService'
import { APIError } from '@/lib/api'


import type { IUser } from '@/types/user';
import type { IAuthState } from '@/types/auth'

export interface AuthStore extends IAuthState {
  isInitialized: boolean
  login: ( username: string, password: string ) => Promise<void>
  logout: () => Promise<void>
  setUser: ( user: IUser | null ) => void
  clearError: () => void
  initializeAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>()(
  persist(
    ( set, get ) => ( {
      isInitialized: false,
      user: null,
      isLoading: false, error: null,

      login: async ( username: string, password: string ) => {
        set( { isLoading: true, error: null } )
        try {
          const response = await authService.login( username, password )

          if ( response.success && response.data ) {
            const { user } = response.data

            set( {
              user,
              isLoading: false,
              error: null,
            } )
          } else {
            throw new Error( response.message || 'Login failed' )
          }
        } catch ( error ) {
          const errorMessage = error instanceof APIError ? error.message : ( error as Error ).message
          set( { error: errorMessage, isLoading: false } )
          throw error
        }
      },

      logout: async () => {
        set( { isLoading: true } )
        try {
          await authService.logout().catch( () => {
            // API logout might fail, but we still want to clear local state
          } )
        } finally {
          set( {
            user: null,
            isLoading: false,
            error: null,
          } )
        }
      },

      setUser: ( user: IUser | null ) => {
        set( { user } )
      },

      clearError: () => {
        set( { error: null } )
      },

      initializeAuth: async () => {
        // Prevent multiple initializations
        if ( get().isInitialized ) return

        // Only verify session if there's a persisted user from a previous session
        const currentUser = get().user
        if ( !currentUser ) {
          set( { isInitialized: true } )
          return
        }

        try {
          const response = await authService.getCurrentUser()
          if ( response.success && response.data ) {
            set( { user: response.data, isInitialized: true } )
          } else {
            // Session expired or invalid — clear persisted user
            set( { user: null, isInitialized: true } )
          }
        } catch ( error ) {
          // Cookie/session invalid — clear persisted user
          set( { user: null, isInitialized: true } )
        }
      },
    } ),
    {
      name: 'auth-storage',
      partialize: ( state ) => ( {
        user: state.user,
      } ),
    }
  )
)
