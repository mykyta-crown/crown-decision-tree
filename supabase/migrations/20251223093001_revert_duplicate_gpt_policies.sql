-- Migration: Revert Duplicate GPT Policies
-- Date: 2025-12-23
-- Purpose: Remove duplicate policies created by 20251222171153 and 20251222173052
--          and restore clean state with original policies only
-- Reverts: 20251222171153_fix_gpts_access_for_buyers.sql
--          20251222173052_fix_gpt_policies_buyers_only_assigned.sql
--
-- Context: The original issue was a NULL role in profiles table, not RLS policies.
--          These migrations created duplicate policies that need to be cleaned up.

-- Drop duplicate policies created by the incorrect migrations
DROP POLICY IF EXISTS "Admins can view all GPTs" ON gpts;
DROP POLICY IF EXISTS "Admins can manage GPTs" ON gpts;

-- Keep the original policies:
-- 1. "Admins can do everything on gpts" (original admin policy)
-- 2. "Users can view assigned GPTs" (created by 20251211155154, uses user_can_access_gpt function)

-- Verify the remaining policies are correct
DO $$
BEGIN
  -- Ensure "Admins can do everything on gpts" exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gpts'
    AND policyname = 'Admins can do everything on gpts'
  ) THEN
    -- Recreate it if missing
    EXECUTE 'CREATE POLICY "Admins can do everything on gpts"
      ON gpts
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = ''admin''
        )
      )';
  END IF;

  -- Ensure "Users can view assigned GPTs" exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'gpts'
    AND policyname = 'Users can view assigned GPTs'
  ) THEN
    -- Recreate it if missing
    EXECUTE 'CREATE POLICY "Users can view assigned GPTs"
      ON gpts
      FOR SELECT
      TO authenticated
      USING (user_can_access_gpt(id, auth.uid()))';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON POLICY "Admins can do everything on gpts" ON gpts IS
  'Allows admins to perform all operations (SELECT, INSERT, UPDATE, DELETE) on GPTs';
COMMENT ON POLICY "Users can view assigned GPTs" ON gpts IS
  'Allows buyers and regular users to view only GPTs they have been assigned to via gpt_access table using the user_can_access_gpt security definer function';
