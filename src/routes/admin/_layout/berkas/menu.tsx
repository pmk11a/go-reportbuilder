import { createFileRoute } from '@tanstack/react-router'
import { MenuDataTable } from '@/domains/menu/components/menu/MenuDataTable'

export const Route = createFileRoute('/admin/_layout/berkas/menu')({
  component: MenuRoute,
})

function MenuRoute() {
  return (
    <div className="w-full">
      <MenuDataTable />
    </div>
  )
}
