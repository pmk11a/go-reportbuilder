export type T1ComputedRule = {
  expression: string
  operands: Record<string, 't1' | 'sum:t1' | 'sum:t2'>
}

// Legacy format allows string expressions directly
export type T1ComputedRuleLegacy = string | T1ComputedRule

export type T1SummaryConfig = {
  detail_dataset?: string
  t2_sum_fields?: string[]
  bon_giro_fields?: string[]
  computed?: Record<string, T1ComputedRule>
  display_role?: string
  summary_fields?: string[]
  right_fields?: string[]
  summary_layout?: string
}

const num = (v: any) => parseFloat(v || 0) || 0

export const evalT1Expression = (
  expression: string,
  operands: Record<string, 't1' | 'sum:t1' | 'sum:t2'>,
  ctx: { t1: Record<string, number>; t1Sums: Record<string, number>; t2Sums: Record<string, number>; t2Row?: Record<string, number> }
): number => {
  // Case-insensitive lookup helpers
  const getT2Sum = (key: string) => {
    const k = Object.keys(ctx.t2Sums).find(k => k.toLowerCase() === key.toLowerCase())
    return k ? ctx.t2Sums[k] : undefined
  }
  const getT1Sum = (key: string) => {
    const k = Object.keys(ctx.t1Sums).find(k => k.toLowerCase() === key.toLowerCase())
    return k ? ctx.t1Sums[k] : undefined
  }
  const getT1Val = (key: string) => {
    const k = Object.keys(ctx.t1).find(k => k.toLowerCase() === key.toLowerCase())
    return k ? ctx.t1[k] : undefined
  }

  // Replace `name(name)` function calls first (e.g. `sum(Debet)`)
  let replaced = expression.replace(/([A-Za-z_][A-Za-z0-9_]*)\(([A-Za-z_][A-Za-z0-9_]*)\)/g, (_whole, fn, arg) => {
    if (fn !== 'sum') throw new Error(`Unknown function: ${fn}`)
    const src = operands[arg]
    if (src === 'sum:t2') return String(getT2Sum(arg) ?? 0)
    if (src === 'sum:t1') return String(getT1Sum(arg) ?? 0)
    // Fallback: if operand not declared, treat as sum:t2
    const t2Val = getT2Sum(arg)
    if (!src && t2Val !== undefined) return String(t2Val)
    throw new Error(`sum() operand "${arg}" not found in t2 sums`)
  })

  // Replace remaining bare tokens (e.g. `SaldoAwal`)
  replaced = replaced.replace(/[A-Za-z_][A-Za-z0-9_]*/g, (tok) => {
    const src = operands[tok]
    if (src === 't1') return String(getT1Val(tok) ?? 0)
    if (src) throw new Error(`Operand "${tok}" must be t1 (use sum(${tok}) for aggregates)`)
    
    // Per-row context: check t2Row first, then t2Sums
    const t2RowVal = ctx.t2Row?.[tok]
    if (t2RowVal !== undefined) return String(t2RowVal)
    const t2Val = getT2Sum(tok)
    if (t2Val !== undefined) return String(t2Val)
    
    const t1Val = getT1Val(tok)
    if (t1Val !== undefined) return String(t1Val)
    
    // If not found in any dataset, assume 0 (legacy reports often omit empty fields)
    console.warn(`[FormulaEvaluator] Unknown token treated as 0: ${tok}`)
    return "0"
  })

  // Whitelist characters
  if (!/^[\d\s+\-*/().?:%<>!=&|]+$/.test(replaced)) {
    throw new Error(`Expression contains invalid characters: ${replaced}`)
  }

  // eslint-disable-next-line no-new-func
  const fn = new Function(`"use strict"; return (${replaced});`)
  const result = fn()
  return typeof result === 'number' && isFinite(result) ? result : 0
}

export const computeT1SummaryData = (
  summaryDatasetName: string,
  config: T1SummaryConfig,
  datasets: Record<string, any[]>,
  detailDatasetsNames: string[]
): Record<string, any> | null => {
  if (!summaryDatasetName) return null

  const detName = config.detail_dataset || detailDatasetsNames[0]
  const t1 = datasets[summaryDatasetName]
  const t2 = detName ? datasets[detName] : null

  if (!t1 || t1.length === 0) return null

  const data: Record<string, any> = { ...t1[0] }

  // T2 aggregates
  const t2SumFields = config.t2_sum_fields || []
  const t2Sums: Record<string, number> = {}
  t2SumFields.forEach((f) => {
    t2Sums[f] = t2 ? t2.reduce((s: number, r: any) => s + num(r[f]), 0) : 0
  })

  // T1 aggregates
  const t1Sums: Record<string, number> = {}
  if (config.bon_giro_fields?.length) {
    config.bon_giro_fields.forEach((f) => { t1Sums[f] = num(data[f]) })
    t1Sums['TotalBonGiro'] = config.bon_giro_fields.reduce((s, f) => s + (t1Sums[f] || 0), 0)
  }

  // Built-in helpers
  const t1Nums: Record<string, number> = {}
  Object.keys(data).forEach((k) => { t1Nums[k] = num(data[k]) })

  // Apply computed rules
  if (config.computed) {
    for (const [target, rule] of Object.entries(config.computed)) {
      try {
        let expression = ''
        let operands: Record<string, any> = {}

        if (typeof rule === 'string') {
           // Legacy format (from Vue): just a string expression
           expression = rule
           operands = {} // Fallbacks in evalT1Expression will resolve sum:t2 and t1 automatically
        } else {
           // New format
           expression = rule.expression
           operands = rule.operands || {}
        }

        data[target] = evalT1Expression(expression, operands, { t1: t1Nums, t1Sums, t2Sums })
      } catch (e: any) {
        console.warn(`[computeT1SummaryData] computed.${target} failed:`, e?.message)
        data[target] = 0
      }
    }
  }

  // Expose raw T2 sums
  t2SumFields.forEach((f) => { data[`sum${f}`] = t2Sums[f] })

  return data
}

// ============================================================
// Per-Row Computed (T2 Detail Rows) — TASK-027b AC4.1
// ============================================================

/**
 * Apply per-row computed expressions to each row in a T2 detail dataset.
 *
 * Each rowContext has access to:
 *   - Bare tokens  → resolve against the current row (T2 fields)
 *   - sum(field)   → resolve against the entire T2 dataset (column sum)
 *   - t1(field)    → resolve against the T1 summary header
 *
 * Example rule:
 *   {
 *     saldo: { expression: 'Debet - Kredit', operands: {} },
 *     pct:   { expression: 'Debet / sum(Debet) * 100', operands: { sum: 'sum:t2' } },
 *   }
 *
 * Returns a NEW array; the input is not mutated.
 */
export const computePerRowComputed = (
  rows: Record<string, any>[],
  rules: Record<string, T1ComputedRuleLegacy>,
  t1Context: Record<string, number> = {}
): Record<string, any>[] => {
  if (!rows || rows.length === 0 || !rules || Object.keys(rules).length === 0) {
    return rows
  }

  // Pre-compute column sums (optimization: avoid re-summing on every row)
  const sumCols: Record<string, number> = {}
  rows.forEach((row) => {
    Object.keys(row).forEach((k) => {
      sumCols[k] = (sumCols[k] || 0) + num(row[k])
    })
  })

  return rows.map((row) => {
    const out = { ...row }
    for (const [target, rule] of Object.entries(rules)) {
      try {
        const expression = typeof rule === 'string' ? rule : rule.expression
        const operands = typeof rule === 'string' ? {} : rule.operands || {}

        // Build a per-row context: t1 = T1 header, t2 = current row, t2Sums = column sums
        const rowNums: Record<string, number> = {}
        Object.keys(row).forEach((k) => { rowNums[k] = num(row[k]) })

        const value = evalT1Expression(expression, operands, {
          t1: t1Context,
          t1Sums: {},
          t2Sums: sumCols,
          t2Row: rowNums, // per-row field values take precedence over sums for bare tokens
        })
        out[target] = value
      } catch (e: any) {
        console.warn(`[computePerRowComputed] ${target} failed:`, e?.message)
        out[target] = 0
      }
    }
    return out
  })
}

// ============================================================
// Running Balance — TASK-027b AC4.2
// ============================================================

/**
 * Compute a running balance column by accumulating a delta across rows.
 *
 * @param rows       Detail rows (T2)
 * @param rules      Map of target → { delta: 'debet' | 'kredit' | 'net', ... };
 *                   the key is the OUTPUT column name
 * @param openingKey Field name in rows that holds the opening balance (e.g. 'SaldoAwal')
 * @param outputKey  Field name to write the running balance to (default: 'Saldo')
 *
 * Each row's running balance = previous_balance + delta_this_row
 * First row's previous_balance = rows[0][openingKey] || 0
 *
 * Returns a NEW array (original rows are not mutated).
 */
export const applyRunningBalance = (
  rows: Record<string, any>[],
  rules: Record<string, {
    opening?: string       // field name in row holding opening balance (default: 'SaldoAwal')
    delta: string          // field name in row holding change (e.g. 'Debet', 'Kredit')
    debetCredit?: boolean   // if true, 'delta' is an object { debet, kredit }
  }>,
  outputKey: string = 'Saldo'
): Record<string, any>[] => {
  if (!rows || rows.length === 0) return rows

  const out = rows.map((row) => ({ ...row }))

  for (const rule of Object.values(rules)) {
    let running = 0
    for (let i = 0; i < out.length; i++) {
      const row = out[i]
      // Each row: balance = opening + delta (delta is added on top of the row's opening)
      let delta = 0
      if (rule.debetCredit) {
        const deltaObj = row[rule.delta] || {}
        delta = num(deltaObj.debet) - num(deltaObj.kredit)
      } else {
        delta = num(row[rule.delta])
      }

      if (i === 0) {
        // First row: balance = opening + delta
        running = num(row[rule.opening || 'SaldoAwal'] || 0) + delta
      } else {
        // Subsequent rows: carry forward from previous row's balance + THIS row's delta
        running = running + delta
      }
      row[outputKey] = running
    }
  }

  return out
}

