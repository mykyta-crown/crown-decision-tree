-- Migration: Add builder_params column to dt_scoring_params
-- Date: 2026-03-15
-- Purpose: Persist architect builder parameters (timing, templates per auction type)
--          alongside existing scoring params, scoped per admin user.

ALTER TABLE dt_scoring_params
  ADD COLUMN IF NOT EXISTS builder_params jsonb;

COMMENT ON COLUMN dt_scoring_params.builder_params IS
  'Builder-phase parameters (timing defaults, text templates) per auction type — used by the Decision Tree Architect module to pre-fill builder lots';
