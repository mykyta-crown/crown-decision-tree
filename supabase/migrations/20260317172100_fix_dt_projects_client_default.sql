-- Migration: Fix dt_projects.client default value
-- Date: 2026-03-17
-- Purpose: Remove hardcoded 'Crown' default introduced in initial migration.
--          Client name should default to empty string, not a specific company name.

ALTER TABLE dt_projects
  ALTER COLUMN client SET DEFAULT '';

COMMENT ON COLUMN dt_projects.client IS
  'Client name associated with this project. Empty string when not specified.';
