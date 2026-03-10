import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getScores, DEF_BASES, DEF_SAVINGS, DEF_MATRIX, deepCloneMatrix, type ScoringParams } from '~/utils/decisionTree/scoring-engine'
import { createSnapshot, parseSnapshot } from '~/utils/decisionTree/snapshot-schema'
import type { DemoPreset } from '~/utils/decisionTree/demo-presets'

let _paramsSaveTimer: ReturnType<typeof setTimeout> | null = null

export interface Lot {
  id: number
  name: string
  unit: string
  qty: number
  pref: number
  intens: number
  award: number
  prices: number[]
  excl: boolean[]
}

let _lid = 100

function defaultLot(sc: number = 2): Lot {
  return {
    id: _lid++,
    name: 'Lot 1',
    unit: 'Unit',
    qty: 1,
    pref: 1,
    intens: 50,
    award: 1,
    prices: Array(sc).fill(0),
    excl: Array(sc).fill(false),
  }
}

export const useCalculatorStore = defineStore('calculator', () => {
  // ─── Editor state ───
  const mode = ref<'standard' | 'guided' | 'blue'>('standard')
  const phase = ref(1)
  const spend = ref(0)
  const nSup = ref(0)
  const award = ref<number | null>(null)
  const ccy = ref('EUR')
  const evName = ref('')
  const evNameErr = ref(false)
  const userNameErr = ref(false)
  const spendErr = ref(false)
  const nSupErr = ref(false)
  const awardErr = ref(false)
  const offersErr = ref(false)
  const lots = ref<Lot[]>([defaultLot()])
  const sc = ref(2)
  const supNames = ref(['Supplier 1', 'Supplier 2'])
  const selLot = ref(0)
  const expLot = ref(-1)
  const showParams = ref(false)
  const visitedPhase3 = ref(false)
  const lotHeaderH = ref(0)
  const params = ref<ScoringParams>({
    bases: [...DEF_BASES],
    savings: [...DEF_SAVINGS],
    matrix: deepCloneMatrix(DEF_MATRIX),
  })

  // ─── Computed scoring ───
  const v1 = computed(() => spend.value < 100000 ? 1 : spend.value <= 500000 ? 2 : 3)
  const v3 = computed(() => award.value || 1)
  const p1Ok = computed(() => {
    if (mode.value === 'guided' || mode.value === 'blue') return spend.value > 0 && nSup.value > 0
    return spend.value > 0 && nSup.value > 0 && award.value !== null
  })

  const p1Sc = computed(() => {
    if (!p1Ok.value) return []
    const nSupVal = nSup.value === 1 ? 1 : nSup.value === 2 ? 2 : 3
    const awardVal = (mode.value === 'guided' || mode.value === 'blue') ? 1 : v3.value
    return getScores(params.value, v1.value, nSupVal, awardVal, 1, 2, 1)
  })

  const hasAuction = computed(() => p1Sc.value.some(s => !s.eliminated))
  const eligible = computed(() => p1Ok.value && hasAuction.value)
  const notRec = computed(() => p1Ok.value && !hasAuction.value)
  const status = computed(() => eligible.value ? 'eligible' : notRec.value ? 'notRec' : 'setup')

  const lotSc = computed(() => lots.value.map(l => {
    const ap = l.prices.filter((p, i) => p > 0 && !l.excl[i])
    if (!ap.length || l.qty <= 0) return null
    const v2 = ap.length === 1 ? 1 : ap.length === 2 ? 2 : 3
    const v5 = l.intens <= 33 ? 1 : l.intens <= 66 ? 2 : 3
    let v6 = 1
    if (ap.length >= 2) {
      const sorted = [...ap].sort((a, b) => a - b)
      const low3 = sorted.slice(0, 3)
      const mn = low3[0], mx = low3[low3.length - 1]
      if (mn > 0) {
        const g = Math.round((mx - mn) / mn * 10000) / 100
        v6 = g <= 7 ? 1 : g <= 10 ? 2 : 3
      }
    }
    const lotAward = (mode.value === 'guided' || mode.value === 'blue') ? (l.award || 1) : v3.value
    return getScores(params.value, v1.value, v2, lotAward, l.pref, v5, v6)
  }))

  function lotBaseline(l: Lot): number {
    const ap = l.prices.filter((p, i) => p > 0 && !l.excl[i])
    if (!ap.length) return 0
    const avg = ap.reduce((s, p) => s + p, 0) / ap.length
    return avg * (l.qty || 0)
  }

  const totBase = computed(() => lots.value.reduce((s, l) => s + lotBaseline(l), 0))

  // Check if all supplier offer fields are filled (non-zero, non-excluded) for every lot
  const allOffersFilled = computed(() => lots.value.every(l =>
    l.prices.every((p, i) => l.excl[i] || p > 0)
  ))

  const lotTop3 = computed(() => lots.value.map((lot, i) => {
    const s = lotSc.value[i]
    if (!s) return []

    // Blue mode rule: baseline < 100K AND award is Rank(2) or No Rank(3) → Traditional first
    // Condition evaluated in: stores/decisionTree/calculator.ts (lotTop3 computed)
    if (mode.value === 'blue') {
      const bl = lotBaseline(lot)
      const lotAw = lot.award || 1
      if (bl > 0 && bl < 100000 && (lotAw === 2 || lotAw === 3)) {
        const trad = s.find(r => r.family === 'Traditional')
        if (trad) {
          const others = s.filter(r => !r.eliminated && r.family !== 'Traditional').slice(0, 2)
          return [{ ...trad, eliminated: false, pctMatch: 100 }, ...others]
        }
      }
    }

    const nonTrad = s.filter(r => !r.eliminated && r.family !== 'Traditional').slice(0, 3)
    if (nonTrad.length > 0) return nonTrad
    // Fallback: recommend Traditional when no auction type qualifies
    const trad = s.find(r => !r.eliminated && r.family === 'Traditional')
    return trad ? [trad] : []
  }))

  // ─── Progress ───
  const p1Pct = computed(() => {
    if (mode.value === 'guided' || mode.value === 'blue') {
      let d = 0
      if (spend.value > 0) d++
      if (nSup.value > 0) d++
      const pct = Math.round(d / 2 * 100)
      // Blue mode: cap at 99% when verdict is 'stop' (eAuction not recommended)
      // so the step badge shows progress-in-progress, not complete
      if (mode.value === 'blue' && pct === 100 && spend.value < 100000 && nSup.value <= 1) return 99
      return pct
    }
    let d = 0
    if (spend.value > 0) d++
    if (nSup.value > 0) d++
    if (award.value !== null) d++
    return Math.round(d / 3 * 100)
  })

  const p2Pct = computed(() => {
    let t = 1, d = evName.value.trim() ? 1 : 0
    lots.value.forEach(l => {
      t += 1
      if (l.prices.some((p, i) => p > 0 && !l.excl[i])) d++
    })
    return t > 0 ? Math.round(d / t * 100) : 0
  })

  // Auto-sync Phase 1 from lot data when in Phase 2+
  watch(totBase, (tb) => {
    if (phase.value >= 2 && tb > 0) {
      spend.value = Math.round(tb)
    }
  })
  watch(sc, (newSc) => {
    if (phase.value >= 2) {
      nSup.value = newSc
    }
  })

  // Clear error states when values change
  watch(spend, (v) => { if (v > 0) spendErr.value = false })
  watch(nSup, (v) => { if (v > 0) nSupErr.value = false })
  watch(award, (v) => { if (v !== null) awardErr.value = false })
  watch(lots, () => { if (allOffersFilled.value) offersErr.value = false }, { deep: true })

  // Track if user has ever opened Phase 3
  watch(phase, (v) => {
    if (v >= 3) visitedPhase3.value = true
    // Sync sc/supNames with nSup when entering Phase 2 in guided mode
    if (v === 2 && (mode.value === 'guided' || mode.value === 'blue')) syncGuidedSuppliers()
  })

  // Keep sc in sync when nSup changes in guided mode (even while in Phase 2)
  watch(nSup, () => {
    if ((mode.value === 'guided' || mode.value === 'blue') && phase.value >= 2) syncGuidedSuppliers()
  })

  function syncGuidedSuppliers() {
    const target = Math.max(1, nSup.value)
    if (sc.value === target) return
    if (target > sc.value) {
      // Add suppliers
      const toAdd = target - sc.value
      const oldSc = sc.value
      const newNames = Array.from({ length: toAdd }, (_, i) => 'Supplier ' + (oldSc + i + 1))
      supNames.value = [...supNames.value, ...newNames]
      lots.value = lots.value.map(l => ({
        ...l,
        prices: [...l.prices, ...Array(toAdd).fill(0)],
        excl: [...l.excl, ...Array(toAdd).fill(false)],
      }))
      sc.value = target
    } else {
      // Remove suppliers from the end
      const newSc = target
      supNames.value = supNames.value.slice(0, newSc)
      lots.value = lots.value.map(l => ({
        ...l,
        prices: l.prices.slice(0, newSc),
        excl: l.excl.slice(0, newSc),
      }))
      sc.value = newSc
    }
  }
  const p3Pct = computed(() => (phase.value >= 3 || visitedPhase3.value) ? 100 : 0)

  const statusLabel = computed(() => {
    if (phase.value >= 3) return 'eAuction'
    if (lotTop3.value.some(t => t.length > 0)) return 'Recommended'
    if (evName.value.trim()) return 'In progress'
    return 'Draft'
  })

  // ─── Actions ───
  function updateLot(i: number, key: string, value: any) {
    lots.value = lots.value.map((l, j) => j === i ? { ...l, [key]: value } : l)
  }

  function updatePrice(li: number, si: number, v: number) {
    lots.value = lots.value.map((l, i) => {
      if (i !== li) return l
      const np = [...l.prices]
      np[si] = v
      return { ...l, prices: np }
    })
  }

  function addLot() {
    if (lots.value.length >= 10) return
    lots.value = [...lots.value, {
      id: _lid++,
      name: 'Lot ' + (lots.value.length + 1),
      unit: 'Unit',
      qty: 1,
      pref: 1,
      intens: 50,
      award: 1,
      prices: Array(sc.value).fill(0),
      excl: Array(sc.value).fill(false),
    }]
  }

  function removeLot(i: number) {
    if (lots.value.length <= 1) return
    lots.value = lots.value.filter((_, j) => j !== i)
    selLot.value = Math.min(selLot.value, lots.value.length - 1)
  }

  function addSupplier() {
    if (sc.value >= 20) return
    const n = sc.value + 1
    sc.value = n
    supNames.value = [...supNames.value, 'Supplier ' + n]
    lots.value = lots.value.map(l => ({
      ...l,
      prices: [...l.prices, 0],
      excl: [...l.excl, false],
    }))
  }

  function removeSupplierAt(si: number) {
    if (sc.value <= 1) return
    sc.value = sc.value - 1
    supNames.value = supNames.value.filter((_, i) => i !== si)
    lots.value = lots.value.map(l => ({
      ...l,
      prices: l.prices.filter((_, i) => i !== si),
      excl: l.excl.filter((_, i) => i !== si),
    }))
  }

  function renameSupplier(si: number, name: string) {
    supNames.value = supNames.value.map((n, i) => i === si ? name : n)
  }

  function toggleExclude(li: number, si: number) {
    lots.value = lots.value.map((l, i) => {
      if (i !== li) return l
      const ne = [...l.excl]
      ne[si] = !ne[si]
      const np = [...l.prices]
      if (ne[si]) np[si] = 0
      return { ...l, excl: ne, prices: np }
    })
  }

  function applyDemoPreset(preset: DemoPreset) {
    const n = preset.suppliers.length
    sc.value = n
    supNames.value = [...preset.suppliers]
    lots.value = preset.lots.map((l, i) => ({
      id: Date.now() + i,
      name: l.name,
      unit: l.unit,
      qty: l.qty,
      pref: l.pref,
      intens: l.intens,
      award: (l as any).award || 1,
      prices: [...l.prices],
      excl: l.prices.map(() => false),
    }))
    selLot.value = 0
    // Sync Phase 1 from preset data
    nSup.value = n
    const totalSpend = preset.lots.reduce((sum, l) => {
      const avg = l.prices.reduce((s, p) => s + p, 0) / l.prices.length
      return sum + avg * l.qty
    }, 0)
    spend.value = Math.round(totalSpend)
  }

  function resetEditor() {
    if (_paramsSaveTimer) {
      clearTimeout(_paramsSaveTimer)
      _paramsSaveTimer = null
    }
    mode.value = 'standard'
    phase.value = 1
    spend.value = 0
    nSup.value = 0
    award.value = null
    ccy.value = 'EUR'
    evName.value = ''
    evNameErr.value = false
    userNameErr.value = false
    spendErr.value = false
    nSupErr.value = false
    awardErr.value = false
    offersErr.value = false
    lots.value = [defaultLot()]
    sc.value = 2
    supNames.value = ['Supplier 1', 'Supplier 2']
    selLot.value = 0
    expLot.value = -1
    visitedPhase3.value = false
  }

  function dispose() {
    if (_paramsSaveTimer) {
      clearTimeout(_paramsSaveTimer)
      _paramsSaveTimer = null
    }
  }

  function resetParams() {
    params.value = {
      bases: [...DEF_BASES],
      savings: [...DEF_SAVINGS],
      matrix: deepCloneMatrix(DEF_MATRIX),
    }
  }

  // ─── Supabase scoring params ───
  const paramsLoaded = ref(false)

  async function loadScoringParams() {
    try {
      const supabase = useSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('dt_scoring_params')
        .select('bases, savings, matrix')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      if (data) {
        params.value = {
          bases: Array.isArray(data.bases) ? data.bases : [...DEF_BASES],
          savings: Array.isArray(data.savings) ? data.savings : [...DEF_SAVINGS],
          matrix: Array.isArray(data.matrix) ? data.matrix : deepCloneMatrix(DEF_MATRIX),
        }
      }
    } catch (e) {
      console.error('[DT] Failed to load scoring params:', e)
    } finally {
      paramsLoaded.value = true
    }
  }

  async function saveScoringParams() {
    try {
      const supabase = useSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('dt_scoring_params')
        .upsert({
          user_id: user.id,
          bases: params.value.bases,
          savings: params.value.savings,
          matrix: params.value.matrix,
        }, { onConflict: 'user_id' })

      if (error) throw error
    } catch (e) {
      console.error('[DT] Failed to save scoring params:', e)
    }
  }

  // Debounced auto-save when params change
  watch(params, () => {
    if (!paramsLoaded.value) return
    if (_paramsSaveTimer) clearTimeout(_paramsSaveTimer)
    _paramsSaveTimer = setTimeout(() => saveScoringParams(), 1500)
  }, { deep: true })

  function getSnapshot() {
    return createSnapshot({
      mode: mode.value,
      phase: phase.value,
      spend: spend.value,
      nSup: nSup.value,
      award: award.value,
      ccy: ccy.value,
      evName: evName.value,
      lots: lots.value,
      sc: sc.value,
      supNames: [...supNames.value],
      selLot: selLot.value,
      expLot: expLot.value,
      params: JSON.parse(JSON.stringify(params.value)),
    })
  }

  function hydrateFromState(raw: any) {
    if (!raw) { resetEditor(); return }

    // Parse and migrate snapshot (handles v1 → v2, validation, defaults)
    const s = parseSnapshot(raw)
    if (!s) { resetEditor(); return }

    mode.value = s.mode
    phase.value = s.phase
    spend.value = s.spend
    nSup.value = s.nSup
    award.value = s.award
    ccy.value = s.ccy
    evName.value = s.evName
    evNameErr.value = false
    userNameErr.value = false
    spendErr.value = false
    nSupErr.value = false
    awardErr.value = false
    offersErr.value = false
    sc.value = s.sc
    lots.value = s.lots
    supNames.value = s.supNames
    selLot.value = 0
    expLot.value = -1
    visitedPhase3.value = s.phase >= 3
    // Restore custom scoring params if saved
    if (s.params) {
      params.value = s.params
    }
  }

  return {
    // State
    mode, phase, spend, nSup, award, ccy, evName, evNameErr, userNameErr, spendErr, nSupErr, awardErr, offersErr,
    lots, sc, supNames, selLot, expLot, showParams, params, lotHeaderH,
    // Computed
    v1, v3, p1Ok, p1Sc, hasAuction, eligible, notRec, status,
    lotSc, lotBaseline, totBase, lotTop3, allOffersFilled,
    p1Pct, p2Pct, p3Pct, statusLabel,
    // Actions
    updateLot, updatePrice, addLot, removeLot,
    addSupplier, removeSupplierAt, renameSupplier, toggleExclude,
    applyDemoPreset, resetEditor, resetParams, dispose,
    getSnapshot, hydrateFromState,
    paramsLoaded, loadScoringParams, saveScoringParams,
  }
})
