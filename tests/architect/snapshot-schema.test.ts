import { describe, it, expect } from 'vitest'
import {
  parseSnapshot,
  createSnapshot,
  validateScoringParams,
  CURRENT_SNAPSHOT_VERSION,
  ScoringParamsSchema,
  SnapshotV2Schema,
} from '~/utils/architect/snapshot-schema'
import { DEF_BASES, DEF_SAVINGS, DEF_MATRIX, deepCloneMatrix } from '~/utils/architect/scoring-engine'

// ─── Fixtures ───
const validLot = {
  id: 1, name: 'Lot 1', unit: 'Unit', qty: 10,
  pref: 1, intens: 50, award: 1,
  prices: [100, 200], excl: [false, false],
}

const validV2Snapshot = {
  version: 2 as const,
  mode: 'standard' as const,
  phase: 2,
  spend: 300000,
  nSup: 5,
  award: 1,
  ccy: 'EUR',
  evName: 'Test Scenario',
  lots: [validLot],
  sc: 2,
  supNames: ['Supplier A', 'Supplier B'],
  selLot: 0,
  expLot: -1,
}

// ══════════════════════════════════════════════════════════════
// parseSnapshot — v2 inputs
// ══════════════════════════════════════════════════════════════
describe('parseSnapshot — v2 inputs', () => {
  it('parses a valid v2 snapshot', () => {
    const result = parseSnapshot(validV2Snapshot)
    expect(result).not.toBeNull()
    expect(result!.version).toBe(2)
    expect(result!.mode).toBe('standard')
    expect(result!.evName).toBe('Test Scenario')
    expect(result!.lots).toHaveLength(1)
  })

  it('preserves all fields', () => {
    const result = parseSnapshot(validV2Snapshot)!
    expect(result.spend).toBe(300000)
    expect(result.nSup).toBe(5)
    expect(result.award).toBe(1)
    expect(result.ccy).toBe('EUR')
    expect(result.sc).toBe(2)
    expect(result.supNames).toEqual(['Supplier A', 'Supplier B'])
  })

  it('preserves lot details', () => {
    const result = parseSnapshot(validV2Snapshot)!
    const lot = result.lots[0]
    expect(lot.name).toBe('Lot 1')
    expect(lot.qty).toBe(10)
    expect(lot.pref).toBe(1)
    expect(lot.intens).toBe(50)
    expect(lot.award).toBe(1)
    expect(lot.prices).toEqual([100, 200])
    expect(lot.excl).toEqual([false, false])
  })

  it('accepts snapshot with valid scoring params', () => {
    const withParams = {
      ...validV2Snapshot,
      params: { bases: [...DEF_BASES], savings: [...DEF_SAVINGS], matrix: deepCloneMatrix(DEF_MATRIX) },
    }
    const result = parseSnapshot(withParams)
    expect(result).not.toBeNull()
    expect(result!.params).toBeDefined()
    expect(result!.params!.bases).toHaveLength(22)
  })
})

// ══════════════════════════════════════════════════════════════
// parseSnapshot — v1 (unversioned) migration
// ══════════════════════════════════════════════════════════════
describe('parseSnapshot — v1 migration', () => {
  it('migrates unversioned snapshot to v2', () => {
    const v1 = {
      mode: 'standard',
      phase: 1,
      spend: 50000,
      nSup: 3,
      award: 1,
      ccy: 'USD',
      evName: 'Old Project',
      lots: [{ id: 1, name: 'Lot A', unit: 'kg', qty: 5, pref: 2, intens: 70, prices: [10, 20], excl: [false, false] }],
      sc: 2,
      supNames: ['Alpha', 'Beta'],
    }
    const result = parseSnapshot(v1)
    expect(result).not.toBeNull()
    expect(result!.version).toBe(2)
    expect(result!.mode).toBe('standard')
    expect(result!.evName).toBe('Old Project')
    expect(result!.ccy).toBe('USD')
  })

  it('converts "lots" mode to "guided"', () => {
    const v1 = { mode: 'lots', phase: 2, spend: 100000, nSup: 2, sc: 2 }
    const result = parseSnapshot(v1)
    expect(result!.mode).toBe('guided')
  })

  it('handles string award values (legacy)', () => {
    const v1 = { mode: 'standard', award: 'Rank', sc: 2 }
    const result = parseSnapshot(v1)
    expect(result!.award).toBe(2) // 'Rank' → 2
  })

  it('handles missing fields with defaults', () => {
    const minimal = {}
    const result = parseSnapshot(minimal)
    expect(result).not.toBeNull()
    expect(result!.version).toBe(2)
    expect(result!.mode).toBe('standard')
    expect(result!.phase).toBe(1)
    expect(result!.spend).toBe(0)
    expect(result!.nSup).toBe(0)
    expect(result!.award).toBeNull()
    expect(result!.ccy).toBe('EUR')
    expect(result!.evName).toBe('')
    expect(result!.lots).toHaveLength(1)
    expect(result!.sc).toBe(2)
    expect(result!.supNames).toEqual(['Supplier 1', 'Supplier 2'])
  })

  it('pads lot prices/excl arrays to match sc', () => {
    const v1 = {
      sc: 4,
      lots: [{ id: 1, name: 'X', unit: 'u', qty: 1, pref: 1, intens: 50, prices: [10, 20], excl: [false] }],
    }
    const result = parseSnapshot(v1)
    const lot = result!.lots[0]
    expect(lot.prices).toHaveLength(4)
    expect(lot.prices).toEqual([10, 20, 0, 0])
    expect(lot.excl).toHaveLength(4)
    expect(lot.excl).toEqual([false, false, false, false])
  })

  it('truncates lot prices/excl arrays to match sc', () => {
    const v1 = {
      sc: 2,
      lots: [{ id: 1, name: 'X', unit: 'u', qty: 1, pref: 1, intens: 50, prices: [10, 20, 30, 40], excl: [false, false, true, false] }],
    }
    const result = parseSnapshot(v1)
    const lot = result!.lots[0]
    expect(lot.prices).toHaveLength(2)
    expect(lot.excl).toHaveLength(2)
  })

  it('adds default award=1 to lots missing it', () => {
    const v1 = {
      sc: 2,
      lots: [{ id: 1, name: 'X', unit: 'u', qty: 1, pref: 1, intens: 50, prices: [10, 20], excl: [false, false] }],
    }
    const result = parseSnapshot(v1)
    expect(result!.lots[0].award).toBe(1)
  })

  it('discards invalid scoring params during migration', () => {
    const v1 = {
      sc: 2,
      params: { bases: [1, 2, 3], savings: 'invalid', matrix: null },
    }
    const result = parseSnapshot(v1)
    expect(result!.params).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════
// parseSnapshot — invalid inputs
// ══════════════════════════════════════════════════════════════
describe('parseSnapshot — invalid inputs', () => {
  it('returns null for null', () => {
    expect(parseSnapshot(null)).toBeNull()
  })

  it('returns null for undefined', () => {
    expect(parseSnapshot(undefined)).toBeNull()
  })

  it('returns null for string', () => {
    expect(parseSnapshot('hello')).toBeNull()
  })

  it('returns null for number', () => {
    expect(parseSnapshot(42)).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════
// createSnapshot
// ══════════════════════════════════════════════════════════════
describe('createSnapshot', () => {
  it('creates a v2 snapshot with correct version', () => {
    const snap = createSnapshot({
      mode: 'guided',
      phase: 2,
      spend: 200000,
      nSup: 4,
      award: null,
      ccy: 'GBP',
      evName: 'My Test',
      lots: [{ id: 99, name: 'L1', unit: 'pcs', qty: 100, pref: 2, intens: 60, award: 2, prices: [50, 60], excl: [false, false] }],
      sc: 2,
      supNames: ['A', 'B'],
      selLot: 0,
      expLot: -1,
    })
    expect(snap.version).toBe(CURRENT_SNAPSHOT_VERSION)
    expect(snap.mode).toBe('guided')
    expect(snap.evName).toBe('My Test')
  })

  it('deep-copies lot arrays', () => {
    const originalPrices = [100, 200]
    const lots = [{ id: 1, name: 'L', unit: 'u', qty: 1, pref: 1, intens: 50, award: 1, prices: originalPrices, excl: [false, false] }]
    const snap = createSnapshot({
      mode: 'standard', phase: 1, spend: 0, nSup: 2, award: null,
      ccy: 'EUR', evName: '', lots, sc: 2, supNames: ['A', 'B'], selLot: 0, expLot: -1,
    })
    // Mutate original — should not affect snapshot
    originalPrices[0] = 999
    expect(snap.lots[0].prices[0]).toBe(100)
  })

  it('created snapshot passes v2 validation', () => {
    const snap = createSnapshot({
      mode: 'standard', phase: 1, spend: 50000, nSup: 3, award: 1,
      ccy: 'EUR', evName: 'Test', lots: [validLot], sc: 2, supNames: ['A', 'B'], selLot: 0, expLot: -1,
    })
    const result = SnapshotV2Schema.safeParse(snap)
    expect(result.success).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════
// validateScoringParams
// ══════════════════════════════════════════════════════════════
describe('validateScoringParams', () => {
  it('accepts valid default params', () => {
    const result = validateScoringParams({
      bases: [...DEF_BASES],
      savings: [...DEF_SAVINGS],
      matrix: deepCloneMatrix(DEF_MATRIX),
    })
    expect(result).not.toBeNull()
  })

  it('rejects params with wrong bases length', () => {
    const result = validateScoringParams({
      bases: [1, 2, 3],
      savings: [...DEF_SAVINGS],
      matrix: deepCloneMatrix(DEF_MATRIX),
    })
    expect(result).toBeNull()
  })

  it('rejects params with wrong matrix dimensions', () => {
    const result = validateScoringParams({
      bases: [...DEF_BASES],
      savings: [...DEF_SAVINGS],
      matrix: [[1, 2, 3]],
    })
    expect(result).toBeNull()
  })

  it('rejects non-object input', () => {
    expect(validateScoringParams(null)).toBeNull()
    expect(validateScoringParams('hello')).toBeNull()
    expect(validateScoringParams(42)).toBeNull()
  })

  it('rejects params with missing fields', () => {
    expect(validateScoringParams({ bases: [...DEF_BASES] })).toBeNull()
    expect(validateScoringParams({ savings: [...DEF_SAVINGS] })).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════
// ScoringParamsSchema
// ══════════════════════════════════════════════════════════════
describe('ScoringParamsSchema', () => {
  it('requires exactly 22 bases', () => {
    const result = ScoringParamsSchema.safeParse({
      bases: Array(21).fill(0),
      savings: Array(22).fill(0),
      matrix: DEF_MATRIX.map(s => s.map(q => [...q])),
    })
    expect(result.success).toBe(false)
  })

  it('requires exactly 22 savings', () => {
    const result = ScoringParamsSchema.safeParse({
      bases: Array(22).fill(0),
      savings: Array(23).fill(0),
      matrix: DEF_MATRIX.map(s => s.map(q => [...q])),
    })
    expect(result.success).toBe(false)
  })

  it('requires matrix shape [22][6][3]', () => {
    // Wrong inner dimension (2 instead of 3)
    const badMatrix = DEF_MATRIX.map(s => s.map(() => [0, 0]))
    const result = ScoringParamsSchema.safeParse({
      bases: Array(22).fill(0),
      savings: Array(22).fill(0),
      matrix: badMatrix,
    })
    expect(result.success).toBe(false)
  })
})
