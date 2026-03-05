-- Migration: Webhook System Setup
-- Date: 2025-12-10
-- Purpose: Configure webhook system for Crown auction platform
--
-- This migration consolidates the webhook system configuration.
-- Webhooks are managed via Supabase Dashboard, not via database triggers.
--
-- REPLACES (consolidated from):
--   - 20251210085312_update_webhooks_for_dev.sql
--   - 20251212170000_fix_insert_bid_webhook_payload.sql
--   - 20251212170500_webhook_config_table.sql
--   - 20251212171000_fix_webhook_function_for_pg_net.sql
--   - 20251212180000_fix_insert_bid_trigger.sql
--   - 20251213120000_restore_webhook_system.sql
--
-- Final State: No custom webhook triggers or functions in database
--               All webhooks configured via Supabase Dashboard
--               See docs/WEBHOOK_SETUP_GUIDE.md for configuration

-- ============================================
-- Clean up any existing custom webhook system
-- ============================================

-- Drop custom webhook triggers (if they exist from previous attempts)
DROP TRIGGER IF EXISTS "insert_bid" ON "public"."bids";
DROP TRIGGER IF EXISTS "insert_auction" ON "public"."auctions";
DROP TRIGGER IF EXISTS "update_auction" ON "public"."auctions";
DROP TRIGGER IF EXISTS "update_auction_timing" ON "public"."auctions";
DROP TRIGGER IF EXISTS "insert_users" ON "auth"."users";

-- Drop custom webhook trigger functions
DROP FUNCTION IF EXISTS trigger_insert_bid();
DROP FUNCTION IF EXISTS trigger_insert_auction();
DROP FUNCTION IF EXISTS trigger_update_auction();
DROP FUNCTION IF EXISTS trigger_insert_users();

-- Drop webhook helper functions
DROP FUNCTION IF EXISTS _call_webhook(TEXT, JSONB);
DROP FUNCTION IF EXISTS get_webhook_config(TEXT);

-- Drop webhook config table (if exists)
DROP TABLE IF EXISTS public.webhook_config;

-- ============================================
-- Summary
-- ============================================
-- ✅ All custom webhook triggers and functions have been removed
-- ✅ Database is ready for Supabase Dashboard webhooks
--
-- NEXT STEPS REQUIRED:
-- Configure webhooks via Supabase Dashboard (see docs/WEBHOOK_SETUP_GUIDE.md):
--
-- 1. insert_bid (Dutch prebid scheduling)
--    Table: public.bids | Event: INSERT
--    URL: https://your-domain.com/api/v1/webhooks/bids/insert
--    Payload: {"record": {{ record }}}
--
-- 2. insert_auction (Japanese round scheduling)
--    Table: public.auctions | Event: INSERT
--    URL: https://your-domain.com/api/v1/webhooks/auctions/insert
--    Payload: {"record": {{ record }}}
--
-- 3. update_auction (Auction state changes)
--    Table: public.auctions | Event: UPDATE
--    URL: https://your-domain.com/api/v1/webhooks/auctions/update
--    Payload: {"record": {{ record }}, "old_record": {{ old_record }}}
--
-- 4. insert_users (Profile creation)
--    Table: auth.users | Event: INSERT
--    URL: https://your-domain.com/api/v1/webhooks/users/insert
--    Payload: {"record": {{ record }}}

COMMENT ON DATABASE postgres IS 'Webhooks configured via Supabase Dashboard - see docs/WEBHOOK_SETUP_GUIDE.md';
