#!/bin/bash
set -e

echo "🔧 Repairing orphan prebids in PROD..."

# Load PROD environment variables
export SUPABASE_URL=$(grep '^SUPABASE_URL=' .env.prod | cut -d'=' -f2 | tr -d '"')
export SUPABASE_SERVICE_KEY=$(grep '^SUPABASE_ADMIN_KEY=' .env.prod | cut -d'=' -f2 | tr -d '"')
export WEBHOOK_BEARER_TOKEN=$(grep '^WEBHOOK_BEARER_TOKEN=' .env.prod | cut -d'=' -f2 | tr -d '"')
export WEBHOOK_BASE_URL="https://app.crown-procurement.com/api/v1/webhooks"

echo "📊 Environment:"
echo "   SUPABASE_URL: $SUPABASE_URL"
echo "   WEBHOOK_BASE_URL: $WEBHOOK_BASE_URL"
echo ""

# Run repair script
node scripts/repairPrebids.js --since 2025-12-11 --limit 50

echo ""
echo "✅ Repair completed!"
