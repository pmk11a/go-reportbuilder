
import { SideInfoPanel } from './SideInfoPanel'
import { FooterSummaryTable } from './FooterSummaryTable'
import { SignaturesBlock } from './SignaturesBlock'
import { Each } from '@/shared/ui/layout'
import type { IReportDataset } from '@/domains/reports/types'

interface SubreportDataset {
  dataset: IReportDataset
  columns: any[]
  data: any[]
}

interface ReportFooterBandsProps {
  footerBandsJson?: any
  summaryData: Record<string, any> // Processed T1 with computes
  detailDatasets: Record<string, any[]>
  /** T3 datasets to render inline as subreport (left side of footer block) */
  subreportDatasets?: SubreportDataset[]
}

export function ReportFooterBands({
  footerBandsJson,
  summaryData,
  detailDatasets,
  subreportDatasets = [],
}: ReportFooterBandsProps) {
  if (!footerBandsJson?.bands?.summary?.enabled) return null

  const summaryConfig = footerBandsJson.bands.summary
  const sidePanelConfig = summaryConfig.chgb_panel // chgb_panel for backward compat
  const footerTable = summaryConfig.footer_table
  const signatures = summaryConfig.signatures

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(val)

  const hasSummaryTable = sidePanelConfig?.enabled || footerTable
  const hasSignatures = signatures && signatures.length > 0
  const hasSubreport = subreportDatasets.length > 0

  if (!hasSummaryTable && !hasSignatures && !hasSubreport) return null

  // Determine layout: when subreport is present, it goes left; summary table goes right
  const layout = hasSubreport ? 'side_by_side' : 'stacked'

  return (
    <div className="mt-8 flex flex-col gap-0 w-full">
      {/* Footer content row */}
      <div
        className={`flex flex-col gap-8 w-full ${
          hasSignatures ? 'border-t-2 border-slate-300 dark:border-slate-600 pt-6' : ''
        }`}
      >
        {layout === 'side_by_side' ? (
          /* Inline layout: subreport (left) + summary table (right) */
          <div className="flex flex-col lg:flex-row gap-6 w-full">
            {/* LEFT: Subreport table (T3 Bank/Kurs/CHGB) */}
            {hasSubreport && (
              <div className="w-full lg:w-3/5 flex flex-col gap-4">
                <Each of={subreportDatasets}>
                  {({ dataset, columns, data }) => (
                    <div key={dataset.nama_dataset}>
                      <SubreportInlineTable
                        dataset={dataset}
                        columns={columns}
                        data={data}
                        formatCurrency={formatCurrency}
                      />
                    </div>
                  )}
                </Each>
              </div>
            )}

            {/* RIGHT: Summary table + side panel */}
            {hasSummaryTable && (
              <div className={`flex flex-col ${hasSubreport ? 'lg:w-2/5' : 'w-full'}`}>
                {(sidePanelConfig?.enabled || footerTable) && (
                  <div className="flex flex-col gap-6">
                    {sidePanelConfig?.enabled && (
                      <SideInfoPanel
                        config={sidePanelConfig}
                        summaryData={summaryData}
                        formatCurrency={formatCurrency}
                      />
                    )}

                    {footerTable && (
                      <FooterSummaryTable
                        config={footerTable}
                        summaryData={summaryData}
                        detailDatasets={detailDatasets}
                        formatCurrency={formatCurrency}
                      />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Stacked layout (no subreport) */
          <>
            {hasSummaryTable && (
              <div className="flex flex-col md:flex-row gap-8 w-full">
                {sidePanelConfig?.enabled && (
                  <div className={`${footerTable ? 'w-full md:w-1/3' : 'w-full'}`}>
                    <SideInfoPanel
                      config={sidePanelConfig}
                      summaryData={summaryData}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                )}

                {footerTable && (
                  <div className={`${sidePanelConfig?.enabled ? 'w-full md:flex-1' : 'w-full'}`}>
                    <FooterSummaryTable
                      config={footerTable}
                      summaryData={summaryData}
                      detailDatasets={detailDatasets}
                      formatCurrency={formatCurrency}
                    />
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Signatures — rendered directly after footer table, inside same footer band */}
      {hasSignatures && (
        <SignaturesBlock signatures={signatures} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// SubreportInlineTable — renders T3 Bank/Kurs/CHGB breakdown inline in footer
// Matches Delphi Footer1 Subreport1 (Page 2) layout:
//   Columns: Bank | Riil $ | Riil Rp | CHGB | Total
//   Footer:  Jumlah | SUM | SUM | SUM | SUM
// ---------------------------------------------------------------------------
interface SubreportInlineTableProps {
  dataset: IReportDataset
  columns: any[]
  data: any[]
  formatCurrency: (val: number) => string
}

function SubreportInlineTable({ columns, data, formatCurrency }: SubreportInlineTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-sm text-slate-400 italic p-4">Tidak ada data subreport</div>
    )
  }

  // Compute SUM for footer row
  const columnSums = columns.map(col => {
    if (col.is_summable === false || col.is_visible === false) return null
    return data.reduce((acc, row) => {
      const val = row[col.nama_kolom]
      return acc + (parseFloat(String(val || '').replace(/,/g, '')) || 0)
    }, 0)
  })

  return (
    <div className="bg-white dark:bg-[#0f172a] rounded-xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              {columns
                .filter(col => col.is_visible !== false)
                .map(col => (
                  <th
                    key={col.nama_kolom}
                    className={`px-3 py-2 font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide whitespace-nowrap ${
                      col.alignment === 'right' || col.format_type === 'currency'
                        ? 'text-right'
                        : col.alignment === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.label_tampil || col.nama_kolom}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr
                key={rIdx}
                className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              >
                {columns
                  .filter(col => col.is_visible !== false)
                  .map(col => {
                    const val = row[col.nama_kolom]
                    const isCurrency = col.format_type === 'currency' || col.format_type === 'number'
                    const numVal = parseFloat(String(val || '').replace(/,/g, '')) || 0
                    return (
                      <td
                        key={col.nama_kolom}
                        className={`px-3 py-1.5 text-slate-700 dark:text-slate-200 whitespace-nowrap ${
                          isCurrency ? 'text-right' : col.alignment === 'center' ? 'text-center' : 'text-left'
                        }`}
                      >
                        {isCurrency ? formatCurrency(numVal) : val}
                      </td>
                    )
                  })}
              </tr>
            ))}
          </tbody>
          {/* Footer: Jumlah row with SUM */}
          <tfoot>
            <tr className="border-t-2 border-slate-400 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-200">
              <td className="px-3 py-1.5">Jumlah</td>
              {columnSums.map((sum, cIdx) => {
                if (sum === null) return <td key={cIdx} className="px-3 py-1.5"></td>
                const col = columns.filter(c => c.is_visible !== false)[cIdx]
                const isCurrency = col?.format_type === 'currency' || col?.format_type === 'number'
                return (
                  <td
                    key={cIdx}
                    className={`px-3 py-1.5 text-right ${isCurrency ? '' : 'text-left'}`}
                  >
                    {isCurrency ? formatCurrency(sum) : sum.toLocaleString('id-ID')}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
