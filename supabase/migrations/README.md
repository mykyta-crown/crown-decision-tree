# Supabase Migrations - Crown Platform

## Migration History

This directory contains all database migrations for the Crown e-auction platform.

## Recent Consolidation (2025-12-13)

The webhook-related migrations were consolidated to clean up the migration history.

### Consolidated Migration

**File**: `20251210090000_webhook_system_setup.sql`

This migration consolidates and replaces 6 previous webhook migrations:

- `20251210085312_update_webhooks_for_dev.sql` (removed triggers)
- `20251212170000_fix_insert_bid_webhook_payload.sql` (attempted GUCs approach)
- `20251212170500_webhook_config_table.sql` (created webhook_config table)
- `20251212171000_fix_webhook_function_for_pg_net.sql` (attempted pg_net approach)
- `20251212180000_fix_insert_bid_trigger.sql` (attempted trigger fix)
- `20251213120000_restore_webhook_system.sql` (cleanup of all above)

**Why consolidation?**

- The 6 original migrations represented debugging iterations, not stable versioning
- They performed operations that cancelled each other out
- Consolidation provides a clean, understandable history

**Final State**:

- No custom webhook triggers in database
- No custom webhook functions
- Webhooks are configured via Supabase Dashboard
- See `docs/WEBHOOK_SETUP_GUIDE.md` for configuration

### Current Migration List

```
20251210090000_webhook_system_setup.sql           ← Consolidated webhook setup
20251210173000_add_gpt_creator_protection.sql    ← GPT features
20251211155154_fix_gpts_infinite_recursion.sql   ← GPT bug fix
20251211155454_add_gpt_access_policies.sql       ← GPT RLS policies
20251211160349_add_gpt_access_unique_constraints.sql ← GPT constraints
```

## Migration Best Practices

1. **Always create migrations for schema changes** - Never modify the database directly
2. **Test on DEV first** - Always apply migrations to DEV before PROD
3. **Use idempotent operations** - Use `IF NOT EXISTS`, `IF EXISTS`, etc.
4. **Document breaking changes** - Add comments explaining the purpose
5. **Keep migrations small** - One logical change per migration
6. **Never delete applied migrations** - Use repair/consolidation if needed

## Environments

| Environment | Project Ref          | Status                             |
| ----------- | -------------------- | ---------------------------------- |
| **DEV**     | qzxnlhzlilysiklmbspn | ✅ Consolidated migration applied  |
| **PROD**    | jgwbqdpxygwsnswtnrxf | ⏳ Pending (will apply via Vercel) |

## Applying Migrations

### DEV

```bash
supabase link --project-ref qzxnlhzlilysiklmbspn
supabase db push
```

### PROD

Migrations are applied automatically via Vercel during deployment:

```bash
npm run migrate  # Runs: supabase db push --db-url "$PG_URL"
```

## Verifying Migrations

```bash
# Check migration status
supabase migration list

# Verify database state
psql "$PG_URL" -f scripts/verify_webhook_cleanup.sql
```

## Troubleshooting

### "Remote migration not found locally"

If a migration exists on remote but not locally:

```bash
# Option 1: Pull missing migration
supabase db pull

# Option 2: Mark as reverted (if migration was consolidated)
supabase migration repair --status reverted <migration_id>
```

### "Migration already applied"

This is normal - Supabase tracks applied migrations. Use `supabase migration list` to see status.

## Documentation

- **Webhook Setup**: `docs/WEBHOOK_SETUP_GUIDE.md`
- **Database Schema**: `docs/DATABASE.md`
- **Migration Policy**: `CLAUDE.md` (section "Database Migrations Policy")

---

**Last Updated**: 2025-12-13
**Consolidated By**: Migration history cleanup
