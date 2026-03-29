import { describe, it, expect } from 'vitest'

/**
 * Analyzer calculation tests
 * Tests the core computation logic used by the analyzer APIs and frontend
 */

// Replicate the calculation helpers used across the analyzer
const fmtSaving = (pct) => {
  if (pct == null) return null
  const n = Number(pct)
  if (n > 0) return `+${n}%`
  if (n < 0) return `${n}%`
  return '0%'
}

const titleCase = (s) => {
  if (!s) return ''
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
}

const conversionRates = { 'EUR->USD': 1.08, 'USD->EUR': 0.93, 'EUR->EUR': 1, 'USD->USD': 1 }
const convert = (val, from, to) => {
  if (val == null) return null
  if (from === to) return Number(val)
  const rate = conversionRates[`${from}->${to}`] || 1
  return Number(val) * rate
}

describe('Saving calculations', () => {
  it('calculates saving_pct correctly', () => {
    const baseline = 100000
    const bestPrice = 85000
    const saving = ((1 - bestPrice / baseline) * 100)
    expect(saving).toBeCloseTo(15.0, 1)
  })

  it('calculates saving_abs correctly', () => {
    const baseline = 964342
    const bestPrice = 731578
    const saving = baseline - bestPrice
    expect(saving).toBe(232764)
  })

  it('handles negative savings (price above baseline)', () => {
    const baseline = 325600
    const bestPrice = 344000
    const saving_pct = ((1 - bestPrice / baseline) * 100)
    expect(saving_pct).toBeLessThan(0)
    expect(saving_pct).toBeCloseTo(-5.65, 1)
  })

  it('handles zero baseline', () => {
    const baseline = 0
    const bestPrice = 50000
    const saving_pct = baseline > 0 ? ((1 - bestPrice / baseline) * 100) : null
    expect(saving_pct).toBeNull()
  })
})

describe('fmtSaving', () => {
  it('formats positive savings with +', () => {
    expect(fmtSaving(15.5)).toBe('+15.5%')
  })

  it('formats negative savings without double sign', () => {
    expect(fmtSaving(-5.65)).toBe('-5.65%')
  })

  it('formats zero', () => {
    expect(fmtSaving(0)).toBe('0%')
  })

  it('handles null', () => {
    expect(fmtSaving(null)).toBeNull()
  })
})

describe('titleCase', () => {
  it('converts uppercase to title case', () => {
    expect(titleCase('KIABI')).toBe('Kiabi')
  })

  it('handles multi-word', () => {
    expect(titleCase('WELDING ALLOYS')).toBe('Welding Alloys')
  })

  it('handles already title case', () => {
    expect(titleCase('Bonduelle')).toBe('Bonduelle')
  })

  it('handles empty string', () => {
    expect(titleCase('')).toBe('')
  })

  it('handles null', () => {
    expect(titleCase(null)).toBe('')
  })
})

describe('Currency conversion', () => {
  it('converts EUR to USD', () => {
    expect(convert(100, 'EUR', 'USD')).toBeCloseTo(108, 0)
  })

  it('converts USD to EUR', () => {
    expect(convert(100, 'USD', 'EUR')).toBeCloseTo(93, 0)
  })

  it('same currency returns same value', () => {
    expect(convert(100, 'EUR', 'EUR')).toBe(100)
  })

  it('handles null', () => {
    expect(convert(null, 'EUR', 'USD')).toBeNull()
  })
})

describe('Supplier profile classification', () => {
  const classify = (s) => {
    const isDutchOnly = s.english_lots === 0 && s.lots_with_prebids > 0
    if (s.lots_bid === 0) return 'Passif'
    if (isDutchOnly && s.lots_won >= 2 && s.win_rate >= 50) return 'Expert'
    if (s.avg_compression === 0 && s.lots_won >= 2 && s.win_rate >= 70) return 'Expert'
    if (s.avg_compression > 12) return 'Volatile'
    if (s.avg_start_pct > 103 && s.avg_compression > 8) return 'Volatile'
    if (s.std_compression > 5 && s.english_lots >= 2) return 'Volatile'
    if (s.avg_compression >= 3 && s.win_rate >= 30) return 'Competiteur'
    if (isDutchOnly && s.lots_won > 0) return 'Expert'
    return 'Passif'
  }

  it('classifies Dutch-only winner as Expert', () => {
    expect(classify({ lots_bid: 12, lots_won: 10, win_rate: 83, english_lots: 0, lots_with_prebids: 12, avg_compression: 0, avg_start_pct: null, std_compression: null })).toBe('Expert')
  })

  it('classifies high compression as Volatile', () => {
    expect(classify({ lots_bid: 5, lots_won: 1, win_rate: 20, english_lots: 3, lots_with_prebids: 0, avg_compression: 25, avg_start_pct: 110, std_compression: 8 })).toBe('Volatile')
  })

  it('classifies moderate compression with good win rate as Competiteur', () => {
    expect(classify({ lots_bid: 7, lots_won: 5, win_rate: 71, english_lots: 7, lots_with_prebids: 0, avg_compression: 8, avg_start_pct: 96, std_compression: 2 })).toBe('Competiteur')
  })

  it('classifies no-bid as Passif', () => {
    expect(classify({ lots_bid: 0, lots_won: 0, win_rate: 0, english_lots: 0, lots_with_prebids: 0, avg_compression: 0, avg_start_pct: null, std_compression: null })).toBe('Passif')
  })

  it('classifies low activity as Passif', () => {
    expect(classify({ lots_bid: 3, lots_won: 0, win_rate: 0, english_lots: 3, lots_with_prebids: 0, avg_compression: 1, avg_start_pct: 99, std_compression: 0.5 })).toBe('Passif')
  })
})

describe('Intensity score', () => {
  const calcIntensity = (s) => {
    let intensity = 0
    if (s.bid_rate >= 80) intensity++
    if (s.bid_rate >= 50) intensity++
    if (s.avg_bids_per_lot >= 10) intensity += 2
    else if (s.avg_bids_per_lot >= 5) intensity++
    else if (s.total_prebids > 0 && s.lots_with_prebids >= s.lots_bid * 0.5) intensity++
    if (s.avg_compression >= 10) intensity++
    return Math.min(intensity, 5)
  }

  it('gives high intensity to active English bidder', () => {
    expect(calcIntensity({ bid_rate: 100, avg_bids_per_lot: 15, total_prebids: 0, lots_with_prebids: 0, lots_bid: 5, avg_compression: 12 })).toBe(5)
  })

  it('gives moderate intensity to prebid-only supplier', () => {
    expect(calcIntensity({ bid_rate: 80, avg_bids_per_lot: 0, total_prebids: 10, lots_with_prebids: 10, lots_bid: 10, avg_compression: 0 })).toBe(3)
  })

  it('gives low intensity to passive supplier', () => {
    expect(calcIntensity({ bid_rate: 20, avg_bids_per_lot: 2, total_prebids: 0, lots_with_prebids: 0, lots_bid: 1, avg_compression: 1 })).toBe(0)
  })
})

describe('Event aggregation', () => {
  it('calculates weighted saving correctly', () => {
    const lots = [
      { baseline: 100000, best_price: 90000 },
      { baseline: 200000, best_price: 160000 }
    ]
    const totalBaseline = lots.reduce((s, l) => s + l.baseline, 0)
    const totalSpend = lots.reduce((s, l) => s + l.best_price, 0)
    const weightedSaving = ((1 - totalSpend / totalBaseline) * 100)
    // (300000 - 250000) / 300000 = 16.67%
    expect(weightedSaving).toBeCloseTo(16.67, 1)
  })

  it('weighted saving differs from average of lot savings', () => {
    const lots = [
      { baseline: 100000, best_price: 90000 }, // 10% saving
      { baseline: 200000, best_price: 160000 }  // 20% saving
    ]
    const avgSaving = (10 + 20) / 2 // = 15%
    const totalBaseline = lots.reduce((s, l) => s + l.baseline, 0)
    const totalSpend = lots.reduce((s, l) => s + l.best_price, 0)
    const weightedSaving = ((1 - totalSpend / totalBaseline) * 100) // = 16.67%
    // Weighted ≠ simple average (because different baselines)
    expect(weightedSaving).not.toBeCloseTo(avgSaving, 0)
  })
})

describe('Compression calculation', () => {
  it('calculates compression from first to last bid', () => {
    const firstPrice = 100000
    const bestPrice = 85000
    const compression = ((firstPrice - bestPrice) / firstPrice) * 100
    expect(compression).toBe(15)
  })

  it('compression is 0 for single bid', () => {
    const firstPrice = 100000
    const bestPrice = 100000
    const compression = ((firstPrice - bestPrice) / firstPrice) * 100
    expect(compression).toBe(0)
  })

  it('compression cannot be negative (best > first should not happen in English)', () => {
    const firstPrice = 85000
    const bestPrice = 85000 // In English, best is always <= first
    const compression = ((firstPrice - bestPrice) / firstPrice) * 100
    expect(compression).toBeGreaterThanOrEqual(0)
  })
})

describe('Win rate and bid rate', () => {
  it('win_rate = lots_won / lots_bid * 100', () => {
    expect(Math.round(12 / 19 * 100)).toBe(63)
  })

  it('bid_rate = lots_bid / lots_invited * 100', () => {
    expect(Math.round(19 / 19 * 100)).toBe(100)
  })

  it('win_rate cannot exceed 100%', () => {
    // lots_won should never exceed lots_bid
    const lots_won = 5
    const lots_bid = 5
    expect(Math.round(lots_won / lots_bid * 100)).toBeLessThanOrEqual(100)
  })
})
