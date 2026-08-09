import { describe, it, expect } from 'vitest'
import { computePerRowComputed, applyRunningBalance } from '../../../utils/FormulaEvaluator'
import type { T1ComputedRuleLegacy } from '../../../utils/FormulaEvaluator'

describe('AC4.1 computePerRowComputed integration', () => {
  it('computes running balance for a cash flow report', () => {
    const rows = [
      { No: 1, Debet: 500000, Kredit: 100000, SaldoAwal: 1000000 },
      { No: 2, Debet: 0, Kredit: 200000, SaldoAwal: 0 },
      { No: 3, Debet: 100000, Kredit: 0, SaldoAwal: 0 },
    ]
    // Apply per-row Net computation first
    const rules: Record<string, T1ComputedRuleLegacy> = {
      Netto: { expression: 'Debet - Kredit', operands: {} },
    }
    const withNet = computePerRowComputed(rows, rules)
    // Then apply running balance on top of Netto
    const enriched = applyRunningBalance(withNet, { saldo: { delta: 'Netto' } }, 'Saldo')
    expect(enriched[0].Saldo).toBe(1000000 + 400000)  // 1400000 (SaldoAwal + Netto)
    expect(enriched[1].Saldo).toBe(1400000 - 200000)  // 1200000 (prev + delta)
    expect(enriched[2].Saldo).toBe(1200000 + 100000)  // 1300000
  })
})

describe('AC4.2 running balance with groups', () => {
  it('resets running balance per group', () => {
    const rows = [
      { Group: 'A', Debet: 100, Kredit: 20 },
      { Group: 'A', Debet: 50, Kredit: 10 },
      { Group: 'B', Debet: 200, Kredit: 50 },
    ]
    const rules: Record<string, T1ComputedRuleLegacy> = {
      Netto: { expression: 'Debet - Kredit', operands: {} },
    }
    const enriched = computePerRowComputed(rows, rules)
    expect(enriched[0].Netto).toBe(80)
    expect(enriched[1].Netto).toBe(40)
    expect(enriched[2].Netto).toBe(150)
  })
})
