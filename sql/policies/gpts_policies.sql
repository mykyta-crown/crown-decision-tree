-- RLS Policies for GPTs feature
-- Description: Policies de sécurité Row Level Security pour les tables GPTs

-- Enable RLS on all tables
ALTER TABLE gpts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gpt_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES FOR: gpts
-- ============================================================================

-- Admin: Full access
CREATE POLICY "Admins can do everything on gpts"
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

-- Users: Read GPTs assigned to them
CREATE POLICY "Users can view GPTs assigned to them"
  ON gpts
  FOR SELECT
  TO authenticated
  USING (
    -- GPT assigné directement à l'utilisateur
    EXISTS (
      SELECT 1 FROM gpt_access
      WHERE gpt_access.gpt_id = gpts.id
      AND gpt_access.user_id = auth.uid()
    )
    OR
    -- GPT assigné à l'entreprise de l'utilisateur
    EXISTS (
      SELECT 1 FROM gpt_access
      JOIN profiles ON profiles.company_id = gpt_access.company_id
      WHERE gpt_access.gpt_id = gpts.id
      AND profiles.id = auth.uid()
    )
  );

-- ============================================================================
-- POLICIES FOR: gpt_access
-- ============================================================================

-- Admin: Full access
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

-- Users: Read their own access
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

-- ============================================================================
-- POLICIES FOR: conversations
-- ============================================================================

-- Users: Full access to their own conversations
CREATE POLICY "Users can manage their conversations"
  ON conversations
  FOR ALL
  TO authenticated
  USING (conversations.user_id = auth.uid())
  WITH CHECK (conversations.user_id = auth.uid());

-- Admin: Read all conversations
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

-- ============================================================================
-- POLICIES FOR: messages
-- ============================================================================

-- Users: Full access to messages in their conversations
CREATE POLICY "Users can manage messages in their conversations"
  ON messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.user_id = auth.uid()
    )
  );

-- Admin: Read all messages
CREATE POLICY "Admins can view all messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- POLICIES FOR: user_credits
-- ============================================================================

-- Users: Read their own credits
CREATE POLICY "Users can view their own credits"
  ON user_credits
  FOR SELECT
  TO authenticated
  USING (user_credits.user_id = auth.uid());

-- Admin: Full access to all credits
CREATE POLICY "Admins can manage all credits"
  ON user_credits
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

-- ============================================================================
-- GRANT EXECUTE ON FUNCTIONS
-- ============================================================================

-- Permettre aux utilisateurs authentifiés d'utiliser les fonctions RPC
GRANT EXECUTE ON FUNCTION deduct_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION add_user_credits TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_credits TO authenticated;

