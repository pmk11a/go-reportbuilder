import { Link, useLocation } from '@tanstack/react-router'
import {
  LayoutDashboard,
  Users,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Menu
} from 'lucide-react'
import { useThemeStore } from '@/shared/stores/themeStore'

interface SidebarProps {
  open: boolean
  onToggle?: () => void
}

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/admin/dashboard' },
  { icon: Users, label: 'User Management', href: '/admin/_layout/master-data/users' },
  { icon: FileText, label: 'Document Center', href: '/admin/documents' },
  { icon: BarChart3, label: 'Analytics', href: '/admin/reports' },
  { icon: ShieldCheck, label: 'Security', href: '/admin/security' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
]

export function Sidebar({ open, onToggle }: SidebarProps) {
  const isDark = useThemeStore((state) => state.isDark)
  const location = useLocation()

  return (
    <aside
      className={`${
        open ? 'w-72' : 'w-20'
      } relative flex flex-col h-screen border-r border-white/10 dark:border-slate-800/50 bg-white/70 dark:bg-slate-950/80 backdrop-blur-xl transition-all duration-500 ease-in-out z-30`}
    >
      {/* Brand Logo */}
      <div className="h-20 flex items-center px-6 mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          {open && (
            <span className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              DAPEN<span className="text-blue-600">Admin</span>
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`group flex items-center gap-4 rounded-2xl px-4 py-3.5 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : `hover:bg-blue-50 dark:hover:bg-blue-900/10 ${
                      isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'
                    }`
              } ${open ? 'justify-start' : 'justify-center'}`}
            >
              <item.icon className={`h-5 w-5 flex-shrink-0 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : ''}`} />
              {open && (
                <span className="truncate">{item.label}</span>
              )}
              {isActive && open && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Footer / Toggle */}
      <div className="p-4 mt-auto">
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl border border-dashed ${
            isDark ? 'border-slate-800 text-slate-500 hover:text-slate-300' : 'border-slate-200 text-slate-400 hover:text-slate-600'
          } transition-colors ${open ? 'justify-start' : 'justify-center'}`}
        >
          {open ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          {open && <span className="text-sm font-medium">Collapse Sidebar</span>}
        </button>
      </div>

      {/* Subtle Bottom Blob */}
      {open && (
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none -z-10" />
      )}
    </aside>
  )
}
