#!/bin/bash
set -e

echo "🔧 Extracting PROD PG_URL..."
PG_URL_PROD=$(grep '^PG_URL=' .env.prod | cut -d'=' -f2 | tr -d '"')

if [ -z "$PG_URL_PROD" ]; then
    echo "❌ PG_URL not found in .env.prod"
    exit 1
fi

echo "✅ PG_URL found - Hostname: $(echo $PG_URL_PROD | cut -d'@' -f2 | cut -d':' -f1)"

echo ""
echo "🔨 Marking old migrations as reverted on PROD..."

echo "  - Reverting 20251210085312..."
supabase migration repair --status reverted 20251210085312 --db-url "$PG_URL_PROD"

echo "  - Reverting 20251212170000..."
supabase migration repair --status reverted 20251212170000 --db-url "$PG_URL_PROD"

echo "  - Reverting 20251212170500..."
supabase migration repair --status reverted 20251212170500 --db-url "$PG_URL_PROD"

echo "  - Reverting 20251212171000..."
supabase migration repair --status reverted 20251212171000 --db-url "$PG_URL_PROD"

echo ""
echo "✅ All old migrations marked as reverted!"

echo ""
echo "🚀 Now applying consolidated migration..."
supabase db push --db-url "$PG_URL_PROD" --include-all

echo ""
echo "🎉 PROD migrations fixed successfully!"
