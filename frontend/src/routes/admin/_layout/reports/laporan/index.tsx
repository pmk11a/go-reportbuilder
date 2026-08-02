import { createFileRoute } from '@tanstack/react-router'
import { FileText } from 'lucide-react'

export const Route = createFileRoute('/admin/_layout/reports/laporan/')({
  head: () => ({
    meta: [
      { title: 'Laporan Dinamis - DAPEN' },
    ],
  }),
  component: LaporanIndexPage,
})

function LaporanIndexPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-full">
      <div className="w-20 h-20 bg-secondary-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
        <FileText className="w-10 h-10 text-secondary-300 dark:text-slate-500" />
      </div>
      <h2 className="text-xl font-semibold text-secondary-900 dark:text-slate-200 mb-2">Belum Ada Laporan Terpilih</h2>
      <p className="text-secondary-500 dark:text-slate-400 max-w-sm">
        Pilih salah satu laporan dari menu di sebelah kiri untuk melihat detail dan mengeksekusi laporan.
      </p>
    </div>
  )
}
