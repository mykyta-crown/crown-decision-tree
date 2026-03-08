import { z } from 'zod'
import { STRATEGY_COUNT } from './scoring-engine'

// ══════════════════════════════════════════════════════════════
// SNAPSHOT VERSIONING
// ══════════════════════════════════════════════════════════════
//
// Every project's `state` field in the database is a snapshot of
// the calculator store. This module provides:
//   1. Zod schemas for type-safe validation
//   2. Version tracking (current: v2)
//   3. Migration functions from older formats
//
// VERSION HISTORY
// ───────────────
// v1 (unversioned): Original format — no `version` field.
//    Had optional `mode: 'standard' | 'lots' | 'guided'`.
// v2 (current): Added `version: 2` field.
//    Removed 'lots' mode. Mode is 'standard' | 'guided'.
//    Lots always have `award` field.
// ══════════════════════════════════════════════════════════════

export const CURRENT_SNAPSHOT_VERSION = 2

// ─── ScoringParams schema ───
export const ScoringParamsSchema = z.object({
  bases: z.array(z.number()).length(STRATEGY_COUNT),
  savings: z.array(z.number()).length(STRATEGY_COUNT),
  matrix: z.array(
    z.array(
      z.array(z.number()).length(3)
    ).length(6)
  ).length(STRATEGY_COUNT),
})

export type ValidatedScoringParams = z.infer<typeof ScoringParamsSchema>

// ─── Lot schema ───
const LotSchema = z.object({
  id: z.number(),
  name: z.string(),
  unit: z.string(),
  qty: z.number(),
  pref: z.number().min(1).max(3),
  intens: z.number().min(0).max(100),
  award: z.number().min(1).max(3),
  prices: z.array(z.number()),
  excl: z.array(z.boolean()),
})

// ─── Snapshot v2 schema (current) ───
export const SnapshotV2Schema = z.object({
  version: z.literal(2),
  mode: z.enum(['standard', 'guided']),
  phase: z.number().min(0).max(3),
  spend: z.number().min(0),
  nSup: z.number().min(0),
  award: z.number().nullable(),
  ccy: z.string(),
  evName: z.string(),
  lots: z.array(LotSchema).min(1),
  sc: z.number().min(1),
  supNames: z.array(z.string()),
  selLot: z.number().min(0),
  expLot: z.number(),
  params: ScoringParamsSchema.optional(),
})

export type SnapshotV2 = z.infer<typeof SnapshotV2Schema>

// ─── V1 schema (legacy, unversioned) ───
const SnapshotV1Schema = z.object({
  mode: z.enum(['standard', 'lots', 'guided']).optional(),
  phase: z.number().optional(),
  spend: z.number().optional(),
  nSup: z.number().optional(),
  award: z.union([z.number(), z.string(), z.null()]).optional(),
  ccy: z.string().optional(),
  evName: z.string().optional(),
  lots: z.array(z.any()).optional(),
  sc: z.number().optional(),
  supNames: z.array(z.string()).optional(),
  selLot: z.number().optional(),
  expLot: z.number().optional(),
  params: z.any().optional(),
})

// ─── Migration: v1 → v2 ───
function migrateV1toV2(raw: z.infer<typeof SnapshotV1Schema>): SnapshotV2 {
  // Normalize mode: 'lots' → 'guided'
  let mode: 'standard' | 'guided' = 'standard'
  if (raw.mode === 'guided' || raw.mode === 'lots') {
    mode = 'guided'
  }

  const sc = raw.sc ?? 2

  // Normalize lots
  const lots = (raw.lots && raw.lots.length > 0)
    ? raw.lots.map((l: any, i: number) => ({
        id: l.id ?? Date.now() + i,
        name: l.name ?? `Lot ${i + 1}`,
        unit: l.unit ?? 'Unit',
        qty: typeof l.qty === 'number' ? l.qty : 1,
        pref: typeof l.pref === 'number' ? Math.min(Math.max(l.pref, 1), 3) : 1,
        intens: typeof l.intens === 'number' ? Math.min(Math.max(l.intens, 0), 100) : 50,
        award: typeof l.award === 'number' ? Math.min(Math.max(l.award, 1), 3) : 1,
        prices: Array.isArray(l.prices)
          ? l.prices.slice(0, sc).concat(Array(Math.max(0, sc - (l.prices?.length || 0))).fill(0))
          : Array(sc).fill(0),
        excl: Array.isArray(l.excl)
          ? l.excl.slice(0, sc).concat(Array(Math.max(0, sc - (l.excl?.length || 0))).fill(false))
          : Array(sc).fill(false),
      }))
    : [{ id: Date.now(), name: 'Lot 1', unit: 'Unit', qty: 1, pref: 1, intens: 50, award: 1, prices: Array(sc).fill(0), excl: Array(sc).fill(false) }]

  // Normalize award
  let award: number | null = null
  if (typeof raw.award === 'number') {
    award = raw.award
  } else if (typeof raw.award === 'string') {
    const map: Record<string, number> = { Award: 1, Rank: 2, 'No Rank': 3 }
    award = map[raw.award] ?? null
  }

  // Validate params if present
  let params: ValidatedScoringParams | undefined
  if (raw.params) {
    const parsed = ScoringParamsSchema.safeParse(raw.params)
    if (parsed.success) {
      params = parsed.data
    }
    // If invalid, omit — store will use defaults
  }

  return {
    version: 2,
    mode,
    phase: raw.phase ?? 1,
    spend: raw.spend ?? 0,
    nSup: raw.nSup ?? 0,
    award,
    ccy: raw.ccy ?? 'EUR',
    evName: raw.evName ?? '',
    lots,
    sc,
    supNames: raw.supNames ?? Array.from({ length: sc }, (_, i) => `Supplier ${i + 1}`),
    selLot: raw.selLot ?? 0,
    expLot: raw.expLot ?? -1,
    params,
  }
}

// ─── Public API ───

/**
 * Parse and migrate any snapshot to the current version.
 * Returns a validated SnapshotV2 or null if the input is not a valid snapshot.
 */
export function parseSnapshot(raw: unknown): SnapshotV2 | null {
  if (!raw || typeof raw !== 'object') return null

  const obj = raw as Record<string, unknown>

  // Already v2 — validate directly
  if (obj.version === 2) {
    const result = SnapshotV2Schema.safeParse(raw)
    if (result.success) return result.data
    // If validation fails, try migrating as v1 (might have partial v2 shape)
    console.warn('[DT] Snapshot v2 validation failed, attempting migration:', result.error.issues)
  }

  // v1 or unversioned — migrate
  const v1Result = SnapshotV1Schema.safeParse(raw)
  if (v1Result.success) {
    return migrateV1toV2(v1Result.data)
  }

  console.error('[DT] Failed to parse snapshot:', v1Result.error.issues)
  return null
}

/**
 * Create a snapshot from current store state (always at current version).
 */
export function createSnapshot(state: {
  mode: 'standard' | 'guided'
  phase: number
  spend: number
  nSup: number
  award: number | null
  ccy: string
  evName: string
  lots: any[]
  sc: number
  supNames: string[]
  selLot: number
  expLot: number
  params?: ValidatedScoringParams
}): SnapshotV2 {
  return {
    version: CURRENT_SNAPSHOT_VERSION,
    ...state,
    lots: state.lots.map(l => ({
      id: l.id,
      name: l.name,
      unit: l.unit,
      qty: l.qty,
      pref: l.pref,
      intens: l.intens,
      award: l.award ?? 1,
      prices: [...l.prices],
      excl: [...l.excl],
    })),
    params: state.params ? { ...state.params } : undefined,
  }
}

/**
 * Validate ScoringParams independently.
 * Returns validated params or null.
 */
export function validateScoringParams(raw: unknown): ValidatedScoringParams | null {
  const result = ScoringParamsSchema.safeParse(raw)
  return result.success ? result.data : null
}
