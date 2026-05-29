import { useThemeStore } from '@/store/themeStore'
import { ArrowRight, LucideIcon } from 'lucide-react'

interface QuickLinkProps {
  label: string
  icon: LucideIcon
  onClick?: () => void
}

export function QuickLink({ label, icon: Icon, onClick }: QuickLinkProps) {
  const isDark = useThemeStore((state) => state.isDark)
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group ${
        isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-50'
      }`}
    >
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        <span className="text-sm font-bold">{label}</span>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
    </button>
  )
}
