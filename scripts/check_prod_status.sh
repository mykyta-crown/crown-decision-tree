#!/bin/bash
set -e

PG_URL_PROD=$(grep '^PG_URL=' .env.prod | cut -d'=' -f2 | tr -d '"')

echo "📊 PROD Migration Status:"
echo "========================="
supabase migration list --db-url "$PG_URL_PROD" 2>&1 | grep -E "Local|202512" || true

echo ""
echo "🔍 Verifying database state..."
/opt/homebrew/opt/libpq/bin/psql "$PG_URL_PROD" << 'EOF'
SELECT
  'Webhook Triggers' AS check_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END as status
FROM information_schema.triggers
WHERE trigger_name IN ('insert_bid', 'insert_auction', 'update_auction', 'update_auction_timing', 'insert_users')
UNION ALL
SELECT
  'Webhook Functions' AS check_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname IN ('_call_webhook', 'get_webhook_config', 'trigger_insert_bid')
UNION ALL
SELECT
  'webhook_config Table' AS check_type,
  COUNT(*) as count,
  CASE WHEN COUNT(*) = 0 THEN '✅' ELSE '❌' END as status
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'webhook_config';
EOF
