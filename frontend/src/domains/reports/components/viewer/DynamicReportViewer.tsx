import { FileText, FileSpreadsheet } from 'lucide-react'
import { useReportConfig, useExecuteReport } from '../../hooks/useReport'
import { Show } from '@/shared/ui/layout'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DynamicFilterPanel } from './DynamicFilterPanel'
import { SummaryLayout } from './layouts/SummaryLayout'
import { DetailLayout } from './layouts/DetailLayout'
import { computeT1SummaryData } from '../../utils/FormulaEvaluator'
import { ReportTitleBand } from './bands/ReportTitleBand'
import { ReportFooterBands } from './bands/ReportFooterBands'
import { useMemo } from 'react'

interface DynamicReportViewerProps {
  kodeMenu: string
}

export function DynamicReportViewer({ kodeMenu }: DynamicReportViewerProps) {
  const { data: config, isLoading, isError, error } = useReportConfig(kodeMenu)
  const executeReport = useExecuteReport(kodeMenu)



  let reportDatasets: Record<string, any[]> = {}
  if (executeReport.data) {
    const rawData = executeReport.data as any
    if (Array.isArray(rawData)) {
      reportDatasets = { default: rawData }
    } else if (rawData.datasets) {
      reportDatasets = rawData.datasets
    } else {
      reportDatasets = { default: rawData.data || rawData.items || [] }
    }
  }

  const getColumnsAndData = () => {
    // Collect all datasets into a single array for Export
    const allData: { sheetName: string; columns: any[]; data: any[] }[] = []
    const columnsRecord = config?.columns || {}
    
    Object.entries(columnsRecord).forEach(([datasetName, columns]) => {
      const data = reportDatasets[datasetName] || []
      if (data.length > 0 && columns.length > 0) {
        allData.push({
          sheetName: config?.datasets?.find(d => d.nama_dataset === datasetName)?.deskripsi || datasetName,
          columns,
          data
        })
      }
    })
    
    return allData.length > 0 ? allData : null
  }

  const handleExportExcel = () => {
    const allTableData = getColumnsAndData()
    if (!allTableData) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    const workbook = XLSX.utils.book_new()
    
    allTableData.forEach(({ sheetName, columns, data }) => {
      const headers = columns.map((col: any) => col.label_tampil || col.nama_kolom)
      const rows = data.map((row: any) => {
        const rowData: any = {}
        columns.forEach((col: any) => {
          rowData[col.label_tampil || col.nama_kolom] = row[col.nama_kolom]
        })
        return rowData
      })
      const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers })
      // Ensure sheet name is unique and < 31 chars
      const safeSheetName = sheetName.substring(0, 30)
      XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName)
    })
    
    XLSX.writeFile(workbook, `${config?.nama_laporan || 'Laporan'}.xlsx`)
  }

  const handleExportPDF = () => {
    const allTableData = getColumnsAndData()
    if (!allTableData) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    const doc = new jsPDF('landscape')
    doc.text(config?.nama_laporan || 'Laporan', 14, 15)
    
    let currentY = 25
    
    allTableData.forEach(({ sheetName, columns, data }, index) => {
      if (index > 0) {
        doc.addPage()
        currentY = 15
      }
      
      doc.setFontSize(10)
      doc.text(sheetName, 14, currentY)
      currentY += 5
      
      const headers = columns.map((col: any) => col.label_tampil || col.nama_kolom)
      const rows = data.map((row: any) => columns.map((col: any) => row[col.nama_kolom] || ''))

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: currentY,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [41, 128, 185] },
      })
    })

    doc.save(`${config?.nama_laporan || 'Laporan'}.pdf`)
  }

  // To determine if Export buttons should be disabled
  const hasAnyData = Object.keys(reportDatasets).some(k => reportDatasets[k] && reportDatasets[k].length > 0)

  // Split datasets into summary and detail
  const summaryDatasets = config?.datasets?.filter(d => d.config_json?.display_role === 'summary' && d.visible) || []
  const detailDatasetsList = config?.datasets?.filter(d => d.config_json?.display_role !== 'summary' && d.visible) || []
  
  // Format details for DetailLayout
  const formattedDetailDatasets = detailDatasetsList.map(ds => ({
    dataset: ds,
    columns: config?.columns?.[ds.nama_dataset] || [],
    data: reportDatasets[ds.nama_dataset] || (!executeReport.data ? [] : [])
  }))

  const footerBandsJson = useMemo(() => {
    try {
      if (!config?.footer_bands) return null
      return typeof config.footer_bands === 'string' ? JSON.parse(config.footer_bands) : config.footer_bands
    } catch {
      return null
    }
  }, [config?.footer_bands])

  const t1SummaryDataset = summaryDatasets[0]
  const summaryData = useMemo(() => {
    if (!t1SummaryDataset || !t1SummaryDataset.config_json) return {}
    
    const summaryConfigJson = typeof t1SummaryDataset.config_json === 'string' 
      ? JSON.parse(t1SummaryDataset.config_json) 
      : t1SummaryDataset.config_json

    return computeT1SummaryData(
      t1SummaryDataset.nama_dataset,
      summaryConfigJson,
      reportDatasets,
      detailDatasetsList.map(d => d.nama_dataset)
    ) || {}
  }, [t1SummaryDataset, reportDatasets, detailDatasetsList])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="flex flex-col items-center gap-4 text-secondary-500">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Memuat konfigurasi laporan...</p>
        </div>
      </div>
    )
  }

  if (isError || !config) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-xl m-8">
        <p className="font-semibold text-lg">Gagal memuat laporan</p>
        <p>{error?.message || 'Laporan tidak ditemukan atau Anda tidak memiliki akses.'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="border-b border-slate-200 dark:border-white/5 px-6 py-4 shadow-sm sticky top-0 z-10 bg-white dark:bg-[#0f172a]">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                {config.nama_laporan || kodeMenu}
              </h1>
            </div>
            {config.deskripsi && (
              <p className="text-sm text-slate-500 pl-7">{config.deskripsi}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              disabled={!hasAnyData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={!hasAnyData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto flex flex-col">
        <div className="w-full mx-auto space-y-6 flex flex-col flex-1">
          <DynamicFilterPanel 
            kodeMenu={kodeMenu} 
            executeReport={executeReport} 
          />
          
          <Show 
            when={!!executeReport.data || executeReport.isPending}
            fallback={
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400 bg-slate-50/50 dark:bg-slate-800/20 rounded-3xl border border-slate-100 dark:border-white/5 border-dashed min-h-[300px]">
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                  <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">Generate</h3>
                <p className="text-sm max-w-md text-center">
                  Silakan lengkapi parameter di atas dan klik <strong>Generate Report</strong> untuk menampilkan data.
                </p>
              </div>
            }
          >
            <Show when={!!executeReport.data}>
              <ReportTitleBand 
                footerBandsJson={footerBandsJson}
                fallbackTitle={config.nama_laporan || kodeMenu}
                fallbackSubtitle={config.deskripsi}
              />
            </Show>

            {summaryDatasets.map(ds => (
              <SummaryLayout
                key={`header-${ds.nama_dataset}`}
                datasetName={ds.nama_dataset}
                deskripsi={ds.deskripsi || ''}
                configJson={ds.config_json}
                columns={config.columns?.[ds.nama_dataset] || []}
                data={ds.nama_dataset === t1SummaryDataset?.nama_dataset ? [summaryData] : (reportDatasets[ds.nama_dataset] || [])}
                position="header"
              />
            ))}

            <DetailLayout
              kodeMenu={kodeMenu}
              isLoading={executeReport.isPending}
              detailDatasets={formattedDetailDatasets}
            />

            {summaryDatasets.map(ds => (
              <SummaryLayout
                key={`footer-${ds.nama_dataset}`}
                datasetName={ds.nama_dataset}
                deskripsi={ds.deskripsi || ''}
                configJson={ds.config_json}
                columns={config.columns?.[ds.nama_dataset] || []}
                data={ds.nama_dataset === t1SummaryDataset?.nama_dataset ? [summaryData] : (reportDatasets[ds.nama_dataset] || [])}
                position="footer"
              />
            ))}

            <Show when={!!executeReport.data}>
              <ReportFooterBands
                footerBandsJson={footerBandsJson}
                summaryData={summaryData}
                detailDatasets={reportDatasets}
              />
            </Show>
          </Show>
        </div>
      </div>
    </div>
  )
}
