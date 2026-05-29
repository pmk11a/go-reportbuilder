import { createFileRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Card, LoadingState, Skeleton } from '@/components/ui'
import { apiClient } from '@/lib/api'

export const Route = createFileRoute('/(admin)/dashboard/')({
  component: DashboardPage,
})

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => apiClient.dashboard.getStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const stats = data?.data || {
    total_users: 0,
    total_karyawan: 0,
    total_kepesertaan: 0,
    activity_count: 0,
  }

  const StatCard = ({ label, value, isLoading }: { label: string; value: number; isLoading: boolean }) => (
    <Card className="p-6">
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      {isLoading ? (
        <Skeleton className="h-10 w-20 mt-2" />
      ) : (
        <p className="text-3xl font-bold mt-2">{value.toLocaleString()}</p>
      )}
    </Card>
  )

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to DAPEN Management System</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Users" value={stats.total_users} isLoading={isLoading} />
        <StatCard label="Total Karyawan" value={stats.total_karyawan} isLoading={isLoading} />
        <StatCard label="Total Kepesertaan" value={stats.total_kepesertaan} isLoading={isLoading} />
        <StatCard label="Total Activity" value={stats.activity_count} isLoading={isLoading} />
      </div>

      {isLoading && (
        <Card className="p-8">
          <LoadingState />
        </Card>
      )}
    </div>
  )
}
