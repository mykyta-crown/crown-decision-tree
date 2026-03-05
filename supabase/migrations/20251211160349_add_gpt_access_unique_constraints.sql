-- Migration: Add Unique Constraints to gpt_access
-- Date: 2025-12-11
-- Purpose: Add proper unique constraints to prevent duplicate assignments

-- Add unique constraint for user assignments
-- Ensures a user can only be assigned to a GPT once
CREATE UNIQUE INDEX IF NOT EXISTS gpt_access_user_unique
ON gpt_access (gpt_id, user_id)
WHERE user_id IS NOT NULL;

-- Add unique constraint for company assignments
-- Ensures a company can only be assigned to a GPT once
CREATE UNIQUE INDEX IF NOT EXISTS gpt_access_company_unique
ON gpt_access (gpt_id, company_id)
WHERE company_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON INDEX gpt_access_user_unique IS
  'Ensures a user can only be assigned to a GPT once';
COMMENT ON INDEX gpt_access_company_unique IS
  'Ensures a company can only be assigned to a GPT once';
