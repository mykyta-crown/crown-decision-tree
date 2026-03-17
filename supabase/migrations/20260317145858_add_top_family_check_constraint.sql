-- Migration: Add CHECK constraint on dt_projects.top_family
-- Date: 2026-03-17
-- Purpose: Ensure top_family only contains valid auction family values (or NULL)

ALTER TABLE dt_projects
  ADD CONSTRAINT dt_projects_top_family_check
  CHECK (
    top_family IS NULL OR top_family IN (
      'English',
      'Dutch',
      'Japanese',
      'Sealed Bid',
      'Double Scenario',
      'Traditional'
    )
  );

COMMENT ON COLUMN dt_projects.top_family IS
  'Best-matching auction family computed by the scoring engine. NULL until at least one lot is scored.';
