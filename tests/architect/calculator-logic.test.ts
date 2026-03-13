import { describe, it, expect } from 'vitest'

// ─── Extracted pure functions from calculator store ───
// These mirror the logic in stores/architect/calculator.ts

interface Lot {
  prices: number[]
  excl: boolean[]
  qty: number
}

/** Compute baseline (average of active prices × quantity) */
function lotBaseline(l: Lot): number {
  const ap = l.prices.filter((p, i) => p > 0 && !l.excl[i])
  if (!ap.length) return 0
  const avg = ap.reduce((s, p) => s + p, 0) / ap.length
  return avg * (l.qty || 0)
}

/** Compute gap between top 3 active prices (as %) */
function gapPercent(prices: number[], excl: boolean[]): number | null {
  const activePrices = prices.filter((p, i) => p > 0 && !excl[i])
  if (activePrices.length < 2) return null
  const sorted = [...activePrices].sort((a, b) => a - b)
  const low3 = sorted.slice(0, 3)
  const mn = low3[0], mx = low3[low3.length - 1]
  if (mn <= 0) return null
  return Math.round((mx - mn) / mn * 10000) / 100
}

/** Map gap to scoring dimension value */
function gapToV6(gap: number | null): number {
  if (gap === null) return 1
  if (gap <= 7) return 1
  if (gap <= 10) return 2
  return 3
}

/** Map spend to scoring dimension value */
function spendToV1(spend: number): number {
  if (spend < 100000) return 1
  if (spend <= 500000) return 2
  return 3
}

/** Map supplier count to scoring dimension value */
function supCountToV2(count: number): number {
  if (count === 1) return 1
  if (count === 2) return 2
  return 3
}

/** Map intensity slider (0-100) to scoring dimension value */
function intensityToV5(intens: number): number {
  if (intens <= 33) return 1
  if (intens <= 66) return 2
  return 3
}

// ══════════════════════════════════════════════════════════════
// lotBaseline
// ══════════════════════════════════════════════════════════════
describe('lotBaseline', () => {
  it('calculates average × quantity for active prices', () => {
    const lot: Lot = { prices: [100, 200, 300], excl: [false, false, false], qty: 10 }
    expect(lotBaseline(lot)).toBe(2000) // avg=200, ×10
  })

  it('excludes zero prices', () => {
    const lot: Lot = { prices: [100, 0, 300], excl: [false, false, false], qty: 5 }
    expect(lotBaseline(lot)).toBe(1000) // avg of [100,300]=200, ×5
  })

  it('excludes explicitly excluded suppliers', () => {
    const lot: Lot = { prices: [100, 200, 300], excl: [false, true, false], qty: 4 }
    expect(lotBaseline(lot)).toBe(800) // avg of [100,300]=200, ×4
  })

  it('returns 0 when no active prices', () => {
    const lot: Lot = { prices: [0, 0, 0], excl: [false, false, false], qty: 10 }
    expect(lotBaseline(lot)).toBe(0)
  })

  it('returns 0 when all suppliers excluded', () => {
    const lot: Lot = { prices: [100, 200], excl: [true, true], qty: 10 }
    expect(lotBaseline(lot)).toBe(0)
  })

  it('returns 0 when qty is 0', () => {
    const lot: Lot = { prices: [100, 200], excl: [false, false], qty: 0 }
    expect(lotBaseline(lot)).toBe(0)
  })

  it('handles single active price', () => {
    const lot: Lot = { prices: [500], excl: [false], qty: 3 }
    expect(lotBaseline(lot)).toBe(1500)
  })
})

// ══════════════════════════════════════════════════════════════
// gapPercent
// ══════════════════════════════════════════════════════════════
describe('gapPercent', () => {
  it('calculates gap between lowest and highest of top 3', () => {
    // [100, 105, 110] → (110-100)/100 = 10%
    const gap = gapPercent([100, 110, 105], [false, false, false])
    expect(gap).toBe(10)
  })

  it('returns null with fewer than 2 active prices', () => {
    expect(gapPercent([100], [false])).toBeNull()
    expect(gapPercent([100, 0], [false, false])).toBeNull()
    expect(gapPercent([100, 200], [false, true])).toBeNull()
  })

  it('uses only top 3 lowest prices', () => {
    // Prices: [100, 103, 106, 500]
    // Top 3 lowest: [100, 103, 106] → (106-100)/100 = 6%
    const gap = gapPercent([500, 100, 106, 103], [false, false, false, false])
    expect(gap).toBe(6)
  })

  it('excludes zero and excluded prices', () => {
    const gap = gapPercent([100, 0, 110, 105], [false, false, false, true])
    // Active: [100, 110] → (110-100)/100 = 10%
    expect(gap).toBe(10)
  })

  it('returns 0% when all active prices are identical', () => {
    expect(gapPercent([100, 100, 100], [false, false, false])).toBe(0)
  })

  it('handles 2 prices correctly', () => {
    // [200, 214] → (214-200)/200 = 7%
    const gap = gapPercent([200, 214], [false, false])
    expect(gap).toBe(7)
  })
})

// ══════════════════════════════════════════════════════════════
// Dimension mapping functions
// ══════════════════════════════════════════════════════════════
describe('Dimension mappings', () => {
  describe('spendToV1', () => {
    it('< 100K → 1', () => {
      expect(spendToV1(0)).toBe(1)
      expect(spendToV1(50000)).toBe(1)
      expect(spendToV1(99999)).toBe(1)
    })
    it('100K–500K → 2', () => {
      expect(spendToV1(100000)).toBe(2)
      expect(spendToV1(300000)).toBe(2)
      expect(spendToV1(500000)).toBe(2)
    })
    it('> 500K → 3', () => {
      expect(spendToV1(500001)).toBe(3)
      expect(spendToV1(1000000)).toBe(3)
    })
  })

  describe('supCountToV2', () => {
    it('1 → 1, 2 → 2, 3+ → 3', () => {
      expect(supCountToV2(1)).toBe(1)
      expect(supCountToV2(2)).toBe(2)
      expect(supCountToV2(3)).toBe(3)
      expect(supCountToV2(10)).toBe(3)
    })
  })

  describe('intensityToV5', () => {
    it('≤33 → 1 (Collaborative)', () => {
      expect(intensityToV5(0)).toBe(1)
      expect(intensityToV5(33)).toBe(1)
    })
    it('34–66 → 2 (Competitive)', () => {
      expect(intensityToV5(34)).toBe(2)
      expect(intensityToV5(50)).toBe(2)
      expect(intensityToV5(66)).toBe(2)
    })
    it('>66 → 3 (Aggressive)', () => {
      expect(intensityToV5(67)).toBe(3)
      expect(intensityToV5(100)).toBe(3)
    })
  })

  describe('gapToV6', () => {
    it('≤7% → 1', () => {
      expect(gapToV6(0)).toBe(1)
      expect(gapToV6(5)).toBe(1)
      expect(gapToV6(7)).toBe(1)
    })
    it('7–10% → 2', () => {
      expect(gapToV6(7.01)).toBe(2)
      expect(gapToV6(10)).toBe(2)
    })
    it('>10% → 3', () => {
      expect(gapToV6(10.01)).toBe(3)
      expect(gapToV6(50)).toBe(3)
    })
    it('null → 1 (default)', () => {
      expect(gapToV6(null)).toBe(1)
    })
  })
})
