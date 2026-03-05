#!/bin/bash
set -e

mkdir -p backups

PG_URL=$(grep '^PG_URL=' .env | cut -d'=' -f2 | tr -d '"')
BACKUP_FILE="backups/dev_schema_backup_$(date +%Y%m%d_%H%M%S).sql"

/opt/homebrew/opt/libpq/bin/pg_dump "$PG_URL" --schema-only --no-owner --no-privileges > "$BACKUP_FILE"

echo "✅ Backup created: $BACKUP_FILE"
ls -lh "$BACKUP_FILE"
