import { useState } from 'react';
import { ReportEditor } from './ReportEditor';
import { ReportPreview } from './ReportPreview';
import type { ILayoutConfig, IReportConfig } from '@/domains/reports/types';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useThemeStore } from '@/shared/stores/themeStore';
import { Button, Tabs } from '@/shared/ui';

export function ReportBuilder() {
  const navigate = useNavigate();
  const isDark = useThemeStore((s) => s.isDark);
  
  const [zoom, setZoom] = useState(0.8);

  // Full report configuration state
  const [reportConfig, setReportConfig] = useState<Partial<IReportConfig>>({
    nama_laporan: 'Kas Harian',
    KODEMENU: '020101',
    status_aktif: true,
    deskripsi: 'Laporan kas harian dengan mutasi TUNAI dan CH/GB',
    filters: [
      { id_parameter: 1, id_laporan: 140, nama_filter: 'tgl_awal', label: 'Tanggal Awal', tipe_input: 'date', wajib_isi: true, posisi: 1, konfigurasi: null, nilai_default: null },
      { id_parameter: 2, id_laporan: 140, nama_filter: 'tgl_akhir', label: 'Tanggal Akhir', tipe_input: 'date', wajib_isi: true, posisi: 2, konfigurasi: null, nilai_default: null }
    ],
    datasets: [
      { id_query: 1, id_laporan: 140, nama_dataset: 'T1', query_sumber_data: 'EXEC Sp_LapSaldoAwal @TglAwal', urutan: 1, visible: true, deskripsi: 'Saldo Awal' },
      { id_query: 2, id_laporan: 140, nama_dataset: 'T2', query_sumber_data: 'EXEC Sp_LapKasHarian @TglAwal', urutan: 2, visible: true, deskripsi: 'Mutasi' }
    ]
  });

  // Layout config state
  const [layoutConfig, setLayoutConfig] = useState<ILayoutConfig[]>([
    {
      type: 'header',
      rows: [
        {
          columns: [
            { text: 'DANA PENSIUN PEMBERI KERJA', align: 'left', width: '50%', sourceType: 'static' },
            { text: 'Tanggal: {current_date}', align: 'right', width: '50%', sourceType: 'system' }
          ]
        },
        {
          columns: [
            { text: 'LAPORAN KAS', align: 'center', colSpan: 2, sourceType: 'static' }
          ]
        },
        {
          columns: [
            { text: '{nama_laporan}', align: 'center', colSpan: 2, sourceType: 'database' }
          ]
        }
      ]
    },
    {
      type: 'body',
      rows: [
        {
          columns: [
            {
              width: '100%',
              table: {
                dataset: 'T2',
                headerRows: [
                  [
                    { text: 'Tgl.', rowSpan: 2, width: '8%', align: 'center' },
                    { text: 'No. Bukti', rowSpan: 2, width: '12%', align: 'center' },
                    { text: 'Uraian', rowSpan: 2, width: '25%', align: 'center' },
                    { text: 'Perk.', rowSpan: 2, width: '10%', align: 'center' },
                    { text: 'TUNAI', colSpan: 2, align: 'center' },
                    { text: 'CH / GB', colSpan: 2, align: 'center' }
                  ],
                  [
                    { text: 'Penerimaan', align: 'center', width: '11.25%' },
                    { text: 'Pengeluaran', align: 'center', width: '11.25%' },
                    { text: 'Penerimaan', align: 'center', width: '11.25%' },
                    { text: 'Pengeluaran', align: 'center', width: '11.25%' }
                  ]
                ],
                dataColumns: [
                  { field: 'tanggal', align: 'center' },
                  { field: 'nobukti', align: 'center' },
                  { field: 'Keterangan', align: 'left' },
                  { field: 'lawan', align: 'left' },
                  { field: 'Debet', align: 'right' },
                  { field: 'kredit', align: 'right' },
                  { field: 'Debet2', align: 'right' },
                  { field: 'kredit2', align: 'right' }
                ]
              }
            }
          ]
        }
      ]
    },
    {
      type: 'footer',
      rows: [
        {
          justifyContent: 'space-between',
          columns: [
            { title: 'Kontrol,', name: '.......................', role: 'Bag. Kontrol', align: 'center' },
            { title: 'Kasir,', name: '.......................', role: 'Kasir', align: 'center' },
            { title: 'Mengetahui,', name: '.......................', role: 'Pimpinan', align: 'center' }
          ]
        }
      ]
    }
  ]);

  const handleSave = () => {
    const finalPayload = {
      ...reportConfig,
      komponen: [
        {
          nama_komponen: 'DynamicLayout',
          konfigurasi_layout: JSON.stringify(layoutConfig)
        }
      ]
    };
    console.log('Final Save Payload:', JSON.stringify(finalPayload, null, 2));
    alert('Konfigurasi Laporan disimpan (Lihat console log)');
  };

  return (
    <div className={`flex flex-col h-screen ${isDark ? 'bg-[#0f172a]' : 'bg-slate-50'}`}>
      {/* Top Navbar */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 gap-4 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="flex items-center gap-4">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: '/admin/reports/laporan' })}
            className="rounded-full w-9 h-9 p-0 shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className={`text-lg sm:text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Report Builder</h1>
            <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Susun Konfigurasi Laporan (Filter, SP, Layout)</p>
          </div>
        </div>
        <Button onClick={handleSave} className="w-full sm:w-auto">
          <Save className="w-4 h-4 mr-2" /> Simpan Laporan
        </Button>
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto lg:overflow-hidden bg-slate-50 dark:bg-[#0f172a]">
        
        {/* Desktop Split Screen */}
        <div className="hidden lg:flex flex-row h-full p-6 gap-6">
          {/* Left Side: Editor */}
          <div className="w-1/2 max-w-175 h-full flex flex-col shrink-0">
            <ReportEditor 
              reportConfig={reportConfig} 
              setReportConfig={setReportConfig}
              layoutConfig={layoutConfig} 
              setLayoutConfig={setLayoutConfig} 
            />
          </div>
          
          {/* Right Side: Preview */}
          <div className={`flex-1 h-full rounded-3xl relative overflow-hidden border ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
            <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 shadow-lg rounded-full p-1.5 flex gap-1 z-50 border border-slate-200 dark:border-slate-700">
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="h-8 w-8 rounded-full">
                <span className="text-lg font-bold leading-none">-</span>
              </Button>
              <div className="flex items-center justify-center w-12 text-xs font-medium dark:text-slate-200">
                {Math.round(zoom * 100)}%
              </div>
              <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full">
                <span className="text-lg font-bold leading-none">+</span>
              </Button>
            </div>

            <div className="absolute inset-0 overflow-x-hidden overflow-y-auto flex justify-center items-start pt-16 sm:pt-20 pb-8">
              <ReportPreview config={layoutConfig} zoom={zoom} />
            </div>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="lg:hidden">
          <Tabs 
            tabs={[
              {
                label: 'Editor Konfigurasi',
                value: 'editor',
                content: (
                  <div className="lg:p-2 bg-slate-50 dark:bg-[#0f172a]">
                    <ReportEditor 
                      reportConfig={reportConfig} 
                      setReportConfig={setReportConfig}
                      layoutConfig={layoutConfig} 
                      setLayoutConfig={setLayoutConfig} 
                    />
                  </div>
                )
              },
              {
                label: 'Preview Laporan',
                value: 'preview',
                content: (
                  <div className={`w-full min-h-125 rounded-3xl relative overflow-hidden border ${isDark ? 'bg-slate-950 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                    <div className="absolute top-4 right-4 bg-white dark:bg-slate-800 shadow-lg rounded-full p-1.5 flex gap-1 z-50 border border-slate-200 dark:border-slate-700">
                      <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="h-8 w-8 rounded-full">
                        <span className="text-lg font-bold leading-none">-</span>
                      </Button>
                      <div className="flex items-center justify-center w-12 text-xs font-medium dark:text-slate-200">
                        {Math.round(zoom * 100)}%
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="h-8 w-8 rounded-full">
                        <span className="text-lg font-bold leading-none">+</span>
                      </Button>
                    </div>

                    <div className="absolute inset-0 overflow-x-hidden overflow-y-auto flex justify-center items-start pt-16 sm:pt-20 pb-8">
                      <ReportPreview config={layoutConfig} zoom={zoom} />
                    </div>
                  </div>
                )
              }
            ]}
          />
        </div>

      </div>
    </div>
  );
}
