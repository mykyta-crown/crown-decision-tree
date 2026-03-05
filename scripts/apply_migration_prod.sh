#!/bin/bash
set -e

echo "🔧 Extracting PROD PG_URL..."
PG_URL_PROD=$(grep '^PG_URL=' .env.prod | cut -d'=' -f2 | tr -d '"')

if [ -z "$PG_URL_PROD" ]; then
    echo "❌ PG_URL not found in .env.prod"
    exit 1
fi

echo "✅ PG_URL found"
echo "📊 Hostname: $(echo $PG_URL_PROD | cut -d'@' -f2 | cut -d':' -f1)"

echo ""
echo "🚀 Applying consolidated migration to PROD..."
supabase db push --db-url "$PG_URL_PROD" --include-all

echo ""
echo "✅ Migration applied successfully!"
