import { createFileRoute } from '@tanstack/react-router'
import { 
  Home, 
  Clock, 
  Calendar, 
  FileText, 
  MessageSquare,
  TrendingUp,
  CheckCircle2
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useThemeStore } from '@/store/themeStore'
import { StatCard } from '@/components/dashboard/StatCard'
import { QuickLink } from '@/components/dashboard/QuickLink'

export const Route = createFileRoute('/karyawan/_layout/dashboard/')({
  component: KaryawanDashboard,
})

function KaryawanDashboard() {
  const { user } = useAuthStore()
  const isDark = useThemeStore((state) => state.isDark)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Employee Greeting */}
      <div className={`relative overflow-hidden rounded-[40px] p-10 ${
        isDark ? 'bg-indigo-900/30 border border-indigo-500/20' : 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/30'
      }`}>
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight">Halo, {user?.full_name || 'Rekan'}! 👋</h1>
          <p className="text-indigo-100 mt-2 text-lg font-medium max-w-xl">
            Selamat datang di portal karyawan DAPEN. Pantau presensi, ajukan cuti, dan kelola dokumen kepesertaan Anda dengan mudah.
          </p>
          <div className="flex flex-wrap gap-4 mt-8">
            <button className="px-6 py-3 bg-white text-indigo-600 rounded-2xl font-bold shadow-lg hover:scale-105 transition-all">
              Presensi Sekarang
            </button>
            <button className="px-6 py-3 bg-indigo-500/20 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold hover:bg-white/10 transition-all">
              Ajukan Cuti
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-indigo-400/20 rounded-full translate-y-1/2 blur-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard label="Sisa Cuti Tahunan" value="12 Hari" icon={Calendar} color="indigo" />
          <StatCard label="Total Jam Kerja" value="164 Jam" icon={Clock} color="purple" />
          <StatCard label="Status Kepesertaan" value="Aktif" icon={CheckCircle2} color="emerald" />
          <StatCard label="Pesan Pengumuman" value="03 Baru" icon={MessageSquare} color="blue" />
        </div>

        <div className="space-y-6">
          <div className={`p-8 rounded-[32px] border ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100 shadow-sm'
          }`}>
            <h3 className="text-xl font-bold mb-6">Tautan Cepat</h3>
            <div className="space-y-4">
              <QuickLink label="Unduh Slip Gaji Terbaru" icon={FileText} />
              <QuickLink label="Update Profil & Alamat" icon={Home} />
              <QuickLink label="Lapor Keluhan / Support" icon={TrendingUp} />
            </div>
          </div>

          <div className={`p-8 rounded-[32px] border bg-gradient-to-br from-emerald-500/10 to-teal-500/10 ${
            isDark ? 'border-emerald-500/20' : 'border-emerald-100'
          }`}>
            <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">Tips Hari Ini</h3>
            <p className="text-sm font-medium mt-2 text-slate-500">
              Jangan lupa untuk memverifikasi data kepesertaan Anda sebelum akhir kuartal ini untuk memastikan kelancaran administrasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
