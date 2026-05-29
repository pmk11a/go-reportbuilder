import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { NotFoundComponent, GlobalErrorComponent } from '@/components/ui/feedback/error-pages'
import { useAuthStore } from '@/store/authStore'
import { getHomePath, isAdmin } from '@/utils/auth'

export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: async ({ location }) => {
    // Access state directly to ensure we have the post-initialization value
    const auth = useAuthStore.getState()
    const user = auth.user
    
    console.log('Admin Guard Checking:', { user, isInitialized: auth.isInitialized })

    if (!user) {
      console.log('Access Denied: No user session. Redirecting to login.')
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    if (!isAdmin(user)) {
      console.log('Access Denied: IUser is not authorized for admin area. Redirecting.')
      throw redirect({
        to: getHomePath(user),
      })
    }
  },
  component: AdminLayout,
  notFoundComponent: () => <NotFoundComponent isLayout={true} />,
  errorComponent: ({ error, reset }) => <GlobalErrorComponent error={error} reset={reset} isLayout={true} />,
})
