import { createFileRoute } from '@tanstack/react-router'
import { UserDetailPage } from '@/components/admin/users/pages/UserDetailPage'

export const Route = createFileRoute("/admin/_layout/master-data/users/$id/")({
  component: UserDetailPage,
})
