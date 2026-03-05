-- Migration: Add GPT Creator Protection Trigger
-- Date: 2025-12-10
-- Purpose: Prevent GPT creators from being removed from access list

-- Function to prevent deletion of creator's access
CREATE OR REPLACE FUNCTION prevent_creator_access_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the row being deleted belongs to the GPT creator
  IF OLD.user_id IS NOT NULL AND OLD.user_id = (
    SELECT created_by FROM gpts WHERE id = OLD.gpt_id
  ) THEN
    RAISE EXCEPTION 'Cannot remove GPT creator from access list. Creator must always maintain access to their GPT.';
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before DELETE on gpt_access table
DROP TRIGGER IF EXISTS prevent_creator_deletion_trigger ON gpt_access;

CREATE TRIGGER prevent_creator_deletion_trigger
  BEFORE DELETE ON gpt_access
  FOR EACH ROW
  EXECUTE FUNCTION prevent_creator_access_deletion();

-- Add comment for documentation
COMMENT ON FUNCTION prevent_creator_access_deletion() IS
  'Prevents deletion of GPT creator access. Ensures creators always maintain access to their GPTs.';
COMMENT ON TRIGGER prevent_creator_deletion_trigger ON gpt_access IS
  'Protects GPT creator access from being deleted.';
