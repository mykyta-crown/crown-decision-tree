-- Migration: Fix dt_projects visibility for admins
-- Date: 2026-03-09
-- Purpose: Admins see ALL projects, buyers see only their own (+ company), suppliers see nothing
-- Also: admins can update/delete any project

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION dt_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Drop existing policies
DROP POLICY IF EXISTS dt_projects_select ON dt_projects;
DROP POLICY IF EXISTS dt_projects_update ON dt_projects;
DROP POLICY IF EXISTS dt_projects_delete ON dt_projects;

-- SELECT: admins see all, buyers/super_buyers see own + company
CREATE POLICY dt_projects_select ON dt_projects
  FOR SELECT USING (
    dt_has_access()
    AND (
      dt_is_admin()
      OR user_id = auth.uid()
      OR company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid() AND company_id IS NOT NULL
      )
    )
  );

-- UPDATE: admins can update any, buyers only their own
CREATE POLICY dt_projects_update ON dt_projects
  FOR UPDATE USING (
    dt_has_access()
    AND (dt_is_admin() OR user_id = auth.uid())
  );

-- DELETE: admins can delete any, buyers only their own
CREATE POLICY dt_projects_delete ON dt_projects
  FOR DELETE USING (
    dt_has_access()
    AND (dt_is_admin() OR user_id = auth.uid())
  );

COMMENT ON FUNCTION dt_is_admin() IS 'Returns true if current user has admin role';
