import { createFileRoute, redirect } from '@tanstack/react-router'
import { AdminLayout } from '@/components/layouts/AdminLayout'
import { useAuthStore } from '@/store/authStore'

export const Route = createFileRoute('/(admin)/__layout')({
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
  },
  component: AdminLayout,
})
