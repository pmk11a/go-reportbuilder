import { useState, useEffect } from 'react'
import { MainLayout } from './MainLayout'

function AdminSkeleton() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export function AdminLayout() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <AdminSkeleton />

  return <MainLayout />
}
