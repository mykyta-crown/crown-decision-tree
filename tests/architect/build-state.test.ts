import { describe, it, expect, beforeEach, vi } from 'vitest'

// ─────────────────────────────────────────────────────────────────────────────
// Pure logic extracted from composables/useArchitectBuildState.js
// Same pattern as other test files in this suite — no Vue/Pinia required.
// ─────────────────────────────────────────────────────────────────────────────

// ── _applyTemplate ────────────────────────────────────────────────────────────
function applyTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl
    .replace(/\{\{lotName\}\}/g, String(vars.lotName))
    .replace(/\{\{qty\}\}/g, String(vars.qty))
    .replace(/\{\{unit\}\}/g, String(vars.unit))
    .replace(/\{\{baseline\}\}/g, String(vars.baseline))
    .replace(/\{\{currency\}\}/g, String(vars.currency))
}

// ── _fmt ──────────────────────────────────────────────────────────────────────
function fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

// ── _buildLotData ─────────────────────────────────────────────────────────────
interface PhaseParams {
  builderType: string
  maxRankDisplayed: number
  duration?: number
  overtimeRange?: number
  roundDuration?: number
  minDecr?: number
  maxDecr?: number
  starting?: number
  ending?: number
  incr?: number
  decr?: number
}

interface Lot {
  name: string
  unit: string
  qty: number
}

function buildLotData(phaseParams: PhaseParams, lot: Lot, lotBaseline: number, ccy: string) {
  const base = {
    name: lot.name || '',
    multiplier: true,
    rank_trigger: 'all',
    min_bid_decr_type: ccy,
    max_bid_decr_type: ccy,
    suppliers: [],
    suppliersTimePerRound: [],
    items: [{ line_item: lot.name || '', unit: lot.unit || '', quantity: lot.qty || 1, index: 0 }],
    commercials_docs: [],
    awarding_principles: '',
    commercials_terms: '',
    general_terms: '',
    got_fixed_handicap: false,
    show_fixed_handicap_calculations: false,
    got_dynamic_handicap: false,
    handicaps: [],
    rank_per_line_item: false,
    max_rank_displayed: phaseParams.maxRankDisplayed,
  }

  const type = phaseParams.builderType

  if (type === 'reverse') {
    return {
      ...base,
      duration: phaseParams.duration,
      overtime_range: phaseParams.overtimeRange,
      baseline: lotBaseline,
      min_bid_decr: phaseParams.minDecr,
      max_bid_decr: phaseParams.maxDecr,
      dutch_prebid_enabled: false,
    }
  }

  if (type === 'sealed-bid') {
    return {
      ...base,
      duration: 0,
      overtime_range: 0,
      baseline: lotBaseline,
      min_bid_decr: 0,
      max_bid_decr: 0,
      dutch_prebid_enabled: false,
    }
  }

  if (type === 'dutch') {
    const qty = lot.qty || 1
    return {
      ...base,
      duration: phaseParams.duration,
      overtime_range: phaseParams.roundDuration ?? phaseParams.overtimeRange,
      baseline: (phaseParams.starting ?? 0) * qty,
      min_bid_decr: (phaseParams.incr ?? 0) * qty,
      max_bid_decr: (phaseParams.ending ?? 0) * qty,
      dutch_prebid_enabled: true,
    }
  }

  if (type === 'japanese') {
    const qty = lot.qty || 1
    return {
      ...base,
      duration: phaseParams.duration,
      overtime_range: phaseParams.roundDuration ?? phaseParams.overtimeRange,
      baseline: (phaseParams.starting ?? 0) * qty,
      min_bid_decr: (phaseParams.decr ?? 0) * qty,
      max_bid_decr: (phaseParams.starting ?? 0) * qty,
      dutch_prebid_enabled: true,
    }
  }

  return { ...base, duration: 0, overtime_range: 0, baseline: 0, min_bid_decr: 0, max_bid_decr: 0, dutch_prebid_enabled: false }
}

// ── _buildTerms ───────────────────────────────────────────────────────────────
const GENERAL_TERMS = {
  fr: `<ul><li>Toute offre placée durant l'eAuction doit refléter les spécifications, termes et conditions énoncés ci-dessus.</li><li>Toute offre placée durant l'eAuction est contractuellement contraignante et traitée comme une proposition formelle.</li><li>La renégociation n'est pas possible après l'eAuction.</li><li>Les offres et lots gagnants doivent être formalisés dans un contrat avec le client dans les trente (30) jours ouvrables suivant l'eAuction.</li></ul>`,
  en: `<ul><li>Any bid placed during the eAuction must reflect the specifications, terms and conditions stated above.</li><li>Any bid placed during the eAuction is contractually binding and treated as a formal proposal.</li><li>Renegotiation is not possible post eAuction.</li><li>Winning bids and lots must be formalized in a contract with the client within thirty (30) business days post eAuction.</li></ul>`,
}

const FAMILY_KEY: Record<string, string> = {
  English: 'english',
  SealedBid: 'sealedBid',
  Dutch: 'dutch',
  DutchPreferred: 'dutchPreferred',
  Japanese: 'japanese',
  DoubleScenario: 'doubleScenario',
}

function buildTerms(
  params: { type: string },
  lot: { name?: string; qty?: number; unit?: string },
  lotBaseline: number,
  ccy: string,
  locale: string = 'fr',
  builderParams: any = null,
) {
  const lotName = lot.name || 'Lot'
  const qty = lot.qty || 1
  const unit = lot.unit || 'unité(s)'
  const lang = locale === 'en' ? 'en' : 'fr'

  const vars = {
    lotName,
    qty,
    unit,
    baseline: lotBaseline > 0 ? fmt(lotBaseline) : '—',
    currency: ccy,
  }

  const general_terms = GENERAL_TERMS[lang as 'fr' | 'en']
  const bpKey = FAMILY_KEY[params.type]
  const tplSet = builderParams?.[bpKey]?.templates?.[lang] || null

  const awarding_principles = tplSet ? applyTemplate(tplSet.awarding_principles, vars) : ''
  const commercials_terms   = tplSet ? applyTemplate(tplSet.commercials_terms, vars)   : ''

  return { general_terms, commercials_terms, awarding_principles }
}

// ── sessionStorage mock ───────────────────────────────────────────────────────
const STORAGE_KEY = 'crown_architect_build_state'

function mockSessionStorage() {
  const store: Record<string, string> = {}
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
    removeItem: (k: string) => { delete store[k] },
    _store: store,
  }
}

// ─────────────────────────────────────────────────────────────────────────────

describe('_applyTemplate', () => {
  it('substitutes all placeholders', () => {
    const tpl = 'Lot {{lotName}} — {{qty}} {{unit}} — baseline {{baseline}} {{currency}}'
    const result = applyTemplate(tpl, { lotName: 'Fournitures', qty: 100, unit: 'kg', baseline: '10 000', currency: 'EUR' })
    expect(result).toBe('Lot Fournitures — 100 kg — baseline 10 000 EUR')
  })

  it('substitutes multiple occurrences of the same placeholder', () => {
    const tpl = '{{lotName}} / {{lotName}}'
    expect(applyTemplate(tpl, { lotName: 'X', qty: 1, unit: 'u', baseline: '0', currency: 'EUR' })).toBe('X / X')
  })

  it('leaves non-matching text untouched', () => {
    const tpl = 'No placeholders here.'
    expect(applyTemplate(tpl, { lotName: 'A', qty: 1, unit: 'u', baseline: '0', currency: 'EUR' })).toBe('No placeholders here.')
  })

  it('handles HTML content in templates', () => {
    const tpl = '<p>Lot <strong>{{lotName}}</strong> ({{qty}} {{unit}}).</p>'
    const result = applyTemplate(tpl, { lotName: 'Papeterie', qty: 500, unit: 'unités', baseline: '25 000', currency: 'EUR' })
    expect(result).toBe('<p>Lot <strong>Papeterie</strong> (500 unités).</p>')
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('_buildLotData — reverse (English)', () => {
  const lot = { name: 'Lot Papier', unit: 'rames', qty: 200 }
  const phaseParams: PhaseParams = {
    builderType: 'reverse',
    maxRankDisplayed: 5,
    duration: 15,
    overtimeRange: 3,
    minDecr: 50,
    maxDecr: 5000,
  }

  it('sets correct builder type fields', () => {
    const result = buildLotData(phaseParams, lot, 100000, 'EUR')
    expect(result.duration).toBe(15)
    expect(result.overtime_range).toBe(3)
    expect(result.baseline).toBe(100000)
    expect(result.min_bid_decr).toBe(50)
    expect(result.max_bid_decr).toBe(5000)
    expect(result.dutch_prebid_enabled).toBe(false)
  })

  it('populates base fields correctly', () => {
    const result = buildLotData(phaseParams, lot, 100000, 'EUR')
    expect(result.name).toBe('Lot Papier')
    expect(result.multiplier).toBe(true)
    expect(result.rank_trigger).toBe('all')
    expect(result.min_bid_decr_type).toBe('EUR')
    expect(result.max_bid_decr_type).toBe('EUR')
    expect(result.items[0].quantity).toBe(200)
    expect(result.items[0].unit).toBe('rames')
    expect(result.max_rank_displayed).toBe(5)
    expect(result.got_fixed_handicap).toBe(false)
    expect(result.got_dynamic_handicap).toBe(false)
  })
})

describe('_buildLotData — sealed-bid', () => {
  const lot = { name: 'Lot IT', unit: 'licences', qty: 50 }
  const phaseParams: PhaseParams = { builderType: 'sealed-bid', maxRankDisplayed: 0 }

  it('forces duration and overtime to 0', () => {
    const result = buildLotData(phaseParams, lot, 80000, 'USD')
    expect(result.duration).toBe(0)
    expect(result.overtime_range).toBe(0)
    expect(result.baseline).toBe(80000)
    expect(result.min_bid_decr).toBe(0)
    expect(result.max_bid_decr).toBe(0)
    expect(result.dutch_prebid_enabled).toBe(false)
  })
})

describe('_buildLotData — dutch', () => {
  const lot = { name: 'Lot Nettoyage', unit: 'sites', qty: 4 }
  const phaseParams: PhaseParams = {
    builderType: 'dutch',
    maxRankDisplayed: 1,
    duration: 10,
    roundDuration: 0.5,
    starting: 1000,
    ending: 1400,
    incr: 25,
  }

  it('multiplies price fields by qty', () => {
    const result = buildLotData(phaseParams, lot, 0, 'EUR')
    expect(result.baseline).toBe(1000 * 4)     // starting * qty
    expect(result.min_bid_decr).toBe(25 * 4)   // incr * qty
    expect(result.max_bid_decr).toBe(1400 * 4) // ending * qty
    expect(result.dutch_prebid_enabled).toBe(true)
  })

  it('uses roundDuration as overtime_range', () => {
    const result = buildLotData(phaseParams, lot, 0, 'EUR')
    expect(result.overtime_range).toBe(0.5)
  })

  it('falls back to overtimeRange when roundDuration is absent', () => {
    const params = { ...phaseParams, roundDuration: undefined, overtimeRange: 2 }
    const result = buildLotData(params, lot, 0, 'EUR')
    expect(result.overtime_range).toBe(2)
  })

  it('handles qty=1 (no multiplication effect)', () => {
    const singleLot = { ...lot, qty: 1 }
    const result = buildLotData(phaseParams, singleLot, 0, 'EUR')
    expect(result.baseline).toBe(1000)
    expect(result.min_bid_decr).toBe(25)
    expect(result.max_bid_decr).toBe(1400)
  })
})

describe('_buildLotData — japanese', () => {
  const lot = { name: 'Lot Transport', unit: 'trajets', qty: 3 }
  const phaseParams: PhaseParams = {
    builderType: 'japanese',
    maxRankDisplayed: 0,
    duration: 10,
    roundDuration: 0.5,
    starting: 500,
    decr: 10,
  }

  it('sets max_bid_decr = starting * qty (ceiling = starting price)', () => {
    const result = buildLotData(phaseParams, lot, 0, 'EUR')
    expect(result.baseline).toBe(500 * 3)
    expect(result.min_bid_decr).toBe(10 * 3)
    expect(result.max_bid_decr).toBe(500 * 3) // max = starting
    expect(result.dutch_prebid_enabled).toBe(true)
  })
})

describe('_buildLotData — unknown type (fallback)', () => {
  it('returns zeros for all price fields', () => {
    const lot = { name: 'X', unit: 'u', qty: 1 }
    const phaseParams: PhaseParams = { builderType: 'unknown', maxRankDisplayed: 0 }
    const result = buildLotData(phaseParams, lot, 99999, 'EUR')
    expect(result.duration).toBe(0)
    expect(result.overtime_range).toBe(0)
    expect(result.baseline).toBe(0)
    expect(result.min_bid_decr).toBe(0)
    expect(result.max_bid_decr).toBe(0)
    expect(result.dutch_prebid_enabled).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('_buildTerms', () => {
  const lot = { name: 'Lot Papeterie', qty: 100, unit: 'rames' }
  const builderParams = {
    english: {
      templates: {
        fr: {
          awarding_principles: '<p>Attribution pour {{lotName}} ({{qty}} {{unit}}) à {{baseline}} {{currency}}.</p>',
          commercials_terms: '<p>Devise : {{currency}}</p>',
        },
        en: {
          awarding_principles: '<p>Award for {{lotName}} ({{qty}} {{unit}}) at {{baseline}} {{currency}}.</p>',
          commercials_terms: '<p>Currency: {{currency}}</p>',
        },
      },
    },
  }

  it('returns correct general_terms in French', () => {
    const result = buildTerms({ type: 'English' }, lot, 50000, 'EUR', 'fr', builderParams)
    expect(result.general_terms).toContain('eAuction')
    expect(result.general_terms).toContain('contractuellement contraignante')
  })

  it('returns correct general_terms in English', () => {
    const result = buildTerms({ type: 'English' }, lot, 50000, 'EUR', 'en', builderParams)
    expect(result.general_terms).toContain('contractually binding')
    expect(result.general_terms).toContain('thirty (30) business days')
  })

  it('substitutes placeholders in awarding_principles (FR)', () => {
    const result = buildTerms({ type: 'English' }, lot, 50000, 'EUR', 'fr', builderParams)
    expect(result.awarding_principles).toContain('Lot Papeterie')
    expect(result.awarding_principles).toContain('100')
    expect(result.awarding_principles).toContain('rames')
    expect(result.awarding_principles).toContain('EUR')
    expect(result.awarding_principles).toContain('50') // baseline formatted
  })

  it('substitutes placeholders in awarding_principles (EN)', () => {
    const result = buildTerms({ type: 'English' }, lot, 50000, 'EUR', 'en', builderParams)
    expect(result.awarding_principles).toContain('Award for Lot Papeterie')
  })

  it('formats baseline as fr-FR number when > 0', () => {
    const result = buildTerms({ type: 'English' }, lot, 50000, 'EUR', 'fr', builderParams)
    // 50000 formatted fr-FR → '50 000' (non-breaking space or regular space)
    expect(result.awarding_principles).toMatch(/50[\s\u202f\u00a0]?000/)
  })

  it('uses dash for baseline when lotBaseline = 0', () => {
    const result = buildTerms({ type: 'English' }, lot, 0, 'EUR', 'fr', builderParams)
    expect(result.awarding_principles).toContain('—')
  })

  it('returns empty strings when builderParams is null', () => {
    const result = buildTerms({ type: 'English' }, lot, 50000, 'EUR', 'fr', null)
    expect(result.awarding_principles).toBe('')
    expect(result.commercials_terms).toBe('')
    expect(result.general_terms).toBeTruthy() // general terms always present
  })

  it('returns empty strings when family key not in builderParams', () => {
    const result = buildTerms({ type: 'Japanese' }, lot, 50000, 'EUR', 'fr', builderParams)
    expect(result.awarding_principles).toBe('')
    expect(result.commercials_terms).toBe('')
  })

  it('defaults locale to fr for any non-en value', () => {
    const resultFr = buildTerms({ type: 'English' }, lot, 0, 'EUR', 'fr', builderParams)
    const resultOther = buildTerms({ type: 'English' }, lot, 0, 'EUR', 'de', builderParams)
    expect(resultFr.general_terms).toBe(resultOther.general_terms)
  })

  it('uses lot defaults when name/qty/unit are missing', () => {
    const result = buildTerms({ type: 'English' }, {}, 0, 'EUR', 'fr', builderParams)
    expect(result.awarding_principles).toContain('Lot') // default name
  })

  it('maps all 6 family types to correct builderParams keys', () => {
    const allFamilies: Record<string, string> = {
      English: 'english',
      SealedBid: 'sealedBid',
      Dutch: 'dutch',
      DutchPreferred: 'dutchPreferred',
      Japanese: 'japanese',
      DoubleScenario: 'doubleScenario',
    }
    const fullBp: any = {}
    Object.values(allFamilies).forEach(key => {
      fullBp[key] = { templates: { fr: { awarding_principles: `AP-${key}`, commercials_terms: `CT-${key}` } } }
    })
    Object.entries(allFamilies).forEach(([type, key]) => {
      const result = buildTerms({ type }, lot, 0, 'EUR', 'fr', fullBp)
      expect(result.awarding_principles).toBe(`AP-${key}`)
      expect(result.commercials_terms).toBe(`CT-${key}`)
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('sessionStorage helpers', () => {
  let storage: ReturnType<typeof mockSessionStorage>

  beforeEach(() => {
    storage = mockSessionStorage()
  })

  it('getArchitectState returns null when nothing stored', () => {
    const stored = storage.getItem(STORAGE_KEY)
    expect(stored).toBeNull()
  })

  it('setItem + getItem round-trips correctly', () => {
    const state = { basics: { name: 'Test auction' }, lots: [] }
    storage.setItem(STORAGE_KEY, JSON.stringify(state))
    const result = JSON.parse(storage.getItem(STORAGE_KEY)!)
    expect(result.basics.name).toBe('Test auction')
  })

  it('removeItem clears the stored state', () => {
    storage.setItem(STORAGE_KEY, JSON.stringify({ foo: 1 }))
    storage.removeItem(STORAGE_KEY)
    expect(storage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('handles invalid JSON gracefully', () => {
    storage.setItem(STORAGE_KEY, 'not-valid-json{{{')
    let result = null
    try {
      result = JSON.parse(storage.getItem(STORAGE_KEY)!)
    } catch {
      result = null
    }
    expect(result).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────

describe('saveArchitectState — basics construction', () => {
  // Mirror the basics-building logic without Vue/Pinia
  function buildBasics(params: any, phaseParams: any) {
    return {
      name: params.name,
      description: '',
      type: phaseParams.builderType,
      currency: params.currency,
      timezone: params.timezone,
      time: params.time,
      usage: params.usage,
      max_rank_displayed: phaseParams.maxRankDisplayed,
      prefered: params.type === 'DutchPreferred',
      published: false,
      test: true,
      log_visibility: 'only_own',
    }
  }

  it('sets prefered=true only for DutchPreferred', () => {
    const params = { name: 'Test', type: 'DutchPreferred', currency: 'EUR', timezone: 'Europe/Paris', time: '14:00', usage: 'procurement' }
    const phase  = { builderType: 'dutch', maxRankDisplayed: 1 }
    expect(buildBasics(params, phase).prefered).toBe(true)
  })

  it('sets prefered=false for Dutch (non-preferred)', () => {
    const params = { name: 'Test', type: 'Dutch', currency: 'EUR', timezone: 'Europe/Paris', time: '14:00', usage: 'procurement' }
    const phase  = { builderType: 'dutch', maxRankDisplayed: 0 }
    expect(buildBasics(params, phase).prefered).toBe(false)
  })

  it('sets published=false and test=true always', () => {
    const params = { name: 'X', type: 'English', currency: 'EUR', timezone: 'UTC', time: '10:00', usage: 'test' }
    const phase  = { builderType: 'reverse', maxRankDisplayed: 3 }
    const basics = buildBasics(params, phase)
    expect(basics.published).toBe(false)
    expect(basics.test).toBe(true)
    expect(basics.log_visibility).toBe('only_own')
  })

  it('for DoubleScenario, phaseParams = params.english', () => {
    const params = {
      type: 'DoubleScenario',
      english: { builderType: 'reverse', maxRankDisplayed: 3, duration: 15, overtimeRange: 3 },
      name: 'DS auction', currency: 'EUR', timezone: 'UTC', time: '09:00', usage: 'test',
    }
    const isDoubleScenario = params.type === 'DoubleScenario'
    const phaseParams = isDoubleScenario ? params.english : params
    const basics = buildBasics(params, phaseParams)
    expect(basics.type).toBe('reverse')          // from params.english
    expect(basics.max_rank_displayed).toBe(3)
    expect(basics.prefered).toBe(false)
  })

  it('state includes architectFamily and isDoubleScenarioEnglishPhase', () => {
    const params = { type: 'DoubleScenario', english: { builderType: 'reverse', maxRankDisplayed: 3 }, name: 'DS', currency: 'EUR', timezone: 'UTC', time: '09:00', usage: 'test' }
    const isDS = params.type === 'DoubleScenario'
    const state = {
      basics: {},
      suppliers: null,
      lots: [],
      timingRule: 'serial',
      architectFamily: params.type,
      isDoubleScenarioEnglishPhase: isDS,
    }
    expect(state.architectFamily).toBe('DoubleScenario')
    expect(state.isDoubleScenarioEnglishPhase).toBe(true)
    expect(state.timingRule).toBe('serial')
    expect(state.suppliers).toBeNull()
  })
})
