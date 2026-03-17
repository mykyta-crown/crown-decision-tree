-- Migration: Add dt_global_params — single global row for scoring + builder params
-- Date: 2026-03-17
-- Purpose: Replace per-user dt_scoring_params with a single global config row.
--          All users read from this table; only admins can write.
--          When fields are NULL the frontend falls back to hardcoded TS defaults.

CREATE TABLE IF NOT EXISTS dt_global_params (
  id             integer PRIMARY KEY DEFAULT 1,
  bases          jsonb,
  savings        jsonb,
  matrix         jsonb,
  builder_params jsonb,
  updated_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at     timestamptz NOT NULL DEFAULT now(),
  -- Enforce single-row constraint
  CONSTRAINT dt_global_params_single_row CHECK (id = 1)
);

-- Auto-update updated_at on row change
CREATE TRIGGER dt_global_params_updated_at
  BEFORE UPDATE ON dt_global_params
  FOR EACH ROW
  EXECUTE FUNCTION dt_set_updated_at();

-- Seed the single row (NULL fields = use TS defaults until an admin customises)
INSERT INTO dt_global_params (id) VALUES (1)
  ON CONFLICT (id) DO NOTHING;

-- ── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE dt_global_params ENABLE ROW LEVEL SECURITY;

-- Any authenticated buyer/admin can READ
CREATE POLICY dt_global_params_select ON dt_global_params
  FOR SELECT USING (dt_has_access());

-- Only admins can INSERT (shouldn't happen after seed, but safe)
CREATE POLICY dt_global_params_insert ON dt_global_params
  FOR INSERT WITH CHECK (dt_is_admin());

-- Only admins can UPDATE
CREATE POLICY dt_global_params_update ON dt_global_params
  FOR UPDATE USING (dt_is_admin());

COMMENT ON TABLE dt_global_params IS
  'Single-row global config for the Decision Tree scoring engine and builder params.
   All platform users read from here. Only admins can write.
   NULL fields fall back to hardcoded TypeScript defaults in scoring-engine.ts.';
