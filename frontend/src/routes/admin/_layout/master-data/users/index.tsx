import { createFileRoute } from '@tanstack/react-router'
import { UsersListPage } from '@/domains/users/components/users/pages/UsersListPage'

export const Route = createFileRoute("/admin/_layout/master-data/users/")({
  component: UsersListPage,
})
