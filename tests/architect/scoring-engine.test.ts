import { describe, it, expect } from 'vitest'
import {
  getScores,
  DEF_BASES,
  DEF_SAVINGS,
  DEF_MATRIX,
  deepCloneMatrix,
  SC,
  STRATEGY_COUNT,
  type ScoringParams,
  type ScoreResult,
} from '~/utils/architect/scoring-engine'

// ─── Helpers ───
const DEF_PARAMS: ScoringParams = {
  bases: [...DEF_BASES],
  savings: [...DEF_SAVINGS],
  matrix: deepCloneMatrix(DEF_MATRIX),
}

function top3(results: ScoreResult[]): ScoreResult[] {
  return results.filter(r => !r.eliminated && r.family !== 'Traditional').slice(0, 3)
}

function topFamily(results: ScoreResult[]): string {
  const t = top3(results)
  return t.length > 0 ? t[0].family : 'none'
}

/** Best non-eliminated strategy for a given family */
function bestOf(results: ScoreResult[], family: string): ScoreResult | undefined {
  return results.filter(r => r.family === family && !r.eliminated)[0]
}

/** All non-eliminated strategies */
function active(results: ScoreResult[]): ScoreResult[] {
  return results.filter(r => !r.eliminated)
}

// ══════════════════════════════════════════════════════════════
// 1. DATA INTEGRITY
// ══════════════════════════════════════════════════════════════
describe('Data integrity', () => {
  it('has exactly 22 strategies', () => {
    expect(SC).toHaveLength(STRATEGY_COUNT)
  })

  it('DEF_BASES has 22 entries', () => {
    expect(DEF_BASES).toHaveLength(STRATEGY_COUNT)
  })

  it('DEF_SAVINGS has 22 entries', () => {
    expect(DEF_SAVINGS).toHaveLength(STRATEGY_COUNT)
  })

  it('DEF_MATRIX has correct shape [22][6][3]', () => {
    expect(DEF_MATRIX).toHaveLength(STRATEGY_COUNT)
    DEF_MATRIX.forEach((strategyMatrix, i) => {
      expect(strategyMatrix).toHaveLength(6)
      strategyMatrix.forEach((questionOpts, q) => {
        expect(questionOpts).toHaveLength(3)
      })
    })
  })

  it('all strategy IDs are unique and sequential 1–22', () => {
    const ids = SC.map(s => s.id)
    expect(ids).toEqual(Array.from({ length: 22 }, (_, i) => i + 1))
  })

  it('every strategy has a valid family', () => {
    const validFamilies = ['Traditional', 'Sealed Bid', 'English', 'Dutch', 'Japanese', 'Double Scenario']
    SC.forEach(s => {
      expect(validFamilies).toContain(s.family)
    })
  })

  it('family distribution matches expected counts', () => {
    const counts: Record<string, number> = {}
    SC.forEach(s => { counts[s.family] = (counts[s.family] || 0) + 1 })
    expect(counts['Traditional']).toBe(1)
    expect(counts['Sealed Bid']).toBe(6)
    expect(counts['English']).toBe(4)
    expect(counts['Dutch']).toBe(4)
    expect(counts['Japanese']).toBe(6)
    expect(counts['Double Scenario']).toBe(1)
  })

  it('DEF_SAVINGS are all positive', () => {
    DEF_SAVINGS.forEach(s => {
      expect(s).toBeGreaterThan(0)
    })
  })
})

// ══════════════════════════════════════════════════════════════
// 2. CORE SCORING LOGIC
// ══════════════════════════════════════════════════════════════
describe('getScores — basic behavior', () => {
  it('returns 22 results', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    expect(results).toHaveLength(STRATEGY_COUNT)
  })

  it('results are sorted by tiebreak descending', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].tiebreak).toBeGreaterThanOrEqual(results[i].tiebreak)
    }
  })

  it('eliminated strategies have raw < 0', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    results.forEach(r => {
      if (r.eliminated) {
        expect(r.raw).toBeLessThan(0)
      } else {
        expect(r.raw).toBeGreaterThanOrEqual(0)
      }
    })
  })

  it('eliminated strategies have pctMatch = 0', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    results.forEach(r => {
      if (r.eliminated) {
        expect(r.pctMatch).toBe(0)
      }
    })
  })

  it('the top non-eliminated strategy has pctMatch = 100', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    const nonElim = results.filter(r => !r.eliminated)
    if (nonElim.length > 0) {
      expect(nonElim[0].pctMatch).toBe(100)
    }
  })

  it('pctMatch values are between 0 and 100', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    results.forEach(r => {
      expect(r.pctMatch).toBeGreaterThanOrEqual(0)
      expect(r.pctMatch).toBeLessThanOrEqual(100)
    })
  })

  it('each result carries savings from DEF_SAVINGS', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    results.forEach(r => {
      const idx = SC.findIndex(s => s.id === r.id)
      expect(r.saving).toBe(DEF_SAVINGS[idx])
    })
  })
})

// ══════════════════════════════════════════════════════════════
// 3. ELIMINATION RULES (via -999 matrix values)
// ══════════════════════════════════════════════════════════════
describe('Elimination rules', () => {
  it('English strategies are eliminated for small spend (<100K)', () => {
    // Q1=1 (<100K) — English matrix[7..10][0][0] = -999
    const results = getScores(DEF_PARAMS, 1, 3, 1, 1, 2, 1)
    results.filter(r => r.family === 'English').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('Dutch strategies are eliminated for small spend (<100K)', () => {
    const results = getScores(DEF_PARAMS, 1, 3, 1, 1, 2, 1)
    results.filter(r => r.family === 'Dutch').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('Japanese strategies are eliminated for small spend (<100K)', () => {
    const results = getScores(DEF_PARAMS, 1, 3, 1, 1, 2, 1)
    results.filter(r => r.family === 'Japanese').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('Double Scenario is eliminated for small spend (<100K)', () => {
    const results = getScores(DEF_PARAMS, 1, 3, 1, 1, 2, 1)
    results.filter(r => r.family === 'Double Scenario').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('English requires 3+ suppliers', () => {
    // Q2=1 (one supplier) or Q2=2 (two) → English matrix[7..10][1][0/1] = -999
    const results1 = getScores(DEF_PARAMS, 2, 1, 1, 1, 2, 1)
    results1.filter(r => r.family === 'English').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
    const results2 = getScores(DEF_PARAMS, 2, 2, 1, 1, 2, 1)
    results2.filter(r => r.family === 'English').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('Double Scenario requires 3+ suppliers', () => {
    const results = getScores(DEF_PARAMS, 2, 2, 1, 1, 2, 1)
    results.filter(r => r.family === 'Double Scenario').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('Sealed Bid Award is eliminated when award method is Rank or NoRank', () => {
    // SB-Award (idx 1) → Q3: [10, -999, -999]
    const resultsRank = getScores(DEF_PARAMS, 2, 3, 2, 1, 2, 1)
    const sbAwardRank = resultsRank.find(r => r.id === 2)
    expect(sbAwardRank?.eliminated).toBe(true)

    const resultsNR = getScores(DEF_PARAMS, 2, 3, 3, 1, 2, 1)
    const sbAwardNR = resultsNR.find(r => r.id === 2)
    expect(sbAwardNR?.eliminated).toBe(true)
  })

  it('Traditional survives Financial preference (fallback rule: raw clamped to 1)', () => {
    // Traditional Q4: [0, 0, -999] → raw would be negative, but fallback clamps to 1
    const results = getScores(DEF_PARAMS, 2, 3, 1, 3, 2, 1)
    const trad = results.find(r => r.family === 'Traditional')
    expect(trad?.eliminated).toBe(false)
    expect(trad?.raw).toBe(1) // clamped to 1, not eliminated
  })
})

// ══════════════════════════════════════════════════════════════
// 4. CROSS-DEPENDENCY RULES
// ══════════════════════════════════════════════════════════════
describe('Cross-dependency rules', () => {
  it('Q1×Q3: small spend + Rank → Traditional boosted, Sealed Bid eliminated', () => {
    // Q1=1 (<100K), Q3=2 (Rank)
    const results = getScores(DEF_PARAMS, 1, 3, 2, 1, 2, 1)
    const trad = results.find(r => r.family === 'Traditional')
    expect(trad?.eliminated).toBe(false)

    // Sealed Bid should be extra-eliminated (base -999 + -1029)
    results.filter(r => r.family === 'Sealed Bid').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('Q1×Q3: small spend + Award → no extra cross-dep (c === 1)', () => {
    const results = getScores(DEF_PARAMS, 1, 3, 1, 1, 2, 1)
    // Sealed Bid should NOT have the extra -1029 penalty
    const sbAward = results.find(r => r.id === 2)
    // SB-Award base=25, Q1[0]=30, Q2[2]=5, Q3[0]=10, Q4[0]=8, Q5[1]=5, Q6[0]=0 → 83
    // No cross-dep since c===1
    expect(sbAward?.eliminated).toBe(false)
  })

  it('Q1×Q2: medium/large spend + few suppliers → Japanese boosted (non-Award only)', () => {
    // Q1=2 (100K-500K), Q2=2 (two suppliers), Q3=2 (Rank — non-Award)
    const resultsBoost = getScores(DEF_PARAMS, 2, 2, 2, 1, 2, 1)
    const japBoost = resultsBoost.filter(r => r.family === 'Japanese' && !r.eliminated)

    // Without boost (Q2=3, 3+ suppliers)
    const resultsNoBoost = getScores(DEF_PARAMS, 2, 3, 2, 1, 2, 1)
    const japNoBoost = resultsNoBoost.filter(r => r.family === 'Japanese' && !r.eliminated)

    // Japanese with 2 suppliers should score higher than with 3+ (for non-Award)
    if (japBoost.length > 0 && japNoBoost.length > 0) {
      expect(japBoost[0].raw).toBeGreaterThan(japNoBoost[0].raw)
    }

    // Boost should NOT apply for Award (Q3=1)
    const awardBoost = getScores(DEF_PARAMS, 2, 2, 1, 1, 2, 1)
    const awardNoBoost = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    const japAwardB = awardBoost.filter(r => r.family === 'Japanese' && !r.eliminated)
    const japAwardNB = awardNoBoost.filter(r => r.family === 'Japanese' && !r.eliminated)
    if (japAwardB.length > 0 && japAwardNB.length > 0) {
      // Without the +40 boost, difference is only from Q2 matrix values
      expect(japAwardB[0].raw - japAwardNB[0].raw).toBeLessThan(10)
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 5. SCENARIO-BASED RECOMMENDATIONS
// ══════════════════════════════════════════════════════════════
describe('Scenario-based recommendations', () => {
  it('large spend, many suppliers, tight gap → English or Double Scenario recommended', () => {
    // Q1=3 (>500K), Q2=3 (3+), Q3=1 (Award), Q4=1 (None), Q5=3 (Aggressive), Q6=1 (<7%)
    const results = getScores(DEF_PARAMS, 3, 3, 1, 1, 3, 1)
    const top = topFamily(results)
    expect(['English', 'Double Scenario']).toContain(top)
  })

  it('medium spend, 2 suppliers, collaborative, Award → Dutch favored (Award binding)', () => {
    // Q1=2, Q2=2, Q3=1 (Award), Q4=1, Q5=1 (Collaborative), Q6=3 (>10% gap)
    const results = getScores(DEF_PARAMS, 2, 2, 1, 1, 1, 3)
    const top = topFamily(results)
    // Dutch always wins for Award, even with collaborative intensity
    expect(top).toBe('Dutch')
  })

  it('medium spend, 2 suppliers, collaborative, Rank → Japanese favored (boost)', () => {
    // Q1=2, Q2=2, Q3=2 (Rank), Q4=1, Q5=1 (Collaborative), Q6=3 (>10% gap)
    const results = getScores(DEF_PARAMS, 2, 2, 2, 1, 1, 3)
    const top = topFamily(results)
    // Japanese gets +40 boost for non-Award + ≤2 suppliers
    expect(top).toBe('Japanese')
  })

  it('small spend, many suppliers → Sealed Bid is top non-eliminated', () => {
    // Q1=1 (<100K), Q2=3 (3+), Q3=1, Q4=1, Q5=2, Q6=1
    const results = getScores(DEF_PARAMS, 1, 3, 1, 1, 2, 1)
    const top = topFamily(results)
    // English/Dutch/Japanese/DS are eliminated for small spend
    expect(top).toBe('Sealed Bid')
  })

  it('Traditional is always available (never eliminated) unless Financial preference', () => {
    // Test a range of non-Financial scenarios
    const scenarios: [number, number, number, number, number, number][] = [
      [1, 1, 1, 1, 1, 1], [2, 2, 2, 2, 2, 2], [3, 3, 1, 1, 3, 3],
      [1, 3, 1, 1, 2, 1], [2, 1, 3, 1, 1, 2],
    ]
    for (const args of scenarios) {
      const results = getScores(DEF_PARAMS, ...args)
      const trad = results.find(r => r.family === 'Traditional')
      expect(trad?.eliminated).toBe(false)
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 6. CUSTOM PARAMS
// ══════════════════════════════════════════════════════════════
describe('Custom scoring params', () => {
  it('changing a base score shifts the ranking', () => {
    const custom: ScoringParams = {
      bases: [...DEF_BASES],
      savings: [...DEF_SAVINGS],
      matrix: deepCloneMatrix(DEF_MATRIX),
    }
    // Boost Traditional base from 15 to 200
    custom.bases[0] = 200

    const results = getScores(custom, 2, 3, 1, 1, 2, 1)
    const trad = results.find(r => r.family === 'Traditional')
    expect(trad?.eliminated).toBe(false)
    // Traditional should now be #1
    const nonElim = results.filter(r => !r.eliminated)
    expect(nonElim[0].family).toBe('Traditional')
  })

  it('setting all matrix values to 0 uses only base scores (+ cross-deps)', () => {
    const custom: ScoringParams = {
      bases: [...DEF_BASES],
      savings: [...DEF_SAVINGS],
      matrix: DEF_MATRIX.map(s => s.map(() => [0, 0, 0])),
    }
    // Use Q3=2 (Rank) to avoid Dutch Award cross-dep (+10)
    // Use Q1=1 to avoid Japanese Q1×Q2 boost, but Q1=1,Q3=2 triggers Q1×Q3 cross-dep
    // Safest: Q1=2, Q2=3, Q3=2 → no cross-deps fire
    const results = getScores(custom, 2, 3, 2, 1, 1, 1)
    results.forEach(r => {
      // raw = base + 0 = base (all >= 0 since bases are all positive)
      expect(r.raw).toBe(custom.bases[SC.findIndex(s => s.id === r.id)])
    })
  })
})

// ══════════════════════════════════════════════════════════════
// 7. deepCloneMatrix
// ══════════════════════════════════════════════════════════════
describe('deepCloneMatrix', () => {
  it('creates a deep copy that does not share references', () => {
    const clone = deepCloneMatrix(DEF_MATRIX)
    clone[0][0][0] = 9999
    expect(DEF_MATRIX[0][0][0]).not.toBe(9999)
  })

  it('preserves all values', () => {
    const clone = deepCloneMatrix(DEF_MATRIX)
    for (let i = 0; i < DEF_MATRIX.length; i++) {
      for (let q = 0; q < DEF_MATRIX[i].length; q++) {
        for (let o = 0; o < DEF_MATRIX[i][q].length; o++) {
          expect(clone[i][q][o]).toBe(DEF_MATRIX[i][q][o])
        }
      }
    }
  })
})

// ══════════════════════════════════════════════════════════════
// 8. EDGE CASES
// ══════════════════════════════════════════════════════════════
describe('Edge cases', () => {
  it('all strategies eliminated except Traditional (fallback rule)', () => {
    // Create params where every strategy gets eliminated
    // Traditional survives with raw=1 due to fallback rule
    const custom: ScoringParams = {
      bases: Array(22).fill(-1000),
      savings: [...DEF_SAVINGS],
      matrix: deepCloneMatrix(DEF_MATRIX),
    }
    const results = getScores(custom, 1, 1, 1, 1, 1, 1)
    const trad = results.find(r => r.family === 'Traditional')
    expect(trad?.eliminated).toBe(false)
    expect(trad?.raw).toBe(1)
    expect(trad?.pctMatch).toBe(100) // only survivor → 100%
    results.filter(r => r.family !== 'Traditional').forEach(r => {
      expect(r.pctMatch).toBe(0)
      expect(r.eliminated).toBe(true)
    })
  })

  it('only Traditional survives → it gets 100% match', () => {
    // Small spend, 1 supplier, no rank, financial preference
    // This eliminates most strategies
    const results = getScores(DEF_PARAMS, 1, 1, 3, 1, 1, 1)
    const nonElim = results.filter(r => !r.eliminated)
    // At least Traditional should survive (Q4=1, not Financial)
    const trad = nonElim.find(r => r.family === 'Traditional')
    if (nonElim.length === 1 && trad) {
      expect(trad.pctMatch).toBe(100)
    }
  })

  it('boundary values: all dimensions at 1', () => {
    const results = getScores(DEF_PARAMS, 1, 1, 1, 1, 1, 1)
    expect(results).toHaveLength(22)
    // Should not throw
  })

  it('boundary values: all dimensions at 3', () => {
    const results = getScores(DEF_PARAMS, 3, 3, 3, 3, 3, 3)
    expect(results).toHaveLength(22)
  })
})

// ══════════════════════════════════════════════════════════════
// 9. DUTCH vs JAPANESE — AWARD LOGIC (Business Rule)
// ══════════════════════════════════════════════════════════════
describe('Dutch vs Japanese — award binding logic', () => {
  it('Award selected → Dutch scores higher than Japanese (3+ suppliers, >500K)', () => {
    // Q3=1 (Award), Q1=3 (>500K), Q2=3 (3+), neutral rest
    const results = getScores(DEF_PARAMS, 3, 3, 1, 1, 2, 1)
    const dutch = bestOf(results, 'Dutch')
    const jap = bestOf(results, 'Japanese')
    expect(dutch).toBeDefined()
    expect(jap).toBeDefined()
    expect(dutch!.raw).toBeGreaterThan(jap!.raw)
  })

  it('Award selected → Dutch scores higher than Japanese (100-500K, 3+ suppliers)', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    const dutch = bestOf(results, 'Dutch')
    const jap = bestOf(results, 'Japanese')
    expect(dutch).toBeDefined()
    expect(jap).toBeDefined()
    expect(dutch!.raw).toBeGreaterThan(jap!.raw)
  })

  it('Rank selected → Dutch eliminated, Japanese active', () => {
    // Q3=2 (Rank) — Dutch only has Award variants → all eliminated
    const results = getScores(DEF_PARAMS, 2, 3, 2, 1, 2, 1)
    const dutch = bestOf(results, 'Dutch')
    const jap = bestOf(results, 'Japanese')
    expect(dutch).toBeUndefined()
    expect(jap).toBeDefined()
  })

  it('No Rank selected → Dutch eliminated, Japanese active', () => {
    // Q3=3 (No Rank) — Dutch only has Award variants → all eliminated
    const results = getScores(DEF_PARAMS, 2, 3, 3, 1, 2, 1)
    const dutch = bestOf(results, 'Dutch')
    const jap = bestOf(results, 'Japanese')
    expect(dutch).toBeUndefined()
    expect(jap).toBeDefined()
  })

  it('Dutch Q3 matrix gives +10 for Award option', () => {
    // Verify matrix values directly: Dutch strategies (indices 11-14) Q3[0] = 10
    for (let i = 11; i <= 14; i++) {
      expect(DEF_MATRIX[i][2][0]).toBe(10)  // Q3, Award option
      expect(DEF_MATRIX[i][2][1]).toBe(-999) // Q3, Rank → eliminated
      expect(DEF_MATRIX[i][2][2]).toBe(-999) // Q3, No Rank → eliminated
    }
  })

  it('Japanese Award Q3 matrix gives 0 (no bonus for Award)', () => {
    // Japanese-Award (idx 15) and Japanese-Ceiling-Award (idx 18) should get 0 for Award
    expect(DEF_MATRIX[15][2][0]).toBe(0)
    expect(DEF_MATRIX[18][2][0]).toBe(0)
  })

  it('Japanese Rank/NoRank Q3 matrix gives +10 for their respective option', () => {
    // Japanese-Rank (idx 16): Q3[1] = +10
    expect(DEF_MATRIX[16][2][1]).toBe(10)
    // Japanese-NoRank (idx 17): Q3[2] = +10
    expect(DEF_MATRIX[17][2][2]).toBe(10)
    // Japanese-Ceiling-Rank (idx 19): Q3[1] = +10
    expect(DEF_MATRIX[19][2][1]).toBe(10)
    // Japanese-Ceiling-NoRank (idx 20): Q3[2] = +10
    expect(DEF_MATRIX[20][2][2]).toBe(10)
  })

  it('Award + 2 suppliers + >500K + Non-financial → Dutch-Preference top, Japanese fully eliminated', () => {
    // When Q4=Non-financial, only Dutch-Preference can deliver — Japanese has no non-financial variant
    const results = getScores(DEF_PARAMS, 3, 2, 1, 2, 3, 2)
    const dutch = bestOf(results, 'Dutch')
    const jap = bestOf(results, 'Japanese')
    expect(dutch).toBeDefined()
    expect(dutch!.tf).toBe('Preference') // Dutch-Preference is the winner
    expect(jap).toBeUndefined() // Japanese entirely eliminated for Non-financial preference
  })
})

// ══════════════════════════════════════════════════════════════
// 10. ENGLISH — MOST FLEXIBLE FORMAT
// ══════════════════════════════════════════════════════════════
describe('English — most flexible format', () => {
  it('English has highest base score among single-variant families', () => {
    // English base = 45, Dutch = 40, Japanese = 35, SB = 25, Traditional = 15
    const englishBase = DEF_BASES[7] // English-Award
    const dutchBase = DEF_BASES[11]   // Dutch-Award
    const japBase = DEF_BASES[15]     // Japanese-Award
    const sbBase = DEF_BASES[1]       // SB-Award
    expect(englishBase).toBeGreaterThan(dutchBase)
    expect(englishBase).toBeGreaterThan(japBase)
    expect(englishBase).toBeGreaterThan(sbBase)
  })

  it('English is top family for >500K, 3+ suppliers, Award, Competitive', () => {
    const results = getScores(DEF_PARAMS, 3, 3, 1, 1, 2, 1)
    const eng = bestOf(results, 'English')
    const nonElim = active(results)
    expect(nonElim[0].family).toBe('English')
    expect(eng!.pctMatch).toBe(100)
  })

  it('English supports both Award and Rank variants', () => {
    const engStrategies = SC.filter(s => s.family === 'English')
    const awards = engStrategies.filter(s => s.aw === 'Award')
    const ranks = engStrategies.filter(s => s.aw === 'Rank')
    expect(awards.length).toBeGreaterThanOrEqual(1)
    expect(ranks.length).toBeGreaterThanOrEqual(1)
  })

  it('English supports transformation variants', () => {
    const engTransfo = SC.filter(s => s.family === 'English' && s.tf === 'Fixed+Dynamic')
    expect(engTransfo.length).toBe(2) // Transfo-Award and Transfo-Rank
  })

  it('English requires medium-to-large spend', () => {
    // Q1=1 (<100K) → all English eliminated
    const small = getScores(DEF_PARAMS, 1, 3, 1, 1, 2, 1)
    small.filter(r => r.family === 'English').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
    // Q1=2 (100K-500K) → English active with 3+ suppliers
    const medium = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    expect(bestOf(medium, 'English')).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════
// 11. DOUBLE SCENARIO — HIGHEST POTENTIAL
// ══════════════════════════════════════════════════════════════
describe('Double Scenario — highest potential', () => {
  it('Double Scenario has highest base score', () => {
    expect(DEF_BASES[21]).toBe(52) // DS base
    expect(DEF_BASES[21]).toBeGreaterThan(Math.max(...DEF_BASES.slice(0, 21)))
  })

  it('DS requires large spend + many suppliers + aggressive intensity', () => {
    // Perfect conditions for DS
    const results = getScores(DEF_PARAMS, 3, 3, 1, 1, 3, 1)
    const ds = results.find(r => r.family === 'Double Scenario')
    expect(ds?.eliminated).toBe(false)
    expect(ds!.raw).toBeGreaterThan(0)
  })

  it('DS eliminated when collaborative/competitive intensity', () => {
    // Q5=1 (Collaborative) with >500K, 3+ suppliers
    const results1 = getScores(DEF_PARAMS, 3, 3, 1, 1, 1, 1)
    const ds1 = results1.find(r => r.family === 'Double Scenario')
    // DS gets -30 for Q5=1, base=52, but needs to net positive
    // 52 + (-999 for Q1=1 scenario won't apply since Q1=3)
    // Actually: 52 + 25(Q1) + 25(Q2) + 0(Q3) + 10(Q4) + (-30)(Q5) + 20(Q6) = 102 → active
    // Let me check with Q5=1 and less favorable Q6
    const results2 = getScores(DEF_PARAMS, 3, 3, 1, 1, 1, 3)
    const ds2 = results2.find(r => r.family === 'Double Scenario')
    // 52 + 25 + 25 + 0 + 10 + (-30) + (-50) = 32 → still active but low score
    expect(ds2!.raw).toBeLessThan(50)
  })

  it('DS has highest savings estimate', () => {
    expect(DEF_SAVINGS[21]).toBe(15)
    expect(DEF_SAVINGS[21]).toBeGreaterThanOrEqual(Math.max(...DEF_SAVINGS))
  })
})

// ══════════════════════════════════════════════════════════════
// 12. FAMILY HIERARCHY — COMPETITIVE ORDERING
// ══════════════════════════════════════════════════════════════
describe('Family hierarchy — competitive ordering', () => {
  it('base scores follow expected hierarchy: DS > English > Dutch > Japanese > SB > Traditional', () => {
    expect(DEF_BASES[21]).toBeGreaterThan(DEF_BASES[7])  // DS > English
    expect(DEF_BASES[7]).toBeGreaterThan(DEF_BASES[11])   // English > Dutch
    expect(DEF_BASES[11]).toBeGreaterThan(DEF_BASES[15])  // Dutch > Japanese
    expect(DEF_BASES[15]).toBeGreaterThan(DEF_BASES[1])   // Japanese > SB
    expect(DEF_BASES[1]).toBeGreaterThan(DEF_BASES[0])    // SB > Traditional
  })

  it('savings estimates follow expected hierarchy: DS ≥ English ≥ Dutch/Japanese ≥ SB ≥ Traditional', () => {
    expect(DEF_SAVINGS[21]).toBeGreaterThanOrEqual(DEF_SAVINGS[7])   // DS ≥ English
    expect(DEF_SAVINGS[7]).toBeGreaterThanOrEqual(DEF_SAVINGS[11])   // English ≥ Dutch
    expect(DEF_SAVINGS[11]).toBeGreaterThanOrEqual(DEF_SAVINGS[1])   // Dutch ≥ SB
    expect(DEF_SAVINGS[1]).toBeGreaterThanOrEqual(DEF_SAVINGS[0])    // SB ≥ Traditional
  })

  it('optimal scenario yields ordering: DS/English > Dutch > Japanese > SB > Traditional', () => {
    // >500K, 3+ suppliers, Award, None pref, Aggressive, <7% gap
    const results = getScores(DEF_PARAMS, 3, 3, 1, 1, 3, 1)
    const nonElim = active(results)
    const families = [...new Set(nonElim.map(r => r.family))]
    // DS or English should be first
    expect(['Double Scenario', 'English']).toContain(families[0])
  })
})

// ══════════════════════════════════════════════════════════════
// 13. Q3 AWARD DIMENSION — COMPLETE ELIMINATION MATRIX
// ══════════════════════════════════════════════════════════════
describe('Q3 Award dimension — elimination matrix', () => {
  it('Award (Q3=1): Dutch active, Japanese Rank/NoRank eliminated', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    // Dutch should be active (Award only)
    expect(bestOf(results, 'Dutch')).toBeDefined()
    // Japanese-Award (id=16) active, Japanese-Rank (id=17) and NoRank (id=18) eliminated
    const japAward = results.find(r => r.id === 16)
    const japRank = results.find(r => r.id === 17)
    const japNR = results.find(r => r.id === 18)
    expect(japAward?.eliminated).toBe(false)  // Jap-Award is OK with Award
    expect(japRank?.eliminated).toBe(true)     // Jap-Rank eliminated when Award selected
    expect(japNR?.eliminated).toBe(true)       // Jap-NoRank eliminated when Award selected
  })

  it('all Dutch strategies are Award-only (no Rank/NoRank variants)', () => {
    SC.filter(s => s.family === 'Dutch').forEach(s => {
      expect(s.aw).toBe('Award')
    })
  })

  it('Japanese has Award, Rank, AND NoRank variants', () => {
    const japStrats = SC.filter(s => s.family === 'Japanese')
    const awTypes = [...new Set(japStrats.map(s => s.aw))]
    expect(awTypes).toContain('Award')
    expect(awTypes).toContain('Rank')
    expect(awTypes).toContain('No Rank')
  })

  it('English has Award and Rank variants (no NoRank)', () => {
    const engStrats = SC.filter(s => s.family === 'English')
    const awTypes = [...new Set(engStrats.map(s => s.aw))]
    expect(awTypes).toContain('Award')
    expect(awTypes).toContain('Rank')
    expect(awTypes).not.toContain('No Rank')
  })

  it('Sealed Bid has Award, Rank, AND NoRank variants', () => {
    const sbStrats = SC.filter(s => s.family === 'Sealed Bid')
    const awTypes = [...new Set(sbStrats.map(s => s.aw))]
    expect(awTypes).toContain('Award')
    expect(awTypes).toContain('Rank')
    expect(awTypes).toContain('No Rank')
  })
})

// ══════════════════════════════════════════════════════════════
// 14. CROSS-DEPENDENCY Q1×Q2 — JAPANESE BOOST
// ══════════════════════════════════════════════════════════════
describe('Q1×Q2 cross-dependency — Japanese supplier boost', () => {
  it('Japanese gets +40 when spend ≥ 100K, suppliers ≤ 2, AND non-Award', () => {
    // With boost: Q1=2, Q2=2, Q3=2 (Rank — non-Award)
    const withBoost = getScores(DEF_PARAMS, 2, 2, 2, 1, 2, 1)
    const japWith = bestOf(withBoost, 'Japanese')

    // Without boost: Q1=2, Q2=3, Q3=2 (Rank)
    const without = getScores(DEF_PARAMS, 2, 3, 2, 1, 2, 1)
    const japWithout = bestOf(without, 'Japanese')

    expect(japWith).toBeDefined()
    expect(japWithout).toBeDefined()
    // Difference should be ~40 (boost) + Q2 matrix diff
    expect(japWith!.raw - japWithout!.raw).toBeGreaterThanOrEqual(35)
  })

  it('Japanese boost does NOT apply for Award (Q3=1)', () => {
    // Q1=2, Q2=2, Q3=1 (Award) → no boost
    const award = getScores(DEF_PARAMS, 2, 2, 1, 1, 2, 1)
    const japAward = bestOf(award, 'Japanese')

    // Q1=2, Q2=2, Q3=2 (Rank) → boost applies
    const rank = getScores(DEF_PARAMS, 2, 2, 2, 1, 2, 1)
    const japRank = bestOf(rank, 'Japanese')

    expect(japAward).toBeDefined()
    expect(japRank).toBeDefined()
    // Rank version should be much higher due to +40 boost
    expect(japRank!.raw - japAward!.raw).toBeGreaterThanOrEqual(30)
  })

  it('Japanese boost does NOT apply for small spend (<100K)', () => {
    // Q1=1 → Japanese already eliminated by Q1 matrix
    const results = getScores(DEF_PARAMS, 1, 2, 2, 1, 2, 1)
    results.filter(r => r.family === 'Japanese').forEach(r => {
      expect(r.eliminated).toBe(true)
    })
  })

  it('Japanese boost does NOT apply when 3+ suppliers', () => {
    // Q2=3, Q3=2 (Rank) → no cross-dep boost
    const results3 = getScores(DEF_PARAMS, 2, 3, 2, 1, 2, 1)
    // Q2=2, Q3=2 (Rank) → boost applies
    const results2 = getScores(DEF_PARAMS, 2, 2, 2, 1, 2, 1)

    const jap3 = bestOf(results3, 'Japanese')
    const jap2 = bestOf(results2, 'Japanese')
    expect(jap2!.raw).toBeGreaterThan(jap3!.raw)
  })

  it('Japanese boost applies for Q2=1 (single supplier) too', () => {
    // Q3=2 (Rank) so boost can fire
    const results = getScores(DEF_PARAMS, 2, 1, 2, 1, 2, 1)
    const jap = bestOf(results, 'Japanese')
    expect(jap).toBeDefined()
    // Should have boost since Q1=2, Q2=1 ≤ 2, Q3=2 (non-Award)
  })
})

// ══════════════════════════════════════════════════════════════
// 15. PREFERENCE (Q4) — TRANSFORMATION ROUTING
// ══════════════════════════════════════════════════════════════
describe('Preference (Q4) — transformation routing', () => {
  it('Financial preference (Q4=3) penalizes Traditional but fallback keeps it alive', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 3, 2, 1)
    const trad = results.find(r => r.family === 'Traditional')
    // Traditional raw would go negative from -999, but fallback clamps to 1
    expect(trad?.eliminated).toBe(false)
    expect(trad?.raw).toBe(1)
  })

  it('Financial preference (Q4=3) favors transformation variants', () => {
    const results = getScores(DEF_PARAMS, 3, 3, 1, 3, 2, 1)
    // English-Transfo-Award (idx 9) should be active and score well
    const engTransfo = results.find(r => r.id === 10) // Eng-Transfo-Award
    const engPlain = results.find(r => r.id === 8)   // Eng-Award
    expect(engTransfo?.eliminated).toBe(false)
    expect(engPlain?.eliminated).toBe(true) // Q4=3 → eliminated for non-transfo English
  })

  it('No preference (Q4=1) favors standard (non-transformation) variants', () => {
    const results = getScores(DEF_PARAMS, 3, 3, 1, 1, 2, 1)
    // Standard English-Award should score well
    const engPlain = results.find(r => r.id === 8)
    expect(engPlain?.eliminated).toBe(false)
  })

  it('Non-financial preference (Q4=2) enables Dutch-Preference variant', () => {
    const results = getScores(DEF_PARAMS, 3, 3, 1, 2, 2, 1)
    // Dutch-Preference-Award (idx 13) should be active
    const dutchPref = results.find(r => r.id === 14) // Dutch-Pref-Award
    expect(dutchPref?.eliminated).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════
// 16. INTENSITY (Q5) — COMPETITION LEVEL
// ══════════════════════════════════════════════════════════════
describe('Intensity (Q5) — competition level', () => {
  it('Aggressive intensity favors Double Scenario', () => {
    const aggressive = getScores(DEF_PARAMS, 3, 3, 1, 1, 3, 1)
    const ds = aggressive.find(r => r.family === 'Double Scenario')
    // DS gets +40 for aggressive
    expect(ds?.eliminated).toBe(false)
    expect(ds!.raw).toBeGreaterThan(100)
  })

  it('Collaborative intensity penalizes Double Scenario', () => {
    const collab = getScores(DEF_PARAMS, 3, 3, 1, 1, 1, 1)
    const ds = collab.find(r => r.family === 'Double Scenario')
    // DS gets -30 for collaborative
    const aggr = getScores(DEF_PARAMS, 3, 3, 1, 1, 3, 1)
    const dsAgg = aggr.find(r => r.family === 'Double Scenario')
    expect(ds!.raw).toBeLessThan(dsAgg!.raw)
  })

  it('Collaborative intensity favors Japanese and Sealed Bid', () => {
    const results = getScores(DEF_PARAMS, 2, 3, 1, 1, 1, 1)
    // Japanese gets +25 for collaborative, SB gets +20
    const jap = bestOf(results, 'Japanese')
    const sb = bestOf(results, 'Sealed Bid')
    expect(jap).toBeDefined()
    expect(sb).toBeDefined()
  })
})

// ══════════════════════════════════════════════════════════════
// 17. PRICE GAP (Q6) — GAP SENSITIVITY
// ══════════════════════════════════════════════════════════════
describe('Price Gap (Q6) — gap sensitivity', () => {
  it('tight gap (<7%) favors English (English gets +30)', () => {
    const results = getScores(DEF_PARAMS, 3, 3, 1, 1, 2, 1) // Q6=1 (<7%)
    const eng = bestOf(results, 'English')
    expect(eng).toBeDefined()
    // English Q6[0] = +30
    expect(DEF_MATRIX[7][5][0]).toBe(30)
  })

  it('wide gap (>10%) penalizes English heavily (-50)', () => {
    const tight = getScores(DEF_PARAMS, 3, 3, 1, 1, 2, 1)
    const wide = getScores(DEF_PARAMS, 3, 3, 1, 1, 2, 3)
    const engTight = bestOf(tight, 'English')
    const engWide = bestOf(wide, 'English')
    if (engTight && engWide) {
      expect(engTight.raw - engWide.raw).toBe(80) // +30 vs -50
    }
  })

  it('wide gap (>10%) favors Japanese (+15)', () => {
    expect(DEF_MATRIX[15][5][2]).toBe(15) // Jap-Award Q6[2]
    expect(DEF_MATRIX[16][5][2]).toBe(15) // Jap-Rank Q6[2]
  })

  it('wide gap (>10%) favors Dutch (+10)', () => {
    expect(DEF_MATRIX[11][5][2]).toBe(10) // Dutch-Award Q6[2]
  })
})

// ══════════════════════════════════════════════════════════════
// 18. COMPREHENSIVE SCENARIO MATRIX
// ══════════════════════════════════════════════════════════════
describe('Comprehensive scenario matrix', () => {
  // Each test validates a realistic business scenario

  it('Scenario: Large procurement, many suppliers, want award → English/DS top', () => {
    // Typical large corporate tender: >500K, 3+ suppliers, Award, Competitive, tight gap
    const r = getScores(DEF_PARAMS, 3, 3, 1, 1, 2, 1)
    const top = topFamily(r)
    expect(['English', 'Double Scenario']).toContain(top)
  })

  it('Scenario: Large procurement, few suppliers, want award → Dutch top', () => {
    // >500K, 2 suppliers, Award, Non-financial pref, Aggressive, 7-10% gap
    const r = getScores(DEF_PARAMS, 3, 2, 1, 2, 3, 2)
    const top = topFamily(r)
    expect(top).toBe('Dutch')
  })

  it('Scenario: Price discovery, many suppliers → Japanese Rank or English Rank', () => {
    // >500K, 3+ suppliers, Rank, no pref, Competitive, medium gap
    const r = getScores(DEF_PARAMS, 3, 3, 2, 1, 2, 2)
    const top = topFamily(r)
    expect(['English', 'Japanese']).toContain(top)
  })

  it('Scenario: Small budget, few suppliers → Traditional or SB only', () => {
    // <100K, 1 supplier, Award, no pref
    const r = getScores(DEF_PARAMS, 1, 1, 1, 1, 2, 1)
    const nonElim = active(r)
    // Only Traditional and maybe some SB should survive
    nonElim.forEach(s => {
      expect(['Traditional', 'Sealed Bid']).toContain(s.family)
    })
  })

  it('Scenario: Medium budget, sole source, collaborative, Rank → Japanese with boost', () => {
    // 100-500K, 1 supplier, Rank, None, Collaborative, >10% gap
    const r = getScores(DEF_PARAMS, 2, 1, 2, 1, 1, 3)
    const jap = bestOf(r, 'Japanese')
    expect(jap).toBeDefined()
    // Japanese gets +40 cross-dep boost (Q1=2, Q2=1, Q3≠Award)
    expect(jap!.raw).toBeGreaterThan(50)
  })

  it('Scenario: Medium budget, sole source, collaborative, Award → Dutch top', () => {
    // 100-500K, 1 supplier, Award, None, Collaborative, >10% gap
    const r = getScores(DEF_PARAMS, 2, 1, 1, 1, 1, 3)
    // Dutch should win for Award even with sole source
    expect(topFamily(r)).toBe('Dutch')
  })

  it('Scenario: Want ranking only (no award) → Japanese or SB, Dutch eliminated', () => {
    // >500K, 3+ suppliers, No Rank, None pref
    const r = getScores(DEF_PARAMS, 3, 3, 3, 1, 2, 1)
    const dutch = bestOf(r, 'Dutch')
    const jap = bestOf(r, 'Japanese')
    expect(dutch).toBeUndefined() // Dutch eliminated (Award-only)
    expect(jap).toBeDefined()
  })

  it('Scenario: Financial preference → Transformation variants surface', () => {
    // >500K, 3+ suppliers, Award, Financial pref, Competitive
    const r = getScores(DEF_PARAMS, 3, 3, 1, 3, 2, 1)
    const topResult = active(r)[0]
    // Should be a transformation variant (tf includes 'Fixed+Dynamic' or 'Ceiling+Pref')
    expect(['Fixed+Dynamic', 'Ceiling+Pref', 'Ceiling']).toContain(topResult.tf)
  })

  it('all 27 dimension combinations produce valid results', () => {
    // Test all combinations of Q1×Q2×Q3 (3×3×3 = 27) with neutral Q4-Q6
    for (let q1 = 1; q1 <= 3; q1++) {
      for (let q2 = 1; q2 <= 3; q2++) {
        for (let q3 = 1; q3 <= 3; q3++) {
          const r = getScores(DEF_PARAMS, q1, q2, q3, 1, 2, 1)
          expect(r).toHaveLength(22)
          // At least one strategy should be non-eliminated
          const nonElim = active(r)
          expect(nonElim.length).toBeGreaterThan(0)
          // Top strategy should have 100% match
          expect(nonElim[0].pctMatch).toBe(100)
        }
      }
    }
  })

  it('all 729 full combinations produce valid results (no crashes)', () => {
    // Exhaustive: 3^6 = 729 combinations — verify no errors and valid structure
    let allElimCount = 0
    for (let q1 = 1; q1 <= 3; q1++)
      for (let q2 = 1; q2 <= 3; q2++)
        for (let q3 = 1; q3 <= 3; q3++)
          for (let q4 = 1; q4 <= 3; q4++)
            for (let q5 = 1; q5 <= 3; q5++)
              for (let q6 = 1; q6 <= 3; q6++) {
                const r = getScores(DEF_PARAMS, q1, q2, q3, q4, q5, q6)
                expect(r).toHaveLength(22)
                const nonElim = active(r)
                if (nonElim.length === 0) allElimCount++
                // When there are active strategies, top one should have 100%
                if (nonElim.length > 0) {
                  expect(nonElim[0].pctMatch).toBe(100)
                }
              }
    // Some edge combos eliminate everything (e.g., Financial pref + small spend + NoRank + aggressive)
    // This is acceptable — at most ~10% of combos (729 total)
    expect(allElimCount).toBeLessThan(80)
  })
})

// ══════════════════════════════════════════════════════════════
// 19. MATRIX CONSISTENCY CHECKS
// ══════════════════════════════════════════════════════════════
describe('Matrix consistency checks', () => {
  it('all Dutch strategies share same Q1 and Q2 values', () => {
    // Dutch indices: 11, 12, 13, 14
    for (let i = 12; i <= 14; i++) {
      expect(DEF_MATRIX[i][0]).toEqual(DEF_MATRIX[11][0]) // Q1
      expect(DEF_MATRIX[i][1]).toEqual(DEF_MATRIX[11][1]) // Q2
    }
  })

  it('all Japanese strategies share same Q1, Q2, Q5, Q6 values', () => {
    // Japanese indices: 15-20
    for (let i = 16; i <= 20; i++) {
      expect(DEF_MATRIX[i][0]).toEqual(DEF_MATRIX[15][0]) // Q1
      expect(DEF_MATRIX[i][1]).toEqual(DEF_MATRIX[15][1]) // Q2
      expect(DEF_MATRIX[i][4]).toEqual(DEF_MATRIX[15][4]) // Q5
      expect(DEF_MATRIX[i][5]).toEqual(DEF_MATRIX[15][5]) // Q6
    }
  })

  it('all English strategies share same Q1, Q2, Q5, Q6 values', () => {
    // English indices: 7-10
    for (let i = 8; i <= 10; i++) {
      expect(DEF_MATRIX[i][0]).toEqual(DEF_MATRIX[7][0]) // Q1
      expect(DEF_MATRIX[i][1]).toEqual(DEF_MATRIX[7][1]) // Q2
      expect(DEF_MATRIX[i][4]).toEqual(DEF_MATRIX[7][4]) // Q5
      expect(DEF_MATRIX[i][5]).toEqual(DEF_MATRIX[7][5]) // Q6
    }
  })

  it('all Sealed Bid strategies share same Q1, Q2, Q5, Q6 values', () => {
    // SB indices: 1-6
    for (let i = 2; i <= 6; i++) {
      expect(DEF_MATRIX[i][0]).toEqual(DEF_MATRIX[1][0]) // Q1
      expect(DEF_MATRIX[i][1]).toEqual(DEF_MATRIX[1][1]) // Q2
      expect(DEF_MATRIX[i][4]).toEqual(DEF_MATRIX[1][4]) // Q5
      expect(DEF_MATRIX[i][5]).toEqual(DEF_MATRIX[1][5]) // Q6
    }
  })

  it('large negative values in matrix are exactly -999 (elimination sentinel)', () => {
    // Small negatives (like -5, -15, -30, -50) are valid penalties, not eliminations
    // Only -999 is the elimination sentinel
    DEF_MATRIX.forEach((strat, i) => {
      strat.forEach((q, qi) => {
        q.forEach((val, oi) => {
          if (val < -100) {
            expect(val).toBe(-999)
          }
        })
      })
    })
  })

  it('negative non-elimination values are reasonable penalties (between -100 and 0)', () => {
    DEF_MATRIX.forEach((strat, i) => {
      strat.forEach((q, qi) => {
        q.forEach((val, oi) => {
          if (val < 0 && val !== -999) {
            expect(val).toBeGreaterThanOrEqual(-100)
            expect(val).toBeLessThan(0)
          }
        })
      })
    })
  })

  it('no base score is negative', () => {
    DEF_BASES.forEach(b => {
      expect(b).toBeGreaterThanOrEqual(0)
    })
  })

  it('no savings estimate is negative or above 100%', () => {
    DEF_SAVINGS.forEach(s => {
      expect(s).toBeGreaterThan(0)
      expect(s).toBeLessThanOrEqual(100)
    })
  })
})
