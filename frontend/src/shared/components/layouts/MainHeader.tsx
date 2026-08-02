import  { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useMatches } from "@tanstack/react-router"
import { useAuthStore } from "@/shared/stores/authStore"
import { useThemeStore } from "@/shared/stores/themeStore"
import { useMenuStore } from "@/domains/menu/stores/menuStore"
import { LanguageToggle } from "@/shared/components/LanguageToggle"
import { ThemeToggle } from "@/shared/components/ThemeToggle"
// import {} from "@/domains/auth/services/"
import { Settings, KeyRound, LogOut, CheckCircle2 } from "lucide-react"
import { useModalStore } from "@/shared/stores/modalStore"
import { useTranslation } from "react-i18next"

export function MainHeader() {
  const { t } = useTranslation(["common", "accounting"])
  const isDark = useThemeStore((state) => state.isDark)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const matches = useMatches()
  const { menus } = useMenuStore()

  const pathname = matches[matches.length - 1]?.pathname || '/'

  // Normalize pathname for comparison: strip layout prefix
  const normalizedPath = pathname.replace(/^\/admin\/_layout/, '/admin').replace(/^\/karyawan\/_layout/, '/karyawan')

  // Capitalize each word helper
  const capWords = (str: string) => str.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  const { title, subtitle } = useMemo(() => {
    // Dashboard: match any admin root path
    if (normalizedPath === '/admin' || normalizedPath === '/admin/dashboard' || pathname === '/') {
      return {
        title: t('header.welcome_user', 'Welcome, {{name}}', { name: user?.full_name || "Guest" }),
        subtitle: t('header.dashboard_subtitle', 'Your dashboard summary.')
      }
    }

    const findMenuTitle = (menuList: any[]): string | null => {
      for (const m of menuList) {
        // Normalize menu route path for comparison
        const mRoute = m.route.replace(/^\/admin\/_layout/, '/admin').replace(/^\/karyawan\/_layout/, '/karyawan')
        if (mRoute === normalizedPath) return m.title
        if (m.items && m.items.length > 0) {
          const found = findMenuTitle(m.items)
          if (found) return found
        }
      }
      return null
    }

    const menuTitle = findMenuTitle(menus || [])
    if (menuTitle) {
      return {
        title: t('header.management_module', 'Management {{module}}', { module: menuTitle }),
        subtitle: t('header.management_subtitle', 'Manage settings and data for {{module}} module.', { module: menuTitle })
      }
    }

    // Fallback: clean path segments
    const pathSegments = pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1] || ''

    // If path has multiple segments, show the meaningful portion (strip layout-like prefixes)
    const cleanSegments = pathSegments.filter(s => s !== 'admin' && s !== '_layout' && s !== 'karyawan' && s !== '')
    const fallbackTitle = cleanSegments.length > 1
      ? capWords(cleanSegments[cleanSegments.length - 2])
      : capWords(lastSegment)

    return {
      title: fallbackTitle ? t('header.page_title', 'Page {{name}}', { name: fallbackTitle }) : t('header.default_title', 'DAPEN Dashboard'),
      subtitle: t('header.default_subtitle', 'Detail page of the system.')
    }
  }, [pathname, normalizedPath, user, menus, t])

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { openModal } = useModalStore()

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMessage])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      navigate({ to: "/login" })
    } catch (err: any) {
      console.error("Logout failed:", err)
    }
  }, [logout, navigate])

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl text-white shadow-2xl animate-in slide-in-from-top-6 duration-300 bg-emerald-600">
          <CheckCircle2 size={20} />
          <span className="text-sm font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex justify-between items-start w-full">
        <div>
          <h1 className={`text-[32px] font-black tracking-tight ${isDark ? "text-white" : "text-[#1e293b]"} leading-tight`}>
            {title}
          </h1>
          <p className={`${isDark ? "text-slate-500" : "text-[#475569]"} text-lg font-medium mt-1`}>{subtitle}</p>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <LanguageToggle />
          <ThemeToggle />
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-11 h-11 rounded-full bg-sky-600 border-[3px] border-white dark:border-slate-800 flex items-center justify-center text-white text-lg font-black shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              {user?.full_name?.charAt(0) || "G"}
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className={`absolute right-0 mt-3 w-64 rounded-3xl border shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200 ${isDark ? "bg-[#0f172a] border-white/5 text-white" : "bg-white border-slate-100 text-[#1e293b]"
                  }`}>
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 mb-2">
                    <p className="text-sm font-bold truncate">{user?.email || "admin@dapen.id"}</p>
                    <p className="text-xs text-sky-500 uppercase tracking-widest font-black mt-1">
                      {user?.role === "admin" ? t('header.super_admin', 'Super Admin') : t('header.operator', 'Operator')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      setToastMessage({ type: "success", text: t('header.feature_coming_soon', 'Account settings feature is coming soon!') });
                    }}
                    className={`w-full flex items-center space-x-3 px-5 py-3 text-left transition-colors cursor-pointer ${isDark ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-sky-600"
                      }`}
                  >
                    <Settings size={18} />
                    <span className="text-sm font-bold">{t('header.account_settings', 'Account Settings')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsProfileOpen(false);
                      openModal("changePassword");
                    }}
                    className={`w-full flex items-center space-x-3 px-5 py-3 text-left transition-colors cursor-pointer ${isDark ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-sky-600"
                      }`}
                  >
                    <KeyRound size={18} />
                    <span className="text-sm font-bold">{t('header.change_password', 'Change Password')}</span>
                  </button>
                  <div className={`h-px my-2 mx-4 ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-5 py-3 text-left text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-black">{t('header.logout', 'Logout')}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
