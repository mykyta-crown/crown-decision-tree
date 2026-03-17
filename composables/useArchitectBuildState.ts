import dayjs from 'dayjs'
import { useCalculatorStore } from '~/stores/architect/calculator'
import type { AuctionParams } from '~/utils/architect/computeAuctionParams'
import type { Lot } from '~/stores/architect/calculator'

const STORAGE_KEY = 'crown_architect_build_state'

interface ActiveSupplier {
  name: string
  email: string
  phone: string
  isNew: boolean
}

interface ArchitectBuildState {
  basics: Record<string, unknown>
  suppliers: ActiveSupplier[]
  lots: Record<string, unknown>[]
  timingRule: string
  architectFamily: string
  isDoubleScenarioEnglishPhase: boolean
}

/**
 * Serialises architect params into sessionStorage for the builder integration.
 * NOTE: supplier emails are placeholders (supplier+N@crown.ovh) — see C2 in audit notes.
 */
export const useArchitectBuildState = () => {
  const saveArchitectState = (
    params: AuctionParams & Record<string, unknown>,
    lot: Lot,
    lotBaseline: number,
    ccy: string,
    locale = 'fr',
    supNames: string[] = [],
  ): ArchitectBuildState | null => {
    if (!params) return null
    const store = useCalculatorStore()

    const isDoubleScenario = params.type === 'DoubleScenario'
    const phaseParams: Record<string, unknown> = isDoubleScenario
      ? (params as any).english
      : params

    const buildDate = dayjs().add(7, 'day').format('YYYY-MM-DD')

    const basics = {
      name: (params as any).name,
      description: '',
      type: phaseParams.builderType,
      currency: (params as any).currency,
      timezone: (params as any).timezone,
      time: (params as any).time,
      date: buildDate,
      usage: (params as any).usage,
      max_rank_displayed: phaseParams.maxRankDisplayed,
      prefered: params.type === 'DutchPreferred',
      published: false,
      test: true,
      log_visibility: 'only_own',
    }

    const activeSuppliers: ActiveSupplier[] = supNames
      .map((name, i) => ({ name, excluded: lot.excl?.[i] ?? false }))
      .filter(s => !s.excluded)
      .map((s, i) => ({
        name: s.name,
        email: `supplier+${i + 1}@crown.ovh`,
        phone: '',
        isNew: true,
      }))

    const terms = _buildTerms(params, lot, lotBaseline, ccy, locale, store.builderParams)
    const lotData: Record<string, unknown> = {
      ..._buildLotData(phaseParams, lot, lotBaseline, ccy),
      ...terms,
      suppliers: activeSuppliers.map(s => ({ email: s.email })),
      suppliersTimePerRound: activeSuppliers.map(s => ({ email: s.email, time_per_round: null })),
    }

    // Inject per-supplier ceiling prices (English, SealedBid, DoubleScenario)
    const supplierCeilings = (params as any).supplierCeilings ?? (params as any).english?.supplierCeilings
    if (supplierCeilings?.length) {
      const items = lotData.items as Record<string, unknown>[]
      supplierCeilings.forEach((ceiling: { name: string; price: number }) => {
        const match = activeSuppliers.find(s => s.name === ceiling.name)
        if (match) items[0][match.email] = ceiling.price
      })
    }

    // Inject per-supplier selling prices (Dutch, Japanese prebid)
    if (phaseParams.builderType === 'dutch' || phaseParams.builderType === 'japanese') {
      const items = lotData.items as Record<string, unknown>[]
      supNames.forEach((name, i) => {
        if (lot.excl?.[i]) return
        const price = lot.prices?.[i]
        if (!price || price <= 0) return
        const match = activeSuppliers.find(s => s.name === name)
        if (match) items[0][match.email] = price
      })
    }

    const state: ArchitectBuildState = {
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

  const getArchitectState = (): ArchitectBuildState | null => {
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

function _fmt(n: number): string {
  return Math.round(n).toLocaleString('fr-FR')
}

function _applyTemplate(tpl: string, vars: Record<string, string | number>): string {
  return tpl
    .replace(/\{\{lotName\}\}/g, String(vars.lotName))
    .replace(/\{\{qty\}\}/g, String(vars.qty))
    .replace(/\{\{unit\}\}/g, String(vars.unit))
    .replace(/\{\{baseline\}\}/g, String(vars.baseline))
    .replace(/\{\{currency\}\}/g, String(vars.currency))
}

const _GENERAL_TERMS: Record<string, string> = {
  fr: `<ul><li>Toute offre plac\u00e9e durant l\u2019eAuction doit refl\u00e9ter les sp\u00e9cifications, termes et conditions \u00e9nonc\u00e9s ci-dessus.</li><li>Toute offre plac\u00e9e durant l\u2019eAuction est contractuellement contraignante et trait\u00e9e comme une proposition formelle.</li><li>La ren\u00e9gociation n\u2019est pas possible apr\u00e8s l\u2019eAuction.</li><li>Les offres et lots gagnants doivent \u00eatre formalis\u00e9s dans un contrat avec le client dans les trente (30) jours ouvrables suivant l\u2019eAuction.</li></ul>`,
  en: `<ul><li>Any bid placed during the eAuction must reflect the specifications, terms and conditions stated above.</li><li>Any bid placed during the eAuction is contractually binding and treated as a formal proposal.</li><li>Renegotiation is not possible post eAuction.</li><li>Winning bids and lots must be formalized in a contract with the client within thirty (30) business days post eAuction.</li></ul>`,
}

const _FAMILY_KEY: Record<string, string> = {
  English: 'english',
  SealedBid: 'sealedBid',
  Dutch: 'dutch',
  DutchPreferred: 'dutchPreferred',
  Japanese: 'japanese',
  DoubleScenario: 'doubleScenario',
}

function _buildTerms(
  params: Record<string, unknown>,
  lot: Lot,
  lotBaseline: number,
  ccy: string,
  locale = 'fr',
  builderParams: Record<string, unknown> | null = null,
) {
  const lotName = (lot.name as string) || 'Lot'
  const qty = lot.qty || 1
  const unit = (lot.unit as string) || 'unité(s)'
  const family = params.type as string
  const lang = locale === 'en' ? 'en' : 'fr'

  const vars = {
    lotName,
    qty,
    unit,
    baseline: lotBaseline > 0 ? _fmt(lotBaseline) : '—',
    currency: ccy,
  }

  const general_terms = _GENERAL_TERMS[lang]
  const bpKey = _FAMILY_KEY[family]
  const tplSet = (builderParams as any)?.[bpKey]?.templates?.[lang] ?? null

  const awarding_principles = tplSet ? _applyTemplate(tplSet.awarding_principles, vars) : ''
  const commercials_terms = tplSet ? _applyTemplate(tplSet.commercials_terms, vars) : ''

  return { general_terms, commercials_terms, awarding_principles }
}

function _buildLotData(
  phaseParams: Record<string, unknown>,
  lot: Lot,
  lotBaseline: number,
  ccy: string,
): Record<string, unknown> {
  const base = {
    name: (lot.name as string) || '',
    multiplier: true,
    rank_trigger: 'all',
    min_bid_decr_type: ccy,
    max_bid_decr_type: ccy,
    suppliers: [],
    suppliersTimePerRound: [],
    items: [
      {
        line_item: (lot.name as string) || '',
        unit: (lot.unit as string) || '',
        quantity: lot.qty || 1,
        index: 0,
      },
    ],
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

  const type = phaseParams.builderType as string

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
      overtime_range: (phaseParams.roundDuration as number) ?? phaseParams.overtimeRange,
      baseline: ((phaseParams.starting as number) ?? 0) * qty,
      min_bid_decr: (phaseParams.incr as number) * qty,
      max_bid_decr: (phaseParams.ending as number) * qty,
      dutch_prebid_enabled: true,
    }
  }

  if (type === 'japanese') {
    const qty = lot.qty || 1
    return {
      ...base,
      duration: phaseParams.duration,
      overtime_range: (phaseParams.roundDuration as number) ?? phaseParams.overtimeRange,
      baseline: ((phaseParams.starting as number) ?? 0) * qty,
      min_bid_decr: (phaseParams.decr as number) * qty,
      max_bid_decr: ((phaseParams.starting as number) ?? 0) * qty,
      dutch_prebid_enabled: true,
    }
  }

  return { ...base, duration: 0, overtime_range: 0, baseline: 0, min_bid_decr: 0, max_bid_decr: 0, dutch_prebid_enabled: false }
}
