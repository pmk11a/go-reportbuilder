import { evalT1Expression } from '../../../utils/FormulaEvaluator'

interface FooterSummaryTableProps {
  config: {
    columns: any[]
    rows: any[]
  }
  summaryData: Record<string, any> // Includes t1, sumT2, computed
  detailDatasets: Record<string, any[]>
  formatCurrency: (val: number) => string
}

export function FooterSummaryTable({ config, summaryData, detailDatasets, formatCurrency }: FooterSummaryTableProps) {
  if (!config?.rows?.length || !config?.columns?.length) return null

  // Normalize columns
  const normCols = config.columns.map((col: any) => {
    if (typeof col === 'object') {
      return { ...col, col_key: col.col_key || col.field || col.label }
    }
    return { label: col, col_key: col }
  })

  // Prepare Eval Context for `cells` expressions
  const ctxT1 = summaryData || {}
  
  // T2 aggregates context (from all detail datasets)
  const ctxT2Sums: Record<string, number> = {}
  Object.keys(detailDatasets).forEach(dsName => {
    const ds = detailDatasets[dsName] || []
    if (ds.length > 0) {
       Object.keys(ds[0]).forEach(key => {
          ctxT2Sums[key] = (ctxT2Sums[key] || 0) + ds.reduce((acc, row) => acc + (parseFloat(row[key]) || 0), 0)
       })
    }
  })

  const evalCtx = { t1: ctxT1, t1Sums: {}, t2Sums: ctxT2Sums } // Simplification

  const resolveCellValue = (rowDef: any, colDef: any): number => {
    const ck = colDef.col_key
    const explicit = rowDef.fields?.[ck]

    if (explicit !== undefined) {
      if (rowDef.data_source === 'sum') {
        if (typeof explicit === 'string' && /[+\-*/()]|\b(?:sum|SaldoAwal)\b/.test(explicit)) {
          try {
            return evalT1Expression(explicit, {}, evalCtx)
          } catch (e: any) {
            console.warn(`[FooterSummaryTable] expression failed:`, e?.message)
            return 0
          }
        }
        // explicit is a field name
        const targetDataset = detailDatasets[rowDef.dataset] || Object.values(detailDatasets)[0] || []
        return targetDataset.reduce((sum, row) => {
           const k = Object.keys(row).find(key => key.toLowerCase() === explicit.toLowerCase())
           const val = k ? row[k] : 0
           return sum + (parseFloat(val) || 0)
        }, 0)
      }

      if (rowDef.data_source === 't1' || rowDef.data_source === 'computed') {
        return parseFloat(summaryData[explicit] || 0)
      }
    }

    // Default legacy logic if `fields` mapping is missing
    if (rowDef.data_source === 'sum') {
      const field = colDef.field || colDef.col_key
      const targetDataset = detailDatasets[rowDef.dataset || colDef.dataset] || Object.values(detailDatasets)[0] || []
      return targetDataset.reduce((sum, row) => {
        // case-insensitive lookup
        const k = Object.keys(row).find(key => key.toLowerCase() === field.toLowerCase())
        const val = k ? row[k] : 0
        return sum + (parseFloat(val) || 0)
      }, 0)
    }

    return 0
  }

  return (
    <div className="w-full">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left py-1 pr-4 text-slate-500 w-1/3"></th>
            {normCols.map((col: any) => (
              <th
                key={col.label}
                className="text-right py-1 px-4 text-slate-500 font-medium"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
          {config.rows.map((rowDef: any, idx) => {
            const rowLabel = typeof rowDef === 'string' ? rowDef : rowDef.label

            // Handle data_source: "cells" override
            let cellsVals: number[] = []
            if (rowDef.data_source === 'cells') {
               cellsVals = normCols.map((_colDef: any, colIdx: number) => {
                 const cellDef = rowDef.cells?.find((c: any) => (c.col === undefined ? colIdx : c.col) === colIdx)
                 if (!cellDef) return 0
                 if (cellDef.field) return parseFloat(summaryData[cellDef.field] || 0)
                 if (cellDef.expression) {
                   try {
                     return evalT1Expression(cellDef.expression, {}, evalCtx)
                   } catch { return 0 }
                 }
                 return 0
               })
            } else {
               cellsVals = normCols.map((colDef: any) => resolveCellValue(rowDef, colDef))
            }

            return (
              <tr key={idx}>
                <td className="py-2 pr-4 text-slate-600 dark:text-slate-400 w-1/3 font-medium">{rowLabel}</td>
                {cellsVals.map((val, colIdx) => (
                  <td
                    key={colIdx}
                    className="py-2 px-4 text-slate-900 dark:text-slate-200 font-semibold text-right"
                  >
                    {formatCurrency(val)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
