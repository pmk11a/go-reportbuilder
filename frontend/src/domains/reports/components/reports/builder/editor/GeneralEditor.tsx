import { Input, Textarea, Checkbox, Button } from '@/shared/ui';
import type { IReportConfig } from '@/domains/reports/types';
import { Trash2 } from 'lucide-react';
import { DataSourceManager } from './DataSourceManager';

export function GeneralEditor({ config, onChange, isDark, onDelete }: { config: Partial<IReportConfig>, onChange: any, isDark: boolean, onDelete?: () => void }) {
  const labelClass = `text-xs font-semibold block ${isDark ? 'text-slate-300' : 'text-slate-700'}`;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        <div className="md:col-span-8 space-y-1">
          <label className={labelClass}>Nama Laporan</label>
          <Input 
            className={`h-9 rounded-xl ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
            type="text" 
            value={config.nama_laporan || ''}
            onChange={e => onChange({ ...config, nama_laporan: e.target.value })}
          />
        </div>
        <div className="md:col-span-4 space-y-1">
          <label className={labelClass}>Kode Menu</label>
          <Input 
            className={`h-9 rounded-xl ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
            type="text" 
            value={config.KODEMENU || ''}
            onChange={e => onChange({ ...config, KODEMENU: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1">
        <label className={labelClass}>Deskripsi Laporan</label>
        <Textarea 
          className={`rounded-xl ${isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-900'}`}
          rows={3}
          value={config.deskripsi || ''}
          onChange={e => onChange({ ...config, deskripsi: e.target.value })}
        />
      </div>
      <div>
        <label className={`flex items-center text-sm font-medium cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
          <Checkbox 
            className="mr-2"
            checked={config.status_aktif !== false} // default true
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...config, status_aktif: e.target.checked })}
          />
          Laporan Aktif (Ditampilkan di Menu)
        </label>
      </div>

      <div className={`h-px w-full ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}></div>

      <DataSourceManager 
        config={config}
        onChange={onChange}
        isDark={isDark}
        scope="global"
        title="Global Data Sources"
        description="Ambil data dari database yang bisa digunakan di semua tab (Filter, Header, Body, Footer)."
      />

      {onDelete && config.id_laporan && (
        <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800">
          <Button variant="destructive" onClick={onDelete} className="w-full sm:w-auto">
            <Trash2 className="w-4 h-4 mr-2" /> Hapus Laporan Ini
          </Button>
          <p className="text-xs text-slate-500 mt-2">Menghapus laporan akan menghapus seluruh data tab, filter, dataset, dan layout secara permanen.</p>
        </div>
      )}
    </div>
  );
}
