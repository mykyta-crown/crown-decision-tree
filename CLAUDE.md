# Crown - E-Auction Platform

## Project Overview

Crown is a B2B e-auction platform built with:

- **Frontend**: Nuxt 3 (Vue 3) with TypeScript
- **Backend**: Nuxt server routes (Nitro)
- **Database**: Supabase (PostgreSQL)
- **Scheduling**: Google Cloud Tasks
- **Hosting**: Vercel

## Key Documentation

- **Database Schema**: See `docs/DATABASE.md` for complete schema, RLS policies, triggers, and business logic
- **API Reference**: See `docs/API.md` for all server endpoints, webhooks, Cloud Tasks handlers, and utilities
- **Bot Behavior**: See `docs/BOT_BEHAVIOR.md` for training bot logic per auction type
- **Scripts**: See `docs/SCRIPTS.md` for utility scripts (auction ops, migrations, debugging)
- **Browser Testing**: See `docs/BROWSER_TESTING.md` for auth flow, test credentials, and navigation
- **Frontend Architecture**: See `docs/FRONTEND.md` for composables, components structure, and data flow
- **SQL Reference**: See `docs/SQL.md` for functions, triggers, policies, and price/rank calculations
- **Error Monitoring**: See `docs/SENTRY.md` for Sentry configuration and usage

## Auction Types

### ⚠️ CRITICAL: Database Type Values

**The database `type` field does NOT match the UI display names!**

| UI Name    | Database `type` value | Description                                |
| ---------- | --------------------- | ------------------------------------------ |
| English    | `reverse`             | Price descends through competitive bidding |
| Sealed Bid | `sealed-bid`          | Single blind bid submission                |
| Dutch      | `dutch`               | Price auto-decreases, first to accept wins |
| Japanese   | `japanese`            | Price ascends, sellers exit when too high  |

**NEVER write `auction.type === 'english'`** - this value does not exist in the database!

```javascript
// ❌ WRONG - 'english' type does not exist
if (auction.type === 'english') { ... }

// ✅ CORRECT - English auctions use 'reverse' type
if (auction.type === 'reverse') { ... }
```

**Exception**: The Trainings page converts types for display purposes:

```javascript
// In pages/trainings/index.vue - type is converted for UI
return auction.type === 'reverse' ? 'english' : auction.type
```

### Dutch Auction

- Price **descends** over time (starts high, goes low)
- First bidder at current price wins
- Supports **prebids**: scheduled bids executed automatically via Cloud Tasks
- Queue: `BidWatchQueue` → `/api/v1/dutch/auto_bid`

### Japanese Auction

- Price **ascends** over time (starts low, goes high)
- Sellers must confirm each round or exit
- Last remaining seller wins
- Queue: `JaponeseRoundHandler` → `/api/v1/japanese/round_handler`

### English (Reverse) Auction

- Database type: `reverse`
- Price **descends** through competitive bidding
- Bidders compete by lowering their price
- Supports overtime extensions when bids placed near end

## Important Conventions

### Seller Identification

Sellers are identified by **email** (not user ID) throughout:

- `auctions_sellers.seller_email`
- `supplies_sellers.seller_email`
- `bids.seller_email`

### Cloud Tasks

Dutch prebids store their Cloud Task reference in `bids.cloud_task`:

```
projects/crown-476614/locations/europe-west1/queues/BidWatchQueue/tasks/{TASK_ID}
```

### Key Files

- `server/utils/enqueuer.js` - Cloud Tasks creation/deletion
- `server/utils/dutch/helpers.js` - Dutch price calculations
- `server/utils/dutch/addPreBidToScheduler.js` - Prebid scheduling
- `server/api/v1/dutch/auto_bid.js` - Prebid execution endpoint
- `server/api/v1/japanese/round_handler.js` - Japanese round handler

## Environment

- **GCP Project**: `crown-476614`
- **GCP Location**: `europe-west1`
- **Supabase PROD**: `jgwbqdpxygwsnswtnrxf`
- **Supabase DEV**: `qzxnlhzlilysiklmbspn`
- **Production**: `app.crown-procurement.com`
- **Dev**: `dev.crown.ovh`

## Supabase Environment Management

### Database Environments

We have **two Supabase projects**:

| Environment | Project Ref            | URL                                        | Purpose             |
| ----------- | ---------------------- | ------------------------------------------ | ------------------- |
| **PROD**    | `jgwbqdpxygwsnswtnrxf` | `https://jgwbqdpxygwsnswtnrxf.supabase.co` | Production database |
| **DEV**     | `qzxnlhzlilysiklmbspn` | `https://qzxnlhzlilysiklmbspn.supabase.co` | Development/testing |

### Switching Between Environments

The Supabase CLI links to one project at a time. Use these commands to switch:

```bash
# Link to DEV (for local development)
supabase link --project-ref qzxnlhzlilysiklmbspn

# Link to PROD (for production deployments)
supabase link --project-ref jgwbqdpxygwsnswtnrxf

# Check which project is currently linked
cat supabase/.branches/_current_branch 2>/dev/null || supabase migration list
```

### Checking Migration Status

```bash
# View local vs remote migration status
supabase migration list

# Output example:
#    Local          | Remote         | Time (UTC)
#   ----------------|----------------|---------------------
#    20251210085312 | 20251210085312 | 2025-12-10 08:53:12 ✅
#    20251210173000 | 20251210173000 | 2025-12-10 17:30:00 ✅
```

**Status Indicators:**

- ✅ Both columns filled = Migration synced
- ⚠️ Local only = Not yet pushed to remote
- ⚠️ Remote only = Local missing migration (pull or repair needed)

### Pushing Migrations

```bash
# Push to currently linked project
supabase db push

# Push with explicit database URL (useful for CI/CD)
supabase db push --db-url "$PG_URL"
```

**⚠️ IMPORTANT:** Vercel uses `npm run migrate` which runs:

```bash
npx supabase db push --db-url "$PG_URL"
```

This uses the `PG_URL` environment variable, **not** the linked project.

### Repairing Migration History

If migrations are out of sync:

```bash
# Mark remote migration as reverted (if migration doesn't exist locally)
supabase migration repair --status reverted 20251210162541

# Mark remote migration as applied (if migration already exists on remote)
supabase migration repair --status applied 20251210082328
```

### Local Development Setup

**Option 1: Use DEV database (Recommended)**

```bash
# 1. Link to DEV
supabase link --project-ref qzxnlhzlilysiklmbspn

# 2. Update .env to point to DEV
SUPABASE_URL=https://qzxnlhzlilysiklmbspn.supabase.co
SUPABASE_ANON_KEY=<dev_anon_key>
PG_URL=postgresql://postgres:<password>@db.qzxnlhzlilysiklmbspn.supabase.co:5432/postgres

# 3. Run migrations
npm run migrate
```

**Option 2: Use Supabase Local (Docker)**

```bash
# Start local Supabase
supabase start

# This creates a local database at:
# postgresql://postgres:postgres@localhost:54322/postgres
```

### Environment Variables

Ensure your `.env` matches your target environment:

**For DEV:**

```bash
SUPABASE_URL=https://qzxnlhzlilysiklmbspn.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # DEV anon key
PG_URL=postgresql://postgres:<dev_password>@db.qzxnlhzlilysiklmbspn.supabase.co:5432/postgres
```

**For PROD:**

```bash
SUPABASE_URL=https://jgwbqdpxygwsnswtnrxf.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...  # PROD anon key
PG_URL=postgresql://postgres:<prod_password>@db.jgwbqdpxygwsnswtnrxf.supabase.co:5432/postgres
```

### Common Issues

**Issue: "Remote migration versions not found in local migrations directory"**

```bash
# Solution 1: Pull missing migrations
supabase db pull

# Solution 2: Mark remote migration as reverted
supabase migration repair --status reverted <migration_id>
```

**Issue: "Connection refused" when pushing migrations**

- Port 5432 may be blocked locally
- This is OK - Vercel can connect during builds
- Test migrations work by checking `supabase migration list`

**Issue: CLI connects to wrong database**

```bash
# Verify which project is linked
supabase migration list

# If wrong, re-link to correct project
supabase link --project-ref <correct_project_ref>
```

### Best Practices

1. **Always link to DEV for local development**
2. **Never push migrations directly to PROD** - let Vercel handle it via `npm run migrate`
3. **Test migrations on DEV first** before merging to main branch
4. **Keep migration files small and focused** - avoid large schema dumps
5. **Use `CREATE IF NOT EXISTS`** for idempotent migrations
6. **Document breaking changes** in migration comments

### Migration Workflow

```bash
# 1. Create new migration
supabase migration new add_feature_x

# 2. Write SQL in supabase/migrations/<timestamp>_add_feature_x.sql

# 3. Link to DEV and test
supabase link --project-ref qzxnlhzlilysiklmbspn
supabase db push

# 4. Verify migration applied
supabase migration list

# 5. Commit and push to git
git add supabase/migrations/
git commit -m "feat: add feature x migration"
git push origin dev

# 6. Vercel will automatically run migrations on PROD during build
```

### Testing Database Changes with SQL Queries

When you need to test database updates, verify migrations, or inspect data, you have two options:

#### Option 1: PostgreSQL CLI (`psql`) - Recommended for Quick Tests

**Setup** (already installed via Homebrew):

```bash
# psql is available at:
/opt/homebrew/opt/libpq/bin/psql

# Or add to PATH permanently:
echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
```

**Usage**:

```bash
# Connect to DEV database
/opt/homebrew/opt/libpq/bin/psql "postgresql://postgres:<password>@db.qzxnlhzlilysiklmbspn.supabase.co:5432/postgres" -c "SELECT COUNT(*) FROM auctions;"

# Or use PG_URL from .env
PG_URL=$(grep "^PG_URL=" .env | cut -d'=' -f2 | tr -d '"')
/opt/homebrew/opt/libpq/bin/psql "$PG_URL" -c "YOUR SQL QUERY"

# Execute SQL from file
/opt/homebrew/opt/libpq/bin/psql "$PG_URL" -f scripts/your_query.sql

# Interactive mode
/opt/homebrew/opt/libpq/bin/psql "$PG_URL"
```

**Example - Verify webhook cleanup**:

```bash
/opt/homebrew/opt/libpq/bin/psql "$PG_URL" -c "
SELECT COUNT(*) as webhook_triggers
FROM information_schema.triggers
WHERE trigger_name IN ('insert_bid', 'insert_auction');"
```

#### Option 2: MCP Supabase Tools - Preferred for Production Safety

**⚠️ IMPORTANT**: MCP Supabase tools go through Supabase APIs, providing better safety and logging.

**Available MCP Tools**:

- `mcp__supabase__execute_sql` - Execute read-only queries
- `mcp__supabase__list_tables` - List all tables
- `mcp__supabase__get_logs` - View database logs
- `mcp__supabase__search_docs` - Search Supabase documentation

**Usage Example**:

```typescript
// Execute SQL via MCP (safer than direct psql)
mcp__supabase__execute_sql({
  project_ref: 'qzxnlhzlilysiklmbspn', // DEV project
  query: "SELECT COUNT(*) FROM auctions WHERE type = 'dutch';"
})
```

**⚠️ CRITICAL**: Always specify the correct `project_ref`:

- **DEV**: `qzxnlhzlilysiklmbspn`
- **PROD**: `jgwbqdpxygwsnswtnrxf`

**When to Use Each**:

- Use **psql** for: Quick verification, local testing, reading data
- Use **MCP Supabase** for: Production queries, when you need audit logs, when working with sensitive operations

**Best Practices**:

1. ✅ Always verify you're connected to DEV before testing
2. ✅ Use `SELECT` queries to verify state before/after migrations
3. ✅ Test destructive queries on DEV first
4. ❌ Never run `UPDATE`/`DELETE` via psql without a migration (see Database Migrations Policy)
5. ❌ Never run DDL statements (`CREATE`, `ALTER`, `DROP`) via psql - use migrations instead

**Common Testing Patterns**:

```bash
# 1. Verify migration applied
/opt/homebrew/opt/libpq/bin/psql "$PG_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'your_new_table';"

# 2. Check trigger exists
/opt/homebrew/opt/libpq/bin/psql "$PG_URL" -c "SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'bids';"

# 3. Verify data integrity
/opt/homebrew/opt/libpq/bin/psql "$PG_URL" -c "SELECT COUNT(*) FROM bids WHERE cloud_task IS NOT NULL;"

# 4. Check function definition
/opt/homebrew/opt/libpq/bin/psql "$PG_URL" -c "SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'your_function';"
```

## Code Style

- Use TypeScript when possible
- Use Composition API for Vue components
- Use `<script setup>` syntax
- French comments are acceptable

## UI Design System

### General Principles
- Minimalistic SaaS UI — clean, structured, data-first
- Low cognitive load, no visual noise
- Flat design (no heavy shadows), subtle `border-radius: 4px` everywhere
- Use whitespace instead of lines, grid-based layout
- Progressive disclosure — show only relevant data

### Colors
- **Primary accent**: Green (active states, success, progress, positive KPIs)
- **Background**: `#F8F8F8` | **Surface**: `#FFFFFF` | **Divider**: `#E9EAEC`
- **Text primary**: `#1D1D1B` | **Text secondary**: `#61615F` | **Placeholder**: `#AEB0B2` | **Disabled**: `#C5C7C9`
- **Functional light colors**: Purple `#EDEBFE` | Blue `#DFF0FF` | Yellow `#FDFFD2` | Orange `#FFE1CB` | Red `#FDE8E8` | Green `#EBFFF7`

### Badges (statuses, tags, categories)
- Structure: `height: 24-28px`, `padding: 4px 8px`, `border-radius: 4px`, `font: 12px medium`, `display: inline-flex`, `gap: 4-6px`
- Use soft background + darker text + optional icon

### Typography (Poppins)
- H1: 48/72 Bold | H2: 36/54 Bold | H3: 28/auto Bold-Medium | H4: 20/auto Bold-Semibold-Regular
- Body: 16/24 Regular | Small: 14/20 Regular | XS: 12/16

### Spacing
- Base unit: **4px**, only multiples of 4 (4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64)

### Components
- **Buttons**: height 40px, padding 8px 32px, radius 4px
  - Primary: bg `#1D1D1B`, text white
  - Secondary: border `#E9EAEC`, bg transparent
  - Tertiary: text-only, green accent
- **Inputs**: height 40px, padding 8px 12px, border `#E9EAEC`, radius 4px
- **Cards**: white bg, border `#E9EAEC`, radius 4px, padding 16-20px
- **Checkbox**: 16px, radius 4px
- **Data display**: bold for key numbers, green for positive KPIs, badges for statuses

## 🚨 CRITICAL: Database Migrations Policy

**ALL database modifications MUST go through Supabase migrations. NO EXCEPTIONS.**

### ❌ NEVER DO THIS:

- Execute DDL statements (`CREATE`, `ALTER`, `DROP`) via psql or MCP tools without a migration file
- Execute `UPDATE`/`DELETE`/`INSERT` for schema changes via MCP `execute_sql` or psql
- Modify database schema manually via Supabase dashboard
- Create/alter tables, columns, indexes, constraints, triggers, or functions without a migration
- Use `apply_migration` MCP tool without creating a migration file first

**Exception**: You CAN use MCP `execute_sql` or `psql` for:

- ✅ `SELECT` queries to read/verify data
- ✅ Testing queries before writing migrations
- ✅ Debugging and inspecting database state
- ✅ Verifying migrations were applied correctly

### ✅ ALWAYS DO THIS:

1. **Create a migration file** in `supabase/migrations/`:

   ```
   supabase/migrations/YYYYMMDDHHMMSS_descriptive_name.sql
   ```

2. **Write the migration SQL** with:
   - Clear comments explaining the change
   - Proper error handling (`IF NOT EXISTS`, `DROP IF EXISTS`, etc.)
   - Idempotent operations when possible

3. **Ask user for verification** BEFORE applying:

   ```
   📋 Migration ready: supabase/migrations/20251210173000_add_unique_constraints.sql

   This migration will:
   - Add unique index on gpt_access (gpt_id, user_id)
   - Add unique index on gpt_access (gpt_id, company_id)

   ⚠️  May fail if duplicates exist. Should I apply this migration?
   ```

4. **Apply migration** using `user-Supabase-apply_migration` tool

5. **Test the migration** in local dev environment first

6. **Commit the migration file** to Git for deployment

### Example Migration Workflow:

```sql
-- supabase/migrations/20251210180000_add_gpt_access_unique_constraints.sql

-- Migration: Prevent duplicate GPT access assignments
-- Date: 2025-12-10
-- Purpose: Add unique constraints to prevent duplicate user/company access

-- Unique constraint for user access
CREATE UNIQUE INDEX IF NOT EXISTS idx_gpt_access_unique_user
ON gpt_access (gpt_id, user_id)
WHERE user_id IS NOT NULL;

-- Unique constraint for company access
CREATE UNIQUE INDEX IF NOT EXISTS idx_gpt_access_unique_company
ON gpt_access (gpt_id, company_id)
WHERE company_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_gpt_access_unique_user IS
  'Ensures each user can only be assigned once per GPT';
COMMENT ON INDEX idx_gpt_access_unique_company IS
  'Ensures each company can only be assigned once per GPT';
```

### Why This Matters:

- ✅ **Version control**: All schema changes are tracked in Git
- ✅ **Reproducibility**: Local and production stay in sync
- ✅ **Rollback capability**: Migrations can be reverted if needed
- ✅ **Team collaboration**: Other developers see schema changes
- ✅ **Deployment automation**: Migrations run during build (via `npm run prebuild`)

### Migration Naming Convention:

```
YYYYMMDDHHMMSS_action_description.sql

Examples:
20251210173000_add_gpt_creator_protection.sql
20251210180000_add_unique_constraints_gpt_access.sql
20251210190000_update_profiles_add_role_column.sql
```

**REMEMBER: Always ask for user verification before applying any migration!**

## Contributing to Documentation

If you discover useful information while working on the codebase (new patterns, test flows, credentials, component behaviors, etc.), **please update the relevant docs/** files to help future assistants.

**When to add documentation:**

- You found a non-obvious navigation flow or page structure
- You discovered test credentials or setup steps
- You identified a pattern that took time to understand
- You debugged an issue that others might encounter

**Files to update:**

- `docs/BROWSER_TESTING.md` - Auth flows, test credentials, navigation paths
- `docs/API.md` - New endpoints, webhook behaviors
- `docs/DATABASE.md` - Schema changes, new tables, RLS policies
- `docs/SCRIPTS.md` - New utility scripts
- `docs/BOT_BEHAVIOR.md` - Training bot logic
- `docs/FRONTEND.md` - Composables, components, data flow patterns
- `docs/SQL.md` - Functions, triggers, policies, price calculations

This documentation is a living resource - keep it accurate and helpful!

## Browser Testing Documentation (MANDATORY)

**IMPORTANT**: When you successfully complete an E2E browser test flow (using MCP browser automation), you **MUST** update `docs/BROWSER_TESTING.md` with:

1. **Step-by-step instructions** for reproducing the test flow
2. **JavaScript patterns** that worked for setting form values (Vuetify inputs are tricky)
3. **Selector references** or `ref` values that successfully targeted elements
4. **Common pitfalls** you encountered and their solutions
5. **Validation requirements** the form expects before submission
6. **Success verification** steps (what to check after form submission)

**Why this is mandatory:**

- Browser automation for Vuetify/Vue forms requires specific patterns
- Selectors and `ref` values help future assistants avoid trial-and-error
- Documenting pitfalls saves hours of debugging
- This creates a reusable playbook for testing similar features

**Format**: Follow the existing E2E sections in `docs/BROWSER_TESTING.md`:

- `## E2E: Create Dutch eAuction with MCP Browser`
- `## E2E: Create English eAuction with MCP Browser`
- `## E2E: Create Multi-Lot Multi-Item eAuction with MCP Browser`

Each new browser test flow should have its own section with the same structure.

## Session State (updated every ~5 messages)

### Current Scope
- Working on **Decision Tree / Architect module** only
- Do NOT modify the rest of the codebase (auction engine, bidding, etc.) unless explicitly asked

### Decision Tree Routes
- `/decisionTree` routes are **public** (no auth required) — see middleware config

### Decision Tree Colors — `gfc(family)`
Returns `{ border, bg, text }` per family. Defined in `utils/decisionTree/constants.ts`:
- Sealed Bid: cyan `#67E8F9` | English: green `#34D399` | Dutch: violet `#A78BFA`
- Japanese: yellow `#FBBF24` | Traditional: orange `#FB923C` | Double Scenario: rose `#F472B6`

### Options per Auction Family
| Family | Pre-bid | Preference | Award | Rank | No Rank |
|--------|---------|------------|-------|------|---------|
| Double Scenario | yes | yes | yes | - | - |
| English | yes | yes | yes | yes | - |
| Dutch | yes | yes | yes | - | - |
| Japanese | yes | - | yes | yes | yes |
| Sealed Bid | - | yes | yes | yes | yes |
| Traditional | - | - | - | - | - |

### Admin Users (DEV)
- lisa@crown-procurement.com, louis@crown-procurement.com, nastya@crown-procurement.com
- All profiles created manually (auth webhook failed)

### Common Dev Issues
- `Cannot delete property 'runtimeConfig'` → clear `.nuxt` + `node_modules/.cache`, restart dev
- `useTranslations` → always **default import** (`import useTranslations from`)
- `"type": "module"` in package.json → temp scripts need `.cjs` extension
- Direct DB connection blocked locally → use Dashboard SQL editor or Node.js admin client
