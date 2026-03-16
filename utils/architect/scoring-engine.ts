// ══════════════════════════════════════════════════════════════
// SCORING ENGINE — Matrix-based (from Excel model)
// ══════════════════════════════════════════════════════════════
//
// HOW IT WORKS
// ────────────
// Each of the 22 auction strategies has:
//   - A base score (DEF_BASES[i]): starting fitness value
//   - A savings estimate (DEF_SAVINGS[i]): expected % savings
//   - A 6×3 adjustment matrix (DEF_MATRIX[i]):
//       6 questions (dimensions), each with 3 possible answers.
//       The matrix value is added to the base score.
//       A value of -999 means "eliminate this strategy entirely".
//
// SCORING FORMULA
// ───────────────
// For strategy i:
//   raw = bases[i] + sum( matrix[i][q][answer[q]] for q in 0..5 )
//   + cross-dependency adjustments (Q1×Q3, Q1×Q2)
//
// If raw < 0 → strategy is eliminated.
// pctMatch = round(raw / maxRaw * 100) among non-eliminated strategies.
// Strategies are sorted by raw score (descending), with a tiebreak
// that favors lower-indexed (more "standard") strategies.
//
// THE 6 DIMENSIONS (Questions)
// ────────────────────────────
// Q1 — Spend Range       (v1): 1 = <100K, 2 = 100K–500K, 3 = >500K
// Q2 — Supplier Count    (v2): 1 = One, 2 = Two, 3 = Three+
// Q3 — Award Method      (v3): 1 = Award, 2 = Rank, 3 = No Rank
// Q4 — Preference Type   (v4): 1 = None, 2 = Non-financial, 3 = Financial
// Q5 — Intensity Level   (v5): 1 = Collaborative (≤33%), 2 = Competitive (34–66%), 3 = Aggressive (>66%)
// Q6 — Price Gap (top 3) (v6): 1 = <7%, 2 = 7–10%, 3 = >10%
//
// CROSS-DEPENDENCIES
// ──────────────────
// 1. Q1×Q3: When spend is small (<100K) AND award ≠ Award:
//    Traditional gets +30, Sealed Bid gets -1029 (eliminated)
// 2. Q1×Q2: When spend ≥ 100K AND ≤ 2 suppliers:
//    Japanese strategies get +40
//
// STRATEGY FAMILIES
// ─────────────────
// Traditional (1 variant)  — Fallback, always available
// Sealed Bid (6 variants)  — None/Transfo × Award/Rank/NoRank
// English (4 variants)     — None/Transfo × Award/Rank
// Dutch (4 variants)       — None/Ceiling/Preference/Ceiling+Pref × Award
// Japanese (6 variants)    — None/Ceiling × Award/Rank/NoRank
// Double Scenario (1 variant) — Combined English+Dutch format
//
// ══════════════════════════════════════════════════════════════

export interface Strategy {
  id: number
  /** Auction family: 'English' | 'Dutch' | 'Sealed Bid' | 'Japanese' | 'Traditional' | 'Double Scenario' */
  family: string
  /** Transformation format: 'None' | 'Fixed+Dynamic' | 'Ceiling' | 'Preference' | 'Ceiling+Pref' | '—' */
  tf: string
  /** Awarding method: 'Award' | 'Rank' | 'No Rank' | '—' */
  aw: string
  name: string
}

/**
 * Scoring parameters — customizable per user.
 * bases[i]:      Base score for strategy i (22 values)
 * savings[i]:    Expected savings % for strategy i (22 values)
 * matrix[i][q][o]: Score adjustment for strategy i, question q (0–5), option o (0–2)
 *                  -999 = eliminate strategy for this answer
 */
export interface ScoringParams {
  bases: number[]    // length: 22 (one per strategy)
  savings: number[]  // length: 22 (one per strategy)
  matrix: number[][][] // shape: [22][6][3]
}

export interface ScoreResult extends Strategy {
  /** Raw computed score (base + matrix adjustments + cross-deps) */
  raw: number
  /** Expected savings percentage for this strategy */
  saving: number
  /** Raw score with micro-tiebreak to ensure stable sort order */
  tiebreak: number
  /** True if raw < 0 (strategy not suitable for these parameters) */
  eliminated: boolean
  /** 0–100 match percentage relative to the best non-eliminated strategy */
  pctMatch: number
}

/** Total number of auction strategies in the scoring model */
export const STRATEGY_COUNT = 22

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

/** UI labels for each of the 6 scoring dimensions */
export const Q_LABELS = ['Q1 — Spend', 'Q2 — Suppliers', 'Q3 — Award', 'Q4 — Preference', 'Q5 — Intensity', 'Q6 — Price Gap']

/** Human-readable options for each dimension (3 options per question) */
export const Q_OPTS = [
  ['< 100K', '100K–500K', '> 500K'],       // Q1: Spend range
  ['One', 'Two', 'Three +'],                // Q2: Number of suppliers
  ['Award', 'Rank', 'No Rank'],             // Q3: Award method
  ['None', 'Non-financial', 'Financial'],    // Q4: Preference type
  ['Collaborative', 'Competitive', 'Aggressive'], // Q5: Intensity
  ['< 7%', '7%–10%', '> 10%'],             // Q6: Price gap between top offers
]

/**
 * Default base scores per strategy.
 * Higher = more likely to be recommended by default.
 * Order matches SC array (index 0 = Traditional, ... index 21 = Double Scenario).
 *
 * Families: Traditional=15, SealedBid=25, English=45, Dutch=40, Japanese=35, DoubleScenario=52
 */
export const DEF_BASES = [15, 25, 25, 25, 25, 25, 25, 45, 45, 45, 45, 40, 40, 40, 40, 35, 35, 35, 35, 35, 35, 52]

/**
 * Expected savings % per strategy.
 * Traditional=4%, SealedBid=7%, English=12%, Dutch=10%, Japanese=10%, DoubleScenario=15%
 */
export const DEF_SAVINGS = [4, 7, 7, 7, 7, 7, 7, 12, 12, 12, 12, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 15]

/**
 * Default scoring matrix: DEF_MATRIX[strategy][question][option]
 * Shape: [22][6][3] — 22 strategies × 6 questions × 3 options each.
 * Values are added to the base score. -999 means "eliminate this strategy".
 *
 * Columns per question:
 *   Q1: [<100K, 100K-500K, >500K]
 *   Q2: [1 supplier, 2 suppliers, 3+ suppliers]
 *   Q3: [Award, Rank, No Rank]
 *   Q4: [None, Non-financial, Financial]
 *   Q5: [Collaborative, Competitive, Aggressive]
 *   Q6: [<7%, 7-10%, >10%]
 */
export const DEF_MATRIX = [
  //                        Q1: Spend         Q2: Suppliers     Q3: Award          Q4: Preference      Q5: Intensity        Q6: Gap
  /* 0  Traditional     */ [[10, 0, 0],       [30, 0, 0],       [0, 0, 0],         [0, 0, -999],       [20, -5, -15],       [0, 0, 0]],
  /* 1  SB-Award        */ [[30, 0, 0],       [-10, 10, 5],     [10, -999, -999],  [8, -999, -999],    [20, 5, 0],          [0, 0, 0]],
  /* 2  SB-Rank         */ [[30, 0, 0],       [-10, 10, 5],     [-999, 10, -999],  [8, -999, -999],    [20, 5, 0],          [0, 0, 0]],
  /* 3  SB-NoRank       */ [[30, 0, 0],       [-10, 10, 5],     [-999, -999, 10],  [8, -999, -999],    [20, 5, 0],          [0, 0, 0]],
  /* 4  SB-Transfo-Aw   */ [[30, 0, 0],       [-10, 10, 5],     [10, -999, -999],  [-999, -999, 20],   [20, 5, 0],          [0, 0, 0]],
  /* 5  SB-Transfo-Rk   */ [[30, 0, 0],       [-10, 10, 5],     [-999, 10, -999],  [-999, -999, 20],   [20, 5, 0],          [0, 0, 0]],
  /* 6  SB-Transfo-NR   */ [[30, 0, 0],       [-10, 10, 5],     [-999, -999, 10],  [-999, -999, 20],   [20, 5, 0],          [0, 0, 0]],
  /* 7  Eng-Award       */ [[-999, 10, 20],   [-999, -999, 20], [10, -999, -999],  [8, -999, -999],    [-15, 20, 20],       [30, 0, -50]],
  /* 8  Eng-Rank        */ [[-999, 10, 20],   [-999, -999, 20], [-999, 10, -999],  [8, -999, -999],    [-15, 20, 20],       [30, 0, -50]],
  /* 9  Eng-Transfo-Aw  */ [[-999, 10, 20],   [-999, -999, 20], [10, -999, -999],  [-999, -999, 25],   [-15, 20, 20],       [30, 0, -50]],
  /* 10 Eng-Transfo-Rk  */ [[-999, 10, 20],   [-999, -999, 20], [-999, 10, -999],  [-999, -999, 25],   [-15, 20, 20],       [30, 0, -50]],
  /* 11 Dutch-Award     */ [[-999, 5, 10],    [-15, 5, 10],     [10, -999, -999],  [8, -999, -999],    [0, 15, 5],          [0, 0, 10]],
  /* 12 Dutch-Ceil-Aw   */ [[-999, 5, 10],    [-15, 5, 10],     [10, -999, -999],  [-999, -999, 5],    [0, 15, 5],          [0, 0, 10]],
  /* 13 Dutch-Pref-Aw   */ [[-999, 5, 10],    [-15, 5, 10],     [10, -999, -999],  [-999, 20, -999],   [0, 15, 5],          [0, 0, 10]],
  /* 14 Dutch-CeilPr-Aw */ [[-999, 5, 10],    [-15, 5, 10],     [10, -999, -999],  [-999, -999, 20],   [0, 15, 5],          [0, 0, 10]],
  /* 15 Jap-Award       */ [[-999, 0, 5],     [-15, 5, 5],      [0, -999, -999],   [5, -999, 3],       [5, 10, 5],          [0, 0, 15]],
  /* 16 Jap-Rank        */ [[-999, 0, 5],     [-15, 5, 5],      [-999, 10, -999],  [5, -999, 3],       [5, 10, 5],          [0, 0, 15]],
  /* 17 Jap-NoRank      */ [[-999, 0, 5],     [-15, 5, 5],      [-999, -999, 10],  [5, -999, 3],       [5, 10, 5],          [0, 0, 15]],
  /* 18 Jap-Ceil-Aw     */ [[-999, 0, 5],     [-15, 5, 5],      [0, -999, -999],   [-999, -999, 10],   [5, 10, 5],          [0, 0, 15]],
  /* 19 Jap-Ceil-Rk     */ [[-999, 0, 5],     [-15, 5, 5],      [-999, 10, -999],  [-999, -999, 10],   [5, 10, 5],          [0, 0, 15]],
  /* 20 Jap-Ceil-NR     */ [[-999, 0, 5],     [-15, 5, 5],      [-999, -999, 10],  [-999, -999, 10],   [5, 10, 5],          [0, 0, 15]],
  /* 21 DoubleScenario  */ [[-999, 0, 25],    [-999, -999, 25], [0, 0, -999],      [10, 10, 10],       [-30, -30, 40],      [20, 0, -50]],
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
    // Q1×Q2 cross-dependency: when spend > 100K and ≤ 2 suppliers → Japanese
    // BUT only for non-Award (Rank/NoRank): Dutch is the Award-binding format
    if (a >= 2 && b <= 2 && c !== 1 && s.family === 'Japanese') raw += 40
    // Q3×family: Award boosts Dutch to ensure it always beats Japanese for binding awards
    if (c === 1 && s.family === 'Dutch') raw += 10
    // Traditional is the ultimate fallback — always keeps a positive score
    if (s.family === 'Traditional' && raw <= 0) raw = 1
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

// ══════════════════════════════════════════════════════════════
// BUILDER PARAMS — Per-type auction configuration + templates
// ══════════════════════════════════════════════════════════════
//
// Factor fields are stored as PERCENTAGES (human-readable):
//   ending_factor: 95  →  ending = best × 0.95
//   min_decr_factor: 0.25  →  minDecr = baseline × 0.0025
//   max_decr_factor: 20    →  maxDecr = baseline × 0.20
//
// Divide by 100 when computing actual prices.
//
// Placeholders in templates: {{lotName}} {{qty}} {{unit}} {{baseline}} {{currency}}
// ══════════════════════════════════════════════════════════════

export interface BuilderTypeParams {
  duration?: number         // total duration (min)
  overtime_range?: number   // overtime trigger window (min)
  round_duration?: number   // duration per round (min)
  nb_rounds?: number        // total rounds
  time_per_round?: number   // Dutch Preferred exclusive window (seconds)
  min_decr_factor?: number  // min decrement = baseline × (factor / 100)
  max_decr_factor?: number  // max decrement = baseline × (factor / 100)
  ending_factor?: number    // Dutch ending price = best × (factor / 100)
  range_percent?: number    // Dutch range = ending × (factor / 100)
  starting_factor?: number  // Japanese starting = best × (factor / 100)
  floor_factor?: number     // Japanese floor = best × (factor / 100)
  steps?: number            // number of price steps (Dutch/Japanese)
  max_rank_displayed?: number
}

export interface BuilderTemplateSet {
  awarding_principles: string
  commercials_terms: string
}

export interface BuilderTypeConfig extends BuilderTypeParams {
  templates: { fr: BuilderTemplateSet; en: BuilderTemplateSet }
}

export interface BuilderParams {
  english: BuilderTypeConfig
  sealedBid: BuilderTypeConfig
  dutch: BuilderTypeConfig
  dutchPreferred: BuilderTypeConfig
  japanese: BuilderTypeConfig
  doubleScenario: BuilderTypeConfig
}

// ── Default templates ────────────────────────────────────────────────────────

const _tAwardingFR = (intro: string, rules: string[]) =>
  `<p>${intro}</p><ul>${rules.map(r => `<li>${r}</li>`).join('')}</ul>`
const _tAwardingEN = (intro: string, rules: string[]) =>
  `<p>${intro}</p><ul>${rules.map(r => `<li>${r}</li>`).join('')}</ul>`

const _tCommFR = `<p><strong>{{lotName}}</strong></p><ul><li><strong>Quantit\u00e9\u00a0:</strong> {{qty}} {{unit}}</li><li><strong>Devise\u00a0:</strong> {{currency}}</li><li><strong>Prix de r\u00e9f\u00e9rence\u00a0:</strong> {{baseline}} {{currency}}</li><li><strong>Conditions de paiement\u00a0:</strong> [\u00c0 compl\u00e9ter]</li><li><strong>D\u00e9lai de livraison\u00a0:</strong> [\u00c0 compl\u00e9ter]</li><li><strong>Dur\u00e9e du contrat\u00a0:</strong> [\u00c0 compl\u00e9ter]</li></ul>`
const _tCommEN = `<p><strong>{{lotName}}</strong></p><ul><li><strong>Quantity:</strong> {{qty}} {{unit}}</li><li><strong>Currency:</strong> {{currency}}</li><li><strong>Reference price:</strong> {{baseline}} {{currency}}</li><li><strong>Payment terms:</strong> [To be completed]</li><li><strong>Delivery timeline:</strong> [To be completed]</li><li><strong>Contract duration:</strong> [To be completed]</li></ul>`

export const DEF_BUILDER_PARAMS: BuilderParams = {
  english: {
    duration: 15, overtime_range: 3,
    min_decr_factor: 0.25, max_decr_factor: 20,
    templates: {
      fr: {
        awarding_principles: _tAwardingFR(
          `Attribution au prix le plus bas pour le lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `Le fournisseur ayant soumis le prix total le plus bas \u00e0 l\u2019issue de l\u2019ench\u00e8re sera s\u00e9lectionn\u00e9.`,
            `En cas d\u2019\u00e9galit\u00e9 de prix, le premier \u00e0 avoir soumis cette offre sera retenu.`,
            `L\u2019acheteur se r\u00e9serve le droit de ne pas attribuer le lot si aucune offre n\u2019est jug\u00e9e satisfaisante.`,
          ]
        ),
        commercials_terms: _tCommFR,
      },
      en: {
        awarding_principles: _tAwardingEN(
          `Award to the lowest price for lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `The supplier submitting the lowest total price at auction close will be selected.`,
            `In case of a price tie, the first submission is retained.`,
            `The buyer reserves the right not to award if no offer is satisfactory.`,
          ]
        ),
        commercials_terms: _tCommEN,
      },
    },
  },

  sealedBid: {
    min_decr_factor: 0.25, max_decr_factor: 20,
    templates: {
      fr: {
        awarding_principles: _tAwardingFR(
          `Attribution sur appel d\u2019offres scell\u00e9 pour le lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `Chaque fournisseur soumet une offre unique et confidentielle avant la cl\u00f4ture.`,
            `L\u2019attribution est r\u00e9alis\u00e9e au prix le plus bas \u00e0 l\u2019issue du d\u00e9pouillement.`,
            `Les offres ne sont r\u00e9v\u00e9l\u00e9es qu\u2019\u00e0 la cl\u00f4ture de la session.`,
            `L\u2019acheteur se r\u00e9serve le droit de ne pas attribuer le lot si aucune offre n\u2019est jug\u00e9e satisfaisante.`,
          ]
        ),
        commercials_terms: _tCommFR,
      },
      en: {
        awarding_principles: _tAwardingEN(
          `Award via sealed bid for lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `Each supplier submits a single confidential offer before the deadline.`,
            `Award goes to the lowest price after opening.`,
            `Offers are only revealed at session close.`,
            `The buyer reserves the right not to award if no offer is satisfactory.`,
          ]
        ),
        commercials_terms: _tCommEN,
      },
    },
  },

  dutch: {
    duration: 10, round_duration: 0.5, nb_rounds: 20,
    ending_factor: 95, range_percent: 35, steps: 19,
    templates: {
      fr: {
        awarding_principles: _tAwardingFR(
          `Attribution au premier fournisseur acceptant le prix courant pour le lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `Le prix d\u00e9marre bas et monte automatiquement \u00e0 chaque round.`,
            `Le premier fournisseur \u00e0 accepter le prix affich\u00e9 remporte le lot \u2014 l\u2019ench\u00e8re s\u2019arr\u00eate imm\u00e9diatement.`,
            `L\u2019attribution est d\u00e9finitive et contraignante d\u00e8s l\u2019acceptation.`,
          ]
        ),
        commercials_terms: _tCommFR,
      },
      en: {
        awarding_principles: _tAwardingEN(
          `Award to the first supplier accepting the current price for lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `The price starts low and rises automatically each round.`,
            `The first supplier to accept wins \u2014 the auction stops immediately.`,
            `The award is final and binding upon acceptance.`,
          ]
        ),
        commercials_terms: _tCommEN,
      },
    },
  },

  dutchPreferred: {
    duration: 20, round_duration: 1, nb_rounds: 20, time_per_round: 30,
    ending_factor: 95, range_percent: 35, steps: 19,
    templates: {
      fr: {
        awarding_principles: _tAwardingFR(
          `Attribution au premier fournisseur acceptant le prix courant pour le lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `Le prix d\u00e9marre bas et monte automatiquement \u00e0 chaque round.`,
            `Un fournisseur pr\u00e9f\u00e9r\u00e9 b\u00e9n\u00e9ficie d\u2019une fen\u00eatre d\u2019acceptation exclusive en d\u00e9but de chaque round.`,
            `Le premier fournisseur \u00e0 accepter le prix affich\u00e9 remporte le lot.`,
            `L\u2019attribution est d\u00e9finitive et contraignante d\u00e8s l\u2019acceptation.`,
          ]
        ),
        commercials_terms: _tCommFR,
      },
      en: {
        awarding_principles: _tAwardingEN(
          `Award to the first supplier accepting the current price for lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `The price starts low and rises automatically each round.`,
            `A preferred supplier has exclusive access for the first seconds of each round.`,
            `The first to accept wins \u2014 the auction stops immediately.`,
            `The award is final and binding upon acceptance.`,
          ]
        ),
        commercials_terms: _tCommEN,
      },
    },
  },

  japanese: {
    duration: 10, round_duration: 0.5, nb_rounds: 20,
    starting_factor: 95, floor_factor: 65, steps: 19,
    templates: {
      fr: {
        awarding_principles: _tAwardingFR(
          `Attribution au dernier fournisseur pr\u00e9sent dans l\u2019ench\u00e8re pour le lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `Le prix d\u00e9marre haut et descend d\u2019un palier \u00e0 chaque round.`,
            `Les fournisseurs doivent confirmer leur participation \u00e0 chaque round ou se retirer.`,
            `Le dernier fournisseur \u00e0 rester dans l\u2019ench\u00e8re remporte le lot.`,
            `Chaque fournisseur apprend son rang au moment o\u00f9 il se retire.`,
          ]
        ),
        commercials_terms: _tCommFR,
      },
      en: {
        awarding_principles: _tAwardingEN(
          `Award to the last supplier remaining in the auction for lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `The price starts high and drops one step each round.`,
            `Suppliers must confirm each round or exit.`,
            `The last supplier remaining wins the lot.`,
            `Each supplier learns their rank when they exit.`,
          ]
        ),
        commercials_terms: _tCommEN,
      },
    },
  },

  doubleScenario: {
    duration: 15, overtime_range: 3,
    min_decr_factor: 0.25, max_decr_factor: 20, max_rank_displayed: 3,
    templates: {
      fr: {
        awarding_principles: _tAwardingFR(
          `Attribution par Double Ench\u00e8re pour le lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `<strong>Phase\u00a01\u00a0\u2014\u00a0Ench\u00e8re Anglaise\u00a0:</strong> tous les fournisseurs concourent \u00e0 la baisse pour \u00e9tablir un prix comp\u00e9titif. Les 3 meilleurs passent en phase\u00a02.`,
            `<strong>Phase\u00a02\u00a0\u2014\u00a0Ench\u00e8re Dutch\u00a0:</strong> les 3 finalistes s\u2019affrontent sur une ench\u00e8re \u00e0 prix montant. Le premier \u00e0 accepter remporte le lot.`,
            `L\u2019attribution est d\u00e9finitive et contraignante \u00e0 l\u2019issue de la Phase\u00a02.`,
          ]
        ),
        commercials_terms: _tCommFR,
      },
      en: {
        awarding_principles: _tAwardingEN(
          `Award via Double Scenario for lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).`,
          [
            `<strong>Phase\u00a01\u00a0\u2014\u00a0English Auction:</strong> all suppliers compete downward to establish a competitive price. The top 3 proceed to phase\u00a02.`,
            `<strong>Phase\u00a02\u00a0\u2014\u00a0Dutch Auction:</strong> the 3 finalists compete in an ascending price auction. The first to accept wins.`,
            `The award is final and binding at the end of Phase\u00a02.`,
          ]
        ),
        commercials_terms: _tCommEN,
      },
    },
  },
}

export function deepCloneBuilderParams(bp: BuilderParams): BuilderParams {
  return JSON.parse(JSON.stringify(bp))
}
