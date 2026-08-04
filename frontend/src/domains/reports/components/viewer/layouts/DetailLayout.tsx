import { DynamicReportTable } from '../DynamicReportTable'
import { IReportDataset } from '@/domains/reports/types'
import { Each } from '@/shared/ui/layout'

interface DetailDataset {
  dataset: IReportDataset
  columns: any[]
  data: any[]
}

interface DetailLayoutProps {
  kodeMenu: string
  isLoading: boolean
  detailDatasets: DetailDataset[]
}

export function DetailLayout({ kodeMenu, isLoading, detailDatasets }: DetailLayoutProps) {
  if (!detailDatasets || detailDatasets.length === 0) return null

  // Check if ALL detail datasets request side_by_side layout (Neraca style)
  const isSideBySide = detailDatasets.length === 2 && detailDatasets.every(d => d.dataset.config_json?.detail_layout === 'side_by_side')

  if (isSideBySide) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Each of={detailDatasets}>
          {(ds) => (
            <div key={ds.dataset.nama_dataset} className="flex flex-col h-full bg-white dark:bg-[#0f172a] rounded-3xl shadow-sm border border-slate-100 dark:border-white/5 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-white/5">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {ds.dataset.deskripsi || ds.dataset.nama_dataset}
                </h3>
              </div>
              <div className="flex-1 p-0 overflow-auto">
                <DynamicReportTable 
                  kodeMenu={kodeMenu} 
                  columns={ds.columns}
                  data={ds.data} 
                  isLoading={isLoading} 
                  hideBorders={true}
                />
              </div>
            </div>
          )}
        </Each>
      </div>
    )
  }

  // Standard stacked layout
  return (
    <div className="space-y-6">
      <Each of={detailDatasets}>
        {(ds) => (
          <div key={ds.dataset.nama_dataset} className="mb-4">
            <h3 className="text-lg font-bold mb-3 text-slate-800 dark:text-slate-200">
              {ds.dataset.deskripsi || ds.dataset.nama_dataset}
            </h3>
            <DynamicReportTable 
              kodeMenu={kodeMenu} 
              columns={ds.columns}
              data={ds.data} 
              isLoading={isLoading} 
            />
          </div>
        )}
      </Each>
    </div>
  )
}
