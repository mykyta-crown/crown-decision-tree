-- Migration: Fix GPTs Access for Buyers and Admins
-- Date: 2025-12-22
-- Purpose: Allow only admins to view all GPTs, buyers and users see only assigned ones

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view GPTs assigned to them" ON gpts;
DROP POLICY IF EXISTS "Admins and buyers can view all GPTs" ON gpts;
DROP POLICY IF EXISTS "Users can view assigned GPTs" ON gpts;
DROP POLICY IF EXISTS "Admins can manage GPTs" ON gpts;

-- Policy 1: Admins can view all GPTs
CREATE POLICY "Admins can view all GPTs"
  ON gpts
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy 2: Buyers and users can view GPTs assigned to them
CREATE POLICY "Users can view assigned GPTs"
  ON gpts
  FOR SELECT
  TO authenticated
  USING (
    user_can_access_gpt(id, auth.uid())
  );

-- Policy 3: Admins can manage all GPTs
CREATE POLICY "Admins can manage GPTs"
  ON gpts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Admins can view all GPTs" ON gpts IS
  'Allows admins to view all available GPTs';
COMMENT ON POLICY "Users can view assigned GPTs" ON gpts IS
  'Allows buyers and regular users to view only GPTs they have been assigned to via gpt_access table';
COMMENT ON POLICY "Admins can manage GPTs" ON gpts IS
  'Allows admins to create, update, and delete GPTs';
