import { createFileRoute } from '@tanstack/react-router'
import { UsersListPage } from '@/components/admin/users/pages/UsersListPage'

export const Route = createFileRoute("/admin/_layout/master-data/users/")({
  component: UsersListPage,
})
