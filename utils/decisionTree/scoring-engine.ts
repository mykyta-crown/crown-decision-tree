// ══════════════════════════════════════════════════════════════
// SCORING ENGINE — Matrix-based (from Excel model)
// ══════════════════════════════════════════════════════════════

export interface Strategy {
  id: number
  family: string
  tf: string
  aw: string
  name: string
}

export interface ScoringParams {
  bases: number[]
  savings: number[]
  matrix: number[][][]
}

export interface ScoreResult extends Strategy {
  raw: number
  saving: number
  tiebreak: number
  eliminated: boolean
  pctMatch: number
}

// 22 auction strategies (index 0–21)
export const SC: Strategy[] = [
  { id: 1, family: 'Traditional', tf: '—', aw: '—', name: 'Traditional Negotiation' },
  { id: 2, family: 'Sealed Bid', tf: 'None', aw: 'Award', name: 'Sealed Bid - Award' },
  { id: 3, family: 'Sealed Bid', tf: 'None', aw: 'Rank', name: 'Sealed Bid - Rank' },
  { id: 4, family: 'Sealed Bid', tf: 'None', aw: 'No Rank', name: 'Sealed Bid - No Rank' },
  { id: 5, family: 'Sealed Bid', tf: 'Fixed+Dynamic', aw: 'Award', name: 'Sealed Bid - Transformation - Award' },
  { id: 6, family: 'Sealed Bid', tf: 'Fixed+Dynamic', aw: 'Rank', name: 'Sealed Bid - Transformation - Rank' },
  { id: 7, family: 'Sealed Bid', tf: 'Fixed+Dynamic', aw: 'No Rank', name: 'Sealed Bid - Transformation - No Rank' },
  { id: 8, family: 'English', tf: 'None', aw: 'Award', name: 'English - Award' },
  { id: 9, family: 'English', tf: 'None', aw: 'Rank', name: 'English - Rank' },
  { id: 10, family: 'English', tf: 'Fixed+Dynamic', aw: 'Award', name: 'English - Transformation - Award' },
  { id: 11, family: 'English', tf: 'Fixed+Dynamic', aw: 'Rank', name: 'English - Transformation - Rank' },
  { id: 12, family: 'Dutch', tf: 'None', aw: 'Award', name: 'Dutch - Award' },
  { id: 13, family: 'Dutch', tf: 'Ceiling', aw: 'Award', name: 'Dutch - Ceiling - Award' },
  { id: 14, family: 'Dutch', tf: 'Preference', aw: 'Award', name: 'Dutch - Preference - Award' },
  { id: 15, family: 'Dutch', tf: 'Ceiling+Pref', aw: 'Award', name: 'Dutch - Ceiling+Pref - Award' },
  { id: 16, family: 'Japanese', tf: 'None', aw: 'Award', name: 'Japanese - Award' },
  { id: 17, family: 'Japanese', tf: 'None', aw: 'Rank', name: 'Japanese - Rank' },
  { id: 18, family: 'Japanese', tf: 'None', aw: 'No Rank', name: 'Japanese - No Rank' },
  { id: 19, family: 'Japanese', tf: 'Ceiling', aw: 'Award', name: 'Japanese - Ceiling - Award' },
  { id: 20, family: 'Japanese', tf: 'Ceiling', aw: 'Rank', name: 'Japanese - Ceiling - Rank' },
  { id: 21, family: 'Japanese', tf: 'Ceiling', aw: 'No Rank', name: 'Japanese - Ceiling - No Rank' },
  { id: 22, family: 'Double Scenario', tf: '—', aw: '—', name: 'Double Scenario' },
]

export const Q_LABELS = ['Q1 — Spend', 'Q2 — Suppliers', 'Q3 — Award', 'Q4 — Preference', 'Q5 — Intensity', 'Q6 — Price Gap']

export const Q_OPTS = [
  ['< 100K', '100K–500K', '> 500K'],
  ['One', 'Two', 'Three +'],
  ['Award', 'Rank', 'No Rank'],
  ['None', 'Non-financial', 'Financial'],
  ['Collaborative', 'Competitive', 'Aggressive'],
  ['< 7%', '7%–10%', '> 10%'],
]

export const DEF_BASES = [15, 25, 25, 25, 25, 25, 25, 45, 45, 45, 45, 40, 40, 40, 40, 35, 35, 35, 35, 35, 35, 50]

export const DEF_SAVINGS = [4, 7, 7, 7, 7, 7, 7, 12, 12, 12, 12, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 15]

export const DEF_MATRIX = [
  [[10, 0, 0], [50, 0, 0], [0, 0, 0], [0, 0, -999], [20, -5, -15], [0, 0, 0]],
  [[30, 0, 0], [-10, 10, 5], [10, -999, -999], [8, 0, -999], [20, 5, 0], [0, 0, 0]],
  [[30, 0, 0], [-10, 10, 5], [-999, 10, -999], [8, 0, -999], [20, 5, 0], [0, 0, 0]],
  [[30, 0, 0], [-10, 10, 5], [-999, -999, 10], [8, 0, -999], [20, 5, 0], [0, 0, 0]],
  [[30, 0, 0], [-10, 10, 5], [10, -999, -999], [-999, -999, 20], [20, 5, 0], [0, 0, 0]],
  [[30, 0, 0], [-10, 10, 5], [-999, 10, -999], [-999, -999, 20], [20, 5, 0], [0, 0, 0]],
  [[30, 0, 0], [-10, 10, 5], [-999, -999, 10], [-999, -999, 20], [20, 5, 0], [0, 0, 0]],
  [[-999, 10, 20], [-999, -999, 20], [10, -999, -999], [8, 0, -999], [-15, 20, 20], [30, 0, -50]],
  [[-999, 10, 20], [-999, -999, 20], [-999, 10, -999], [8, 0, -999], [-15, 20, 20], [30, 0, -50]],
  [[-999, 10, 20], [-999, -999, 20], [10, -999, -999], [-999, -999, 25], [-15, 20, 20], [30, 0, -50]],
  [[-999, 10, 20], [-999, -999, 20], [-999, 10, -999], [-999, -999, 25], [-15, 20, 20], [30, 0, -50]],
  [[-999, 5, 10], [-15, 5, 10], [0, -999, -999], [8, 0, -999], [0, 15, 5], [0, 0, 10]],
  [[-999, 5, 10], [-15, 5, 10], [0, -999, -999], [-999, -999, 5], [0, 15, 5], [0, 0, 10]],
  [[-999, 5, 10], [-15, 5, 10], [0, -999, -999], [-999, 20, -999], [0, 15, 5], [0, 0, 10]],
  [[-999, 5, 10], [-15, 5, 10], [0, -999, -999], [-999, -999, 20], [0, 15, 5], [0, 0, 10]],
  [[-999, 0, 5], [-15, 5, 5], [10, -999, -999], [5, 0, -999], [25, 5, 0], [0, 0, 15]],
  [[-999, 0, 5], [-15, 5, 5], [-999, 10, -999], [5, 0, -999], [25, 5, 0], [0, 0, 15]],
  [[-999, 0, 5], [-15, 5, 5], [-999, -999, 10], [5, 0, -999], [25, 5, 0], [0, 0, 15]],
  [[-999, 0, 5], [-15, 5, 5], [10, -999, -999], [-999, -999, 5], [25, 5, 0], [0, 0, 15]],
  [[-999, 0, 5], [-15, 5, 5], [-999, 10, -999], [-999, -999, 5], [25, 5, 0], [0, 0, 15]],
  [[-999, 0, 5], [-15, 5, 5], [-999, -999, 10], [-999, -999, 5], [25, 5, 0], [0, 0, 15]],
  [[-999, 0, 25], [-999, -999, 25], [0, 0, 0], [0, 0, 10], [-30, -30, 40], [20, 0, -50]],
]

/**
 * Core scoring function.
 * @param params - Scoring parameters (bases, savings, matrix)
 * @param a Q1 Spend (1=<100K, 2=100K-500K, 3=>500K)
 * @param b Q2 Suppliers (1=One, 2=Two, 3=Three+)
 * @param c Q3 Award (1=Award, 2=Rank, 3=No Rank)
 * @param d Q4 Preference (1=None, 2=Non-financial, 3=Financial)
 * @param e Q5 Intensity (1=Low, 2=Medium, 3=High)
 * @param f Q6 Price Gap (1=<7%, 2=7-10%, 3=>10%)
 */
export function getScores(params: ScoringParams, a: number, b: number, c: number, d: number, e: number, f: number): ScoreResult[] {
  const qi = [a - 1, b - 1, c - 1, d - 1, e - 1, f - 1]
  const res = SC.map((s, i) => {
    let raw = params.bases[i] + qi.reduce((sum, oi, qx) => sum + params.matrix[i][qx][oi], 0)
    // Q1×Q3 cross-dependency: when Q1=1 (small spend) and Q3≠Award
    if (a === 1 && c !== 1) {
      if (s.family === 'Traditional') raw += 30
      if (s.family === 'Sealed Bid') raw += -1029
    }
    return { ...s, raw, saving: params.savings[i], tiebreak: raw + (22 - i) / 10000 }
  })
  const pos = res.filter(r => r.raw >= 0).map(r => r.raw)
  const mx = pos.length ? Math.max(...pos) : 0
  return res
    .map(r => ({
      ...r,
      eliminated: r.raw < 0,
      pctMatch: r.raw >= 0 && mx > 0 ? Math.round(r.raw / mx * 100) : 0,
    }))
    .sort((a, b) => b.tiebreak - a.tiebreak)
}

export function deepCloneMatrix(matrix: number[][][]): number[][][] {
  return matrix.map(s => s.map(q => [...q]))
}
