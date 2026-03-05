-- Temporary fix: Correct GPT policies to restrict buyers to assigned GPTs only
-- This corrects the previously applied migration

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Admins and buyers can view all GPTs" ON gpts;

-- Ensure correct policies exist
DROP POLICY IF EXISTS "Admins can view all GPTs" ON gpts;
DROP POLICY IF EXISTS "Users can view assigned GPTs" ON gpts;

-- Policy 1: Only admins can view all GPTs
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

-- Policy 2: Buyers and users can view only assigned GPTs
CREATE POLICY "Users can view assigned GPTs"
  ON gpts
  FOR SELECT
  TO authenticated
  USING (
    user_can_access_gpt(id, auth.uid())
  );
