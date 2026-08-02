import { Link, useLocation } from '@tanstack/react-router'
import {
  Home,
  User,
  Clock,
  FileText,
// // @ts-expect-error - unused variable
// @ts-expect-error - unused variable
  HelpCircle,
//   LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useThemeStore } from '@/shared/stores/themeStore'

interface SidebarProps {
  open: boolean
  onToggle?: () => void
}

const navItems = [
  { icon: Home, label: 'Beranda', href: '/karyawan/dashboard' },
  { icon: Clock, label: 'Presensi & Cuti', href: '/karyawan/attendance' },
  { icon: FileText, label: 'Slip Gaji', href: '/karyawan/payroll' },
  { icon: User, label: 'Profil Saya', href: '/karyawan/profile' },
]

export function KaryawanSidebar({ open, onToggle }: SidebarProps) {
  const isDark = useThemeStore((state) => state.isDark)
  const location = useLocation()

  return (
    <aside
      className={`${
        open ? 'w-72' : 'w-20'
      } relative flex flex-col h-screen border-r border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-950 transition-[width] duration-500 ease-in-out z-30`}
    >
      <div className="h-20 flex items-center px-6 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <User className="text-white w-6 h-6" />
          </div>
          {open && (
            <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              DAPEN<span className="text-indigo-600">Staff</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : `hover:bg-indigo-50 dark:hover:bg-indigo-900/10 ${
                      isDark ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-600 hover:text-indigo-600'
                    }`
              } ${open ? 'justify-start' : 'justify-center'}`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
              {open && <span>{item.label}</span>}
            </Link>
          )
        })}
      </div>

      <div className="p-4 mt-auto">
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-dashed ${
            isDark ? 'border-slate-800 text-slate-500 hover:text-slate-300' : 'border-slate-200 text-slate-400 hover:text-slate-600'
          } transition-colors ${open ? 'justify-start' : 'justify-center'}`}
        >
          {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {open && <span className="text-sm font-medium">Sembunyikan</span>}
        </button>
      </div>
    </aside>
  )
}
