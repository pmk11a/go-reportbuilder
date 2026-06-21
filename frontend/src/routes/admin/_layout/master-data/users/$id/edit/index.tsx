import { createFileRoute } from '@tanstack/react-router'
import { UserFormPage } from '@/domains/users/components/users/pages/UserFormPage'

export const Route = createFileRoute('/admin/_layout/master-data/users/$id/edit/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <UserFormPage mode="edit" userEid={id} />
}
