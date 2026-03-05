-- Migration: Add Missing RLS Policies for gpt_access
-- Date: 2025-12-11
-- Purpose: Enable admins to manage GPT access assignments and users to view their access

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can manage gpt_access" ON gpt_access;
DROP POLICY IF EXISTS "Users can view their gpt_access" ON gpt_access;

-- Policy: Admins have full access to gpt_access table
CREATE POLICY "Admins can manage gpt_access"
  ON gpt_access
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

-- Policy: Users can view their own access records
CREATE POLICY "Users can view their gpt_access"
  ON gpt_access
  FOR SELECT
  TO authenticated
  USING (
    gpt_access.user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.company_id = gpt_access.company_id
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Admins can manage gpt_access" ON gpt_access IS
  'Allows admins to insert, update, delete, and select gpt_access records';
COMMENT ON POLICY "Users can view their gpt_access" ON gpt_access IS
  'Allows users to view their own access records and company-wide access records';
