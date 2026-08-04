export type T1ComputedRule = {
  expression: string
  operands: Record<string, 't1' | 'sum:t1' | 'sum:t2'>
}

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
  ctx: { t1: Record<string, number>; t1Sums: Record<string, number>; t2Sums: Record<string, number> }
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
    
    // Fallbacks
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
