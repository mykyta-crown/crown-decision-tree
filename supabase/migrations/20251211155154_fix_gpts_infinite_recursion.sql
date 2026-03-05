-- Migration: Fix Infinite Recursion in GPTs RLS Policy
-- Date: 2025-12-11
-- Purpose: Replace recursive policy with security definer function to prevent infinite recursion

-- Drop existing policy that causes recursion
DROP POLICY IF EXISTS "Users can view GPTs assigned to them" ON gpts;

-- Create a security definer function to check GPT access
-- This function runs with elevated privileges and doesn't trigger RLS recursively
CREATE OR REPLACE FUNCTION user_can_access_gpt(gpt_id uuid, user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user has direct access
  IF EXISTS (
    SELECT 1 FROM gpt_access
    WHERE gpt_access.gpt_id = $1
    AND gpt_access.user_id = $2
  ) THEN
    RETURN true;
  END IF;

  -- Check if user has company-based access
  IF EXISTS (
    SELECT 1 FROM gpt_access ga
    JOIN profiles p ON p.company_id = ga.company_id
    WHERE ga.gpt_id = $1
    AND p.id = $2
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Users can view GPTs assigned to them"
  ON gpts
  FOR SELECT
  TO authenticated
  USING (
    user_can_access_gpt(id, auth.uid())
  );

-- Add comment for documentation
COMMENT ON FUNCTION user_can_access_gpt IS
  'Security definer function to check if a user has access to a GPT without triggering RLS recursion';
