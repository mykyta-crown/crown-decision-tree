-- Migration: Expand dt_projects currency options
-- Date: 2026-03-06
-- Purpose: Add more currency options to dt_projects.ccy CHECK constraint

-- Drop old constraint and add new one with expanded currencies
ALTER TABLE dt_projects DROP CONSTRAINT IF EXISTS dt_projects_ccy_check;
ALTER TABLE dt_projects ADD CONSTRAINT dt_projects_ccy_check
  CHECK (ccy IN ('EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN'));
