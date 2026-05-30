import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useNavigate, useMatches } from "@tanstack/react-router"
import { useAuthStore } from "@/store/authStore"
import { useThemeStore } from "@/store/themeStore"
import { useMenuStore } from "@/store/menuStore"
import { LanguageToggle } from "@/components/LanguageToggle"
import { ThemeToggle } from "@/components/ThemeToggle"
import { authService } from "@/services/authService"
import { Settings, KeyRound, LogOut, CheckCircle2, AlertCircle, X, Lock, EyeOff, Eye } from "lucide-react"

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
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalError, setModalError] = useState("")

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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalError("")

    if (!oldPassword || !newPassword || !confirmPassword) {
      setModalError("Semua kolom password wajib diisi.")
      return
    }
    if (newPassword.length < 6) {
      setModalError("Password baru minimal 6 karakter.")
      return
    }
    if (newPassword !== confirmPassword) {
      setModalError("Konfirmasi password baru tidak cocok.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await authService.changePassword(oldPassword, newPassword)
      if (res.success) {
        setToastMessage({ type: "success", text: "Password berhasil diperbarui." })
        setIsResetPasswordOpen(false)
        setOldPassword("")
        setNewPassword("")
        setConfirmPassword("")
      } else {
        setModalError(res.message || "Gagal memperbarui password.")
      }
    } catch (err: any) {
      setModalError(err.message || "Terjadi kesalahan sistem.")
    } finally {
      setIsSubmitting(false)
    }
  }

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
                      setIsResetPasswordOpen(true);
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

      {/* Reset Password Modal */}
      {isResetPasswordOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-300">
          <div className={`relative w-full max-w-md p-8 rounded-[32px] border shadow-2xl animate-in zoom-in-95 duration-300 ${
            isDark ? "bg-[#0f172a] border-white/5 text-white" : "bg-white border-slate-100 text-[#1e293b]"
          }`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black tracking-tight">Ganti Password</h3>
              <button
                onClick={() => setIsResetPasswordOpen(false)}
                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-white/10 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-3 p-4 mb-6 rounded-2xl bg-red-500/10 text-red-500 border border-red-500/10 text-sm font-bold">
                <AlertCircle size={18} className="flex-shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Password Lama
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showOldPassword ? "text" : "password"}
                    placeholder="Masukkan password lama"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border font-bold text-sm bg-transparent outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? "border-white/10 text-white placeholder:text-slate-600" : "border-slate-200 text-slate-800 placeholder:text-slate-400"
                    }`}
                  />
                  <button type="button" onClick={() => setShowOldPassword(!showOldPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Password Baru
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Masukkan password baru"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border font-bold text-sm bg-transparent outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? "border-white/10 text-white placeholder:text-slate-600" : "border-slate-200 text-slate-800 placeholder:text-slate-400"
                    }`}
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-2 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Konfirmasi password baru"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full pl-12 pr-12 py-3.5 rounded-2xl border font-bold text-sm bg-transparent outline-none focus:ring-2 focus:ring-sky-500 ${
                      isDark ? "border-white/10 text-white placeholder:text-slate-600" : "border-slate-200 text-slate-800 placeholder:text-slate-400"
                    }`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors">
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className={`flex-1 py-3.5 rounded-2xl font-black text-sm transition-all duration-300 active:scale-95 ${
                    isDark ? "bg-white/5 hover:bg-white/10 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 rounded-2xl font-black text-sm bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-600/20 transition-all duration-300 active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
