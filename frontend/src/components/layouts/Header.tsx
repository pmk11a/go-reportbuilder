import { Bell, Search, User, LogOut, Moon, Sun, Settings, HelpCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'

interface HeaderProps {
  onMenuClick?: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { isDark, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <header className="h-20 flex items-center justify-between px-8 bg-white/50 dark:bg-slate-950/50 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 sticky top-0 z-20">
      {/* Search Bar - Mockup */}
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search dashboard..." 
            className={`w-full h-11 pl-11 pr-4 rounded-2xl border transition-all outline-none ${
              isDark 
                ? 'bg-slate-900/50 border-slate-800 focus:border-blue-500/50 focus:bg-slate-900' 
                : 'bg-slate-100/50 border-slate-200 focus:border-blue-500/50 focus:bg-white'
            }`}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3">
        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border transition-all ${
            isDark 
              ? 'bg-slate-900 border-slate-800 text-yellow-400 hover:bg-slate-800' 
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications */}
        <button className={`relative p-2.5 rounded-xl border transition-all ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800' 
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}>
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950" />
        </button>

        {/* Vertical Divider */}
        <div className="w-px h-8 bg-slate-200 dark:bg-slate-800 mx-2" />

        {/* IUser Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center space-x-3 p-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            <div className="flex flex-col items-end hidden sm:flex">
              <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {user?.full_name || 'Admin User'}
              </span>
              <span className="text-xs font-medium text-blue-600">
                {user?.role === 'admin' ? 'Super Admin' : 'Employee'}
              </span>
            </div>
            <div className={`p-2 rounded-xl border ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-slate-50 border-slate-200'} cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}>
              <User size={18} className={isDark ? 'text-slate-300' : 'text-slate-600'} />
            </div>
          </button>

          {/* Profile Menu Dropdown */}
          {isProfileOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsProfileOpen(false)} />
              <div className={`absolute right-0 mt-3 w-64 rounded-3xl border shadow-2xl z-20 py-2 animate-in fade-in zoom-in duration-200 ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'
              }`}>
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 mb-2">
                  <p className="text-sm font-bold truncate">{user?.email}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold mt-1">Management</p>
                </div>
                <button className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Account Settings</span>
                </button>
                <button className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium">Support Center</span>
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-2 mx-4" />
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-bold">Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
