-- Migration: Decision Tree tables
-- Date: 2026-03-06
-- Purpose: Create dt_projects and dt_scoring_params tables for the Decision Tree module
-- Access: admin, buyer, super_buyer only (not seller)

-- ══════════════════════════════════════════════════════════════
-- TABLE: dt_projects
-- Stores Decision Tree scenario projects with full state as JSONB
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dt_projects (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id    uuid REFERENCES companies(id) ON DELETE SET NULL,
  name          text NOT NULL DEFAULT 'Untitled',
  owner_name    text DEFAULT '',
  client        text DEFAULT 'Crown',
  status        text NOT NULL DEFAULT 'Draft'
                  CHECK (status IN ('Draft', 'In progress', 'Recommended', 'eAuction', 'Archived')),
  baseline      numeric DEFAULT 0,
  ccy           text DEFAULT 'EUR'
                  CHECK (ccy IN ('EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN')),
  category      text NOT NULL DEFAULT 'Real'
                  CHECK (category IN ('Real', 'Training', 'Test')),
  favorite      boolean NOT NULL DEFAULT false,
  top_family    text,
  state         jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast lookups by user and company
CREATE INDEX IF NOT EXISTS idx_dt_projects_user_id ON dt_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_dt_projects_company_id ON dt_projects(company_id);
CREATE INDEX IF NOT EXISTS idx_dt_projects_status ON dt_projects(status);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION dt_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER dt_projects_updated_at
  BEFORE UPDATE ON dt_projects
  FOR EACH ROW
  EXECUTE FUNCTION dt_set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- TABLE: dt_scoring_params
-- Custom scoring parameters per user (bases, savings, matrix)
-- Falls back to app defaults if no row exists
-- ══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS dt_scoring_params (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bases         jsonb,
  savings       jsonb,
  matrix        jsonb,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER dt_scoring_params_updated_at
  BEFORE UPDATE ON dt_scoring_params
  FOR EACH ROW
  EXECUTE FUNCTION dt_set_updated_at();

-- ══════════════════════════════════════════════════════════════
-- RLS: Only admin, buyer, super_buyer can access (not seller)
-- ══════════════════════════════════════════════════════════════

ALTER TABLE dt_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE dt_scoring_params ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user has DT access (not a seller)
CREATE OR REPLACE FUNCTION dt_has_access()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'buyer', 'super_buyer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- dt_projects policies
CREATE POLICY dt_projects_select ON dt_projects
  FOR SELECT USING (
    dt_has_access()
    AND (user_id = auth.uid() OR company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    ))
  );

CREATE POLICY dt_projects_insert ON dt_projects
  FOR INSERT WITH CHECK (
    dt_has_access()
    AND user_id = auth.uid()
  );

CREATE POLICY dt_projects_update ON dt_projects
  FOR UPDATE USING (
    dt_has_access()
    AND user_id = auth.uid()
  );

CREATE POLICY dt_projects_delete ON dt_projects
  FOR DELETE USING (
    dt_has_access()
    AND user_id = auth.uid()
  );

-- dt_scoring_params policies
CREATE POLICY dt_scoring_params_select ON dt_scoring_params
  FOR SELECT USING (
    dt_has_access()
    AND user_id = auth.uid()
  );

CREATE POLICY dt_scoring_params_insert ON dt_scoring_params
  FOR INSERT WITH CHECK (
    dt_has_access()
    AND user_id = auth.uid()
  );

CREATE POLICY dt_scoring_params_update ON dt_scoring_params
  FOR UPDATE USING (
    dt_has_access()
    AND user_id = auth.uid()
  );

CREATE POLICY dt_scoring_params_delete ON dt_scoring_params
  FOR DELETE USING (
    dt_has_access()
    AND user_id = auth.uid()
  );

-- ══════════════════════════════════════════════════════════════
-- COMMENTS
-- ══════════════════════════════════════════════════════════════

COMMENT ON TABLE dt_projects IS 'Decision Tree scenario projects';
COMMENT ON TABLE dt_scoring_params IS 'Custom scoring engine parameters per user';
COMMENT ON FUNCTION dt_has_access() IS 'Returns true if current user is admin, buyer or super_buyer (not seller)';
