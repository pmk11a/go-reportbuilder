import { evalT1Expression } from '../../../utils/FormulaEvaluator'

interface FooterSummaryTableProps {
  config: {
    columns: any[]
    rows: any[]
  }
  summaryData: Record<string, any> // Includes t1, sumT2, computed fields like SaldoAwalD, TotalD, etc.
  detailDatasets: Record<string, any[]>
  formatCurrency: (val: number) => string
}

export function FooterSummaryTable({ config, summaryData, detailDatasets, formatCurrency }: FooterSummaryTableProps) {
  if (!config?.rows?.length || !config?.columns?.length) return null

  // Normalize columns — each col has: label, dataset, field
  // The col_key is derived from the column's `field` value (Debet/kredit),
  // which is what the `fields` mapping in rows uses (D=first field, K=second field).
  const normCols = config.columns.map((col: any, idx: number) => {
    const field = col.field || col.col_key || col.label
    return {
      ...col,
      field,            // e.g. "Debet" or "kredit"
      col_key: field,  // used for fields.{key} lookup
      pos_key: idx === 0 ? 'D' : idx === 1 ? 'K' : String(idx), // D/K for 2-col reports
    }
  })

  // Build T2 sums from all detail datasets (case-insensitive key lookup)
  const ctxT2Sums: Record<string, number> = {}
  Object.keys(detailDatasets).forEach(dsName => {
    const ds = detailDatasets[dsName] || []
    if (ds.length > 0) {
      Object.keys(ds[0] || {}).forEach(key => {
        ctxT2Sums[key] = (ctxT2Sums[key] || 0) + ds.reduce((acc, row) => acc + (parseFloat(String(row[key] || '').replace(/,/g, '')) || 0), 0)
      })
    }
  })

  const evalCtx = { t1: summaryData, t1Sums: {}, t2Sums: ctxT2Sums }

  // Resolve the value for a given row + column.
  // For "sum" rows: compute SUM of the column field across detail rows.
  // For "computed" rows: the value was pre-computed by computeT1SummaryData() and lives in summaryData
  //   under the key named in fields.{D} or fields.{K}. The D/K key matches the column position
  //   (D=first column=Penerimaan=Debet, K=second column=Pengeluaran=kredit).
  const resolveCellValue = (rowDef: any, colDef: any): number => {
    const fieldMapping = rowDef.fields || {}
    // Try: 1) fields[col_key] (field name), 2) fields[pos_key] (D/K), 3) fields[col_key lowercase]
    const rawField =
      fieldMapping[colDef.col_key] ??
      fieldMapping[colDef.pos_key] ??
      fieldMapping[String(colDef.col_key).toLowerCase()] ??
      undefined

    // ----- data_source: "computed" -----
    if (rowDef.data_source === 'computed') {
      if (rawField !== undefined) {
        // e.g. fields = { "Penerimaan": "SaldoAwalD", "Pengeluaran": "SaldoAwalK" }
        // summaryData already contains the pre-computed result (SaldoAwalD, SaldoAkhirD, TotalD, etc.)
        const val = summaryData[rawField]
        if (val !== undefined && val !== null) {
          return parseFloat(String(val).replace(/,/g, '')) || 0
        }
      }
      return 0
    }

    // ----- data_source: "sum" -----
    if (rowDef.data_source === 'sum') {
      if (rawField !== undefined) {
        // rawField can be an expression string like "sum(Debet)"
        if (typeof rawField === 'string' && /\b(?:sum|SaldoAwal|add)\b/i.test(rawField)) {
          try {
            return evalT1Expression(rawField, {}, evalCtx)
          } catch (e: any) {
            console.warn(`[FooterSummaryTable] expression failed for "${rawField}":`, e?.message)
            return 0
          }
        }
        // rawField is a plain field name — sum across detail rows
        const targetDsName = rowDef.dataset || colDef.dataset
        const targetDs = targetDsName ? (detailDatasets[targetDsName] || []) : Object.values(detailDatasets).flat()
        const fieldLower = rawField.toLowerCase()
        return targetDs.reduce((sum, row) => {
          const k = Object.keys(row).find(key => key.toLowerCase() === fieldLower)
          const val = k ? row[k] : undefined
          return sum + (val !== undefined ? (parseFloat(String(val).replace(/,/g, '')) || 0) : 0)
        }, 0)
      }

      // Fallback: if no field mapping, sum by col key
      const field = colDef.field || colDef.col_key
      if (!field) return 0
      const fieldLower = field.toLowerCase()
      const targetDs = Object.values(detailDatasets).flat()
      return targetDs.reduce((sum, row) => {
        const k = Object.keys(row).find(key => key.toLowerCase() === fieldLower)
        const val = k ? row[k] : undefined
        return sum + (val !== undefined ? (parseFloat(String(val).replace(/,/g, '')) || 0) : 0)
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
            const cellsVals: number[] = normCols.map((colDef: any) => resolveCellValue(rowDef, colDef))

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
