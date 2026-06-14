import { useAuthStore } from '@/shared/stores/authStore'


export function useAuth() {
  const { user, isLoading, login, logout, error, clearError, setUser } = useAuthStore()

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    login,
    logout,
    clearError,
    setUser,
  }
}

export function useRequireAuth() {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    throw new Error('Not authenticated')
  }

  return auth
}

export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return (props: P) => {
    const auth = useAuth()

    if (!auth.isAuthenticated) {
      return <div>Please log in to access this page</div>
    }

    return <Component {...props} />
  }
}
