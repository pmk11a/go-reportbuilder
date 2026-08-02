import { FileText, Download, FileSpreadsheet } from 'lucide-react'
import { useReportConfig, useExecuteReport } from '../../hooks/useReport'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { DynamicFilterPanel } from './DynamicFilterPanel'
import { SummaryLayout } from './layouts/SummaryLayout'
import { DetailLayout } from './layouts/DetailLayout'

interface DynamicReportViewerProps {
  kodeMenu: string
}

export function DynamicReportViewer({ kodeMenu }: DynamicReportViewerProps) {
  const { data: config, isLoading, isError, error } = useReportConfig(kodeMenu)
  const executeReport = useExecuteReport(kodeMenu)

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
  const summaryDatasets = config.datasets?.filter(d => d.config_json?.display_role === 'summary' && d.visible) || []
  const detailDatasetsList = config.datasets?.filter(d => d.config_json?.display_role !== 'summary' && d.visible) || []
  
  // Format details for DetailLayout
  const formattedDetailDatasets = detailDatasetsList.map(ds => ({
    dataset: ds,
    columns: config.columns?.[ds.nama_dataset] || [],
    data: reportDatasets[ds.nama_dataset] || (!executeReport.data ? [] : [])
  }))

  return (
    <div className="flex flex-col h-full bg-transparent">
      <div className="border-b border-secondary-200 dark:border-white/5 px-6 py-4 shadow-sm sticky top-0 z-10 bg-white dark:bg-[#0f172a]">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-secondary-900 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-500" />
                {config.nama_laporan || kodeMenu}
              </h1>
            </div>
            {config.deskripsi && (
              <p className="text-sm text-secondary-500 pl-7">{config.deskripsi}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleExportExcel}
              disabled={!hasAnyData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-secondary-600 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
            </button>
            <button 
              onClick={handleExportPDF}
              disabled={!hasAnyData}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-secondary-600 bg-white border border-secondary-300 rounded-md hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <FileText className="w-4 h-4 text-red-500" /> PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className="w-full mx-auto space-y-6">
          <DynamicFilterPanel 
            kodeMenu={kodeMenu} 
            executeReport={executeReport} 
          />
          
          {summaryDatasets.map(ds => (
            <SummaryLayout
              key={`header-${ds.nama_dataset}`}
              datasetName={ds.nama_dataset}
              deskripsi={ds.deskripsi || ''}
              configJson={ds.config_json}
              columns={config.columns?.[ds.nama_dataset] || []}
              data={reportDatasets[ds.nama_dataset] || []}
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
              data={reportDatasets[ds.nama_dataset] || []}
              position="footer"
            />
          ))}
        </div>
      </div>
    </div>
  )
}
