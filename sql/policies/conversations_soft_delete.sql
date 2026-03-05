-- RLS Policies for Soft Delete on Conversations
-- Description: Policies de sécurité pour le soft delete des conversations

-- ============================================================================
-- POLICIES UPDATE FOR: conversations
-- ============================================================================

-- Drop existing policy to recreate with deleted_at filter
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can manage their conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

-- Policy for SELECT: Exclude soft-deleted conversations
CREATE POLICY "Users can view their own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() 
    AND deleted_at IS NULL
  );

-- Policy for INSERT: Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for UPDATE: Users can update and soft delete their own conversations
CREATE POLICY "Users can update their own conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin: Read all conversations (including soft-deleted)
-- Keep existing admin policy
CREATE POLICY "Admins can view all conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Add comment for clarity
COMMENT ON COLUMN conversations.deleted_at IS 'Soft delete timestamp. If set, conversation is considered deleted but can be restored.';





