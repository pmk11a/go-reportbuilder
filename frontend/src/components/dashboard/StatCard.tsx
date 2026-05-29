import { useThemeStore } from '@/store/themeStore'
import { ArrowUpRight, ArrowDownRight, LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number | string
  icon: LucideIcon
  trend?: string
  trendType?: 'up' | 'down'
  color?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple'
}

export function StatCard({ label, value, icon: Icon, trend, trendType, color = 'blue' }: StatCardProps) {
  const isDark = useThemeStore((state) => state.isDark)
  
  const bgColors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  }

  const iconColors = {
    blue: 'text-blue-600',
    indigo: 'text-indigo-600',
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
  }

  return (
    <div className={`rounded-[32px] border p-7 transition-all hover:scale-[1.02] duration-300 ${
      isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
    }`}>
      <div className="flex items-center justify-between mb-5">
        <div className={`p-3 rounded-2xl ${bgColors[color]}`}>
          <Icon className={`w-6 h-6 ${iconColors[color]}`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold ${
            trendType === 'up' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' : 'text-red-600 bg-red-50 dark:bg-red-900/20'
          }`}>
            {trendType === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{trend}</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{label}</p>
        <h3 className={`text-3xl font-black mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </h3>
      </div>
    </div>
  )
}
