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
} from '~/utils/decisionTree/scoring-engine'

// ─── Helper ───
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

  it('Traditional is eliminated with Financial preference', () => {
    // Traditional Q4: [0, 0, -999]
    const results = getScores(DEF_PARAMS, 2, 3, 1, 3, 2, 1)
    const trad = results.find(r => r.family === 'Traditional')
    expect(trad?.eliminated).toBe(true)
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

  it('Q1×Q2: medium/large spend + few suppliers → Japanese boosted', () => {
    // Q1=2 (100K-500K), Q2=2 (two suppliers)
    const resultsBoost = getScores(DEF_PARAMS, 2, 2, 1, 1, 2, 1)
    const japBoost = resultsBoost.filter(r => r.family === 'Japanese' && !r.eliminated)

    // Without boost (Q2=3, 3+ suppliers)
    const resultsNoBoost = getScores(DEF_PARAMS, 2, 3, 1, 1, 2, 1)
    const japNoBoost = resultsNoBoost.filter(r => r.family === 'Japanese' && !r.eliminated)

    // Japanese with 2 suppliers should score higher than with 3+
    if (japBoost.length > 0 && japNoBoost.length > 0) {
      expect(japBoost[0].raw).toBeGreaterThan(japNoBoost[0].raw)
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

  it('medium spend, 2 suppliers, collaborative → Japanese favored', () => {
    // Q1=2, Q2=2, Q3=1, Q4=1, Q5=1 (Collaborative), Q6=3 (>10% gap)
    const results = getScores(DEF_PARAMS, 2, 2, 1, 1, 1, 3)
    const top = topFamily(results)
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

  it('setting all matrix values to 0 uses only base scores', () => {
    const custom: ScoringParams = {
      bases: [...DEF_BASES],
      savings: [...DEF_SAVINGS],
      matrix: DEF_MATRIX.map(s => s.map(() => [0, 0, 0])),
    }
    const results = getScores(custom, 1, 1, 1, 1, 1, 1)
    // No eliminations from matrix, no cross-deps from Q1=1,Q3=1
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
  it('all strategies eliminated → all pctMatch = 0', () => {
    // Create params where every strategy gets eliminated
    const custom: ScoringParams = {
      bases: Array(22).fill(-1000),
      savings: [...DEF_SAVINGS],
      matrix: deepCloneMatrix(DEF_MATRIX),
    }
    const results = getScores(custom, 1, 1, 1, 1, 1, 1)
    results.forEach(r => {
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
