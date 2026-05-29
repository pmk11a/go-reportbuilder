import { createFileRoute, redirect } from '@tanstack/react-router'
import { KaryawanLayout } from '@/components/layouts/KaryawanLayout'
import { NotFoundComponent, GlobalErrorComponent } from '@/components/ui/feedback/error-pages'
import { useAuthStore } from '@/store/authStore'
import { getHomePath, isKaryawan } from '@/utils/auth'

export const Route = createFileRoute('/karyawan/_layout')({
  beforeLoad: async ({ location }) => {
    const { user } = useAuthStore.getState()
    
    if (!user) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }

    if (!isKaryawan(user)) {
      throw redirect({
        to: getHomePath(user),
      })
    }
  },
  component: KaryawanLayout,
  notFoundComponent: () => <NotFoundComponent isLayout={true} />,
  errorComponent: ({ error, reset }) => <GlobalErrorComponent error={error} reset={reset} isLayout={true} />,
})
