import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { getHomePath } from '@/utils/auth'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { user } = useAuthStore.getState()
    throw redirect({ to: getHomePath(user) })
  },
})
