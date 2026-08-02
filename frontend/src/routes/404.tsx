import { createFileRoute } from '@tanstack/react-router'
import { NotFoundComponent } from '@/shared/ui/feedback/error-pages'

export const Route = createFileRoute('/404')({
  component: NotFoundPage,
})

function NotFoundPage() {
  return <NotFoundComponent />
}
