import { createFileRoute } from '@tanstack/react-router'
import { LayoutDashboard } from 'lucide-react'
import { useThemeStore } from '@/shared/stores/themeStore'

export const Route = createFileRoute('/admin/_layout/reports/builder/')({
  component: BuilderIndexPlaceholder,
})

function BuilderIndexPlaceholder() {
  const isDark = useThemeStore((s) => s.isDark)

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-8 text-center">
      <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
        <LayoutDashboard className={`w-8 h-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
      </div>
      <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
        Report Builder
      </h2>
      <p className={`text-sm max-w-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
        Silakan pilih laporan dari daftar di sebelah kiri untuk mengedit konfigurasinya, atau buat laporan baru.
      </p>
    </div>
  )
}
