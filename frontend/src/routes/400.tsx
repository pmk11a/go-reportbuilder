import { createFileRoute } from '@tanstack/react-router'
import { BadRequestComponent } from '@/shared/ui/feedback/error-pages'

export const Route = createFileRoute('/400')({
  component: BadRequestPage,
})

function BadRequestPage() {
  return <BadRequestComponent />
}
