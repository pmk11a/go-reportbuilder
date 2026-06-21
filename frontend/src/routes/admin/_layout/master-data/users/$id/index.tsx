import { createFileRoute } from '@tanstack/react-router'
import { UserDetailPage } from '@/domains/users/components/users/pages/UserDetailPage'

export const Route = createFileRoute('/admin/_layout/master-data/users/$id/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()
  return <UserDetailPage userId={id} />
}
