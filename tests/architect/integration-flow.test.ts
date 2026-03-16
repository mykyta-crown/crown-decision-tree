import { describe, it, expect } from 'vitest'
import { getScores, DEF_BUILDER_PARAMS, DEF_BASES, DEF_SAVINGS, DEF_MATRIX } from '~/utils/architect/scoring-engine'

// ─────────────────────────────────────────────────────────────────────────────
// Integration flow tests — end-to-end pipeline from raw inputs to builder payload
// Covers: scoring → params computation → _buildLotData → sessionStorage contract
//
// Pattern: pure functions are re-extracted inline (no Vue/Pinia required).
// Mirrors the pattern of auction-params.test.ts and build-state.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

// ── Helpers (extracted from AuctionParamsModal.vue) ───────────────────────────

function niceRound(val: number): number {
  if (val <= 0) return 0
  if (val < 1)       return Math.round(val * 100) / 100
  if (val < 5)       return Math.round(val * 4) / 4
  if (val < 20)      return Math.round(val * 2) / 2
  if (val < 100)     return Math.round(val)
  if (val < 500)     return Math.round(val / 10) * 10
  if (val < 2000)    return Math.round(val / 50) * 50
  if (val < 10000)   return Math.round(val / 1000) * 1000
  if (val < 50000)   return Math.round(val / 5000) * 5000
  if (val < 200000)  return Math.round(val / 10000) * 10000
  return Math.round(val / 50000) * 50000
}

function roundIncrement(val: number): number {
  if (val <= 0) return 0
  if (val < 1)     return Math.round(val * 10) / 10
  if (val < 5)     return Math.round(val)
  if (val < 50)    return Math.round(val / 5) * 5
  if (val < 500)   return Math.round(val / 25) * 25
  if (val < 2000)  return Math.round(val / 100) * 100
  if (val < 10000) return Math.round(val / 500) * 500
  return Math.round(val / 2000) * 2000
}

function softRound(val: number): number {
  if (val <= 0) return 0
  if (val < 10)      return Math.round(val * 10) / 10
  if (val < 100)     return Math.round(val)
  if (val < 1000)    return Math.round(val / 5) * 5
  if (val < 10000)   return Math.round(val / 50) * 50
  if (val < 100000)  return Math.round(val / 100) * 100
  return Math.round(val / 1000) * 1000
}

function bestOffer(prices: number[], excl: boolean[]): number {
  const valid = prices.filter((p, i) => !excl[i] && p > 0)
  return valid.length > 0 ? Math.min(...valid) : 0
}

function lotBaseline(prices: number[], excl: boolean[], qty: number): number {
  const ap = prices.filter((p, i) => p > 0 && !excl[i])
  if (!ap.length || qty <= 0) return 0
  const avg = ap.reduce((s, p) => s + p, 0) / ap.length
  return avg * qty
}

// ── computeParams (extracted from AuctionParamsModal.vue) ─────────────────────

function computeEnglishParams(lotBaselineVal: number, bp = DEF_BUILDER_PARAMS.english) {
  return {
    type: 'English' as const,
    builderType: 'reverse' as const,
    duration: bp.duration ?? 15,
    overtimeRange: bp.overtime_range ?? 3,
    maxRankDisplayed: 2,
    minDecr: niceRound(lotBaselineVal * (bp.min_decr_factor ?? 0.25) / 100),
    maxDecr: niceRound(lotBaselineVal * (bp.max_decr_factor ?? 20) / 100),
  }
}

function computeDutchParams(prices: number[], excl: boolean[], pref: number, bp_dutch = DEF_BUILDER_PARAMS.dutch, bp_dp = DEF_BUILDER_PARAMS.dutchPreferred) {
  const isDutchPreferred = pref === 2
  const bp = isDutchPreferred ? bp_dp : bp_dutch
  const best = bestOffer(prices, excl)
  const ending   = softRound(best * (bp.ending_factor ?? 95) / 100)
  const incr     = roundIncrement((ending * (bp.range_percent ?? 35) / 100) / (bp.steps ?? 19))
  const starting = softRound(ending - (bp.steps ?? 19) * incr)
  if (isDutchPreferred) {
    return {
      type: 'DutchPreferred' as const, builderType: 'dutch' as const,
      duration: bp.duration ?? 20, roundDuration: bp.round_duration ?? 1,
      nbRounds: bp.nb_rounds ?? 20, maxRankDisplayed: 1, prebid: true,
      timePerRound: (bp as any).time_per_round ?? 30,
      ending, starting, incr,
    }
  }
  return {
    type: 'Dutch' as const, builderType: 'dutch' as const,
    duration: bp.duration ?? 10, roundDuration: bp.round_duration ?? 0.5,
    nbRounds: bp.nb_rounds ?? 20, maxRankDisplayed: 1, prebid: true,
    ending, starting, incr,
  }
}

function computeJapaneseParams(prices: number[], excl: boolean[], bp = DEF_BUILDER_PARAMS.japanese) {
  const best = bestOffer(prices, excl)
  const starting = softRound(best * (bp.starting_factor ?? 95) / 100)
  const floor    = softRound(best * (bp.floor_factor ?? 65) / 100)
  const decr     = niceRound((starting - floor) / (bp.steps ?? 19))
  return {
    type: 'Japanese' as const, builderType: 'japanese' as const,
    duration: bp.duration ?? 10, roundDuration: bp.round_duration ?? 0.5,
    nbRounds: bp.nb_rounds ?? 20, maxRankDisplayed: 0, prebid: true,
    starting, floor, decr,
  }
}

function computeSealedBidParams() {
  return { type: 'SealedBid' as const, builderType: 'sealed-bid' as const, maxRankDisplayed: 2 }
}

function computeDoubleScenarioParams(lotBaselineVal: number, bp = DEF_BUILDER_PARAMS.doubleScenario) {
  return {
    type: 'DoubleScenario' as const,
    english: {
      builderType: 'reverse' as const,
      duration: bp.duration ?? 15, overtimeRange: bp.overtime_range ?? 3,
      maxRankDisplayed: (bp as any).max_rank_displayed ?? 3,
      minDecr: niceRound(lotBaselineVal * (bp.min_decr_factor ?? 0.25) / 100),
      maxDecr: niceRound(lotBaselineVal * (bp.max_decr_factor ?? 20) / 100),
    },
    dutch: {
      builderType: 'dutch' as const,
      duration: 10, overtimeRange: 0.5, maxRankDisplayed: 1, prebid: true,
    },
  }
}

// ── _buildLotData (extracted from useArchitectBuildState.js) ──────────────────

function buildLotData(phaseParams: any, lot: any, lotBaselineVal: number, ccy: string) {
  const base = {
    name: lot.name || '',
    multiplier: true, rank_trigger: 'all',
    min_bid_decr_type: ccy, max_bid_decr_type: ccy,
    suppliers: [], suppliersTimePerRound: [],
    items: [{ line_item: lot.name || '', unit: lot.unit || '', quantity: lot.qty || 1, index: 0 }],
    commercials_docs: [],
    awarding_principles: '', commercials_terms: '', general_terms: '',
    got_fixed_handicap: false, show_fixed_handicap_calculations: false,
    got_dynamic_handicap: false, handicaps: [], rank_per_line_item: false,
    max_rank_displayed: phaseParams.maxRankDisplayed,
  }
  const type = phaseParams.builderType
  if (type === 'reverse') return { ...base, duration: phaseParams.duration, overtime_range: phaseParams.overtimeRange, baseline: lotBaselineVal, min_bid_decr: phaseParams.minDecr, max_bid_decr: phaseParams.maxDecr, dutch_prebid_enabled: false }
  if (type === 'sealed-bid') return { ...base, duration: 0, overtime_range: 0, baseline: lotBaselineVal, min_bid_decr: 0, max_bid_decr: 0, dutch_prebid_enabled: false }
  if (type === 'dutch') {
    const qty = lot.qty || 1
    return { ...base, duration: phaseParams.duration, overtime_range: phaseParams.roundDuration ?? phaseParams.overtimeRange, baseline: (phaseParams.starting ?? 0) * qty, min_bid_decr: (phaseParams.incr ?? 0) * qty, max_bid_decr: (phaseParams.ending ?? 0) * qty, dutch_prebid_enabled: true }
  }
  if (type === 'japanese') {
    const qty = lot.qty || 1
    return { ...base, duration: phaseParams.duration, overtime_range: phaseParams.roundDuration ?? phaseParams.overtimeRange, baseline: (phaseParams.starting ?? 0) * qty, min_bid_decr: (phaseParams.decr ?? 0) * qty, max_bid_decr: (phaseParams.starting ?? 0) * qty, dutch_prebid_enabled: true }
  }
  return { ...base, duration: 0, overtime_range: 0, baseline: 0, min_bid_decr: 0, max_bid_decr: 0, dutch_prebid_enabled: false }
}

// ── buildBasics (extracted from saveArchitectState) ───────────────────────────

function buildBasics(params: any, phaseParams: any, buildDate: string) {
  return {
    name: params.name,
    description: '',
    type: phaseParams.builderType,
    currency: params.currency,
    timezone: params.timezone,
    time: params.time,
    date: buildDate,
    usage: params.usage,
    max_rank_displayed: phaseParams.maxRankDisplayed,
    prefered: params.type === 'DutchPreferred',
    published: false,
    test: true,
    log_visibility: 'only_own',
  }
}

// ── lotTop3 override logic (from stores/architect/calculator.ts) ──────────────

function lotTop3Override(scores: any[], lotBaseline: number, lotAward: number) {
  if (!scores || scores.length === 0) return []
  if (lotBaseline > 0 && lotBaseline < 100000 && (lotAward === 2 || lotAward === 3)) {
    const trad = scores.find(r => r.family === 'Traditional')
    if (trad) {
      const others = scores.filter(r => !r.eliminated && r.family !== 'Traditional').slice(0, 2)
      return [{ ...trad, eliminated: false, pctMatch: 100 }, ...others]
    }
  }
  const nonTrad = scores.filter(r => !r.eliminated && r.family !== 'Traditional').slice(0, 3)
  if (nonTrad.length > 0) return nonTrad
  const trad = scores.find(r => !r.eliminated && r.family === 'Traditional')
  return trad ? [trad] : []
}

const ScoringParams = { bases: DEF_BASES, savings: DEF_SAVINGS, matrix: DEF_MATRIX }

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 1 — English (Reverse)
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 1 — English Auction (full pipeline)', () => {
  // Large spend, 3 suppliers, tight price gap → English wins
  const prices = [10000, 9700, 10200]
  const excl   = [false, false, false]
  const qty    = 5
  const award  = 1 // Award

  const bl     = lotBaseline(prices, excl, qty)   // avg × qty
  const scores = getScores(ScoringParams, 3, 3, 1, 1, 2, 1)
  const top3   = lotTop3Override(scores, bl, award)
  const params = computeEnglishParams(bl)
  const lot    = { name: 'Papeterie', unit: 'rames', qty }
  const lotData = buildLotData(params, lot, bl, 'EUR')
  const basics  = buildBasics({ name: 'Test EN', type: 'English', currency: 'EUR', timezone: 'Europe/Paris', time: '10:00', usage: 'test' }, params, '2026-03-22')

  it('lotBaseline = avg(prices) × qty', () => {
    expect(bl).toBeCloseTo((10000 + 9700 + 10200) / 3 * qty, 0)
  })

  it('English is in top 3 recommendations', () => {
    expect(top3.some(r => r.family === 'English')).toBe(true)
  })

  it('params.type = English, builderType = reverse', () => {
    expect(params.type).toBe('English')
    expect(params.builderType).toBe('reverse')
  })

  it('minDecr = niceRound(baseline × 0.25%)', () => {
    expect(params.minDecr).toBe(niceRound(bl * 0.25 / 100))
  })

  it('maxDecr = niceRound(baseline × 20%)', () => {
    expect(params.maxDecr).toBe(niceRound(bl * 20 / 100))
  })

  it('maxRankDisplayed = 2', () => {
    expect(params.maxRankDisplayed).toBe(2)
  })

  it('builder payload: basics.type = reverse', () => {
    expect(basics.type).toBe('reverse')
  })

  it('builder payload: basics.prefered = false', () => {
    expect(basics.prefered).toBe(false)
  })

  it('builder payload: dutch_prebid_enabled = false', () => {
    expect(lotData.dutch_prebid_enabled).toBe(false)
  })

  it('builder payload: baseline = lotBaseline', () => {
    expect(lotData.baseline).toBeCloseTo(bl, 0)
  })

  it('builder payload: min_bid_decr = params.minDecr', () => {
    expect(lotData.min_bid_decr).toBe(params.minDecr)
  })

  it('builder payload: max_bid_decr = params.maxDecr', () => {
    expect(lotData.max_bid_decr).toBe(params.maxDecr)
  })

  it('builder payload: duration and overtime_range correct', () => {
    expect(lotData.duration).toBe(15)
    expect(lotData.overtime_range).toBe(3)
  })

  it('lot items populated correctly', () => {
    expect(lotData.items[0].quantity).toBe(qty)
    expect(lotData.items[0].unit).toBe('rames')
    expect(lotData.items[0].line_item).toBe('Papeterie')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 2 — Sealed Bid
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 2 — Sealed Bid (full pipeline)', () => {
  // Low spend → only SealedBid/Traditional survive
  const prices = [8000, 7500, 9000]
  const excl   = [false, false, false]
  const qty    = 1
  const award  = 1

  const bl      = lotBaseline(prices, excl, qty)
  const scores  = getScores(ScoringParams, 1, 3, 1, 1, 2, 1) // v1=1 (spend<100K)
  const top3    = lotTop3Override(scores, bl, award)
  const params  = computeSealedBidParams()
  const lot     = { name: 'IT Licences', unit: 'licences', qty }
  const lotData = buildLotData(params, lot, bl, 'USD')
  const basics  = buildBasics({ name: 'Test SB', type: 'SealedBid', currency: 'USD', timezone: 'Europe/Paris', time: '10:00', usage: 'test' }, params, '2026-03-22')

  it('with spend<100K, SealedBid appears in top results', () => {
    const sb = scores.find(r => r.family === 'Sealed Bid')
    expect(sb).toBeDefined()
    expect(sb!.eliminated).toBe(false)
  })

  it('params.type = SealedBid, builderType = sealed-bid', () => {
    expect(params.type).toBe('SealedBid')
    expect(params.builderType).toBe('sealed-bid')
  })

  it('maxRankDisplayed = 2', () => {
    expect(params.maxRankDisplayed).toBe(2)
  })

  it('builder payload: duration = 0, overtime_range = 0', () => {
    expect(lotData.duration).toBe(0)
    expect(lotData.overtime_range).toBe(0)
  })

  it('builder payload: all bid decr = 0', () => {
    expect(lotData.min_bid_decr).toBe(0)
    expect(lotData.max_bid_decr).toBe(0)
  })

  it('builder payload: dutch_prebid_enabled = false', () => {
    expect(lotData.dutch_prebid_enabled).toBe(false)
  })

  it('builder payload: baseline = lotBaseline', () => {
    expect(lotData.baseline).toBeCloseTo(bl, 0)
  })

  it('builder payload: basics.type = sealed-bid', () => {
    expect(basics.type).toBe('sealed-bid')
  })

  it('builder payload: basics.prefered = false', () => {
    expect(basics.prefered).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 3 — Dutch (Standard)
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 3 — Dutch Standard (full pipeline)', () => {
  const prices = [100000, 90000]
  const excl   = [false, false]
  const qty    = 2
  const pref   = 1 // None (not Preferred)

  const bl      = lotBaseline(prices, excl, qty)
  const params  = computeDutchParams(prices, excl, pref)
  const lot     = { name: 'Nettoyage', unit: 'sites', qty }
  const lotData = buildLotData(params, lot, bl, 'EUR')
  const basics  = buildBasics({ name: 'Test DU', type: 'Dutch', currency: 'EUR', timezone: 'Europe/Paris', time: '10:00', usage: 'test' }, params, '2026-03-22')

  const best = bestOffer(prices, excl) // 90000

  it('best offer = 90000 (minimum active price)', () => {
    expect(best).toBe(90000)
  })

  it('params.type = Dutch, builderType = dutch', () => {
    expect(params.type).toBe('Dutch')
    expect(params.builderType).toBe('dutch')
  })

  it('ending = softRound(best × 95%)', () => {
    expect(params.ending).toBe(softRound(90000 * 0.95))
  })

  it('incr = roundIncrement((ending × 35%) / 19)', () => {
    const expectedEnding = softRound(90000 * 0.95)
    const expectedIncr   = roundIncrement((expectedEnding * 0.35) / 19)
    expect(params.incr).toBe(expectedIncr)
  })

  it('starting = softRound(ending - 19 × incr)', () => {
    const expectedEnding   = softRound(90000 * 0.95)
    const expectedIncr     = roundIncrement((expectedEnding * 0.35) / 19)
    const expectedStarting = softRound(expectedEnding - 19 * expectedIncr)
    expect(params.starting).toBe(expectedStarting)
  })

  it('maxRankDisplayed = 1', () => {
    expect(params.maxRankDisplayed).toBe(1)
  })

  it('builder payload: baseline = starting × qty', () => {
    expect(lotData.baseline).toBe(params.starting * qty)
  })

  it('builder payload: min_bid_decr = incr × qty', () => {
    expect(lotData.min_bid_decr).toBe(params.incr * qty)
  })

  it('builder payload: max_bid_decr = ending × qty', () => {
    expect(lotData.max_bid_decr).toBe(params.ending * qty)
  })

  it('builder payload: dutch_prebid_enabled = true', () => {
    expect(lotData.dutch_prebid_enabled).toBe(true)
  })

  it('builder payload: overtime_range = roundDuration (not overtimeRange)', () => {
    expect(lotData.overtime_range).toBe(params.roundDuration)
  })

  it('builder payload: basics.type = dutch', () => {
    expect(basics.type).toBe('dutch')
  })

  it('builder payload: basics.prefered = false', () => {
    expect(basics.prefered).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 4 — Dutch Preferred
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 4 — Dutch Preferred (full pipeline)', () => {
  const prices = [100000, 90000]
  const excl   = [false, false]
  const qty    = 1
  const pref   = 2 // Preferred

  const params  = computeDutchParams(prices, excl, pref)
  const lot     = { name: 'Fournitures', unit: 'colis', qty }
  const lotData = buildLotData(params, lot, 0, 'EUR')
  const basics  = buildBasics({ name: 'Test DP', type: 'DutchPreferred', currency: 'EUR', timezone: 'Europe/Paris', time: '10:00', usage: 'test' }, params, '2026-03-22')

  it('params.type = DutchPreferred', () => {
    expect(params.type).toBe('DutchPreferred')
  })

  it('builderType = dutch (same as Dutch)', () => {
    expect(params.builderType).toBe('dutch')
  })

  it('duration = 20 (longer than Dutch)', () => {
    expect(params.duration).toBe(20)
  })

  it('roundDuration = 1 (longer rounds than Dutch 0.5)', () => {
    expect((params as any).roundDuration).toBe(1)
  })

  it('timePerRound = 30 (preferred window)', () => {
    expect((params as any).timePerRound).toBe(30)
  })

  it('same price logic as Dutch (ending/starting/incr formulas identical)', () => {
    const dutchParams = computeDutchParams(prices, excl, 1)
    // Price computation is the same formula, just different bp factors
    // Both use ending_factor=95, range_percent=35, steps=19 (same defaults)
    expect(params.ending).toBe(dutchParams.ending)
    expect(params.incr).toBe(dutchParams.incr)
    expect(params.starting).toBe(dutchParams.starting)
  })

  it('CRITICAL: basics.prefered = true for DutchPreferred', () => {
    expect(basics.prefered).toBe(true)
  })

  it('CRITICAL: basics.prefered = false for standard Dutch', () => {
    const dutchBasics = buildBasics({ name: 'X', type: 'Dutch', currency: 'EUR', timezone: 'UTC', time: '10:00', usage: 'test' }, computeDutchParams(prices, excl, 1), '2026-03-22')
    expect(dutchBasics.prefered).toBe(false)
  })

  it('builder payload: dutch_prebid_enabled = true', () => {
    expect(lotData.dutch_prebid_enabled).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 5 — Japanese
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 5 — Japanese (full pipeline)', () => {
  const prices = [50000, 45000, 55000]
  const excl   = [false, false, false]
  const qty    = 2

  const params  = computeJapaneseParams(prices, excl)
  const lot     = { name: 'Transport', unit: 'trajets', qty }
  const lotData = buildLotData(params, lot, 0, 'EUR')
  const basics  = buildBasics({ name: 'Test JP', type: 'Japanese', currency: 'EUR', timezone: 'Europe/Paris', time: '10:00', usage: 'test' }, params, '2026-03-22')

  const best = bestOffer(prices, excl) // 45000

  it('best = 45000 (min active price)', () => {
    expect(best).toBe(45000)
  })

  it('params.type = Japanese, builderType = japanese', () => {
    expect(params.type).toBe('Japanese')
    expect(params.builderType).toBe('japanese')
  })

  it('starting = softRound(best × 95%)', () => {
    expect(params.starting).toBe(softRound(45000 * 0.95))
  })

  it('floor = softRound(best × 65%)', () => {
    expect(params.floor).toBe(softRound(45000 * 0.65))
  })

  it('decr = niceRound((starting - floor) / 19)', () => {
    const s = softRound(45000 * 0.95)
    const f = softRound(45000 * 0.65)
    expect(params.decr).toBe(niceRound((s - f) / 19))
  })

  it('maxRankDisplayed = 0', () => {
    expect(params.maxRankDisplayed).toBe(0)
  })

  it('builder payload: baseline = starting × qty', () => {
    expect(lotData.baseline).toBe(params.starting * qty)
  })

  it('builder payload: min_bid_decr = decr × qty', () => {
    expect(lotData.min_bid_decr).toBe(params.decr * qty)
  })

  it('CRITICAL: builder max_bid_decr = starting × qty (ceiling = starting price, not ending)', () => {
    expect(lotData.max_bid_decr).toBe(params.starting * qty)
  })

  it('builder payload: dutch_prebid_enabled = true', () => {
    expect(lotData.dutch_prebid_enabled).toBe(true)
  })

  it('builder payload: basics.type = japanese', () => {
    expect(basics.type).toBe('japanese')
  })

  it('builder payload: basics.prefered = false', () => {
    expect(basics.prefered).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO 6 — Double Scenario
// ─────────────────────────────────────────────────────────────────────────────

describe('Scenario 6 — Double Scenario (full pipeline)', () => {
  const prices = [200000, 190000, 210000]
  const excl   = [false, false, false]
  const qty    = 1
  const bl     = lotBaseline(prices, excl, qty) // 200000

  const params  = computeDoubleScenarioParams(bl)
  const lot     = { name: 'Maintenance', unit: 'sites', qty }

  // For DS, phaseParams = params.english
  const isDS        = params.type === 'DoubleScenario'
  const phaseParams = isDS ? params.english : params
  const lotData     = buildLotData(phaseParams, lot, bl, 'EUR')
  const basics      = buildBasics({
    name: 'Test DS', type: 'DoubleScenario',
    currency: 'EUR', timezone: 'Europe/Paris', time: '10:00', usage: 'test',
  }, phaseParams, '2026-03-22')
  const state = {
    basics, suppliers: null, lots: [lotData],
    timingRule: 'serial',
    architectFamily: 'DoubleScenario',
    isDoubleScenarioEnglishPhase: isDS,
  }

  it('lotBaseline = 200000', () => {
    expect(bl).toBe(200000)
  })

  it('params.type = DoubleScenario', () => {
    expect(params.type).toBe('DoubleScenario')
  })

  it('isDoubleScenario = true triggers phaseParams = params.english', () => {
    expect(isDS).toBe(true)
    expect(phaseParams).toBe(params.english)
  })

  it('English phase: builderType = reverse', () => {
    expect(params.english.builderType).toBe('reverse')
  })

  it('English phase: maxRankDisplayed = 3', () => {
    expect(params.english.maxRankDisplayed).toBe(3)
  })

  it('English phase: minDecr computed from baseline', () => {
    expect(params.english.minDecr).toBe(niceRound(200000 * 0.25 / 100))
  })

  it('English phase: maxDecr computed from baseline', () => {
    expect(params.english.maxDecr).toBe(niceRound(200000 * 20 / 100))
  })

  it('Dutch phase present as placeholder', () => {
    expect(params.dutch).toBeDefined()
    expect(params.dutch.builderType).toBe('dutch')
    expect(params.dutch.prebid).toBe(true)
  })

  it('CRITICAL: builder basics.type = reverse (English phase drives basics)', () => {
    expect(basics.type).toBe('reverse')
  })

  it('CRITICAL: basics.prefered = false (DoubleScenario !== DutchPreferred)', () => {
    expect(basics.prefered).toBe(false)
  })

  it('CRITICAL: state.architectFamily = DoubleScenario', () => {
    expect(state.architectFamily).toBe('DoubleScenario')
  })

  it('CRITICAL: state.isDoubleScenarioEnglishPhase = true', () => {
    expect(state.isDoubleScenarioEnglishPhase).toBe(true)
  })

  it('builder payload: dutch_prebid_enabled = false (English phase)', () => {
    expect(lotData.dutch_prebid_enabled).toBe(false)
  })

  it('builder payload: baseline = lotBaseline (English uses avg×qty)', () => {
    expect(lotData.baseline).toBe(bl)
  })

  it('builder payload: min_bid_decr = English minDecr', () => {
    expect(lotData.min_bid_decr).toBe(params.english.minDecr)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE CASES
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge case — zero baseline', () => {
  it('lotBaseline = 0 when no active prices', () => {
    expect(lotBaseline([0, 0, 0], [false, false, false], 1)).toBe(0)
  })

  it('lotBaseline = 0 when all suppliers excluded', () => {
    expect(lotBaseline([10000, 9000], [true, true], 1)).toBe(0)
  })

  it('lotBaseline = 0 when qty = 0', () => {
    expect(lotBaseline([10000, 9000], [false, false], 0)).toBe(0)
  })

  it('bestOffer = 0 when no active prices', () => {
    expect(bestOffer([0, 0], [false, false])).toBe(0)
  })

  it('bestOffer = 0 when all excluded', () => {
    expect(bestOffer([5000, 4000], [true, true])).toBe(0)
  })

  it('English params with baseline=0: minDecr = 0, maxDecr = 0', () => {
    const p = computeEnglishParams(0)
    expect(p.minDecr).toBe(0)
    expect(p.maxDecr).toBe(0)
  })

  it('Dutch params with best=0: ending=0, starting=0, incr=0', () => {
    const p = computeDutchParams([0, 0], [false, false], 1)
    expect(p.ending).toBe(0)
    expect(p.starting).toBe(0)
    expect(p.incr).toBe(0)
  })

  it('Japanese params with best=0: starting=0, floor=0, decr=0', () => {
    const p = computeJapaneseParams([0, 0], [false, false])
    expect(p.starting).toBe(0)
    expect(p.floor).toBe(0)
    expect(p.decr).toBe(0)
  })
})

describe('Edge case — single active supplier', () => {
  const prices = [0, 100000, 0]
  const excl   = [true, false, true]

  it('bestOffer = 100000', () => {
    expect(bestOffer(prices, excl)).toBe(100000)
  })

  it('lotBaseline uses only active price', () => {
    expect(lotBaseline(prices, excl, 1)).toBe(100000)
  })

  it('Dutch params computed from single active price', () => {
    const p = computeDutchParams(prices, excl, 1)
    expect(p.ending).toBe(softRound(100000 * 0.95))
  })
})

describe('Edge case — qty > 1 multiplied fields (Dutch)', () => {
  const prices = [1000, 900]
  const excl   = [false, false]
  const qty    = 5

  it('Dutch: baseline = starting × qty', () => {
    const params = computeDutchParams(prices, excl, 1)
    const lot = { name: 'X', unit: 'u', qty }
    const lotData = buildLotData(params, lot, 0, 'EUR')
    expect(lotData.baseline).toBe(params.starting * qty)
  })

  it('Dutch: min_bid_decr = incr × qty', () => {
    const params = computeDutchParams(prices, excl, 1)
    const lot = { name: 'X', unit: 'u', qty }
    const lotData = buildLotData(params, lot, 0, 'EUR')
    expect(lotData.min_bid_decr).toBe(params.incr * qty)
  })

  it('Dutch: max_bid_decr = ending × qty', () => {
    const params = computeDutchParams(prices, excl, 1)
    const lot = { name: 'X', unit: 'u', qty }
    const lotData = buildLotData(params, lot, 0, 'EUR')
    expect(lotData.max_bid_decr).toBe(params.ending * qty)
  })

  it('English: baseline = lotBaseline (already total, not multiplied again)', () => {
    const bl = lotBaseline(prices, excl, qty) // avg × qty = already total
    const params = computeEnglishParams(bl)
    const lot = { name: 'X', unit: 'u', qty }
    const lotData = buildLotData(params, lot, bl, 'EUR')
    expect(lotData.baseline).toBe(bl) // no second ×qty
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// REGRESSION GUARDS
// ─────────────────────────────────────────────────────────────────────────────

describe('Regression — builder field names match platform contract', () => {
  it('basics.type is never "english" (must be "reverse")', () => {
    const params = computeEnglishParams(50000)
    const basics = buildBasics({ name: 'X', type: 'English', currency: 'EUR', timezone: 'UTC', time: '10:00', usage: 'test' }, params, '2026-03-22')
    expect(basics.type).not.toBe('english')
    expect(basics.type).toBe('reverse')
  })

  it('basics.type is never "japanese-reverse" or similar', () => {
    const params = computeJapaneseParams([50000, 45000], [false, false])
    const basics = buildBasics({ name: 'X', type: 'Japanese', currency: 'EUR', timezone: 'UTC', time: '10:00', usage: 'test' }, params, '2026-03-22')
    expect(basics.type).toBe('japanese')
  })

  it('dutch_prebid_enabled is true for Dutch and Japanese, false for English and SealedBid', () => {
    const lot = { name: 'X', unit: 'u', qty: 1 }
    const du = buildLotData(computeDutchParams([100000, 90000], [false, false], 1), lot, 0, 'EUR')
    const jp = buildLotData(computeJapaneseParams([100000, 90000], [false, false]), lot, 0, 'EUR')
    const en = buildLotData(computeEnglishParams(95000), lot, 95000, 'EUR')
    const sb = buildLotData(computeSealedBidParams(), lot, 95000, 'EUR')
    expect(du.dutch_prebid_enabled).toBe(true)
    expect(jp.dutch_prebid_enabled).toBe(true)
    expect(en.dutch_prebid_enabled).toBe(false)
    expect(sb.dutch_prebid_enabled).toBe(false)
  })

  it('overtime_range for Dutch = roundDuration (0.5), not English overtimeRange (3)', () => {
    const params = computeDutchParams([100000, 90000], [false, false], 1)
    const lot = { name: 'X', unit: 'u', qty: 1 }
    const lotData = buildLotData(params, lot, 0, 'EUR')
    expect(lotData.overtime_range).toBe(0.5)
    expect(lotData.overtime_range).not.toBe(3)
  })

  it('max_rank_displayed: English=2, Dutch=1, Japanese=0, SealedBid=2, DS English=3', () => {
    const enP = computeEnglishParams(100000)
    const duP = computeDutchParams([100000, 90000], [false, false], 1)
    const jpP = computeJapaneseParams([100000, 90000], [false, false])
    const sbP = computeSealedBidParams()
    const dsP = computeDoubleScenarioParams(200000)
    expect(enP.maxRankDisplayed).toBe(2)
    expect(duP.maxRankDisplayed).toBe(1)
    expect(jpP.maxRankDisplayed).toBe(0)
    expect(sbP.maxRankDisplayed).toBe(2)
    expect(dsP.english.maxRankDisplayed).toBe(3)
  })
})

describe('Regression — lotTop3 small-spend override', () => {
  const scores = getScores(ScoringParams, 1, 3, 2, 1, 2, 1) // v1=1 → many eliminated

  it('award=Rank + baseline<100K → Traditional forced first with pctMatch=100', () => {
    const top = lotTop3Override(scores, 50000, 2) // 50K < 100K, Rank
    expect(top[0].family).toBe('Traditional')
    expect(top[0].pctMatch).toBe(100)
  })

  it('award=NoRank + baseline<100K → Traditional forced first', () => {
    const top = lotTop3Override(scores, 50000, 3)
    expect(top[0].family).toBe('Traditional')
  })

  it('award=Award + baseline<100K → no override, normal ranking', () => {
    const scoresAward = getScores(ScoringParams, 1, 3, 1, 1, 2, 1)
    const top = lotTop3Override(scoresAward, 50000, 1)
    // Traditional should not be artificially at top with pctMatch=100
    if (top[0].family === 'Traditional') {
      expect(top[0].pctMatch).not.toBe(100)
    }
  })

  it('baseline>=100K + Rank → non-Traditional families returned first when available', () => {
    // Use scores with multiple suppliers so non-Traditional families are NOT eliminated
    const scoresActive = getScores(ScoringParams, 3, 3, 2, 1, 2, 1)
    const top = lotTop3Override(scoresActive, 150000, 2) // 150K >= 100K
    // All returned families should be non-Traditional (override does not force Traditional)
    for (const r of top) {
      expect(r.family).not.toBe('Traditional')
    }
  })

  it('empty scores → returns []', () => {
    expect(lotTop3Override([], 50000, 1)).toEqual([])
  })
})

describe('Regression — builderParams fallbacks when factors undefined', () => {
  it('English: falls back to DEF values when bp fields are undefined', () => {
    const p = computeEnglishParams(100000, {} as any)
    expect(p.duration).toBe(15)
    expect(p.overtimeRange).toBe(3)
    expect(p.minDecr).toBe(niceRound(100000 * 0.25 / 100))
    expect(p.maxDecr).toBe(niceRound(100000 * 20 / 100))
  })

  it('Dutch: falls back to DEF values when bp fields are undefined', () => {
    const p = computeDutchParams([90000, 100000], [false, false], 1, {} as any, {} as any)
    expect(p.duration).toBe(10)
    expect((p as any).roundDuration).toBe(0.5)
    expect(p.ending).toBe(softRound(90000 * 0.95))
  })

  it('Japanese: falls back to DEF values when bp fields are undefined', () => {
    const p = computeJapaneseParams([90000, 100000], [false, false], {} as any)
    expect(p.starting).toBe(softRound(90000 * 0.95))
    expect(p.floor).toBe(softRound(90000 * 0.65))
  })
})

describe('Regression — DEF_BUILDER_PARAMS structure', () => {
  it('all 6 family keys exist', () => {
    expect(DEF_BUILDER_PARAMS.english).toBeDefined()
    expect(DEF_BUILDER_PARAMS.sealedBid).toBeDefined()
    expect(DEF_BUILDER_PARAMS.dutch).toBeDefined()
    expect(DEF_BUILDER_PARAMS.dutchPreferred).toBeDefined()
    expect(DEF_BUILDER_PARAMS.japanese).toBeDefined()
    expect(DEF_BUILDER_PARAMS.doubleScenario).toBeDefined()
  })

  it('each family has templates.fr and templates.en', () => {
    const families = ['english', 'sealedBid', 'dutch', 'dutchPreferred', 'japanese', 'doubleScenario'] as const
    families.forEach(key => {
      const bp = DEF_BUILDER_PARAMS[key] as any
      expect(bp.templates?.fr?.awarding_principles).toBeTruthy()
      expect(bp.templates?.fr?.commercials_terms).toBeTruthy()
      expect(bp.templates?.en?.awarding_principles).toBeTruthy()
      expect(bp.templates?.en?.commercials_terms).toBeTruthy()
    })
  })

  it('templates contain at least one {{placeholder}}', () => {
    const ap = DEF_BUILDER_PARAMS.english.templates.fr.awarding_principles
    expect(ap).toMatch(/\{\{lotName\}\}/)
  })

  it('Dutch defaults: ending_factor=95, range_percent=35, steps=19', () => {
    expect(DEF_BUILDER_PARAMS.dutch.ending_factor).toBe(95)
    expect(DEF_BUILDER_PARAMS.dutch.range_percent).toBe(35)
    expect(DEF_BUILDER_PARAMS.dutch.steps).toBe(19)
  })

  it('Japanese defaults: starting_factor=95, floor_factor=65, steps=19', () => {
    expect(DEF_BUILDER_PARAMS.japanese.starting_factor).toBe(95)
    expect(DEF_BUILDER_PARAMS.japanese.floor_factor).toBe(65)
    expect(DEF_BUILDER_PARAMS.japanese.steps).toBe(19)
  })

  it('DoubleScenario has max_rank_displayed default', () => {
    expect((DEF_BUILDER_PARAMS.doubleScenario as any).max_rank_displayed).toBe(3)
  })
})
