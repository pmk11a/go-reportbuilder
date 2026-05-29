import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { ThemeToggle } from './ThemeToggle'
import { useThemeStore } from '@/store/themeStore'
import { useAuthStore } from '@/store/authStore'
import { LogOut, User } from 'lucide-react'

export function Navbar() {
  const isDark = useThemeStore((state) => state.isDark)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const location = useLocation()
  const navigate = useNavigate()

  // Don't show navbar on auth or admin pages to match laravel-next design
  if (
    location.pathname.includes('/login') || 
    location.pathname.includes('/register') ||
    location.pathname.startsWith('/admin')
  ) {
    return null
  }

  const handleLogout = async () => {
    await logout()
    navigate({ to: '/login' })
  }

  return (
    <nav
      className={`h-16 border-b transition-colors duration-200 ${
        isDark
          ? 'bg-slate-900 border-slate-800'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
          <svg
            className="w-8 h-8 text-blue-600"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
          <span className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            DAPEN
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center space-x-6">
          <Link
            to="/about"
            className={`transition-colors ${
              location.pathname === '/about'
                ? 'text-blue-600 font-semibold'
                : isDark
                  ? 'text-gray-300 hover:text-white'
                  : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            About
          </Link>
        </div>

        {/* IUser Actions & Theme Toggle */}
        <div className="flex items-center space-x-4">
          {user && (
            <div className="flex items-center space-x-4 pr-4 border-r border-gray-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {user.full_name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
