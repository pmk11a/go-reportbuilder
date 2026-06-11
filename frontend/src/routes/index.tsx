import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/shared/stores/authStore'
import { getHomePath } from '@/shared/auth/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { user } = useAuthStore.getState()
    throw redirect({ to: getHomePath(user) })
  },
})
