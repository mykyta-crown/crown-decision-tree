-- Script to verify that webhook cleanup was successful
-- Run this via: psql $PG_URL -f scripts/verify_webhook_cleanup.sql

\echo '========================================='
\echo 'Webhook Cleanup Verification'
\echo '========================================='
\echo ''

\echo '1. Checking for custom webhook triggers (should return 0 rows):'
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_name IN ('insert_bid', 'insert_auction', 'update_auction', 'update_auction_timing', 'insert_users')
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '2. Checking for custom webhook functions (should return 0 rows):'
SELECT p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN ('_call_webhook', 'get_webhook_config', 'trigger_insert_bid', 'trigger_insert_auction', 'trigger_update_auction', 'trigger_insert_users');

\echo ''
\echo '3. Checking for webhook_config table (should return 0 rows):'
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'webhook_config';

\echo ''
\echo '========================================='
\echo 'If all queries above returned 0 rows:'
\echo '✅ Cleanup successful!'
\echo ''
\echo 'Next step:'
\echo 'Configure webhooks via Supabase Dashboard'
\echo 'See WEBHOOK_SETUP_GUIDE.md for instructions'
\echo '========================================='
