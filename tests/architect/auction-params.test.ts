import { describe, it, expect } from 'vitest'
import { niceRound, softRound, roundIncrement } from '~/utils/architect/computeAuctionParams'

interface Lot {
  prices: number[]
  excl: boolean[]
  qty: number
  pref: number
}

/** Returns lowest active (non-excluded, non-zero) price */
function bestOffer(lot: Lot): number {
  const valid = lot.prices.filter((p, i) => !lot.excl[i] && p > 0)
  return valid.length > 0 ? Math.min(...valid) : 0
}

/** Returns active supplier ceilings (current offer as ceiling) */
function activeCeilings(lot: Lot, supNames: string[]) {
  return supNames
    .map((name, i) => ({ name, price: lot.prices[i] || 0 }))
    .filter((_, i) => !lot.excl[i] && lot.prices[i] > 0)
}

/** Compute recommended params for a given family and lot */
function computeParams(family: string, lot: Lot, lotBaseline: number, supNames: string[]) {
  const best = bestOffer(lot)

  if (family === 'English') {
    return {
      type: 'English' as const,
      minDecr: niceRound(lotBaseline * 0.0025),
      maxDecr: niceRound(lotBaseline * 0.20),
      supplierCeilings: activeCeilings(lot, supNames),
    }
  }

  if (family === 'Dutch') {
    const isDutchPreferred = lot.pref === 2
    const ending  = softRound(best * 0.95)
    const incr    = roundIncrement((ending * 0.35) / 19)
    const starting = softRound(ending - 19 * incr)
    if (isDutchPreferred) {
      return { type: 'DutchPreferred' as const, duration: 20, roundDuration: 1,   nbRounds: 20, ending, starting, incr, timePerRound: 30 }
    }
    return   { type: 'Dutch'          as const, duration: 10, roundDuration: 0.5, nbRounds: 20, ending, starting, incr }
  }

  if (family === 'Japanese') {
    const starting = softRound(best * 0.95)
    const floor    = softRound(best * 0.65)
    const decr     = niceRound((starting - floor) / 19)
    return { type: 'Japanese' as const, duration: 10, roundDuration: 0.5, nbRounds: 20, starting, floor, decr }
  }

  if (family === 'Sealed Bid') {
    return { type: 'SealedBid' as const, supplierCeilings: activeCeilings(lot, supNames) }
  }

  if (family === 'Double Scenario') {
    const enMinDecr  = niceRound(lotBaseline * 0.0025)
    const enMaxDecr  = niceRound(lotBaseline * 0.20)
    return {
      type: 'DoubleScenario' as const,
      english: { minDecr: enMinDecr, maxDecr: enMaxDecr, supplierCeilings: activeCeilings(lot, supNames) },
    }
  }

  return null
}

// ─── Pure function from LotTableBlue.vue / [id].vue ─────────────────────────

/** A lot is complete when every non-excluded supplier has a price */
function isLotComplete(lot: { prices: number[]; excl: boolean[] }): boolean {
  return lot.prices.every((p, i) => lot.excl[i] || p > 0)
}

/** All lots are filled (Phase 2 → Phase 3 gate) */
function allOffersFilled(lots: { prices: number[]; excl: boolean[] }[]): boolean {
  return lots.every(l => l.prices.every((p, i) => l.excl[i] || p > 0))
}


// ══════════════════════════════════════════════════════════════
// bestOffer
// ══════════════════════════════════════════════════════════════
describe('bestOffer', () => {
  it('returns the minimum active price', () => {
    const lot: Lot = { prices: [100, 80, 120], excl: [false, false, false], qty: 1, pref: 1 }
    expect(bestOffer(lot)).toBe(80)
  })

  it('ignores zero prices', () => {
    const lot: Lot = { prices: [0, 100, 150], excl: [false, false, false], qty: 1, pref: 1 }
    expect(bestOffer(lot)).toBe(100)
  })

  it('ignores excluded suppliers', () => {
    const lot: Lot = { prices: [50, 100, 150], excl: [true, false, false], qty: 1, pref: 1 }
    expect(bestOffer(lot)).toBe(100)
  })

  it('returns 0 when all prices are zero', () => {
    const lot: Lot = { prices: [0, 0, 0], excl: [false, false, false], qty: 1, pref: 1 }
    expect(bestOffer(lot)).toBe(0)
  })

  it('returns 0 when all suppliers are excluded', () => {
    const lot: Lot = { prices: [50, 100], excl: [true, true], qty: 1, pref: 1 }
    expect(bestOffer(lot)).toBe(0)
  })

  it('handles a single active supplier', () => {
    const lot: Lot = { prices: [250], excl: [false], qty: 1, pref: 1 }
    expect(bestOffer(lot)).toBe(250)
  })

  it('ignores both excluded and zero prices simultaneously', () => {
    const lot: Lot = { prices: [0, 200, 300], excl: [false, true, false], qty: 1, pref: 1 }
    // valid: [300] (index 0 is zero, index 1 is excluded)
    expect(bestOffer(lot)).toBe(300)
  })
})


// ══════════════════════════════════════════════════════════════
// niceRound
// ══════════════════════════════════════════════════════════════
describe('niceRound', () => {
  it('returns 0 for non-positive values', () => {
    expect(niceRound(0)).toBe(0)
    expect(niceRound(-5)).toBe(0)
  })

  it('rounds to 2 decimal places for values < 1', () => {
    expect(niceRound(0.123)).toBe(0.12)
    expect(niceRound(0.999)).toBe(1)
  })

  it('rounds to nearest 0.25 for values in [1, 5)', () => {
    expect(niceRound(1.1)).toBe(1)       // nearest 0.25 = 1.00
    expect(niceRound(1.2)).toBe(1.25)
    expect(niceRound(3.3)).toBe(3.25)
    expect(niceRound(4.9)).toBe(5)
  })

  it('rounds to nearest 0.5 for values in [5, 20)', () => {
    expect(niceRound(5.3)).toBe(5.5)
    expect(niceRound(10.2)).toBe(10)
    expect(niceRound(10.4)).toBe(10.5)
    expect(niceRound(19.7)).toBe(19.5) // Math.round(19.7*2)/2 = Math.round(39.4)/2 = 39/2 = 19.5
  })

  it('rounds to nearest 1 for values in [20, 100)', () => {
    expect(niceRound(42.4)).toBe(42)
    expect(niceRound(99.6)).toBe(100)
  })

  it('rounds to nearest 10 for values in [100, 500)', () => {
    expect(niceRound(102)).toBe(100)
    expect(niceRound(106)).toBe(110)
    expect(niceRound(499)).toBe(500)
  })

  it('rounds to nearest 50 for values in [500, 2000)', () => {
    expect(niceRound(524)).toBe(500)
    expect(niceRound(1234)).toBe(1250)
    expect(niceRound(1999)).toBe(2000)
  })

  it('rounds to nearest 1000 for values in [2000, 10000)', () => {
    expect(niceRound(4400)).toBe(4000) // 4400/1000=4.4 → 4000
    expect(niceRound(4500)).toBe(5000) // 4500/1000=4.5 → 5000
    expect(niceRound(4600)).toBe(5000)
    expect(niceRound(9999)).toBe(10000)
  })

  it('rounds to nearest 5000 for values in [10000, 50000)', () => {
    expect(niceRound(12000)).toBe(10000)
    expect(niceRound(12500)).toBe(15000)
    expect(niceRound(47000)).toBe(45000)
  })

  it('rounds to nearest 10000 for values in [50000, 200000)', () => {
    expect(niceRound(54999)).toBe(50000)
    expect(niceRound(55000)).toBe(60000)
    expect(niceRound(100250)).toBe(100000)
  })

  it('rounds to nearest 50000 for values >= 200000', () => {
    expect(niceRound(400032)).toBe(400000)
    expect(niceRound(225000)).toBe(250000) // Math.round(225000/50000)=5 → 250000
    expect(niceRound(250000)).toBe(250000)
  })
})


// ══════════════════════════════════════════════════════════════
// roundIncrement
// ══════════════════════════════════════════════════════════════
describe('roundIncrement', () => {
  it('returns 0 for non-positive values', () => {
    expect(roundIncrement(0)).toBe(0)
    expect(roundIncrement(-5)).toBe(0)
  })

  it('rounds to nearest 5 for values in [5, 50)', () => {
    expect(roundIncrement(15.75)).toBe(15)
    expect(roundIncrement(17.5)).toBe(20)   // Math.round(3.5)*5 = 20
    expect(roundIncrement(26.7)).toBe(25)
    expect(roundIncrement(49)).toBe(50)
  })

  it('rounds to nearest 25 for values in [50, 500)', () => {
    expect(roundIncrement(87.5)).toBe(100)  // Math.round(3.5)*25 = 100
    expect(roundIncrement(175)).toBe(175)   // already divisible by 25
    expect(roundIncrement(210)).toBe(200)
    expect(roundIncrement(499)).toBe(500)
  })

  it('rounds to nearest 100 for values in [500, 2000)', () => {
    expect(roundIncrement(550)).toBe(600)   // Math.round(5.5)*100 = 600
    expect(roundIncrement(1750)).toBe(1800)
  })

  it('rounds to nearest 500 for values in [2000, 10000)', () => {
    expect(roundIncrement(3250)).toBe(3500) // Math.round(6.5)*500 = 3500
    expect(roundIncrement(5100)).toBe(5000)
  })

  it('result is always a multiple of the step size', () => {
    expect(roundIncrement(33) % 5).toBe(0)     // [5,50) → nearest 5: 33→35
    expect(roundIncrement(33)).toBe(35)
    expect(roundIncrement(850) % 100).toBe(0)  // [500,2000) → nearest 100: 850→900
    expect(roundIncrement(850)).toBe(900)
  })
})


// ══════════════════════════════════════════════════════════════
// softRound
// ══════════════════════════════════════════════════════════════
describe('softRound', () => {
  it('returns 0 for non-positive values', () => {
    expect(softRound(0)).toBe(0)
    expect(softRound(-10)).toBe(0)
  })

  it('rounds to nearest 0.1 for values < 10', () => {
    expect(softRound(1.23)).toBe(1.2)
    expect(softRound(9.95)).toBe(10)
    expect(softRound(5.55)).toBe(5.6) // Math.round(55.5)/10 = 56/10 = 5.6
  })

  it('rounds to nearest 1 for values in [10, 100)', () => {
    expect(softRound(42.4)).toBe(42)
    expect(softRound(42.6)).toBe(43)
    expect(softRound(99.5)).toBe(100)
  })

  it('rounds to nearest 5 for values in [100, 1000)', () => {
    expect(softRound(102)).toBe(100)
    expect(softRound(103)).toBe(105)
    expect(softRound(855)).toBe(855) // 855/5=171 → 855
    expect(softRound(857)).toBe(855)
    expect(softRound(858)).toBe(860)
  })

  it('rounds to nearest 50 for values in [1000, 10000)', () => {
    expect(softRound(1234)).toBe(1250)
    expect(softRound(4400)).toBe(4400) // 4400/50=88 → 4400
    expect(softRound(4425)).toBe(4450)
    expect(softRound(9975)).toBe(10000)
  })

  it('rounds to nearest 100 for values in [10000, 100000)', () => {
    expect(softRound(10050)).toBe(10100) // 10050/100=100.5 → 101*100=10100
    expect(softRound(95000)).toBe(95000)
    expect(softRound(95049)).toBe(95000)
    expect(softRound(95050)).toBe(95100) // Math.round(950.5)*100 = 951*100
  })

  it('rounds to nearest 1000 for values >= 100000', () => {
    expect(softRound(100000)).toBe(100000)
    expect(softRound(100499)).toBe(100000)
    expect(softRound(100500)).toBe(101000)
    expect(softRound(225000)).toBe(225000)
  })

  it('deviation from input stays within ~1-2%', () => {
    const cases = [855, 1172, 5394, 9500, 95000]
    for (const v of cases) {
      const rounded = softRound(v)
      expect(Math.abs(rounded - v) / v).toBeLessThan(0.02)
    }
  })
})


// ══════════════════════════════════════════════════════════════
// computeParams — English
// ══════════════════════════════════════════════════════════════
describe('computeParams — English', () => {
  const supNames = ['Supplier A', 'Supplier B', 'Supplier C']
  const lot: Lot = { prices: [1000, 900, 1100], excl: [false, false, false], qty: 10, pref: 1 }
  const baseline = 10000 // e.g. avg=1000 × qty=10

  it('returns type English', () => {
    const p = computeParams('English', lot, baseline, supNames)
    expect(p?.type).toBe('English')
  })

  it('minDecr is 0.25% of baseline (nice-rounded)', () => {
    const p = computeParams('English', lot, baseline, supNames)
    expect(p).toMatchObject({ type: 'English' })
    if (p?.type === 'English') {
      // baseline=10000, 0.0025 → 25 → nearest 5 → 25
      expect(p.minDecr).toBe(niceRound(baseline * 0.0025))
    }
  })

  it('maxDecr is 20% of baseline (nice-rounded)', () => {
    const p = computeParams('English', lot, baseline, supNames)
    if (p?.type === 'English') {
      // 10000 * 0.20 = 2000 → nearest 10 → 2000
      expect(p.maxDecr).toBe(niceRound(baseline * 0.20))
    }
  })

  it('supplier ceilings equal each active supplier current price', () => {
    const p = computeParams('English', lot, baseline, supNames)
    if (p?.type === 'English') {
      expect(p.supplierCeilings).toEqual([
        { name: 'Supplier A', price: 1000 },
        { name: 'Supplier B', price: 900 },
        { name: 'Supplier C', price: 1100 },
      ])
    }
  })

  it('excludes excluded suppliers from ceilings', () => {
    const lotExcl: Lot = { prices: [1000, 900, 1100], excl: [false, true, false], qty: 10, pref: 1 }
    const p = computeParams('English', lotExcl, baseline, supNames)
    if (p?.type === 'English') {
      expect(p.supplierCeilings).toHaveLength(2)
      expect(p.supplierCeilings.map(s => s.name)).toEqual(['Supplier A', 'Supplier C'])
    }
  })
})


// ══════════════════════════════════════════════════════════════
// computeParams — Dutch
// ══════════════════════════════════════════════════════════════
describe('computeParams — Dutch (standard)', () => {
  const lot: Lot = { prices: [1000, 900, 1100], excl: [false, false, false], qty: 1, pref: 1 }

  it('returns type Dutch when pref !== 2', () => {
    const p = computeParams('Dutch', lot, 1000, [])
    expect(p?.type).toBe('Dutch')
  })

  it('ending price is 5% below best offer', () => {
    // bestOffer = 900, ending = softRound(900 * 0.95) = softRound(855) = 855
    const p = computeParams('Dutch', lot, 1000, [])
    if (p?.type === 'Dutch') {
      expect(p.ending).toBe(softRound(900 * 0.95))
    }
  })

  it('starting price is below ending (35% range over 19 steps)', () => {
    const p = computeParams('Dutch', lot, 1000, [])
    if (p?.type === 'Dutch') {
      expect(p.starting).toBeLessThan(p.ending)
    }
  })

  it('starting + 19 increments ≈ ending (within rounding tolerance)', () => {
    const p = computeParams('Dutch', lot, 1000, [])
    if (p?.type === 'Dutch') {
      const reconstructed = p.starting + 19 * p.incr
      expect(Math.abs(reconstructed - p.ending)).toBeLessThanOrEqual(p.incr * 2)
    }
  })

  it('duration is 10 min with 0.5-min rounds (30s)', () => {
    const p = computeParams('Dutch', lot, 1000, [])
    if (p?.type === 'Dutch') {
      expect(p.duration).toBe(10)
      expect(p.roundDuration).toBe(0.5)
      expect(p.nbRounds).toBe(20)
    }
  })
})

describe('computeParams — Dutch Preferred (pref=2)', () => {
  const lot: Lot = { prices: [1000, 900, 1100], excl: [false, false, false], qty: 1, pref: 2 }

  it('returns type DutchPreferred when pref === 2', () => {
    const p = computeParams('Dutch', lot, 1000, [])
    expect(p?.type).toBe('DutchPreferred')
  })

  it('duration is 20 min with 1-min rounds', () => {
    const p = computeParams('Dutch', lot, 1000, [])
    if (p?.type === 'DutchPreferred') {
      expect(p.duration).toBe(20)
      expect(p.roundDuration).toBe(1)
      expect(p.nbRounds).toBe(20)
    }
  })

  it('preferred supplier window is 30s', () => {
    const p = computeParams('Dutch', lot, 1000, [])
    if (p?.type === 'DutchPreferred') {
      expect(p.timePerRound).toBe(30)
    }
  })

  it('price range logic is same as standard Dutch', () => {
    const stdLot: Lot  = { ...lot, pref: 1 }
    const prefLot: Lot = { ...lot, pref: 2 }
    const std  = computeParams('Dutch', stdLot,  1000, [])
    const pref = computeParams('Dutch', prefLot, 1000, [])
    if (std?.type === 'Dutch' && pref?.type === 'DutchPreferred') {
      expect(pref.ending).toBe(std.ending)
      expect(pref.starting).toBe(std.starting)
      expect(pref.incr).toBe(std.incr)
    }
  })
})


// ══════════════════════════════════════════════════════════════
// computeParams — Japanese
// ══════════════════════════════════════════════════════════════
describe('computeParams — Japanese', () => {
  const lot: Lot = { prices: [1000, 900, 1100], excl: [false, false, false], qty: 1, pref: 1 }

  it('returns type Japanese', () => {
    const p = computeParams('Japanese', lot, 1000, [])
    expect(p?.type).toBe('Japanese')
  })

  it('starting price is 5% below best offer', () => {
    const p = computeParams('Japanese', lot, 1000, [])
    if (p?.type === 'Japanese') {
      expect(p.starting).toBe(softRound(900 * 0.95))
    }
  })

  it('floor price is 35% below best offer', () => {
    const p = computeParams('Japanese', lot, 1000, [])
    if (p?.type === 'Japanese') {
      expect(p.floor).toBe(softRound(900 * 0.65))
    }
  })

  it('floor is lower than starting price', () => {
    const p = computeParams('Japanese', lot, 1000, [])
    if (p?.type === 'Japanese') {
      expect(p.floor).toBeLessThan(p.starting)
    }
  })

  it('decrement spans starting → floor in 19 steps (within rounding)', () => {
    const p = computeParams('Japanese', lot, 1000, [])
    if (p?.type === 'Japanese') {
      const reconstructed = p.starting - 19 * p.decr
      expect(Math.abs(reconstructed - p.floor)).toBeLessThanOrEqual(p.decr * 2)
    }
  })

  it('duration is 10 min with 30s rounds', () => {
    const p = computeParams('Japanese', lot, 1000, [])
    if (p?.type === 'Japanese') {
      expect(p.duration).toBe(10)
      expect(p.roundDuration).toBe(0.5)
      expect(p.nbRounds).toBe(20)
    }
  })
})


// ══════════════════════════════════════════════════════════════
// computeParams — Sealed Bid
// ══════════════════════════════════════════════════════════════
describe('computeParams — Sealed Bid', () => {
  const lot: Lot = { prices: [1000, 900, 1100], excl: [false, false, false], qty: 1, pref: 1 }

  it('returns type SealedBid', () => {
    const p = computeParams('Sealed Bid', lot, 1000, [])
    expect(p?.type).toBe('SealedBid')
  })

  it('shows per-supplier ceilings (current offer prices, no rounding)', () => {
    const supNames = ['A', 'B', 'C']
    const p = computeParams('Sealed Bid', lot, 1000, supNames)
    if (p?.type === 'SealedBid') {
      expect(p.supplierCeilings).toEqual([
        { name: 'A', price: 1000 },
        { name: 'B', price: 900 },
        { name: 'C', price: 1100 },
      ])
    }
  })

  it('excludes excluded suppliers from ceilings', () => {
    const lotExcl: Lot = { prices: [1000, 900, 1100], excl: [false, true, false], qty: 1, pref: 1 }
    const p = computeParams('Sealed Bid', lotExcl, 1000, ['A', 'B', 'C'])
    if (p?.type === 'SealedBid') {
      expect(p.supplierCeilings).toHaveLength(2)
    }
  })
})


// ══════════════════════════════════════════════════════════════
// computeParams — Double Scenario
// ══════════════════════════════════════════════════════════════
describe('computeParams — Double Scenario', () => {
  const supNames = ['A', 'B', 'C']
  const lot: Lot  = { prices: [1000, 900, 1100], excl: [false, false, false], qty: 10, pref: 1 }
  const baseline  = 10000

  it('returns type DoubleScenario', () => {
    const p = computeParams('Double Scenario', lot, baseline, supNames)
    expect(p?.type).toBe('DoubleScenario')
  })

  it('English phase uses baseline-based decrements', () => {
    const p = computeParams('Double Scenario', lot, baseline, supNames)
    if (p?.type === 'DoubleScenario') {
      expect(p.english.minDecr).toBe(niceRound(baseline * 0.0025))
      expect(p.english.maxDecr).toBe(niceRound(baseline * 0.20))
    }
  })

  it('English phase supplier ceilings include all active suppliers', () => {
    const p = computeParams('Double Scenario', lot, baseline, supNames)
    if (p?.type === 'DoubleScenario') {
      expect(p.english.supplierCeilings).toHaveLength(3)
    }
  })
})


// ══════════════════════════════════════════════════════════════
// computeParams — Traditional & unknown families
// ══════════════════════════════════════════════════════════════
describe('computeParams — Traditional / unknown', () => {
  const lot: Lot = { prices: [100, 200], excl: [false, false], qty: 1, pref: 1 }

  it('returns null for Traditional (no eAuction params)', () => {
    expect(computeParams('Traditional', lot, 1000, [])).toBeNull()
  })

  it('returns null for unknown family', () => {
    expect(computeParams('Unknown', lot, 1000, [])).toBeNull()
  })
})


// ══════════════════════════════════════════════════════════════
// isLotComplete
// ══════════════════════════════════════════════════════════════
describe('isLotComplete', () => {
  it('returns true when all suppliers have prices', () => {
    expect(isLotComplete({ prices: [100, 200, 300], excl: [false, false, false] })).toBe(true)
  })

  it('returns false when any active supplier has no price', () => {
    expect(isLotComplete({ prices: [100, 0, 300], excl: [false, false, false] })).toBe(false)
  })

  it('ignores excluded suppliers (treated as filled)', () => {
    // supplier 1 is excluded, price is 0 → still complete
    expect(isLotComplete({ prices: [100, 0, 300], excl: [false, true, false] })).toBe(true)
  })

  it('returns true when all suppliers are excluded', () => {
    expect(isLotComplete({ prices: [0, 0], excl: [true, true] })).toBe(true)
  })

  it('returns false if even one active supplier has no price', () => {
    expect(isLotComplete({ prices: [100, 200, 0], excl: [false, false, false] })).toBe(false)
  })

  it('returns true for empty lot', () => {
    expect(isLotComplete({ prices: [], excl: [] })).toBe(true)
  })
})


// ══════════════════════════════════════════════════════════════
// allOffersFilled (Phase 2 → Phase 3 gate)
// ══════════════════════════════════════════════════════════════
describe('allOffersFilled', () => {
  it('returns true when every lot is complete', () => {
    const lots = [
      { prices: [100, 200], excl: [false, false] },
      { prices: [300, 400], excl: [false, false] },
    ]
    expect(allOffersFilled(lots)).toBe(true)
  })

  it('returns false when any lot has a missing active price', () => {
    const lots = [
      { prices: [100, 200], excl: [false, false] },
      { prices: [300, 0],   excl: [false, false] },
    ]
    expect(allOffersFilled(lots)).toBe(false)
  })

  it('excluded suppliers do not block completion', () => {
    const lots = [
      { prices: [100, 0], excl: [false, true] },
      { prices: [300, 0], excl: [false, true] },
    ]
    expect(allOffersFilled(lots)).toBe(true)
  })

  it('returns true for empty lot list', () => {
    expect(allOffersFilled([])).toBe(true)
  })

  it('returns false if only one lot among many is incomplete', () => {
    const lots = [
      { prices: [100, 200], excl: [false, false] },
      { prices: [300, 400], excl: [false, false] },
      { prices: [500, 0],   excl: [false, false] },
    ]
    expect(allOffersFilled(lots)).toBe(false)
  })
})
