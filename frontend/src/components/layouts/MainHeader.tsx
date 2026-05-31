import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useMatches } from "@tanstack/react-router"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import { useMenuStore } from "@/store/menuStore"
import { LanguageToggle } from "@/components/LanguageToggle"
import { ThemeToggle } from "@/components/ThemeToggle"
import { authService } from "@/services/authService"
import { Settings, KeyRound, LogOut, CheckCircle2 } from "lucide-react"
import { useModalStore } from "@/store/modalStore"

export function MainHeader() {
  const isDark = useThemeStore((state) => state.isDark)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const matches = useMatches()
  const { menus } = useMenuStore()

  const pathname = matches[matches.length - 1]?.pathname || '/'

  const { title, subtitle } = useMemo(() => {
    if (pathname === '/admin' || pathname === '/admin/dashboard' || pathname === '/') {
      return {
        title: `Selamat Datang, ${user?.full_name || "Guest IUser"}`,
        subtitle: 'Ringkasan dashboard Anda.'
      }
    }

    const findMenuTitle = (menuList: any[]): string | null => {
      for (const m of menuList) {
        if (m.route === pathname) return m.title
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
        title: `Manajemen ${menuTitle}`,
        subtitle: `Kelola pengaturan dan data untuk modul ${menuTitle}.`
      }
    }

    const pathSegments = pathname.split('/').filter(Boolean)
    const lastSegment = pathSegments[pathSegments.length - 1] || ''
    const fallbackTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1)

    return {
      title: fallbackTitle ? `Halaman ${fallbackTitle}` : 'DAPEN Dashboard',
      subtitle: 'Detail halaman sistem.'
    }
  }, [pathname, user, menus])

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
              className="w-11 h-11 rounded-full bg-sky-600 border-[3px] border-white dark:border-slate-800 flex items-center justify-center text-white text-lg font-black shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {user?.full_name?.charAt(0) || "G"}
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsProfileOpen(false)} />
                <div className={`absolute right-0 mt-3 w-64 rounded-3xl border shadow-2xl z-50 py-3 animate-in fade-in zoom-in-95 duration-200 ${
                  isDark ? "bg-[#0f172a] border-white/5 text-white" : "bg-white border-slate-100 text-[#1e293b]"
                }`}>
                  <div className="px-5 py-3 border-b border-slate-100 dark:border-white/5 mb-2">
                    <p className="text-sm font-bold truncate">{user?.email || "admin@dapen.id"}</p>
                    <p className="text-xs text-sky-500 uppercase tracking-widest font-black mt-1">
                      {user?.role === "admin" ? "Super Admin" : "Pengurus"}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      setToastMessage({ type: "success", text: "Fitur Pengaturan Akun segera hadir!" });
                    }}
                    className={`w-full flex items-center space-x-3 px-5 py-3 text-left transition-colors ${
                      isDark ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-sky-600"
                    }`}
                  >
                    <Settings size={18} />
                    <span className="text-sm font-bold">Pengaturan Akun</span>
                  </button>
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      openModal("changePassword");
                    }}
                    className={`w-full flex items-center space-x-3 px-5 py-3 text-left transition-colors ${
                      isDark ? "hover:bg-white/5 text-slate-300 hover:text-white" : "hover:bg-slate-50 text-slate-600 hover:text-sky-600"
                    }`}
                  >
                    <KeyRound size={18} />
                    <span className="text-sm font-bold">Ganti Password</span>
                  </button>
                  <div className={`h-px my-2 mx-4 ${isDark ? "bg-white/5" : "bg-slate-100"}`} />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-5 py-3 text-left text-red-500 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-black">Keluar</span>
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
