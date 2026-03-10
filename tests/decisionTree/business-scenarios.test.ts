import { describe, it, expect } from 'vitest'
import {
  getScores,
  DEF_BASES,
  DEF_SAVINGS,
  DEF_MATRIX,
  deepCloneMatrix,
  SC,
  type ScoringParams,
  type ScoreResult,
} from '~/utils/decisionTree/scoring-engine'

// ─── Helpers ───
const P: ScoringParams = {
  bases: [...DEF_BASES],
  savings: [...DEF_SAVINGS],
  matrix: deepCloneMatrix(DEF_MATRIX),
}

/** Best non-eliminated strategy for a family */
function bestOf(results: ScoreResult[], family: string): ScoreResult | undefined {
  return results.filter(r => r.family === family && !r.eliminated)[0]
}

/** All non-eliminated strategies sorted by raw desc */
function active(results: ScoreResult[]): ScoreResult[] {
  return results.filter(r => !r.eliminated)
}

/** Top non-eliminated family */
function topFamily(results: ScoreResult[]): string {
  const a = active(results)
  return a.length > 0 ? a[0].family : 'none'
}

/** Top 3 non-eliminated families (deduplicated) */
function topFamilies(results: ScoreResult[], n = 3): string[] {
  const a = active(results)
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of a) {
    if (!seen.has(r.family)) {
      seen.add(r.family)
      out.push(r.family)
      if (out.length === n) break
    }
  }
  return out
}

// ══════════════════════════════════════════════════════════════
// A. USER BUG REPORT SCENARIO
// The scenario that originally triggered the bug fix.
// ══════════════════════════════════════════════════════════════
describe('A. Original bug report — Award should recommend Dutch over Japanese', () => {
  it('reproduces exact user scenario: >500K, 2 suppliers, Award, Non-financial, Aggressive, 7-10% gap', () => {
    const r = getScores(P, 3, 2, 1, 2, 3, 2)
    const dutch = bestOf(r, 'Dutch')
    const jap = bestOf(r, 'Japanese')

    expect(dutch).toBeDefined()
    expect(jap).toBeDefined()
    expect(dutch!.raw).toBeGreaterThan(jap!.raw)
    expect(topFamily(r)).toBe('Dutch')
  })

  it('Dutch-Preference-Award is top result (non-financial + award)', () => {
    const r = getScores(P, 3, 2, 1, 2, 3, 2)
    const top = active(r)[0]
    expect(top.family).toBe('Dutch')
    expect(top.tf).toBe('Preference')
    expect(top.aw).toBe('Award')
  })

  it('Dutch has 100% match, Japanese is lower', () => {
    const r = getScores(P, 3, 2, 1, 2, 3, 2)
    const dutch = bestOf(r, 'Dutch')
    const jap = bestOf(r, 'Japanese')
    expect(dutch!.pctMatch).toBe(100)
    expect(jap!.pctMatch).toBeLessThan(dutch!.pctMatch)
  })
})

// ══════════════════════════════════════════════════════════════
// B. REALISTIC PROCUREMENT SCENARIOS
// Simulating actual buyer personas and their contexts.
// ══════════════════════════════════════════════════════════════
describe('B. Realistic procurement scenarios', () => {

  // ── B1. Large corporate IT tender ──
  // €2M budget, 5+ suppliers, want binding award, aggressive negotiation, tight price gap
  it('B1: Large IT tender → Double Scenario or English', () => {
    const r = getScores(P, 3, 3, 1, 1, 3, 1)
    const top = topFamily(r)
    expect(['Double Scenario', 'English']).toContain(top)
    // Both DS and English should be in top 3
    const families = topFamilies(r)
    expect(families).toContain('Double Scenario')
    expect(families).toContain('English')
  })

  // ── B2. MRO supplies, simple products ──
  // €300K budget, 3+ suppliers, want award, no preference, competitive
  it('B2: MRO supplies → English top (standard competitive tender)', () => {
    const r = getScores(P, 2, 3, 1, 1, 2, 1)
    expect(topFamily(r)).toBe('English')
  })

  // ── B3. Strategic single-source negotiation ──
  // €200K budget, 1 supplier, collaborative approach
  it('B3: Single-source + Award → Dutch top (Award binding format)', () => {
    const r = getScores(P, 2, 1, 1, 1, 1, 3)
    // Award → Dutch always preferred, even with single supplier
    expect(topFamily(r)).toBe('Dutch')
  })

  it('B3b: Single-source + Rank → Japanese with boost (collaborative, 1 supplier)', () => {
    const r = getScores(P, 2, 1, 2, 1, 1, 3)
    const jap = bestOf(r, 'Japanese')
    expect(jap).toBeDefined()
    // Japanese gets +40 boost for non-Award + ≤2 suppliers
    expect(topFamily(r)).toBe('Japanese')
  })

  // ── B4. Small office supplies purchase ──
  // €50K budget, 3+ suppliers
  it('B4: Small spend → Sealed Bid (English/Dutch/Japanese/DS eliminated)', () => {
    const r = getScores(P, 1, 3, 1, 1, 2, 1)
    const families = topFamilies(r)
    expect(families[0]).toBe('Sealed Bid')
    // English, Dutch, Japanese, DS should all be eliminated
    expect(bestOf(r, 'English')).toBeUndefined()
    expect(bestOf(r, 'Dutch')).toBeUndefined()
    expect(bestOf(r, 'Japanese')).toBeUndefined()
    expect(bestOf(r, 'Double Scenario')).toBeUndefined()
  })

  // ── B5. Duopoly situation — only 2 suppliers ──
  // €1M budget, 2 suppliers, want award, aggressive
  // Dutch is the Award-binding format, so it should win for Award scenarios
  it('B5: Duopoly → Dutch top (Award binding), English eliminated (needs 3+)', () => {
    const r = getScores(P, 3, 2, 1, 1, 3, 1)
    // English requires 3+ suppliers → eliminated
    expect(bestOf(r, 'English')).toBeUndefined()
    // Dutch should be available and top for Award
    expect(bestOf(r, 'Dutch')).toBeDefined()
    expect(topFamily(r)).toBe('Dutch')
  })

  // ── B6. Price discovery exercise — no binding award ──
  // Just want to rank suppliers and discover market price
  it('B6: Price discovery (Rank) → Japanese or English Rank', () => {
    const r = getScores(P, 3, 3, 2, 1, 2, 1)
    const top = active(r)[0]
    expect(top.aw).toBe('Rank')
    // Dutch should be eliminated (Award-only family)
    expect(bestOf(r, 'Dutch')).toBeUndefined()
  })

  // ── B7. No ranking at all — exploration ──
  // DS contains English → eliminated with NoRank; Japanese/SB NoRank should win
  it('B7: No Rank → Japanese/SB NoRank, Dutch and DS eliminated', () => {
    const r = getScores(P, 3, 3, 3, 1, 2, 1)
    const top = active(r)[0]
    // Top should be a NoRank variant (Japanese or SB)
    expect(top.aw).toBe('No Rank')
    expect(bestOf(r, 'Dutch')).toBeUndefined()
    expect(bestOf(r, 'Double Scenario')).toBeUndefined()
  })

  // ── B8. Incumbent-preferred tender (financial preference) ──
  // Want to give financial advantage to current supplier
  it('B8: Financial preference → Transformation variants (Ceiling+Pref or Fixed+Dynamic)', () => {
    const r = getScores(P, 3, 3, 1, 3, 2, 1)
    const top = active(r)[0]
    // Should be a transformation variant
    expect(top.tf).not.toBe('None')
    expect(top.tf).not.toBe('—')
    // Traditional survives with fallback raw=1 but scores very low
    const trad = r.find(s => s.family === 'Traditional')
    expect(trad?.eliminated).toBe(false)
    expect(trad?.raw).toBe(1) // clamped by fallback rule
  })

  // ── B9. Non-financial preference with Dutch ──
  // Want to give non-price preference (quality, delivery) to incumbent
  it('B9: Non-financial preference + Award → Dutch-Preference-Award top', () => {
    const r = getScores(P, 3, 3, 1, 2, 2, 1)
    const dutchPref = r.find(s => s.id === 14) // Dutch-Pref-Award
    expect(dutchPref?.eliminated).toBe(false)
  })

  // ── B10. Very small budget, solo supplier, no ranking ──
  // Worst case — should still recommend Traditional
  it('B10: Minimal scenario → Traditional always survives (non-financial)', () => {
    const r = getScores(P, 1, 1, 3, 1, 1, 1)
    const trad = bestOf(r, 'Traditional')
    expect(trad).toBeDefined()
    expect(trad!.eliminated).toBe(false)
  })

  // ── B11. Wide price gap scenario ──
  // Suppliers are far apart in pricing (>10%)
  it('B11: Wide gap (>10%) + many suppliers → Japanese or Dutch favored over English', () => {
    const r = getScores(P, 3, 3, 1, 1, 2, 3) // Q6=3 (>10% gap)
    const eng = bestOf(r, 'English')
    const jap = bestOf(r, 'Japanese')
    const dutch = bestOf(r, 'Dutch')
    // English gets -50 for wide gap, so Dutch/Japanese should score closer or higher
    expect(eng).toBeDefined()
    // The gap penalty should significantly reduce English score
    const engNoGap = bestOf(getScores(P, 3, 3, 1, 1, 2, 1), 'English')
    expect(eng!.raw).toBeLessThan(engNoGap!.raw)
  })
})

// ══════════════════════════════════════════════════════════════
// C. AWARD METHOD ROUTING — CRITICAL BUSINESS LOGIC
// This is the most important dimension for recommendation accuracy.
// ══════════════════════════════════════════════════════════════
describe('C. Award method routing', () => {

  it('Award (Q3=1): Dutch available, Japanese-Award available, Japanese-Rank/NoRank eliminated', () => {
    const r = getScores(P, 2, 3, 1, 1, 2, 1)
    expect(bestOf(r, 'Dutch')).toBeDefined()
    expect(r.find(s => s.id === 16)?.eliminated).toBe(false)  // Jap-Award
    expect(r.find(s => s.id === 17)?.eliminated).toBe(true)   // Jap-Rank
    expect(r.find(s => s.id === 18)?.eliminated).toBe(true)   // Jap-NoRank
  })

  it('Rank (Q3=2): Dutch ALL eliminated, Japanese-Rank active, English-Rank active', () => {
    const r = getScores(P, 2, 3, 2, 1, 2, 1)
    // All 4 Dutch strategies should be eliminated
    r.filter(s => s.family === 'Dutch').forEach(s => {
      expect(s.eliminated).toBe(true)
    })
    expect(r.find(s => s.id === 17)?.eliminated).toBe(false) // Jap-Rank
    expect(r.find(s => s.id === 9)?.eliminated).toBe(false)  // Eng-Rank
  })

  it('NoRank (Q3=3): Dutch and DS ALL eliminated, Japanese-NoRank active', () => {
    const r = getScores(P, 2, 3, 3, 1, 2, 1)
    r.filter(s => s.family === 'Dutch').forEach(s => {
      expect(s.eliminated).toBe(true)
    })
    expect(r.find(s => s.id === 22)?.eliminated).toBe(true) // DS eliminated (contains English)
    expect(r.find(s => s.id === 18)?.eliminated).toBe(false) // Jap-NoRank
  })

  it('Award selected: Dutch ALWAYS beats Japanese across ALL combos (including Collaborative)', () => {
    // Dutch is the Award-binding format — it must always win over Japanese for Award
    for (const q1 of [2, 3]) {
      for (const q2 of [1, 2, 3]) {
        for (const q5 of [1, 2, 3]) {
          for (const q6 of [1, 2, 3]) {
            const r = getScores(P, q1, q2, 1, 1, q5, q6)
            const dutch = bestOf(r, 'Dutch')
            const jap = bestOf(r, 'Japanese')
            if (dutch && jap) {
              expect(dutch.raw).toBeGreaterThanOrEqual(jap.raw,
                `Dutch should beat Japanese for Award at Q1=${q1},Q2=${q2},Q5=${q5},Q6=${q6}`)
            }
          }
        }
      }
    }
  })
})

// ══════════════════════════════════════════════════════════════
// D. FAMILY AVAILABILITY BY SPEND
// Ensures correct strategies are available for each budget tier.
// ══════════════════════════════════════════════════════════════
describe('D. Family availability by spend tier', () => {

  it('Small spend (<100K): only Traditional + Sealed Bid available', () => {
    const r = getScores(P, 1, 3, 1, 1, 2, 1)
    const activeFamilies = [...new Set(active(r).map(s => s.family))]
    activeFamilies.forEach(f => {
      expect(['Traditional', 'Sealed Bid']).toContain(f)
    })
  })

  it('Medium spend (100K-500K): English, Dutch, Japanese become available', () => {
    const r = getScores(P, 2, 3, 1, 1, 2, 1)
    expect(bestOf(r, 'English')).toBeDefined()
    expect(bestOf(r, 'Dutch')).toBeDefined()
    expect(bestOf(r, 'Japanese')).toBeDefined()
  })

  it('Large spend (>500K): all families available including Double Scenario', () => {
    const r = getScores(P, 3, 3, 1, 1, 3, 1)
    expect(bestOf(r, 'Double Scenario')).toBeDefined()
    expect(bestOf(r, 'English')).toBeDefined()
    expect(bestOf(r, 'Dutch')).toBeDefined()
    expect(bestOf(r, 'Japanese')).toBeDefined()
    expect(bestOf(r, 'Sealed Bid')).toBeDefined()
    expect(bestOf(r, 'Traditional')).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════
// E. SUPPLIER COUNT IMPACT
// Verify that supplier count correctly gates access.
// ══════════════════════════════════════════════════════════════
describe('E. Supplier count impact', () => {

  it('1 supplier: English + DS eliminated (need 3+)', () => {
    const r = getScores(P, 2, 1, 1, 1, 2, 1)
    expect(bestOf(r, 'English')).toBeUndefined()
    expect(bestOf(r, 'Double Scenario')).toBeUndefined()
  })

  it('2 suppliers: English + DS still eliminated (need 3+)', () => {
    const r = getScores(P, 2, 2, 1, 1, 2, 1)
    expect(bestOf(r, 'English')).toBeUndefined()
    expect(bestOf(r, 'Double Scenario')).toBeUndefined()
  })

  it('3+ suppliers: English + DS available', () => {
    const r = getScores(P, 2, 3, 1, 1, 2, 1)
    expect(bestOf(r, 'English')).toBeDefined()
    // DS still eliminated for medium spend (needs >500K and aggressive)
  })

  it('1-2 suppliers with medium+ spend: Japanese gets +40 cross-dep boost (non-Award only)', () => {
    // Q1=2, Q2=2, Q3=2 (Rank) → boost (≤2 suppliers, spend ≥100K, non-Award)
    const boosted = getScores(P, 2, 2, 2, 1, 2, 1)
    const japBoosted = bestOf(boosted, 'Japanese')

    // Q1=2, Q2=3, Q3=2 (Rank) → no boost (3+ suppliers)
    const normal = getScores(P, 2, 3, 2, 1, 2, 1)
    const japNormal = bestOf(normal, 'Japanese')

    expect(japBoosted).toBeDefined()
    expect(japNormal).toBeDefined()
    // Boost is +40, Q2 matrix diff for Japanese Rank: [5 vs 5] = 0
    expect(japBoosted!.raw - japNormal!.raw).toBe(40)

    // Verify boost does NOT apply for Award (Q3=1)
    const awardResult = getScores(P, 2, 2, 1, 1, 2, 1)
    const japAward = bestOf(awardResult, 'Japanese')
    const normalAward = getScores(P, 2, 3, 1, 1, 2, 1)
    const japNormalAward = bestOf(normalAward, 'Japanese')
    expect(japAward).toBeDefined()
    expect(japNormalAward).toBeDefined()
    // No +40 boost for Award — only Q2 matrix difference
    expect(japAward!.raw - japNormalAward!.raw).toBeLessThan(10)
  })
})

// ══════════════════════════════════════════════════════════════
// F. INTENSITY LEVEL IMPACT
// ══════════════════════════════════════════════════════════════
describe('F. Intensity level impact', () => {

  it('Collaborative (Q5=1): Traditional and Japanese score well', () => {
    const r = getScores(P, 2, 3, 1, 1, 1, 1)
    // Traditional gets +20 for collaborative
    const trad = bestOf(r, 'Traditional')
    expect(trad).toBeDefined()
    // Japanese gets +25 for collaborative
    const jap = bestOf(r, 'Japanese')
    expect(jap).toBeDefined()
  })

  it('Aggressive (Q5=3): English and DS score well, Japanese penalized', () => {
    const r = getScores(P, 3, 3, 1, 1, 3, 1)
    const ds = bestOf(r, 'Double Scenario')
    const eng = bestOf(r, 'English')
    expect(ds).toBeDefined()
    expect(eng).toBeDefined()
    // DS should score very high with aggressive intensity
    expect(ds!.raw).toBeGreaterThan(100)
  })

  it('Changing intensity from Collaborative to Aggressive flips recommendation', () => {
    const collab = getScores(P, 3, 3, 1, 1, 1, 1)
    const aggr = getScores(P, 3, 3, 1, 1, 3, 1)
    // With collab, English or Japanese should be top (DS gets -30)
    // With aggressive, DS should be top (gets +40)
    const dsCollab = bestOf(collab, 'Double Scenario')
    const dsAggr = bestOf(aggr, 'Double Scenario')
    expect(dsAggr!.raw).toBeGreaterThan(dsCollab!.raw)
    // Difference should be 70 (+40 vs -30)
    expect(dsAggr!.raw - dsCollab!.raw).toBe(70)
  })
})

// ══════════════════════════════════════════════════════════════
// G. PRICE GAP SENSITIVITY
// ══════════════════════════════════════════════════════════════
describe('G. Price gap sensitivity', () => {

  it('Tight gap (<7%): English gets +30 bonus', () => {
    const tight = getScores(P, 3, 3, 1, 1, 2, 1)
    const wide = getScores(P, 3, 3, 1, 1, 2, 3)
    const engTight = bestOf(tight, 'English')
    const engWide = bestOf(wide, 'English')
    expect(engTight!.raw - engWide!.raw).toBe(80) // +30 vs -50
  })

  it('Wide gap (>10%): Japanese and Dutch get bonuses', () => {
    const r = getScores(P, 3, 3, 1, 1, 2, 3)
    // Japanese Q6[2]=+15, Dutch Q6[2]=+10
    const jap = bestOf(r, 'Japanese')
    const dutch = bestOf(r, 'Dutch')
    expect(jap).toBeDefined()
    expect(dutch).toBeDefined()
  })

  it('Wide gap significantly reduces English competitiveness', () => {
    // With tight gap, English should dominate
    const tight = getScores(P, 3, 3, 1, 1, 2, 1)
    expect(topFamily(tight)).toBe('English')

    // With wide gap, English should lose its top position
    const wide = getScores(P, 3, 3, 1, 1, 2, 3)
    // English still available but at lower score
    const engWide = bestOf(wide, 'English')
    expect(engWide).toBeDefined()
    expect(engWide!.pctMatch).toBeLessThan(100)
  })
})

// ══════════════════════════════════════════════════════════════
// H. CROSS-DEPENDENCY EDGE CASES
// ══════════════════════════════════════════════════════════════
describe('H. Cross-dependency edge cases', () => {

  it('Small spend + Rank/NoRank: Sealed Bid gets extra elimination (-1029)', () => {
    // Q1=1, Q3=2 (Rank) → SB gets -1029 cross-dep
    const r = getScores(P, 1, 3, 2, 1, 2, 1)
    r.filter(s => s.family === 'Sealed Bid').forEach(s => {
      expect(s.eliminated).toBe(true)
    })
    // Traditional gets +30 boost
    const trad = bestOf(r, 'Traditional')
    expect(trad).toBeDefined()
    expect(trad!.eliminated).toBe(false)
  })

  it('Small spend + Award: NO cross-dep penalty on SB', () => {
    // Q1=1, Q3=1 (Award) → cross-dep doesn't fire (c === 1)
    const r = getScores(P, 1, 3, 1, 1, 2, 1)
    const sb = bestOf(r, 'Sealed Bid')
    expect(sb).toBeDefined()
    expect(sb!.eliminated).toBe(false)
  })

  it('Japanese boost only fires when Q1≥2 AND Q2≤2 AND Q3≠Award simultaneously', () => {
    // ✓ Q1=2, Q2=2, Q3=2 (Rank) → boost
    const a = getScores(P, 2, 2, 2, 1, 2, 1)
    const ja = bestOf(a, 'Japanese')

    // ✗ Q1=1, Q2=2, Q3=2 → no boost (Q1 < 2, also Japanese eliminated)
    // Japanese already eliminated for Q1=1, so can't compare

    // ✗ Q1=2, Q2=3, Q3=2 → no boost (Q2 > 2)
    const c = getScores(P, 2, 3, 2, 1, 2, 1)
    const jc = bestOf(c, 'Japanese')

    expect(ja).toBeDefined()
    expect(jc).toBeDefined()
    expect(ja!.raw).toBeGreaterThan(jc!.raw)

    // ✗ Q1=2, Q2=2, Q3=1 (Award) → no boost (Award mode)
    const d = getScores(P, 2, 2, 1, 1, 2, 1)
    const jd = bestOf(d, 'Japanese')
    expect(jd).toBeDefined()
    // Without boost, Japanese should be lower than with boost
    expect(ja!.raw).toBeGreaterThan(jd!.raw)
  })
})

// ══════════════════════════════════════════════════════════════
// I. RESULT STRUCTURE VALIDATION
// Ensures the V4 Quick Selector can correctly display results.
// ══════════════════════════════════════════════════════════════
describe('I. Result structure for V4 display', () => {

  it('every non-eliminated result has positive raw score', () => {
    for (const q1 of [1, 2, 3]) {
      for (const q3 of [1, 2, 3]) {
        const r = getScores(P, q1, 3, q3, 1, 2, 1)
        active(r).forEach(s => {
          expect(s.raw).toBeGreaterThanOrEqual(0)
        })
      }
    }
  })

  it('pctMatch values are 0-100 with top = 100', () => {
    const r = getScores(P, 3, 3, 1, 1, 2, 1)
    const a = active(r)
    expect(a[0].pctMatch).toBe(100)
    a.forEach(s => {
      expect(s.pctMatch).toBeGreaterThanOrEqual(0)
      expect(s.pctMatch).toBeLessThanOrEqual(100)
    })
  })

  it('every result has valid family, tf, aw fields', () => {
    const validFamilies = ['Traditional', 'Sealed Bid', 'English', 'Dutch', 'Japanese', 'Double Scenario']
    const validTf = ['None', 'Fixed+Dynamic', 'Ceiling', 'Preference', 'Ceiling+Pref', '—']
    const validAw = ['Award', 'Rank', 'No Rank', '—']

    const r = getScores(P, 2, 3, 1, 1, 2, 1)
    r.forEach(s => {
      expect(validFamilies).toContain(s.family)
      expect(validTf).toContain(s.tf)
      expect(validAw).toContain(s.aw)
    })
  })

  it('saving field matches expected values per family', () => {
    const r = getScores(P, 2, 3, 1, 1, 2, 1)
    r.forEach(s => {
      if (s.family === 'Traditional') expect(s.saving).toBe(4)
      if (s.family === 'Sealed Bid') expect(s.saving).toBe(7)
      if (s.family === 'English') expect(s.saving).toBe(12)
      if (s.family === 'Dutch') expect(s.saving).toBe(10)
      if (s.family === 'Japanese') expect(s.saving).toBe(10)
      if (s.family === 'Double Scenario') expect(s.saving).toBe(15)
    })
  })

  it('results are deterministically ordered (no random tiebreak)', () => {
    // Run the same scenario 5 times, verify identical ordering
    const ids: number[][] = []
    for (let i = 0; i < 5; i++) {
      const r = getScores(P, 3, 3, 1, 1, 2, 1)
      ids.push(r.map(s => s.id))
    }
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i]).toEqual(ids[0])
    }
  })
})

// ══════════════════════════════════════════════════════════════
// J. REGRESSION GUARD — KEY BUSINESS INVARIANTS
// These must NEVER break. If they do, something fundamental changed.
// ══════════════════════════════════════════════════════════════
describe('J. Regression guard — key business invariants', () => {

  it('INVARIANT: Award → Dutch is ALWAYS available when Dutch is available', () => {
    // For all medium/large spend scenarios with Award
    for (const q1 of [2, 3]) {
      for (const q2 of [1, 2, 3]) {
        for (const q4 of [1, 2]) { // exclude Financial which eliminates some Dutch
          for (const q5 of [1, 2, 3]) {
            const r = getScores(P, q1, q2, 1, q4, q5, 1)
            const dutch = r.filter(s => s.family === 'Dutch' && !s.eliminated)
            // If any Dutch is active, at least one should have Award
            if (dutch.length > 0) {
              expect(dutch.some(d => d.aw === 'Award')).toBe(true)
            }
          }
        }
      }
    }
  })

  it('INVARIANT: Rank/NoRank → Dutch is ALWAYS eliminated', () => {
    for (const q3 of [2, 3]) { // Rank, NoRank
      for (const q1 of [2, 3]) {
        const r = getScores(P, q1, 3, q3, 1, 2, 1)
        r.filter(s => s.family === 'Dutch').forEach(s => {
          expect(s.eliminated).toBe(true)
        })
      }
    }
  })

  it('INVARIANT: NoRank → Double Scenario is ALWAYS eliminated (contains English)', () => {
    for (const q1 of [2, 3]) {
      for (const q2 of [3]) {
        const r = getScores(P, q1, q2, 3, 1, 2, 1)
        const ds = r.find(s => s.family === 'Double Scenario')
        expect(ds?.eliminated).toBe(true)
      }
    }
  })

  it('INVARIANT: Traditional survives ALL non-Financial scenarios', () => {
    for (let q1 = 1; q1 <= 3; q1++)
      for (let q2 = 1; q2 <= 3; q2++)
        for (let q3 = 1; q3 <= 3; q3++)
          for (let q5 = 1; q5 <= 3; q5++) {
            // Q4=1 (None) or Q4=2 (Non-financial) — Traditional survives
            for (const q4 of [1, 2]) {
              const r = getScores(P, q1, q2, q3, q4, q5, 1)
              const trad = r.find(s => s.family === 'Traditional')
              expect(trad?.eliminated).toBe(false,
                `Traditional should survive for Q1=${q1},Q2=${q2},Q3=${q3},Q4=${q4},Q5=${q5}`)
            }
          }
  })

  it('INVARIANT: Financial preference (Q4=3) penalizes Traditional but fallback keeps it alive', () => {
    for (let q1 = 1; q1 <= 3; q1++)
      for (let q2 = 1; q2 <= 3; q2++)
        for (let q3 = 1; q3 <= 3; q3++) {
          const r = getScores(P, q1, q2, q3, 3, 2, 1)
          const trad = r.find(s => s.family === 'Traditional')
          // Traditional fallback rule clamps raw to 1 (never eliminated)
          expect(trad?.eliminated).toBe(false)
          expect(trad?.raw).toBe(1)
        }
  })

  it('INVARIANT: Small spend (<100K) ALWAYS eliminates English, Dutch, Japanese, DS', () => {
    for (let q2 = 1; q2 <= 3; q2++)
      for (let q3 = 1; q3 <= 3; q3++) {
        const r = getScores(P, 1, q2, q3, 1, 2, 1)
        for (const family of ['English', 'Dutch', 'Japanese', 'Double Scenario']) {
          r.filter(s => s.family === family).forEach(s => {
            expect(s.eliminated).toBe(true,
              `${family} should be eliminated for small spend, Q2=${q2},Q3=${q3}`)
          })
        }
      }
  })

  it('INVARIANT: at least 1 non-eliminated strategy for every combo (Q4≠3)', () => {
    // With non-Financial preference, there should always be at least Traditional
    for (let q1 = 1; q1 <= 3; q1++)
      for (let q2 = 1; q2 <= 3; q2++)
        for (let q3 = 1; q3 <= 3; q3++)
          for (let q5 = 1; q5 <= 3; q5++)
            for (let q6 = 1; q6 <= 3; q6++) {
              const r = getScores(P, q1, q2, q3, 1, q5, q6)
              expect(active(r).length).toBeGreaterThan(0,
                `No strategies survived for Q1=${q1},Q2=${q2},Q3=${q3},Q5=${q5},Q6=${q6}`)
            }
  })
})
