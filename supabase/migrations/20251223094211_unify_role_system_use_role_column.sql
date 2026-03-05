-- Migration: Unify Role System - Use `role` column as single source of truth
-- Date: 2025-12-23
-- Purpose: Fix inconsistency between `admin` (boolean) and `role` (text) columns
--          by making `role` the primary source and keeping `admin` synchronized
--
-- Context: Currently two separate systems exist:
--   - RLS policies use `private.is_admin()` which checks `admin = true`
--   - Middlewares/API use `profile.role IN ('admin', 'buyer', 'super_buyer')`
--   This caused users with `admin = true` but `role = NULL` to access auctions but not GPTs
--
-- Solution:
--   1. Sync role='admin' for users with admin=true and role=NULL (3 users)
--   2. Update is_admin() function to check role='admin' instead of admin=true
--   3. Add trigger to keep admin column synchronized with role (for backward compatibility)

-- Step 1: Sync data - Set role='admin' for admins with NULL role
UPDATE profiles
SET role = 'admin'
WHERE admin = true
  AND role IS NULL;

-- Step 2: Update is_admin() functions to use role column
-- Replace existing functions (cannot DROP because policies depend on them)
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT profiles.role = 'admin'
    FROM profiles
    WHERE profiles.id = auth.uid()
  );
END;
$$;

COMMENT ON FUNCTION private.is_admin() IS
  'Check if current user has admin role. Uses role column as source of truth.';

-- Recreate is_admin(user_id) to check role='admin'
CREATE OR REPLACE FUNCTION private.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT profiles.role = 'admin'
    FROM profiles
    WHERE profiles.id = user_id
  );
END;
$$;

COMMENT ON FUNCTION private.is_admin(uuid) IS
  'Check if specified user has admin role. Uses role column as source of truth.';

-- Step 3: Create trigger function to keep admin column synchronized with role
CREATE OR REPLACE FUNCTION private.sync_admin_with_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Automatically set admin=true when role='admin'
  IF NEW.role = 'admin' THEN
    NEW.admin := true;
  -- Set admin=false when role is not 'admin'
  ELSIF NEW.role IS DISTINCT FROM 'admin' THEN
    NEW.admin := false;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION private.sync_admin_with_role() IS
  'Trigger function to keep admin column synchronized with role column for backward compatibility';

-- Step 4: Create trigger on profiles table
DROP TRIGGER IF EXISTS sync_admin_with_role_trigger ON profiles;

CREATE TRIGGER sync_admin_with_role_trigger
  BEFORE INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION private.sync_admin_with_role();

COMMENT ON TRIGGER sync_admin_with_role_trigger ON profiles IS
  'Automatically synchronizes admin column with role column to maintain backward compatibility';

-- Step 5: Sync existing data (run the trigger logic on all existing rows)
UPDATE profiles
SET admin = (role = 'admin')
WHERE (admin AND role != 'admin')
   OR (NOT admin AND role = 'admin');

-- Verification query (for manual testing)
-- SELECT id, email, role, admin,
--        CASE
--          WHEN role = 'admin' AND admin = true THEN '✓ Consistent'
--          WHEN role != 'admin' AND admin = false THEN '✓ Consistent'
--          WHEN role IS NULL AND admin = false THEN '✓ Consistent'
--          ELSE '✗ INCONSISTENT'
--        END as status
-- FROM profiles
-- WHERE role IS NOT NULL OR admin = true
-- ORDER BY status DESC, role;
