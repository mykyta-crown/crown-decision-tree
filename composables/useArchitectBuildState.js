import dayjs from 'dayjs'
import { useCalculatorStore } from '~/stores/architect/calculator'

const STORAGE_KEY = 'crown_architect_build_state'

/**
 * Serialises architect params into sessionStorage for future use when the
 * builder integration is implemented (pending: supplier email collection).
 *
 * Does NOT modify pages/builder.vue — zero impact on the existing platform.
 */
export const useArchitectBuildState = () => {
  /**
   * Build and persist the architect state to sessionStorage.
   * @param {object} params      - computed `params` from AuctionParamsModal
   * @param {object} lot         - the architect Lot object (name, qty, unit, prices, excl)
   * @param {number} lotBaseline - pre-computed baseline price
   * @param {string} ccy         - currency code (e.g. 'EUR')
   */
  const saveArchitectState = (params, lot, lotBaseline, ccy, locale = 'fr', supNames = []) => {
    if (!params) return null
    const store = useCalculatorStore()

    const isDoubleScenario = params.type === 'DoubleScenario'
    const phaseParams = isDoubleScenario ? params.english : params

    const buildDate = dayjs().add(7, 'day').format('YYYY-MM-DD')

    const basics = {
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

    // Build test suppliers from supNames (active, non-excluded only)
    const activeSuppliers = supNames
      .map((name, i) => ({ name, excluded: lot.excl?.[i] ?? false }))
      .filter(s => !s.excluded)
      .map((_, i) => ({
        email: `supplier+${i + 1}@crown.ovh`,
        phone: '',
        isNew: true,
      }))

    const terms   = _buildTerms(params, lot, lotBaseline, ccy, locale, store.builderParams)
    const lotData = {
      ..._buildLotData(phaseParams, lot, lotBaseline, ccy),
      ...terms,
      suppliers: activeSuppliers.map(s => ({ email: s.email })),
      suppliersTimePerRound: activeSuppliers.map(s => ({ email: s.email, time_per_round: null })),
    }

    // Inject per-supplier ceiling prices into items (English, SealedBid, DoubleScenario)
    // The builder reads them as lineItem[supplier.email]
    const supplierCeilings = params.supplierCeilings ?? params.english?.supplierCeilings
    if (supplierCeilings?.length) {
      supplierCeilings.forEach((s, i) => {
        const email = `supplier+${i + 1}@crown.ovh`
        lotData.items[0][email] = s.price
      })
    }

    const state = {
      basics,
      suppliers: activeSuppliers,
      lots: [lotData],
      timingRule: 'serial',
      architectFamily: params.type,
      isDoubleScenarioEnglishPhase: isDoubleScenario,
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      console.warn('[Architect] sessionStorage write failed (quota?)')
    }
    return state
  }

  const getArchitectState = () => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  }

  const clearArchitectState = () => {
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { saveArchitectState, getArchitectState, clearArchitectState }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function _fmt(n) {
  return Math.round(n).toLocaleString('fr-FR')
}

/** Substitute {{placeholders}} in a template string */
function _applyTemplate(tpl, vars) {
  return tpl
    .replace(/\{\{lotName\}\}/g, vars.lotName)
    .replace(/\{\{qty\}\}/g, vars.qty)
    .replace(/\{\{unit\}\}/g, vars.unit)
    .replace(/\{\{baseline\}\}/g, vars.baseline)
    .replace(/\{\{currency\}\}/g, vars.currency)
}

/** Standard Crown general terms (same for all types) */
const _GENERAL_TERMS = {
  fr: `<ul><li>Toute offre plac\u00e9e durant l\u2019eAuction doit refl\u00e9ter les sp\u00e9cifications, termes et conditions \u00e9nonc\u00e9s ci-dessus.</li><li>Toute offre plac\u00e9e durant l\u2019eAuction est contractuellement contraignante et trait\u00e9e comme une proposition formelle.</li><li>La ren\u00e9gociation n\u2019est pas possible apr\u00e8s l\u2019eAuction.</li><li>Les offres et lots gagnants doivent \u00eatre formalis\u00e9s dans un contrat avec le client dans les trente (30) jours ouvrables suivant l\u2019eAuction.</li></ul>`,
  en: `<ul><li>Any bid placed during the eAuction must reflect the specifications, terms and conditions stated above.</li><li>Any bid placed during the eAuction is contractually binding and treated as a formal proposal.</li><li>Renegotiation is not possible post eAuction.</li><li>Winning bids and lots must be formalized in a contract with the client within thirty (30) business days post eAuction.</li></ul>`,
}

/** Map params.type → builderParams key */
const _FAMILY_KEY = {
  English: 'english',
  SealedBid: 'sealedBid',
  Dutch: 'dutch',
  DutchPreferred: 'dutchPreferred',
  Japanese: 'japanese',
  DoubleScenario: 'doubleScenario',
}

/**
 * Generates pre-filled terms using configurable templates from the store.
 * @param {object} params       - full params from AuctionParamsModal (params.type = family)
 * @param {object} lot          - { name, qty, unit }
 * @param {number} lotBaseline  - total baseline price
 * @param {string} ccy          - currency code
 * @param {string} locale       - 'fr' | 'en'
 * @param {object} builderParams - store.builderParams
 */
function _buildTerms(params, lot, lotBaseline, ccy, locale = 'fr', builderParams = null) {
  const lotName  = lot.name || 'Lot'
  const qty      = lot.qty || 1
  const unit     = lot.unit || 'unité(s)'
  const family   = params.type
  const lang     = (locale === 'en') ? 'en' : 'fr'

  const vars = {
    lotName,
    qty,
    unit,
    baseline: lotBaseline > 0 ? _fmt(lotBaseline) : '—',
    currency: ccy,
  }

  // General terms — standard boilerplate (not per-type)
  const general_terms = _GENERAL_TERMS[lang]

  // Resolve the template set from store (with fallback to empty string)
  const bpKey = _FAMILY_KEY[family]
  const tplSet = builderParams?.[bpKey]?.templates?.[lang] || null

  const awarding_principles = tplSet
    ? _applyTemplate(tplSet.awarding_principles, vars)
    : ''

  const commercials_terms = tplSet
    ? _applyTemplate(tplSet.commercials_terms, vars)
    : ''

  return { general_terms, commercials_terms, awarding_principles }
}

function _buildLotData(phaseParams, lot, lotBaseline, ccy) {
  const base = {
    name: lot.name || '',
    multiplier: true,
    rank_trigger: 'all',
    min_bid_decr_type: ccy,
    max_bid_decr_type: ccy,
    suppliers: [],
    suppliersTimePerRound: [],
    items: [
      {
        line_item: lot.name || '',
        unit: lot.unit || '',
        quantity: lot.qty || 1,
        index: 0,
      },
    ],
    commercials_docs: [],
    awarding_principles: '',  // overridden by _buildTerms
    commercials_terms: '',    // overridden by _buildTerms
    general_terms: '',        // overridden by _buildTerms
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
      min_bid_decr: phaseParams.incr * qty,
      max_bid_decr: phaseParams.ending * qty,
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
      min_bid_decr: phaseParams.decr * qty,
      max_bid_decr: (phaseParams.starting ?? 0) * qty,
      dutch_prebid_enabled: true,
    }
  }

  return { ...base, duration: 0, overtime_range: 0, baseline: 0, min_bid_decr: 0, max_bid_decr: 0, dutch_prebid_enabled: false }
}
