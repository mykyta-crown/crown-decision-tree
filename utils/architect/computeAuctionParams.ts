// Pure utility: compute recommended auction parameters for a given family + lot data.
// Used by PhaseThreeBlue.vue (PDF export) and AuctionParamsModal.vue.
// niceRound / softRound / roundIncrement are exported so AuctionParamsModal can import
// them directly instead of maintaining duplicate copies.

export function niceRound(val: number): number {
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

export function roundIncrement(val: number): number {
  if (val <= 0) return 0
  if (val < 1)     return Math.round(val * 10) / 10
  if (val < 5)     return Math.round(val)
  if (val < 50)    return Math.round(val / 5) * 5
  if (val < 500)   return Math.round(val / 25) * 25
  if (val < 2000)  return Math.round(val / 100) * 100
  if (val < 10000) return Math.round(val / 500) * 500
  return Math.round(val / 2000) * 2000
}

export function softRound(val: number): number {
  if (val <= 0) return 0
  if (val < 10)      return Math.round(val * 10) / 10
  if (val < 100)     return Math.round(val)
  if (val < 1000)    return Math.round(val / 5) * 5
  if (val < 10000)   return Math.round(val / 50) * 50
  if (val < 100000)  return Math.round(val / 100) * 100
  return Math.round(val / 1000) * 1000
}

export interface EnglishAuctionParams {
  type: 'English'
  duration: number
  overtimeRange: number
  minDecr: number
  maxDecr: number
}

export interface SealedBidAuctionParams {
  type: 'SealedBid'
  minDecr: number
  maxDecr: number
}

export interface DutchAuctionParams {
  type: 'Dutch' | 'DutchPreferred'
  duration: number
  roundDuration: number
  nbRounds: number
  starting: number
  incr: number
  ending: number
  prebid: true
}

export interface JapaneseAuctionParams {
  type: 'Japanese'
  duration: number
  roundDuration: number
  nbRounds: number
  starting: number
  decr: number
  floor: number
  prebid: true
}

export interface DoubleScenarioAuctionParams {
  type: 'DoubleScenario'
  english: {
    duration: number
    overtimeRange: number
    minDecr: number
    maxDecr: number
  }
}

export type AuctionParams =
  | EnglishAuctionParams
  | SealedBidAuctionParams
  | DutchAuctionParams
  | JapaneseAuctionParams
  | DoubleScenarioAuctionParams

export function computeAuctionParams(
  family: string,
  pref: number,
  prices: number[],
  excl: boolean[],
  baseline: number,
  builderParams: any
): AuctionParams | null {
  const valid = prices.filter((p: number, i: number) => !excl[i] && p > 0)
  const best = valid.length > 0 ? Math.min(...valid) : 0

  if (family === 'English') {
    const bp = builderParams?.english || {}
    return {
      type: 'English',
      duration: bp.duration ?? 15,
      overtimeRange: bp.overtime_range ?? 3,
      minDecr: niceRound(baseline * (bp.min_decr_factor ?? 0.25) / 100),
      maxDecr: niceRound(baseline * (bp.max_decr_factor ?? 20) / 100),
    }
  }

  if (family === 'Sealed Bid') {
    const bp = builderParams?.sealedBid || {}
    return {
      type: 'SealedBid',
      minDecr: niceRound(baseline * (bp.min_decr_factor ?? 0.25) / 100),
      maxDecr: niceRound(baseline * (bp.max_decr_factor ?? 20) / 100),
    }
  }

  if (family === 'Dutch') {
    const isDutchPreferred = pref === 2
    const bp = isDutchPreferred ? (builderParams?.dutchPreferred || {}) : (builderParams?.dutch || {})
    const ending   = niceRound(best * (bp.ending_factor ?? 95) / 100)
    const incr     = roundIncrement((ending * (bp.range_percent ?? 35) / 100) / (bp.steps ?? 19))
    const starting = softRound(ending - (bp.steps ?? 19) * incr)
    return {
      type: isDutchPreferred ? 'DutchPreferred' : 'Dutch',
      duration: bp.duration ?? (isDutchPreferred ? 20 : 10),
      roundDuration: bp.round_duration ?? (isDutchPreferred ? 1 : 0.5),
      nbRounds: bp.nb_rounds ?? 20,
      ending, starting, incr,
      prebid: true,
    }
  }

  if (family === 'Japanese') {
    const bp = builderParams?.japanese || {}
    const starting = niceRound(best * (bp.starting_factor ?? 95) / 100)
    const floor    = softRound(best * (bp.floor_factor ?? 65) / 100)
    const decr     = niceRound((starting - floor) / (bp.steps ?? 19))
    return {
      type: 'Japanese',
      duration: bp.duration ?? 10,
      roundDuration: bp.round_duration ?? 0.5,
      nbRounds: bp.nb_rounds ?? 20,
      starting, floor, decr,
      prebid: true,
    }
  }

  if (family === 'Double Scenario') {
    const bp = builderParams?.doubleScenario || {}
    return {
      type: 'DoubleScenario',
      english: {
        duration: bp.duration ?? 15,
        overtimeRange: bp.overtime_range ?? 3,
        minDecr: niceRound(baseline * (bp.min_decr_factor ?? 0.25) / 100),
        maxDecr: niceRound(baseline * (bp.max_decr_factor ?? 20) / 100),
      },
    }
  }

  return null // Traditional
}
