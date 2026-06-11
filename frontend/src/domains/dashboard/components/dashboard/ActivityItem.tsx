import { useThemeStore } from '@/shared/stores/themeStore'
import { LucideIcon } from 'lucide-react'

interface ActivityItemProps {
  title: string
  time: string
  icon: LucideIcon
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'red'
}

export function ActivityItem({ title, time, icon: Icon, color = 'blue' }: ActivityItemProps) {
  const isDark = useThemeStore((state) => state.isDark)
  
  const iconColors = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30',
    emerald: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30',
    indigo: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30',
    amber: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30',
  }

  return (
    <div className="flex items-start space-x-4 group">
      <div className={`p-2 rounded-xl mt-0.5 transition-transform group-hover:scale-110 ${iconColors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</p>
        <p className="text-xs font-medium text-slate-500">{time}</p>
      </div>
    </div>
  )
}
