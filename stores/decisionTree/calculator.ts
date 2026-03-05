import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { getScores, DEF_BASES, DEF_SAVINGS, DEF_MATRIX, deepCloneMatrix, type ScoringParams } from '~/utils/decisionTree/scoring-engine'
import type { DemoPreset } from '~/utils/decisionTree/demo-presets'

export interface Lot {
  id: number
  name: string
  unit: string
  qty: number
  pref: number
  intens: number
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
    prices: Array(sc).fill(0),
    excl: Array(sc).fill(false),
  }
}

export const useCalculatorStore = defineStore('calculator', () => {
  // ─── Editor state ───
  const phase = ref(1)
  const spend = ref(0)
  const nSup = ref(0)
  const award = ref<number | null>(null)
  const ccy = ref('EUR')
  const evName = ref('')
  const evNameErr = ref(false)
  const userNameErr = ref(false)
  const lots = ref<Lot[]>([defaultLot()])
  const sc = ref(2)
  const supNames = ref(['Supplier 1', 'Supplier 2'])
  const selLot = ref(0)
  const expLot = ref(-1)
  const showParams = ref(false)
  const visitedPhase3 = ref(false)
  const params = ref<ScoringParams>({
    bases: [...DEF_BASES],
    savings: [...DEF_SAVINGS],
    matrix: deepCloneMatrix(DEF_MATRIX),
  })

  // ─── Computed scoring ───
  const v1 = computed(() => spend.value < 100000 ? 1 : spend.value <= 500000 ? 2 : 3)
  const v3 = computed(() => award.value || 1)
  const p1Ok = computed(() => spend.value > 0 && nSup.value > 0 && award.value !== null)

  const p1Sc = computed(() => {
    if (!p1Ok.value) return []
    const nSupVal = nSup.value === 1 ? 1 : nSup.value === 2 ? 2 : 3
    return getScores(params.value, v1.value, nSupVal, v3.value, 1, 2, 1)
  })

  const hasAuction = computed(() => p1Sc.value.some(s => !s.eliminated && s.family !== 'Traditional'))
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
    return getScores(params.value, v1.value, v2, v3.value, l.pref, v5, v6)
  }))

  function lotBaseline(l: Lot): number {
    const ap = l.prices.filter((p, i) => p > 0 && !l.excl[i])
    if (!ap.length) return 0
    const avg = ap.reduce((s, p) => s + p, 0) / ap.length
    return avg * (l.qty || 0)
  }

  const totBase = computed(() => lots.value.reduce((s, l) => s + lotBaseline(l), 0))

  const lotTop3 = computed(() => lots.value.map((_, i) => {
    const s = lotSc.value[i]
    return s ? s.filter(r => !r.eliminated && r.family !== 'Traditional').slice(0, 3) : []
  }))

  // ─── Progress ───
  const p1Pct = computed(() => {
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

  // Track if user has ever opened Phase 3
  watch(phase, (v) => { if (v >= 3) visitedPhase3.value = true })
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
    if (sc.value >= 6) return
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
      prices: [...l.prices],
      excl: l.prices.map(() => false),
    }))
    selLot.value = 0
  }

  function resetEditor() {
    phase.value = 1
    spend.value = 0
    nSup.value = 0
    award.value = null
    ccy.value = 'EUR'
    evName.value = ''
    evNameErr.value = false
    userNameErr.value = false
    lots.value = [defaultLot()]
    sc.value = 2
    supNames.value = ['Supplier 1', 'Supplier 2']
    selLot.value = 0
    expLot.value = -1
    visitedPhase3.value = false
  }

  function resetParams() {
    params.value = {
      bases: [...DEF_BASES],
      savings: [...DEF_SAVINGS],
      matrix: deepCloneMatrix(DEF_MATRIX),
    }
  }

  function getSnapshot() {
    return {
      phase: phase.value,
      spend: spend.value,
      nSup: nSup.value,
      award: award.value,
      ccy: ccy.value,
      evName: evName.value,
      lots: JSON.parse(JSON.stringify(lots.value)),
      sc: sc.value,
      supNames: [...supNames.value],
      selLot: selLot.value,
      expLot: expLot.value,
      params: JSON.parse(JSON.stringify(params.value)),
    }
  }

  function hydrateFromState(s: any) {
    if (!s) { resetEditor(); return }
    phase.value = s.phase ?? 1
    spend.value = s.spend ?? 0
    nSup.value = s.nSup ?? 1
    award.value = s.award ?? 'Award'
    ccy.value = s.ccy ?? 'EUR'
    evName.value = s.evName ?? ''
    evNameErr.value = false
    userNameErr.value = false
    sc.value = s.sc ?? 2
    // Validate lots: ensure prices/excl arrays have correct length
    if (Array.isArray(s.lots) && s.lots.length > 0) {
      lots.value = s.lots.map((l: any) => ({
        ...l,
        prices: Array.isArray(l.prices) ? l.prices.slice(0, sc.value).concat(Array(Math.max(0, sc.value - (l.prices?.length || 0))).fill(0)) : Array(sc.value).fill(0),
        excl: Array.isArray(l.excl) ? l.excl.slice(0, sc.value).concat(Array(Math.max(0, sc.value - (l.excl?.length || 0))).fill(false)) : Array(sc.value).fill(false),
      }))
    } else {
      lots.value = [defaultLot()]
    }
    supNames.value = s.supNames || Array.from({ length: sc.value }, (_, i) => 'Supplier ' + (i + 1))
    selLot.value = 0
    expLot.value = -1
    visitedPhase3.value = (s.phase ?? 0) >= 3
    // Restore custom scoring params if saved
    if (s.params) {
      params.value = {
        bases: Array.isArray(s.params.bases) ? s.params.bases : [...DEF_BASES],
        savings: Array.isArray(s.params.savings) ? s.params.savings : [...DEF_SAVINGS],
        matrix: Array.isArray(s.params.matrix) ? s.params.matrix : deepCloneMatrix(DEF_MATRIX),
      }
    }
  }

  return {
    // State
    phase, spend, nSup, award, ccy, evName, evNameErr, userNameErr,
    lots, sc, supNames, selLot, expLot, showParams, params,
    // Computed
    v1, v3, p1Ok, p1Sc, hasAuction, eligible, notRec, status,
    lotSc, lotBaseline, totBase, lotTop3,
    p1Pct, p2Pct, p3Pct, statusLabel,
    // Actions
    updateLot, updatePrice, addLot, removeLot,
    addSupplier, removeSupplierAt, renameSupplier, toggleExclude,
    applyDemoPreset, resetEditor, resetParams,
    getSnapshot, hydrateFromState,
  }
})
