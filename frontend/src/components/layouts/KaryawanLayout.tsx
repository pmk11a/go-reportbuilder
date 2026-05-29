import { Outlet } from '@tanstack/react-router'

export function KaryawanLayout() {
  return (
    <div className="h-screen w-screen overflow-hidden">
      <main className="h-full w-full overflow-y-auto custom-scrollbar">
        <Outlet />
      </main>
    </div>
  )
}


