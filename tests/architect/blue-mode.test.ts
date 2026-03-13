import { describe, it, expect } from 'vitest'
import {
  getScores,
  DEF_BASES,
  DEF_SAVINGS,
  DEF_MATRIX,
  deepCloneMatrix,
  type ScoringParams,
  type ScoreResult,
} from '~/utils/decisionTree/scoring-engine'
import {
  parseSnapshot,
  createSnapshot,
  SnapshotV2Schema,
} from '~/utils/decisionTree/snapshot-schema'
import { getFamilyOptions, PREF_LABELS } from '~/utils/decisionTree/constants'

const P: ScoringParams = {
  bases: [...DEF_BASES],
  savings: [...DEF_SAVINGS],
  matrix: deepCloneMatrix(DEF_MATRIX),
}

// ─── Extracted pure functions mirroring calculator store logic ───
interface Lot {
  prices: number[]
  excl: boolean[]
  qty: number
  award: number
  pref: number
  intens: number
}

function lotBaseline(l: { prices: number[]; excl: boolean[]; qty: number }): number {
  const ap = l.prices.filter((p, i) => p > 0 && !l.excl[i])
  if (!ap.length) return 0
  const avg = ap.reduce((s, p) => s + p, 0) / ap.length
  return avg * (l.qty || 0)
}

function allOffersFilled(lots: { prices: number[]; excl: boolean[] }[]): boolean {
  return lots.every(l => l.prices.every((p, i) => l.excl[i] || p > 0))
}

/** Mirrored blue mode Traditional override from calculator store lotTop3 */
function blueTraditionalOverride(
  scores: ScoreResult[],
  lot: Lot,
): ScoreResult[] | null {
  const bl = lotBaseline(lot)
  const lotAw = lot.award || 1
  if (bl > 0 && bl < 100000 && (lotAw === 2 || lotAw === 3)) {
    const trad = scores.find(r => r.family === 'Traditional')
    if (trad) {
      const others = scores
        .filter(r => !r.eliminated && r.family !== 'Traditional')
        .slice(0, 2)
      return [{ ...trad, eliminated: false, pctMatch: 100 }, ...others]
    }
  }
  return null
}

/** Blue mode verdict logic */
function blueVerdict(spend: number, nSup: number): 'stop' | 'ok' | 'perfect' {
  if (spend < 100000 && nSup <= 1) return 'stop'
  if (spend > 500000 && nSup > 1) return 'perfect'
  return 'ok'
}

/** Blue mode p1Pct logic */
function blueP1Pct(spend: number, nSup: number): number {
  let d = 0
  if (spend > 0) d++
  if (nSup > 0) d++
  const pct = Math.round(d / 2 * 100)
  if (pct === 100 && spend < 100000 && nSup <= 1) return 99
  return pct
}

// ══════════════════════════════════════════════════════════════
// 1. BLUE MODE — SNAPSHOT PERSISTENCE
// ══════════════════════════════════════════════════════════════
describe('Blue mode — snapshot persistence', () => {
  const blueSnapshot = {
    version: 2 as const,
    mode: 'blue' as const,
    phase: 2,
    spend: 250000,
    nSup: 3,
    award: null,
    ccy: 'EUR',
    evName: 'Blue Test Event',
    lots: [{ id: 1, name: 'Lot 1', unit: 'Unit', qty: 10, pref: 1, intens: 50, award: 1, prices: [100, 200, 300], excl: [false, false, false] }],
    sc: 3,
    supNames: ['A', 'B', 'C'],
    selLot: 0,
    expLot: -1,
  }

  it('parses a v2 blue mode snapshot', () => {
    const result = parseSnapshot(blueSnapshot)
    expect(result).not.toBeNull()
    expect(result!.mode).toBe('blue')
    expect(result!.version).toBe(2)
  })

  it('preserves blue mode fields on round-trip', () => {
    const result = parseSnapshot(blueSnapshot)!
    expect(result.spend).toBe(250000)
    expect(result.nSup).toBe(3)
    expect(result.award).toBeNull() // blue mode doesn't use global award
    expect(result.evName).toBe('Blue Test Event')
    expect(result.lots[0].prices).toEqual([100, 200, 300])
  })

  it('creates a blue mode snapshot that passes v2 validation', () => {
    const snap = createSnapshot({
      mode: 'blue',
      phase: 1,
      spend: 150000,
      nSup: 4,
      award: null,
      ccy: 'EUR',
      evName: 'New Blue',
      lots: [{ id: 1, name: 'L1', unit: 'u', qty: 5, pref: 2, intens: 60, award: 1, prices: [50, 60, 70, 80], excl: [false, false, false, false] }],
      sc: 4,
      supNames: ['S1', 'S2', 'S3', 'S4'],
      selLot: 0,
      expLot: -1,
    })
    const result = SnapshotV2Schema.safeParse(snap)
    expect(result.success).toBe(true)
    expect(snap.mode).toBe('blue')
  })

  it('migrates a v1 blue mode snapshot to v2', () => {
    const v1 = { mode: 'blue', phase: 1, spend: 80000, nSup: 2, sc: 2 }
    const result = parseSnapshot(v1)
    expect(result).not.toBeNull()
    expect(result!.version).toBe(2)
    expect(result!.mode).toBe('blue')
  })

  it('preserves scoring params in blue snapshot', () => {
    const withParams = {
      ...blueSnapshot,
      params: { bases: [...DEF_BASES], savings: [...DEF_SAVINGS], matrix: deepCloneMatrix(DEF_MATRIX) },
    }
    const result = parseSnapshot(withParams)
    expect(result!.params).toBeDefined()
    expect(result!.params!.bases).toHaveLength(22)
  })
})

// ══════════════════════════════════════════════════════════════
// 2. BLUE MODE — VERDICT & STEP GUARD LOGIC
// ══════════════════════════════════════════════════════════════
describe('Blue mode — verdict & step guard', () => {
  it('spend < 100K AND nSup <= 1 → stop', () => {
    expect(blueVerdict(50000, 1)).toBe('stop')
    expect(blueVerdict(99999, 1)).toBe('stop')
    expect(blueVerdict(0, 0)).toBe('stop')
  })

  it('spend >= 100K OR nSup > 1 → ok', () => {
    expect(blueVerdict(100000, 1)).toBe('ok')
    expect(blueVerdict(50000, 2)).toBe('ok')
    expect(blueVerdict(100000, 2)).toBe('ok')
  })

  it('spend > 500K AND nSup > 1 → perfect', () => {
    expect(blueVerdict(500001, 2)).toBe('perfect')
    expect(blueVerdict(1000000, 5)).toBe('perfect')
  })

  it('boundary: spend=500000, nSup=2 → ok (not perfect, ≤ 500K)', () => {
    expect(blueVerdict(500000, 2)).toBe('ok')
  })

  it('boundary: spend=100000, nSup=1 → ok (not stop, ≥ 100K)', () => {
    expect(blueVerdict(100000, 1)).toBe('ok')
  })
})

// ══════════════════════════════════════════════════════════════
// 3. BLUE MODE — P1 PROGRESS (p1Pct)
// ══════════════════════════════════════════════════════════════
describe('Blue mode — p1Pct progress', () => {
  it('0% when both spend and nSup are 0', () => {
    expect(blueP1Pct(0, 0)).toBe(0)
  })

  it('50% when only spend is filled', () => {
    expect(blueP1Pct(100000, 0)).toBe(50)
  })

  it('50% when only nSup is filled', () => {
    expect(blueP1Pct(0, 3)).toBe(50)
  })

  it('100% when both filled AND verdict is not stop', () => {
    expect(blueP1Pct(100000, 2)).toBe(100)
    expect(blueP1Pct(500001, 5)).toBe(100)
  })

  it('99% when both filled BUT verdict is stop', () => {
    expect(blueP1Pct(50000, 1)).toBe(99)
    expect(blueP1Pct(99999, 1)).toBe(99)
  })

  it('boundary: spend=100000, nSup=1 → 100% (verdict ok)', () => {
    expect(blueP1Pct(100000, 1)).toBe(100)
  })
})

// ══════════════════════════════════════════════════════════════
// 4. BLUE MODE — TRADITIONAL NEGOTIATION OVERRIDE
// ══════════════════════════════════════════════════════════════
describe('Blue mode — Traditional override in lotTop3', () => {
  const mkLot = (prices: number[], qty: number, award: number): Lot => ({
    prices,
    excl: prices.map(() => false),
    qty,
    award,
    pref: 1,
    intens: 50,
  })

  it('forces Traditional #1 when baseline < 100K AND award=Rank(2)', () => {
    // baseline = avg(100,200) * 100 = 15000
    const lot = mkLot([100, 200], 100, 2)
    const scores = getScores(P, 2, 2, 2, 1, 2, 1)
    const result = blueTraditionalOverride(scores, lot)
    expect(result).not.toBeNull()
    expect(result![0].family).toBe('Traditional')
    expect(result![0].pctMatch).toBe(100)
    expect(result![0].eliminated).toBe(false)
  })

  it('forces Traditional #1 when baseline < 100K AND award=NoRank(3)', () => {
    const lot = mkLot([50, 80], 100, 3)
    const scores = getScores(P, 2, 2, 3, 1, 2, 1)
    const result = blueTraditionalOverride(scores, lot)
    expect(result).not.toBeNull()
    expect(result![0].family).toBe('Traditional')
  })

  it('does NOT trigger when award=Award(1)', () => {
    const lot = mkLot([100, 200], 100, 1) // baseline 15000 < 100K, but award=1
    const scores = getScores(P, 2, 2, 1, 1, 2, 1)
    const result = blueTraditionalOverride(scores, lot)
    expect(result).toBeNull()
  })

  it('does NOT trigger when baseline >= 100K', () => {
    const lot = mkLot([5000, 6000], 20, 2) // baseline = avg(5000,6000)*20 = 110000
    const scores = getScores(P, 2, 2, 2, 1, 2, 1)
    const result = blueTraditionalOverride(scores, lot)
    expect(result).toBeNull()
  })

  it('does NOT trigger when baseline = 0 (no prices)', () => {
    const lot = mkLot([0, 0], 100, 2)
    const scores = getScores(P, 2, 2, 2, 1, 2, 1)
    const result = blueTraditionalOverride(scores, lot)
    expect(result).toBeNull()
  })

  it('returns up to 3 results (Traditional + 2 alternatives)', () => {
    const lot = mkLot([100, 200, 300], 50, 2) // baseline = 10000
    const scores = getScores(P, 2, 3, 2, 1, 2, 1)
    const result = blueTraditionalOverride(scores, lot)
    expect(result).not.toBeNull()
    expect(result!.length).toBeLessThanOrEqual(3)
    expect(result!.length).toBeGreaterThanOrEqual(1)
  })

  it('alternatives exclude Traditional family', () => {
    const lot = mkLot([100, 200], 100, 2)
    const scores = getScores(P, 2, 2, 2, 1, 2, 1)
    const result = blueTraditionalOverride(scores, lot)!
    result.slice(1).forEach(r => {
      expect(r.family).not.toBe('Traditional')
    })
  })
})

// ══════════════════════════════════════════════════════════════
// 5. BLUE MODE — OFFERS VALIDATION (allOffersFilled)
// ══════════════════════════════════════════════════════════════
describe('Blue mode — allOffersFilled', () => {
  it('true when all non-excluded prices > 0', () => {
    const lots = [
      { prices: [100, 200], excl: [false, false] },
      { prices: [50, 80], excl: [false, false] },
    ]
    expect(allOffersFilled(lots)).toBe(true)
  })

  it('false when any non-excluded price is 0', () => {
    const lots = [
      { prices: [100, 0], excl: [false, false] },
    ]
    expect(allOffersFilled(lots)).toBe(false)
  })

  it('true when price=0 but supplier is excluded', () => {
    const lots = [
      { prices: [100, 0], excl: [false, true] },
    ]
    expect(allOffersFilled(lots)).toBe(true)
  })

  it('true when all suppliers excluded (edge case)', () => {
    const lots = [
      { prices: [0, 0], excl: [true, true] },
    ]
    expect(allOffersFilled(lots)).toBe(true)
  })

  it('false when only one lot has missing prices', () => {
    const lots = [
      { prices: [100, 200], excl: [false, false] },
      { prices: [100, 0], excl: [false, false] },
    ]
    expect(allOffersFilled(lots)).toBe(false)
  })

  it('handles empty lots array', () => {
    expect(allOffersFilled([])).toBe(true) // every on empty array returns true
  })
})

// ══════════════════════════════════════════════════════════════
// 6. BLUE MODE — FAMILY OPTIONS & PILLS
// ══════════════════════════════════════════════════════════════
describe('Blue mode — getFamilyOptions', () => {
  it('English has security, preference, and awarding options', () => {
    const opts = getFamilyOptions('English')
    expect(opts.security).toEqual(['Pre-bid', 'No Pre-bid'])
    expect(opts.preference).toEqual(['None', 'Non-Financial', 'Financial'])
    expect(opts.awarding).toEqual(['Award', 'Rank'])
  })

  it('Dutch has security, preference, and awarding=Award only', () => {
    const opts = getFamilyOptions('Dutch')
    expect(opts.awarding).toEqual(['Award'])
  })

  it('Sealed Bid only has No Pre-bid for security', () => {
    const opts = getFamilyOptions('Sealed Bid')
    expect(opts.security).toEqual(['No Pre-bid'])
  })

  it('Japanese has Pre-bid and No Pre-bid, but no Non-Financial pref', () => {
    const opts = getFamilyOptions('Japanese')
    expect(opts.security).toEqual(['Pre-bid', 'No Pre-bid'])
    expect(opts.preference).toEqual(['None', 'Financial'])
  })

  it('Traditional returns all null options', () => {
    const opts = getFamilyOptions('Traditional')
    expect(opts.security).toBeNull()
    expect(opts.preference).toBeNull()
    expect(opts.awarding).toBeNull()
  })

  it('Double Scenario returns security and preference but no awarding', () => {
    const opts = getFamilyOptions('Double Scenario')
    expect(opts.security).not.toBeNull()
    expect(opts.preference).not.toBeNull()
  })
})

describe('PREF_LABELS', () => {
  it('maps 1=None, 2=Non-Financial, 3=Financial', () => {
    expect(PREF_LABELS[1]).toBe('None')
    expect(PREF_LABELS[2]).toBe('Non-Financial')
    expect(PREF_LABELS[3]).toBe('Financial')
  })
})

// ══════════════════════════════════════════════════════════════
// 7. TRADITIONAL FALLBACK — SCORING ENGINE INVARIANT
// ══════════════════════════════════════════════════════════════
describe('Traditional fallback rule', () => {
  it('Traditional is NEVER eliminated regardless of inputs', () => {
    // Test all 27 combinations of Q1×Q2×Q3 with the harshest Q4=Financial
    for (let q1 = 1; q1 <= 3; q1++)
      for (let q2 = 1; q2 <= 3; q2++)
        for (let q3 = 1; q3 <= 3; q3++) {
          const r = getScores(P, q1, q2, q3, 3, 3, 3)
          const trad = r.find(s => s.family === 'Traditional')
          expect(trad?.eliminated).toBe(false)
          expect(trad?.raw).toBeGreaterThanOrEqual(1)
        }
  })

  it('Traditional raw is clamped to 1 when it would go negative', () => {
    // Financial pref (Q4=3) gives Traditional -999 on Q4 axis
    const r = getScores(P, 2, 2, 1, 3, 2, 1)
    const trad = r.find(s => s.family === 'Traditional')!
    // base=15, Q1(100-500K)=0, Q2(2sup)=0, Q3(Award)=0, Q4(Financial)=-999, Q5=−5, Q6=0
    // raw = 15 + 0 + 0 + 0 + (-999) + (-5) + 0 = -989 → clamped to 1
    expect(trad.raw).toBe(1)
    expect(trad.eliminated).toBe(false)
  })

  it('Traditional has normal raw when not penalized', () => {
    // Q4=None → Traditional gets 0, not penalized
    const r = getScores(P, 1, 1, 1, 1, 1, 1)
    const trad = r.find(s => s.family === 'Traditional')!
    // base=15, Q1(small)=10, Q2(1)=30, Q3(Award)=0, Q4(None)=0, Q5(Collab)=20, Q6(<7%)=0
    expect(trad.raw).toBe(75)
    expect(trad.eliminated).toBe(false)
  })
})
