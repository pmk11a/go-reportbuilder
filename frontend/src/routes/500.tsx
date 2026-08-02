import { createFileRoute } from '@tanstack/react-router'
import { ServerErrorComponent } from '@/shared/ui/feedback/error-pages'

export const Route = createFileRoute('/500')({
  component: ServerErrorPage,
})

function ServerErrorPage() {
  return <ServerErrorComponent />
}
