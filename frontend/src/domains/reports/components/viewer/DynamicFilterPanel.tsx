import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/shared/ui'
import { Label } from '@/shared/ui/form'
import { Filter, Loader2, Play } from 'lucide-react'
import { useReportStore } from '../../stores/reportStore'
import { useReportConfig } from '../../hooks/useReport'
import { GenericBrowsePicker } from '@/domains/browse/components/browse/GenericBrowsePicker'

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
    const missingRequired = filters.filter(f => 
      f.wajib_isi && (!filterValues[f.nama_filter] || filterValues[f.nama_filter] === '')
    )
    
    if (missingRequired.length > 0) {
      alert(`Mohon isi parameter wajib: ${missingRequired.map(f => f.label).join(', ')}`)
      return
    }

    executeReport.mutate(filterValues)
  }

  if (filters.length === 0) {
    return (
      <Card className="mb-6 shadow-sm border-secondary-200">
        <CardContent className="flex items-center justify-between p-4">
          <p className="text-secondary-500 text-sm">Laporan ini tidak memiliki parameter filter.</p>
          <Button 
            onClick={handleGenerate} 
            disabled={executeReport.isPending}
            className="flex items-center gap-2"
          >
            {executeReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Generate Report
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 shadow-sm border-secondary-200">
      <CardHeader className="py-3 px-4 border-b border-secondary-100 bg-secondary-50/50">
        <CardTitle className="text-sm font-medium flex items-center gap-2 text-secondary-800">
          <Filter className="w-4 h-4" /> Parameter Laporan
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filters.map((filter) => (
            <div key={filter.nama_filter} className="space-y-1.5">
              <Label className="text-xs font-semibold text-secondary-600">
                {filter.label} {filter.wajib_isi && <span className="text-red-500">*</span>}
              </Label>
              
              {filter.tipe_input === 'date' ? (
                <Input
                  type="date"
                  value={String(filterValues[filter.nama_filter] || '')}
                  onChange={(e) => setFilterValue(filter.nama_filter, e.target.value)}
                  className="w-full text-sm"
                />
              ) : filter.tipe_input === 'number' ? (
                <Input
                  type="number"
                  value={String(filterValues[filter.nama_filter] || '')}
                  onChange={(e) => setFilterValue(filter.nama_filter, e.target.value)}
                  placeholder={filter.label}
                  className="w-full text-sm"
                />
              ) : filter.tipe_input === 'browse' ? (
                <GenericBrowsePicker
                  kodeBrowse={filter.konfigurasi?.kode_browse || ''}
                  value={String(filterValues[filter.nama_filter] || '')}
                  onChange={(val) => setFilterValue(filter.nama_filter, val)}
                  placeholder={`Pilih ${filter.label}...`}
                  className="w-full text-sm"
                />
              ) : (
                <Input
                  type="text"
                  value={String(filterValues[filter.nama_filter] || '')}
                  onChange={(e) => setFilterValue(filter.nama_filter, e.target.value)}
                  placeholder={filter.label}
                  className="w-full text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t border-secondary-100">
          <Button 
            onClick={handleGenerate} 
            disabled={executeReport.isPending}
            className="flex items-center gap-2"
          >
            {executeReport.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {executeReport.isPending ? 'Generating...' : 'Generate Report'}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={resetFilters}
            disabled={executeReport.isPending}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
