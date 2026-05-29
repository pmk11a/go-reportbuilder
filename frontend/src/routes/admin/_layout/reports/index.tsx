import { createFileRoute } from '@tanstack/react-router'
import { Button, Card, EmptyState } from '@/components/ui'
import { BarChart3 } from 'lucide-react'

export const Route = createFileRoute('/admin/_layout/reports/')({
  component: ReportsPage,
})

function ReportsPage() {
  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground mt-2">View and manage system reports</p>
        </div>
        <Button>Generate Report</Button>
      </div>

      <Card className="p-8">
        <EmptyState
          icon={<BarChart3 className="h-10 w-10 text-muted-foreground" />}
          title="No reports available"
          description="Generate your first report to get started"
        />
      </Card>
    </div>
  )
}
