# Crown Scripts Documentation

This document provides documentation for all utility scripts in the `scripts/` directory.

## Table of Contents

1. [Overview](#overview)
2. [Cloud Tasks & Queue Management](#cloud-tasks--queue-management)
3. [Auction Management](#auction-management)
4. [User & Profile Management](#user--profile-management)
5. [GPT Management](#gpt-management)
6. [Data Migration](#data-migration)
7. [API Testing](#api-testing)
8. [Debugging Tools](#debugging-tools)

---

## Overview

### Prerequisites

Most scripts require:

- Node.js 18+
- Environment variables (see [Environment Management](#environment-management))
- Google Cloud authentication for Cloud Tasks access

### Environment Management

**IMPORTANT:** Scripts can run against different environments (local dev or production).

See **[docs/ENVIRONMENTS.md](./ENVIRONMENTS.md)** for complete documentation.

**Quick setup:**

```bash
# 1. Create local environment file
cp .env .env.local

# 2. Download production environment
vercel login
vercel env pull .env.production --environment=production --yes

# 3. Authenticate with Google Cloud (for Cloud Tasks)
gcloud auth application-default login
```

**Running scripts with specific environment:**

```bash
# Use the wrapper script to choose environment
node scripts/run-with-env.js [local|production] <script> [...args]

# Examples
node scripts/run-with-env.js local technical_test_auction.js <auction_id>
node scripts/run-with-env.js production cleanup_orphan_japanese_tasks.js
```

The wrapper displays which environment is active:

```
🌍 Environment: PRODUCTION
📄 Using: .env.production
🚀 Running: cleanup_orphan_japanese_tasks.js
```

---

## Cloud Tasks & Queue Management

### `cleanup_orphan_japanese_tasks.js`

Analyzes and cleans up orphaned Cloud Tasks in the `JaponeseRoundHandler` queue.

**What are orphan tasks?**  
Cloud Tasks scheduled for auctions that no longer exist or have been deleted.

```bash
# Analyze orphan tasks (dry run - no deletion)
node scripts/run-with-env.js production cleanup_orphan_japanese_tasks.js

# Delete orphan tasks
node scripts/run-with-env.js production cleanup_orphan_japanese_tasks.js --delete
```

**Output example:**

```
🔍 Analyzing Japanese auction tasks...

📊 Found 20 tasks in queue
📊 Found 435 Japanese auctions in database

📅 Tasks scheduled for December 30th: 20

🚨 Orphan tasks (no matching auction): 0

✅ Valid auctions with scheduled tasks:

1. Webinaire - Enchère Japonaise - Démo (7180a122-4ca3-4b89-a49c-b759839a456c)
   Start: 2025-12-30T10:30:00+00:00
   End: 2025-12-30T10:40:00+00:00
   Status: N/A
   Usage: training
   Tasks: 20
```

**When to use:**

- Debugging Japanese auction scheduling issues
- Cleaning up after deleted auctions
- Verifying task queue health before important auctions

**Requirements:**

- Google Cloud authentication: `gcloud auth application-default login`
- Production environment recommended (use `run-with-env.js`)

---

### `technical_test_auction.js`

Comprehensive technical health check for an auction group.

```bash
node scripts/run-with-env.js production technical_test_auction.js <auction_group_id>
```

**Checks performed:**

1. **Supabase connectivity** and service role key validation
2. **Auction group** configuration (name, timing rule, currencies)
3. **Lots** and **supplies** structure
4. **Sellers** invitation status and participation
5. **Handicaps** configuration (if any)
6. **Google Cloud Tasks** queue accessibility
7. **Scheduled tasks** for Dutch/Japanese auctions
8. **Task endpoint** validation (correct URLs)

**Output sections:**

- 🏗️ Auction Group details
- 📦 Lots & Supplies breakdown
- 👥 Sellers list with status
- 🎯 Handicaps (if applicable)
- ☁️ Cloud Tasks queue health
- 📅 Scheduled tasks list
- ✅ Overall health summary

**Use cases:**

- Pre-auction validation before going live
- Debugging auction setup issues
- Verifying Cloud Tasks are correctly scheduled
- Checking seller invitation status

---

## Auction Management

### `start_auction_now.js`

Starts an auction immediately by setting `start_at` to now and `end_at` to now + 30 minutes.

```bash
node scripts/start_auction_now.js <auctionId>
```

**Example:**

```bash
node scripts/start_auction_now.js 48e90a66-20b4-4d15-bf82-7bee6eb3a63a
```

**Output:**

```
✅ Auction started!
   Start: 2024-01-15T10:00:00.000Z
   End: 2024-01-15T10:30:00.000Z
   Duration: 30 minutes
```

---

### `forceAuctionEnd.js`

Forces an auction to end immediately by setting `end_at` to the current time.

```bash
node scripts/forceAuctionEnd.js <auctionId>
```

**Use case:** Emergency stop of a live auction.

---

### `inspect_auction.js`

Displays comprehensive information about an auction including supplies, sellers, and bids.

```bash
node scripts/inspect_auction.js <auctionId>
```

**Output includes:**

- Auction details (name, type, status, dates)
- `rank_per_line_item` setting
- List of supplies with quantities
- Registered sellers
- Total bids count
- Local URLs for testing
- Checklist for line-item ranking validation

---

### `enable_rank_per_line_item.js`

Enables the `rank_per_line_item` flag for an auction (used for per-supply ranking).

```bash
node scripts/enable_rank_per_line_item.js <auctionId>
```

---

### `updateAuctionDecrement.js`

Updates auction decrement settings (`min_bid_decr`, `max_bid_decr`).

---

### `Auctions/createAuction.js`

Creates a new test auction with predefined configuration.

---

### `Auctions/createAuction_v2.js`

Enhanced version of auction creation script.

---

### `Auctions/createRealAuction.js`

Creates a production auction (usage: `real`).

---

### `Auctions/updateAuctions.js`

Batch updates multiple auctions.

---

### `Auctions/deleteOldTestAuctions.js`

Marks test auctions older than 2 months as deleted.

```bash
node scripts/Auctions/deleteOldTestAuctions.js
```

**Safety:** Script only counts affected auctions on first run. Actual deletion code is commented out.

---

### `Auctions/AddBidForSeller.js`

Adds a bid for a specific seller in an auction.

---

## User & Profile Management

### `addCredits.js`

Adds AI credits to a user's account.

```bash
node scripts/addCredits.js <email> <amount>
```

**Example:**

```bash
node scripts/addCredits.js user@example.com 1000
```

**Output:**

```
💳 Starting credit addition process...

📧 User Email: user@example.com
💰 Amount: 1000 credits

🔍 Looking up user...
✅ User found:
   ID: abc-123
   Name: John Doe
   Role: buyer

📊 Fetching current balance...
   Current remaining: 50
   Current total: 500

💳 Adding credits...
✅ Credits added successfully!

📊 New balance:
   Remaining: 1050 (+1000)
   Total: 1500 (+1000)

🎉 Operation completed successfully!
```

---

### `updateProfilesToBuyers.js`

Updates role to `buyer` for all profiles that have created real auctions.

```bash
node scripts/updateProfilesToBuyers.js
```

**Logic:**

1. Fetches all auctions with `usage: 'real'`
2. Extracts unique `buyer_id` values
3. Updates those profiles to `role: 'buyer'`

---

### `updateProfilesToSuppliers.js`

Updates role to `supplier` for profiles identified as sellers.

---

### `test_user_creation.js`

**⚠️ Important Testing Tool**: Tests the automatic profile creation workflow when users sign up.

```bash
# Test webhook directly (local server must be running)
node scripts/test_user_creation.js webhook

# Test full flow (creates real test user in Supabase)
node scripts/test_user_creation.js full
```

**What it tests:**

1. User creation in `auth.users`
2. Database trigger `insert_users` execution
3. Webhook call to `/api/v1/webhooks/users/insert`
4. Automatic profile creation in `public.profiles`

**Expected behavior:**

- ✅ User created in `auth.users` with confirmed email
- ✅ Profile automatically created in `public.profiles` with matching ID and email
- ✅ Profile has default values (`is_active: false`, `onboarding_step: 0`)
- ✅ Test user is cleaned up after verification

**Use cases:**

- Verify webhook is working after deployment
- Debug profile creation issues
- Validate auth.users → profiles synchronization

**Example output:**

```
╔═══════════════════════════════════════════════════════╗
║  Test de création automatique de profil utilisateur  ║
╚═══════════════════════════════════════════════════════╝

🧪 Test 2: Création complète d'un utilisateur

📧 Email de test: test-1764752191902@test-crown.local
🔐 Mot de passe: TestPassword123!

1️⃣ Création de l'utilisateur dans auth.users...
✅ Utilisateur créé: 0fb09fa1-2fd8-42d3-b299-fa5cc0f7346a

2️⃣ Attente du traitement du webhook (5 secondes)...

3️⃣ Vérification de la création du profil...
✅ Profil créé automatiquement!

🧹 Nettoyage de l'utilisateur de test...
✅ Utilisateur de test supprimé

═══════════════════════════════════════════════════════
✅ TEST RÉUSSI
═══════════════════════════════════════════════════════
```

**Related documentation:**

- See `docs/DATABASE.md` → "Authentication Architecture: auth.users → profiles"
- Webhook implementation: `server/api/v1/webhooks/users/insert.post.js`

---

## GPT Management

### `seedGPTs.js`

Seeds the database with 4 preconfigured GPT assistants.

```bash
node scripts/seedGPTs.js
```

**GPTs Created:**

| Name                   | Description                                   | Provider  | Model             |
| ---------------------- | --------------------------------------------- | --------- | ----------------- |
| RFP Analyser           | Analyse et scoring des offres fournisseurs    | Anthropic | claude-sonnet-4.5 |
| Scope of Work          | Structuration de cahiers des charges pré-RFP  | OpenAI    | gpt-5-chat        |
| eAuction Recommendator | Configuration d'enchères électroniques        | Google    | gemini-2.5-flash  |
| Contract Generator     | Génération de contrats avec clauses standards | xAI       | grok-4-fast       |

**Warning:** This script deletes existing GPTs before creating new ones.

---

## Data Migration

### `migrations/migrateCloudTasks.js`

Migrates Cloud Tasks from one GCP project to another after organization change.

```bash
# Dry run (preview only)
node scripts/migrations/migrateCloudTasks.js --dry-run

# Execute migration
SUPABASE_SERVICE_KEY=xxx GCP_PROJECT_ID=crown-476614 node scripts/migrations/migrateCloudTasks.js
```

**Environment Variables:**

- `SUPABASE_SERVICE_KEY` - Supabase service role key
- `GCP_PROJECT_ID` - New GCP project ID
- `GCP_ENDPOINT` - Endpoint URL (default: `https://crown-procurement.vercel.app`)

**Flow:**

1. Fetches all prebids with `cloud_task` for future auctions
2. Deletes old Cloud Tasks on old GCP project
3. Creates new Cloud Tasks on new GCP project
4. Updates `bids.cloud_task` column with new task names

---

### `migrateCeilings.js`

Migrates ceiling data for supplies_sellers.

---

### `updateCeilings.js`

Updates ceiling values for supplies_sellers.

---

### `updateCreated_at.js`

Updates `created_at` timestamps for specific records.

---

### `createAllGroupSetings.js`

Creates auction group settings for existing auctions.

---

## API Testing

### `api_testing/tasksEnqueuing.js`

Tests Cloud Tasks creation via the enqueuer utility.

---

### `api_testing/dutchAuctionUpdatePreBids.js`

Tests Dutch auction prebid update webhook.

---

### `api_testing/dutchPrebidEnder.js`

Tests Dutch prebid execution flow.

---

### `api_testing/v1/webhook_auctions_update.js`

Tests the `/api/v1/webhooks/auctions/update` endpoint.

---

### `api_testing/v1/webhook_user_insert.js`

Tests the `/api/v1/webhooks/users/insert` endpoint.

---

### Japanese Auction Testing

Located in `api_testing/v1/japanese/`:

| Script                   | Purpose                        |
| ------------------------ | ------------------------------ |
| `japMockTest.js`         | Mock test for Japanese auction |
| `emulateBids.js`         | Emulates bid submissions       |
| `engineCallJapanese.js`  | Tests Japanese auction engine  |
| `emulateRoundHandler.js` | Emulates round handler calls   |

---

### `engineCall.js`

Generic engine call test script.

---

## Debugging Tools

### `inspect_auction.js`

See [Auction Management](#inspect_auctionjs) section.

---

### `check_bids.js`

Checks bid data for a specific auction.

---

### `check_bids_schema.js`

Validates bid data against expected schema.

---

### `check_sellers.js`

Lists and validates sellers for an auction.

---

### `debug_line_item_table.js`

Debugs line-item (supplies) table data.

---

### `test_round_time.js`

Tests Dutch auction round time calculations.

```bash
node scripts/test_round_time.js
```

---

## Script Categories Summary

| Category    | Scripts | Purpose                             |
| ----------- | ------- | ----------------------------------- |
| Cloud Tasks | 2       | Queue management, orphan cleanup    |
| Auction Ops | 10+     | Create, start, end, update auctions |
| User Mgmt   | 3       | Credits, roles, profiles            |
| GPT         | 1       | Seed GPT configurations             |
| Migration   | 4       | Data migrations, ceiling updates    |
| API Testing | 8       | Test webhooks and endpoints         |
| Debug       | 6       | Inspect and validate data           |
| Environment | 1       | Multi-environment script execution  |

---

## Security Notes

1. **Environment Files:** Never commit `.env.*` files (already in `.gitignore`). They contain sensitive credentials.

2. **Service Keys:** Always use environment variables. Use `run-with-env.js` wrapper to switch between environments safely.

3. **Destructive Operations:** Scripts like `deleteOldTestAuctions.js` and `cleanup_orphan_japanese_tasks.js` have safety measures (dry-run mode by default).

4. **Google Cloud Authentication:**

   ```bash
   # Authenticate once per machine
   gcloud auth application-default login

   # Verify correct project
   gcloud config get-value project  # Should show: crown-476614
   ```

5. **Production Access:** Always test scripts on local/dev environment first before running on production:

   ```bash
   # Test locally first
   node scripts/run-with-env.js local <script>

   # Then on production
   node scripts/run-with-env.js production <script>
   ```

---

## Adding New Scripts

When creating new scripts:

1. **Add to appropriate subdirectory** (`scripts/` or subdirectory)
2. **Include JSDoc header** with usage instructions
3. **⚠️ NEVER hardcode credentials or keys** - Always use environment variables
4. **Add CLI argument validation** for better error messages
5. **Document in this file** so others can find it

### Security Rules for New Scripts

**❌ NEVER DO THIS:**

```javascript
// ❌ BAD - Hardcoded credentials
const SUPABASE_URL = 'https://jgwbqdpxygwsnswtnrxf.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // NEVER!
```

**✅ ALWAYS DO THIS:**

```javascript
// ✅ GOOD - Use environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
```

### Script Template

Use the wrapper `run.js` for environment management:

```javascript
#!/usr/bin/env node

/**
 * Script description
 *
 * Usage: node scripts/run.js <script-name> [...args] [--production|--local]
 */

import { createClient } from '@supabase/supabase-js'

// ✅ Load from environment variables
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function main() {
  // Your script logic here
}

main()
```

**Run with:**

```bash
node scripts/run.js my-new-script.js --production
```
