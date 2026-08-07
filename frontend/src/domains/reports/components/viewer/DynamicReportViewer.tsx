import { FileText, FileSpreadsheet, Printer } from 'lucide-react'
import { useReportConfig, useExecuteReport } from '../../hooks/useReport'
import { Show } from '@/shared/ui/layout'
import { DynamicFilterPanel } from './DynamicFilterPanel'
import { SummaryLayout } from './layouts/SummaryLayout'
import { DetailLayout } from './layouts/DetailLayout'
import { computeT1SummaryData, computePerRowComputed, applyRunningBalance } from '../../utils/FormulaEvaluator'
import {
  formatCell,
  substituteFooterText,
  buildFooterContext,
  openPrintView,
} from '../../utils/exportHelpers'
import { reportViewerService } from '../../services/reportService'
import { ReportTitleBand } from './bands/ReportTitleBand'
import { ReportFooterBands } from './bands/ReportFooterBands'
import { PageFooterBand } from './bands/PageFooterBand'
import { useReportStore } from '../../stores/reportStore'
import { useMemo } from 'react'

// Lightweight JSON-safe parse helper
function safeParse(val: string | any): any {
  if (typeof val === 'object') return val
  if (typeof val !== 'string') return {}
  try { return JSON.parse(val) } catch { return {} }
}

interface DynamicReportViewerProps {
  kodeMenu: string
}

export function DynamicReportViewer({ kodeMenu }: DynamicReportViewerProps) {
  const { data: config, isLoading, isError, error } = useReportConfig(kodeMenu)
  const executeReport = useExecuteReport(kodeMenu)
  const filterValues = useReportStore((s) => s.filterValues)



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

  // Server-side export — TASK-027b AC6: backend produces formatted XLSX
  const handleExportExcel = async () => {
    if (!hasAnyData) {
      alert('Tidak ada data untuk diekspor')
      return
    }
    try {
      await reportViewerService.downloadReport({
        kodeMenu,
        format: 'xlsx',
        filters: filterValues || {},
      })
    } catch (e) {
      console.error('Export XLSX failed:', e)
      alert('Gagal mengekspor: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  // Server-side export — TASK-027b AC6: backend produces formatted PDF
  const handleExportPDF = async () => {
    if (!hasAnyData) {
      alert('Tidak ada data untuk diekspor')
      return
    }
    try {
      await reportViewerService.downloadReport({
        kodeMenu,
        format: 'pdf',
        filters: filterValues || {},
        paperSize: 'a4',
        orientation: 'landscape',
      })
    } catch (e) {
      console.error('Export PDF failed:', e)
      alert('Gagal mengekspor: ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  // Print view — opens print dialog with report content — TASK-027b AC3.9
  const handlePrint = () => {
    const printHtml = generatePrintHTML()
    if (!printHtml) return
    openPrintView(printHtml, config?.nama_laporan || 'Laporan')
  }

  // Build HTML for print view — TASK-027b AC3.10
  const generatePrintHTML = (): string | null => {
    const allTableData = getColumnsAndData()
    if (!allTableData) return null

    const fv = filterValues || {}
    const footerCtx = buildFooterContext(1, 1, config?.nama_laporan || '', fv)

    let html = `<div style="max-width:800px;margin:0 auto;padding:20px;font-family:sans-serif;color:#1e293b;">
      <h1 style="text-align:center;margin-bottom:4px;">${config?.nama_laporan || 'Laporan'}</h1>
      ${config?.deskripsi ? `<p style="text-align:center;color:#64748b;margin-top:0;">${config.deskripsi}</p>` : ''}
    `

    allTableData.forEach(({ sheetName, columns, data }) => {
      html += `<h2 style="margin-top:24px;font-size:14px;color:#475569;">${sheetName}</h2>`
      html += `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;">
        <thead><tr style="background:#f1f5f9;">`
      columns.forEach(col => {
        html += `<th style="padding:6px 10px;border:1px solid #e2e8f0;text-align:${col.alignment || 'left'};font-weight:600;">${col.label_tampil || col.nama_kolom}</th>`
      })
      html += `</tr></thead><tbody>`
      data.forEach((row: any) => {
        html += `<tr>`
        columns.forEach(col => {
          const val = formatCell(row[col.nama_kolom], col.format_type)
          html += `<td style="padding:5px 10px;border:1px solid #e2e8f0;text-align:${col.alignment || 'left'};">${val}</td>`
        })
        html += `</tr>`
      })
      html += `</tbody></table>`
    })

    // Footer band
    const footerText = substituteFooterText(
      footerBandsJson?.bands?.footer?.content || '',
      footerCtx
    )
    if (footerText) {
      html += `<p style="text-align:center;color:#94a3b8;font-size:9px;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:8px;">${footerText}</p>`
    }

    // Signatures
    const signatures = footerBandsJson?.bands?.summary?.signatures || []
    if (signatures.length > 0) {
      html += `<div style="display:flex;justify-content:space-around;margin-top:40px;padding:20px 0;border-top:1px solid #e2e8f0;">
        ${signatures.map((sig: any) => `
          <div style="text-align:center;flex:1;">
            <p style="font-size:10px;color:#475569;margin-bottom:40px;">${sig.label}</p>
            <div style="border-top:1px solid #333;margin:0 20px;"></div>
          </div>
        `).join('')}
      </div>`
    }

    html += '</div>'
    return html
  }

  // To determine if Export buttons should be disabled
  const hasAnyData = Object.keys(reportDatasets).some(k => reportDatasets[k] && reportDatasets[k].length > 0)

  // Split datasets into summary and detail
  const summaryDatasets = config?.datasets?.filter(d => d.config_json?.display_role === 'summary' && d.visible) || []
  const detailDatasetsList = config?.datasets?.filter(d => d.config_json?.display_role !== 'summary' && d.visible) || []

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

  // Apply per-row computed + running balance to detail datasets — TASK-027b AC4
  const enrichedReportDatasets = useMemo(() => {
    if (!config?.datasets) return reportDatasets
    const out: Record<string, any[]> = {}
    for (const ds of config.datasets) {
      const rows = reportDatasets[ds.nama_dataset]
      if (!rows) continue
      const dsCfg = typeof ds.config_json === 'string'
        ? safeParse(ds.config_json)
        : ds.config_json

      let enriched = rows
      // 1. Per-row computed rules
      const rules = dsCfg?.computed
      if (rules && Object.keys(rules).length > 0) {
        enriched = computePerRowComputed(enriched, rules, summaryData || {})
      }

      // 2. Running balance (per group level)
      const groups = config?.groups || []
      const rbGroups = groups.filter(g => g.special_handling === 'running-balance')
      for (const g of rbGroups) {
        const ruleCfg = g.config_json as any
        if (ruleCfg) {
          enriched = applyRunningBalance(enriched, { [g.label || g.field_value || 'Saldo']: ruleCfg }, 'Saldo')
        }
      }

      out[ds.nama_dataset] = enriched
    }
    return out
  }, [config, reportDatasets, summaryData])

  // Format details for DetailLayout
  const formattedDetailDatasets = detailDatasetsList.map(ds => ({
    dataset: ds,
    columns: config?.columns?.[ds.nama_dataset] || [],
    data: enrichedReportDatasets[ds.nama_dataset] || (!executeReport.data ? [] : [])
  }))

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
              data-testid="export-excel"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={!hasAnyData}
              data-testid="export-pdf"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" /> PDF
            </button>
            <button
              onClick={handlePrint}
              disabled={!hasAnyData}
              data-testid="export-print"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-blue-600" /> Print
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
                fallbackSubtitle={config.deskripsi ?? undefined}
                filterValues={filterValues as Record<string, string | string[] | null>}
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
              {footerBandsJson?.bands?.footer?.enabled && (
                <PageFooterBand
                  footerBandConfig={footerBandsJson.bands.footer}
                  reportName={config?.nama_laporan}
                />
              )}
            </Show>
          </Show>
        </div>
      </div>
    </div>
  )
}
