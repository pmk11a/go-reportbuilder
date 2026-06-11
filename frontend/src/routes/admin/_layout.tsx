import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { NotFoundComponent, GlobalErrorComponent } from '@/components/ui/feedback/error-pages'
import { useAuthStore } from '@/store/authStore'
import { getHomePath, isAdmin } from '@/utils/auth'
import { meFn } from '@/server/functions/auth'

export const Route = createFileRoute('/admin/_layout')({
  beforeLoad: async ({ location }) => {
    let user = useAuthStore.getState().user

    if (!user) {
      try {
        const me = await meFn()
        useAuthStore.getState().setUser(me)
        useAuthStore.setState({ isInitialized: true })
        user = me
      } catch {
        useAuthStore.setState({ isInitialized: true })
      }
    }

    if (!user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }

    if (!isAdmin(user)) {
      throw redirect({ to: getHomePath(user) })
    }
  },
  component: AdminLayout,
  notFoundComponent: () => <NotFoundComponent isLayout={true} />,
  errorComponent: ({ error, reset }) => <GlobalErrorComponent error={error} reset={reset} isLayout={true} />,
})
