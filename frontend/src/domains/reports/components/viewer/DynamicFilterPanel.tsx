import { useEffect } from 'react'
import { Button, Input } from '@/shared/ui'
import { Label } from '@/shared/ui/form'
import { Filter, Loader2, Play } from 'lucide-react'
import { useReportStore } from '../../stores/reportStore'
import { useReportConfig } from '../../hooks/useReport'
import { GenericBrowsePicker } from '@/domains/browse/components/browse/GenericBrowsePicker'
import { Each, Show } from '@/shared/ui/layout'
import { useThemeStore } from '@/shared/stores/themeStore'

interface DynamicFilterPanelProps {
  kodeMenu: string
  executeReport: any // useExecuteReport mutation instance
}

export function DynamicFilterPanel({ kodeMenu, executeReport }: DynamicFilterPanelProps) {
  const { data: config } = useReportConfig(kodeMenu)
  const filters = config?.filters || []
  
  const filterValues = useReportStore((s) => s.filterValues)
  const setFilterValue = useReportStore((s) => s.setFilterValue)
  const resetFilters = useReportStore((s) => s.resetFilters)
  
  const isDark = useThemeStore((s) => s.theme === 'dark')

  // Initialization: if filterValues is empty but we have filters, we might want defaults
  useEffect(() => {
    if (filters.length > 0 && Object.keys(filterValues).length === 0) {
      filters.forEach(f => {
        if (f.nilai_default) {
          setFilterValue(f.nama_filter, f.nilai_default)
        }
      })
    }
  }, [filters, filterValues, setFilterValue])

  const handleGenerate = () => {
    // Basic validation for required fields
    const missingRequired = []
    for (const f of filters) {
      if (f.wajib_isi && (!filterValues[f.nama_filter] || filterValues[f.nama_filter] === '')) {
        missingRequired.push(f.label)
      }
    }
    
    if (missingRequired.length > 0) {
      alert(`Mohon isi parameter wajib: ${missingRequired.join(', ')}`)
      return
    }

    executeReport.mutate(filterValues)
  }

  return (
    <Show 
      when={filters.length > 0} 
      fallback={
        <div className={`mb-6 p-4 flex items-center justify-between rounded-3xl border ${isDark ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl shadow-blue-500/5'}`}>
          <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Laporan ini tidak memiliki parameter filter.</p>
          <Button 
            onClick={handleGenerate} 
            disabled={executeReport.isPending}
            className="flex items-center gap-2"
          >
            <Show when={executeReport.isPending} fallback={<Play className="w-4 h-4" />}>
              <Loader2 className="w-4 h-4 animate-spin" />
            </Show>
            Generate Report
          </Button>
        </div>
      }
    >
      <div className={`mb-6 rounded-3xl border ${isDark ? 'bg-[#0f172a] border-white/5 shadow-2xl' : 'bg-white border-slate-100 shadow-xl shadow-blue-500/5'}`}>
        <div className={`py-3 px-4 border-b flex items-center gap-2 rounded-t-3xl ${isDark ? 'bg-slate-800/50 border-slate-700/50' : 'bg-slate-50/50 border-slate-100'}`}>
          <Filter className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
          <h3 className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>Parameter Laporan</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <Each of={filters}>
              {(filter) => (
                <div key={filter.nama_filter} className="space-y-1.5">
                  <Label className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {filter.label} <Show when={filter.wajib_isi}><span className="text-red-500">*</span></Show>
                  </Label>
                  
                  <Show when={filter.tipe_input === 'date'}>
                    <Input
                      type="date"
                      value={String(filterValues[filter.nama_filter] || '')}
                      onChange={(e) => setFilterValue(filter.nama_filter, e.target.value)}
                      className="w-full text-sm h-9 rounded-xl"
                    />
                  </Show>
                  <Show when={filter.tipe_input === 'number'}>
                    <Input
                      type="number"
                      value={String(filterValues[filter.nama_filter] || '')}
                      onChange={(e) => setFilterValue(filter.nama_filter, e.target.value)}
                      placeholder={filter.label}
                      className="w-full text-sm h-9 rounded-xl"
                    />
                  </Show>
                  <Show when={filter.tipe_input === 'browse'}>
                    <GenericBrowsePicker
                      kodeBrowse={filter.konfigurasi?.kode_browse || ''}
                      value={String(filterValues[filter.nama_filter] || '')}
                      onChange={(val) => setFilterValue(filter.nama_filter, val)}
                      placeholder={`Pilih ${filter.label}...`}
                      className="w-full text-sm"
                    />
                  </Show>
                  <Show when={!['date', 'number', 'browse'].includes(filter.tipe_input)}>
                    <Input
                      type="text"
                      value={String(filterValues[filter.nama_filter] || '')}
                      onChange={(e) => setFilterValue(filter.nama_filter, e.target.value)}
                      placeholder={filter.label}
                      className="w-full text-sm h-9 rounded-xl"
                    />
                  </Show>
                </div>
              )}
            </Each>
          </div>

          <div className={`flex items-center gap-3 mt-5 pt-4 border-t ${isDark ? 'border-slate-700/50' : 'border-slate-100'}`}>
            <Button 
              onClick={handleGenerate} 
              disabled={executeReport.isPending}
              className="flex items-center gap-2 rounded-xl h-9 px-6"
            >
              <Show when={executeReport.isPending} fallback={<Play className="w-4 h-4" />}>
                <Loader2 className="w-4 h-4 animate-spin" />
              </Show>
              <Show when={executeReport.isPending} fallback="Generate Report">
                Generating...
              </Show>
            </Button>
            
            <Button 
              variant="outline" 
              onClick={resetFilters}
              disabled={executeReport.isPending}
              className="rounded-xl h-9 px-6"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </Show>
  )
}
