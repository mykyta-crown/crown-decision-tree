#!/usr/bin/env node

/**
 * Copy Auction Data from PROD to DEV
 *
 * Copies all data related to an auction (and its group) from PROD to DEV Supabase.
 * Keeps the same UUIDs for easier debugging.
 *
 * Usage:
 *   # Dry-run (shows what will be copied)
 *   node scripts/run.js copy-auction-prod-to-dev.js <auction-id> --prod
 *
 *   # Dry-run with clean (shows what will be deleted + copied)
 *   node scripts/run.js copy-auction-prod-to-dev.js <auction-id> --prod --clean
 *
 *   # Execute with clean (delete existing DEV data, then copy from PROD)
 *   node scripts/run.js copy-auction-prod-to-dev.js <auction-id> --prod --clean --confirm
 *
 * Tables copied (in order, respecting foreign keys):
 *   1. profiles (buyer + sellers)
 *   2. companies (if referenced)
 *   3. auctions_group_settings
 *   4. auctions (all lots in the group)
 *   5. supplies
 *   6. auctions_sellers
 *   7. auctions_handicaps
 *   8. supplies_sellers
 *   9. bids
 *   10. bid_supplies
 *   11. bids_handicaps
 *   12. trainings
 *
 * Safety:
 *   - PROD is read-only (SELECT only)
 *   - DEV receives upserts (INSERT ... ON CONFLICT UPDATE)
 *   - --confirm flag required for actual write
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ============ Parse Args ============
const auctionId = process.argv[2]
const confirm = process.argv.includes('--confirm')
const clean = process.argv.includes('--clean')

if (!auctionId) {
  console.error(
    '❌ Usage: node scripts/run.js copy-auction-prod-to-dev.js <auction-id> --prod [--clean] [--confirm]'
  )
  console.error('')
  console.error('  Dry-run:  node scripts/run.js copy-auction-prod-to-dev.js 28b73dc2-... --prod')
  console.error(
    '  Clean:    node scripts/run.js copy-auction-prod-to-dev.js 28b73dc2-... --prod --clean'
  )
  console.error(
    '  Execute:  node scripts/run.js copy-auction-prod-to-dev.js 28b73dc2-... --prod --clean --confirm'
  )
  process.exit(1)
}

// ============ Environment Setup ============
// PROD connection (from --prod flag loaded by run.js)
const PROD_URL = process.env.SUPABASE_URL
const PROD_KEY = process.env.SUPABASE_ADMIN_KEY || process.env.SUPABASE_SERVICE_KEY

if (!PROD_URL || !PROD_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ADMIN_KEY. Make sure to use --prod flag.')
  process.exit(1)
}

// DEV connection (from .env or .env.local)
const devEnvPath = fs.existsSync(path.join(__dirname, '..', '.env.local'))
  ? path.join(__dirname, '..', '.env.local')
  : path.join(__dirname, '..', '.env')

const devEnvContent = fs.readFileSync(devEnvPath, 'utf8')
const devEnv = {}
devEnvContent.split('\n').forEach((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    devEnv[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
  }
})

const DEV_URL = devEnv.SUPABASE_URL
const DEV_KEY = devEnv.SUPABASE_ADMIN_KEY || devEnv.SUPABASE_SERVICE_KEY

if (!DEV_URL || !DEV_KEY) {
  console.error('❌ Missing DEV SUPABASE_URL or SUPABASE_ADMIN_KEY in .env / .env.local')
  process.exit(1)
}

// Safety: ensure we're not writing to PROD
if (DEV_URL === PROD_URL) {
  console.error('🚫 SAFETY: DEV_URL === PROD_URL — refusing to run. Check your .env files.')
  process.exit(1)
}

// ============ Create Clients ============
const prodDb = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } })
const devDb = createClient(DEV_URL, DEV_KEY, { auth: { persistSession: false } })

const prodHost = new URL(PROD_URL).hostname
const devHost = new URL(DEV_URL).hostname

// ============ Helpers ============
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
}

function title(msg) {
  console.log(`\n${colors.bright}${colors.blue}═══ ${msg} ═══${colors.reset}`)
}
function section(msg) {
  console.log(`\n${colors.cyan}▶ ${msg}${colors.reset}`)
}
function ok(msg) {
  console.log(`  ${colors.green}✓${colors.reset} ${msg}`)
}
function err(msg) {
  console.log(`  ${colors.red}✗${colors.reset} ${msg}`)
}
function info(msg) {
  console.log(`  ${colors.gray}ℹ${colors.reset} ${msg}`)
}
function item(msg) {
  console.log(`    ${colors.gray}•${colors.reset} ${msg}`)
}

// ============ Data Collection ============
const collectedData = {}

async function fetchAll(client, table, query) {
  const { data, error } = await client.from(table).select('*').match(query)
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data || []
}

async function fetchIn(client, table, column, values) {
  if (!values || values.length === 0) return []
  const { data, error } = await client.from(table).select('*').in(column, values)
  if (error) throw new Error(`Failed to fetch ${table}: ${error.message}`)
  return data || []
}

async function upsertBatch(table, rows) {
  if (!rows || rows.length === 0) return 0
  // Use upsert with onConflict to handle existing data
  const { error } = await devDb
    .from(table)
    .upsert(rows, { onConflict: 'id', ignoreDuplicates: false })
  if (error) {
    // If upsert with 'id' conflict fails (table may not have 'id' PK), try delete+insert
    console.log(`  ⚠ Upsert failed for ${table} (${error.message}), trying delete+insert...`)
    // Delete existing rows first
    for (const row of rows) {
      if (row.id) {
        await devDb.from(table).delete().eq('id', row.id)
      }
    }
    const { error: insertError } = await devDb.from(table).insert(rows)
    if (insertError) throw new Error(`Failed to insert ${table}: ${insertError.message}`)
  }
  return rows.length
}

async function upsertBatchComposite(table, rows, conflictColumns) {
  if (!rows || rows.length === 0) return 0
  // Use Supabase upsert with composite conflict columns
  const onConflict = conflictColumns.join(',')
  const { error } = await devDb.from(table).upsert(rows, { onConflict, ignoreDuplicates: false })
  if (error) {
    // Fallback: delete all matching rows by first conflict column, then insert
    console.log(`  ⚠ Upsert on ${table} (${onConflict}) failed: ${error.message}`)
    console.log(`  ⚠ Fallback: bulk delete by ${conflictColumns[0]} then insert...`)
    const uniqueValues = [...new Set(rows.map((r) => r[conflictColumns[0]]))]
    if (uniqueValues.length > 0) {
      const { error: delErr } = await devDb
        .from(table)
        .delete()
        .in(conflictColumns[0], uniqueValues)
      if (delErr) console.log(`  ⚠ Delete failed: ${delErr.message}`)
    }
    const { error: insertError } = await devDb.from(table).insert(rows)
    if (insertError) throw new Error(`Failed to insert ${table}: ${insertError.message}`)
  }
  return rows.length
}

// ============ Clean DEV Data ============
async function cleanDevData(auctionIds, supplyIds, bidIds, groupId, dryRun) {
  title(dryRun ? '🧹 CLEAN DEV DATA (DRY-RUN)' : '🧹 CLEANING DEV DATA')

  // Fetch DEV supply IDs for cleaning supplies_sellers
  // Use BOTH DEV supply IDs (from auction_id lookup) AND PROD supply IDs (passed in)
  // because PROD UUIDs are preserved during copy
  let devSupplyIds = []
  if (auctionIds && auctionIds.length > 0) {
    const { data: devSupplies } = await devDb
      .from('supplies')
      .select('id')
      .in('auction_id', auctionIds)
    devSupplyIds = (devSupplies || []).map((s) => s.id)
  }
  // Merge with PROD supply IDs (they may already exist in DEV from a previous copy)
  if (supplyIds && supplyIds.length > 0) {
    const mergedSet = new Set([...devSupplyIds, ...supplyIds])
    devSupplyIds = [...mergedSet]
  }

  // Order: leaf tables first (reverse FK order)
  const cleanSteps = [
    { table: 'bids_handicaps', column: 'bid_id', values: bidIds },
    { table: 'bid_supplies', column: 'bid_id', values: bidIds },
    { table: 'bids', column: 'auction_id', values: auctionIds },
    { table: 'supplies_sellers', column: 'supply_id', values: devSupplyIds },
    { table: 'auctions_sellers', column: 'auction_id', values: auctionIds },
    { table: 'auctions_handicaps', column: 'auction_id', values: auctionIds },
    { table: 'supplies', column: 'auction_id', values: auctionIds },
    { table: 'auctions', column: 'id', values: auctionIds }
  ]

  if (groupId) {
    cleanSteps.push({ table: 'auctions_group_settings', column: 'id', values: [groupId] })
  }

  let totalDeleted = 0
  for (const { table, column, values } of cleanSteps) {
    if (!values || values.length === 0) {
      info(`${table}: skip (no IDs)`)
      continue
    }

    if (dryRun) {
      // Count existing records
      const { count, error } = await devDb
        .from(table)
        .select('*', { count: 'exact', head: true })
        .in(column, values)
      if (error) {
        info(`${table}: count error (${error.message})`)
      } else {
        const indicator = count > 0 ? colors.yellow : colors.gray
        console.log(
          `  ${indicator}${(count || 0).toString().padStart(4)}${colors.reset} ${table} (will delete)`
        )
        totalDeleted += count || 0
      }
    } else {
      const { error, count } = await devDb.from(table).delete({ count: 'exact' }).in(column, values)
      if (error) {
        err(`${table}: delete error (${error.message})`)
      } else {
        ok(`${table}: ${count || 0} deleted`)
        totalDeleted += count || 0
      }
    }
  }

  console.log(
    `\n  ${colors.bright}Total: ${totalDeleted} record(s) ${dryRun ? 'to delete' : 'deleted'}${colors.reset}`
  )
  return totalDeleted
}

// ============ Profile Mapping Logic ============
// Instead of copying PROD profiles (which would violate FK on auth.users),
// we map PROD profiles to existing DEV profiles.

async function buildProfileMapping(prodProfiles, prodBuyerId) {
  section('🔄 Building PROD → DEV profile mapping')

  // Fetch all DEV profiles
  const { data: devProfiles, error } = await devDb.from('profiles').select('*')
  if (error) throw new Error(`Failed to fetch DEV profiles: ${error.message}`)

  // Categorize DEV profiles
  const devBuyers = devProfiles.filter((p) => p.role === 'admin' || p.role === 'buyer')
  const devSuppliers = devProfiles.filter(
    (p) => p.email?.startsWith('supplier+') || p.email?.startsWith('bot-') || p.role === 'supplier'
  )

  info(`DEV has ${devBuyers.length} buyer/admin(s), ${devSuppliers.length} supplier(s)`)

  // Separate PROD profiles into buyer and sellers
  const prodBuyer = prodProfiles.find((p) => p.id === prodBuyerId)
  const prodSellers = prodProfiles.filter((p) => p.id !== prodBuyerId)

  // Check we have enough DEV suppliers
  if (prodSellers.length > devSuppliers.length) {
    console.error(`\n${colors.red}❌ Not enough DEV suppliers!${colors.reset}`)
    console.error(
      `   PROD has ${prodSellers.length} sellers, DEV only has ${devSuppliers.length} suppliers.`
    )
    console.error(
      `   Create more test suppliers in DEV (supplier+N@crown.ovh) or bot-N@crown-procurement.com`
    )
    process.exit(1)
  }

  // Map buyer: prefer victor+buyer, fallback to victor admin
  const devBuyer =
    devBuyers.find((p) => p.email === 'victor+buyer@crown-procurement.com') ||
    devBuyers.find((p) => p.email === 'victor@crown-procurement.com') ||
    devBuyers[0]

  if (!devBuyer) {
    console.error(`${colors.red}❌ No buyer profile found in DEV!${colors.reset}`)
    process.exit(1)
  }

  // Build mapping: PROD profile_id → DEV profile_id, PROD email → DEV email
  const idMap = {} // prodId → devId
  const emailMap = {} // prodEmail → devEmail
  const companyMap = {} // prodCompanyId → devCompanyId

  // Map buyer
  if (prodBuyer) {
    idMap[prodBuyer.id] = devBuyer.id
    emailMap[prodBuyer.email] = devBuyer.email
    if (prodBuyer.company_id && devBuyer.company_id) {
      companyMap[prodBuyer.company_id] = devBuyer.company_id
    }
    ok(
      `Buyer: ${prodBuyer.email} (${prodBuyer.id.slice(0, 8)}…) → ${devBuyer.email} (${devBuyer.id.slice(0, 8)}…)`
    )
  }

  // Map sellers (round-robin assignment)
  for (let i = 0; i < prodSellers.length; i++) {
    const ps = prodSellers[i]
    const ds = devSuppliers[i]
    idMap[ps.id] = ds.id
    emailMap[ps.email] = ds.email
    if (ps.company_id && ds.company_id) {
      companyMap[ps.company_id] = ds.company_id
    }
    ok(`Seller ${i + 1}: ${ps.email} (${ps.id.slice(0, 8)}…) → ${ds.email} (${ds.id.slice(0, 8)}…)`)
  }

  return { idMap, emailMap, companyMap, devBuyer }
}

function remapData(data, idMap, emailMap, companyMap) {
  // Deep clone
  const rows = JSON.parse(JSON.stringify(data))
  for (const row of rows) {
    // Remap profile IDs
    if (row.buyer_id && idMap[row.buyer_id]) row.buyer_id = idMap[row.buyer_id]
    if (row.seller_id && idMap[row.seller_id]) row.seller_id = idMap[row.seller_id]
    if (row.profile_id && idMap[row.profile_id]) row.profile_id = idMap[row.profile_id]
    if (row.user_id && idMap[row.user_id]) row.user_id = idMap[row.user_id]
    if (row.created_by && idMap[row.created_by]) row.created_by = idMap[row.created_by]

    // Remap emails
    if (row.seller_email && emailMap[row.seller_email])
      row.seller_email = emailMap[row.seller_email]
    if (row.buyer_email && emailMap[row.buyer_email]) row.buyer_email = emailMap[row.buyer_email]
    if (row.email && emailMap[row.email]) row.email = emailMap[row.email]

    // Remap company IDs
    if (row.company_id && companyMap[row.company_id]) row.company_id = companyMap[row.company_id]
  }
  return rows
}

// ============ Main ============
async function main() {
  const mode = confirm ? '🔴 EXECUTION' : '🟢 DRY-RUN'
  const cleanLabel = clean ? ' + CLEAN' : ''
  title(`COPY AUCTION PROD → DEV (${mode}${cleanLabel})`)
  console.log(`${colors.gray}Auction ID: ${auctionId}${colors.reset}`)
  console.log(`${colors.gray}PROD: ${prodHost}${colors.reset}`)
  console.log(`${colors.gray}DEV:  ${devHost}${colors.reset}`)
  console.log(`${colors.gray}Date: ${new Date().toISOString()}${colors.reset}`)
  console.log(
    `${colors.yellow}ℹ Profiles are MAPPED to DEV users (not copied) to avoid auth.users FK constraint${colors.reset}`
  )

  // ============ Step 1: Fetch Auction from PROD ============
  section('1. Fetching auction from PROD')

  const auctions = await fetchAll(prodDb, 'auctions', { id: auctionId })
  if (auctions.length === 0) {
    err(`Auction not found in PROD: ${auctionId}`)
    process.exit(1)
  }

  const auction = auctions[0]
  ok(
    `Found: "${auction.name || auction.lot_name}" (${auction.type}, status: ${auction.status || 'n/a'})`
  )
  info(`Group ID: ${auction.auctions_group_settings_id}`)

  // ============ Step 2: Fetch Auction Group ============
  section('2. Fetching auction group')

  const groupId = auction.auctions_group_settings_id
  let groups = []
  if (groupId) {
    groups = await fetchAll(prodDb, 'auctions_group_settings', { id: groupId })
    if (groups.length > 0) {
      ok(`Group: "${groups[0].name}" (ID: ${groupId})`)
    } else {
      info('Group not found (will skip)')
    }
  } else {
    info('No auction group')
  }
  collectedData.auctions_group_settings = groups

  // ============ Step 3: Fetch ALL auctions in group ============
  section('3. Fetching all lots in group')

  let allAuctions
  if (groupId) {
    allAuctions = await fetchAll(prodDb, 'auctions', { auctions_group_settings_id: groupId })
    ok(`Found ${allAuctions.length} lot(s) in group`)
    for (const a of allAuctions) {
      item(`Lot ${a.lot_number}: "${a.name || a.lot_name}" (${a.type}) — ID: ${a.id}`)
    }
  } else {
    allAuctions = [auction]
    ok('Single auction (no group)')
  }
  collectedData.auctions = allAuctions
  const auctionIds = allAuctions.map((a) => a.id)

  // ============ Step 4: Fetch Supplies ============
  section('4. Fetching supplies (line items)')

  const supplies = await fetchIn(prodDb, 'supplies', 'auction_id', auctionIds)
  ok(`${supplies.length} supply line(s)`)
  collectedData.supplies = supplies
  const supplyIds = supplies.map((s) => s.id)

  // ============ Step 5: Fetch Sellers ============
  section('5. Fetching auction sellers')

  const sellers = await fetchIn(prodDb, 'auctions_sellers', 'auction_id', auctionIds)
  ok(`${sellers.length} seller(s)`)
  for (const s of sellers) {
    item(`${s.seller_email}`)
  }
  collectedData.auctions_sellers = sellers
  const sellerEmails = [...new Set(sellers.map((s) => s.seller_email))]

  // ============ Step 6: Fetch Profiles ============
  section('6. Fetching profiles (buyer + sellers)')

  // Buyer profile
  const buyerId = groups.length > 0 ? groups[0].buyer_id : auction.buyer_id
  const profileIds = new Set()
  if (buyerId) profileIds.add(buyerId)

  // Seller profiles by email
  let sellerProfiles = []
  if (sellerEmails.length > 0) {
    sellerProfiles = await fetchIn(prodDb, 'profiles', 'email', sellerEmails)
    for (const p of sellerProfiles) profileIds.add(p.id)
  }

  // Buyer profile
  let buyerProfile = []
  if (buyerId) {
    buyerProfile = await fetchAll(prodDb, 'profiles', { id: buyerId })
  }

  const allProfiles = [...buyerProfile]
  for (const sp of sellerProfiles) {
    if (!allProfiles.find((p) => p.id === sp.id)) allProfiles.push(sp)
  }
  ok(`${allProfiles.length} profile(s)`)
  collectedData.profiles = allProfiles

  // ============ Step 7: Fetch Companies ============
  section('7. Fetching companies')

  const companyIds = [...new Set(allProfiles.filter((p) => p.company_id).map((p) => p.company_id))]
  let companies = []
  if (companyIds.length > 0) {
    companies = await fetchIn(prodDb, 'companies', 'id', companyIds)
  }
  ok(`${companies.length} company(ies)`)
  collectedData.companies = companies

  // ============ Step 8: Fetch Handicaps ============
  section('8. Fetching auction handicaps')

  const handicaps = await fetchIn(prodDb, 'auctions_handicaps', 'auction_id', auctionIds)
  ok(`${handicaps.length} handicap(s)`)
  collectedData.auctions_handicaps = handicaps

  // ============ Step 9: Fetch Supplies Sellers ============
  section('9. Fetching supplies_sellers (ceilings)')

  let suppliesSellers = []
  if (supplyIds.length > 0) {
    suppliesSellers = await fetchIn(prodDb, 'supplies_sellers', 'supply_id', supplyIds)
  }
  ok(`${suppliesSellers.length} ceiling(s)`)
  collectedData.supplies_sellers = suppliesSellers

  // ============ Step 10: Fetch Bids ============
  section('10. Fetching bids')

  const bids = await fetchIn(prodDb, 'bids', 'auction_id', auctionIds)
  ok(`${bids.length} bid(s)`)
  const prebids = bids.filter((b) => b.type === 'prebid')
  const realBids = bids.filter((b) => b.type === 'bid')
  info(`  Prebids: ${prebids.length}, Real bids: ${realBids.length}`)
  collectedData.bids = bids
  const bidIds = bids.map((b) => b.id)

  // ============ Step 11: Fetch Bid Supplies ============
  section('11. Fetching bid_supplies')

  let bidSupplies = []
  if (bidIds.length > 0) {
    bidSupplies = await fetchIn(prodDb, 'bid_supplies', 'bid_id', bidIds)
  }
  ok(`${bidSupplies.length} bid_supply record(s)`)
  collectedData.bid_supplies = bidSupplies

  // ============ Step 12: Fetch Bids Handicaps ============
  section('12. Fetching bids_handicaps')

  let bidsHandicaps = []
  if (bidIds.length > 0) {
    bidsHandicaps = await fetchIn(prodDb, 'bids_handicaps', 'bid_id', bidIds)
  }
  ok(`${bidsHandicaps.length} bid_handicap(s)`)
  collectedData.bids_handicaps = bidsHandicaps

  // ============ Step 13: Fetch Trainings ============
  section('13. Fetching trainings')

  let trainings = []
  if (groupId && sellerEmails.length > 0) {
    const { data, error } = await prodDb
      .from('trainings')
      .select('*')
      .eq('auctions_group_settings_id', groupId)
      .in('seller_email', sellerEmails)
    if (!error) trainings = data || []
  }
  ok(`${trainings.length} training record(s)`)
  collectedData.trainings = trainings

  // ============ Profile Mapping ============
  // buyerId already declared above
  const { idMap, emailMap, companyMap, devBuyer } = await buildProfileMapping(allProfiles, buyerId)

  // ============ Remap all data ============
  section('🔄 Remapping all data with DEV profile IDs/emails')

  const remappedGroups = remapData(groups, idMap, emailMap, companyMap)
  const remappedAuctions = remapData(allAuctions, idMap, emailMap, companyMap)
  const remappedSupplies = remapData(supplies, idMap, emailMap, companyMap)
  const remappedSellers = remapData(sellers, idMap, emailMap, companyMap)
  const remappedHandicaps = remapData(handicaps, idMap, emailMap, companyMap)
  const remappedSuppliesSellers = remapData(suppliesSellers, idMap, emailMap, companyMap)
  const remappedBids = remapData(bids, idMap, emailMap, companyMap)
  const remappedBidSupplies = remapData(bidSupplies, idMap, emailMap, companyMap)
  const remappedBidsHandicaps = remapData(bidsHandicaps, idMap, emailMap, companyMap)
  const remappedTrainings = remapData(trainings, idMap, emailMap, companyMap)

  ok('All data remapped')

  // ============ Summary ============
  title('COPY SUMMARY')
  console.log('')
  console.log(`  ${colors.yellow}⚠ profiles: SKIPPED (mapped to existing DEV users)${colors.reset}`)
  console.log(
    `  ${colors.yellow}⚠ companies: SKIPPED (using existing DEV companies)${colors.reset}`
  )
  const tableOrder = [
    ['auctions_group_settings', remappedGroups],
    ['auctions', remappedAuctions],
    ['supplies', remappedSupplies],
    ['auctions_sellers', remappedSellers],
    ['auctions_handicaps', remappedHandicaps],
    ['supplies_sellers', remappedSuppliesSellers],
    ['bids', remappedBids],
    ['bid_supplies', remappedBidSupplies],
    ['bids_handicaps', remappedBidsHandicaps],
    ['trainings', remappedTrainings]
  ]

  let totalRecords = 0
  for (const [table, rows] of tableOrder) {
    const count = rows.length
    totalRecords += count
    const indicator = count > 0 ? colors.green : colors.gray
    console.log(`  ${indicator}${count.toString().padStart(4)}${colors.reset} ${table}`)
  }
  console.log(`  ${colors.bright}${totalRecords.toString().padStart(4)}${colors.reset} TOTAL`)

  // Show mapping summary
  title('PROFILE MAPPING')
  for (const [prodEmail, devEmail] of Object.entries(emailMap)) {
    console.log(
      `  ${colors.gray}${prodEmail}${colors.reset} → ${colors.green}${devEmail}${colors.reset}`
    )
  }

  // ============ Clean DEV (if --clean) ============
  if (clean) {
    await cleanDevData(auctionIds, supplyIds, bidIds, groupId, !confirm)
  }

  // ============ Execute or Dry-Run ============
  if (!confirm) {
    title('🟢 DRY-RUN COMPLETE')
    console.log(`\n  To execute the copy, add ${colors.bright}--confirm${colors.reset}:`)
    console.log(
      `  ${colors.cyan}node scripts/run.js copy-auction-prod-to-dev.js ${auctionId} --prod --confirm${colors.reset}\n`
    )
    await cleanup()
    return
  }

  title('🔴 EXECUTING COPY TO DEV')
  console.log(`  Target: ${devHost}`)
  if (clean) console.log(`  ${colors.yellow}--clean: DEV data already cleaned above${colors.reset}`)
  console.log('')

  let copied = 0

  // NOTE: profiles and companies are NOT copied — we use existing DEV users

  // 1. Auction group settings
  if (remappedGroups.length > 0) {
    const n = await upsertBatch('auctions_group_settings', remappedGroups)
    ok(`auctions_group_settings: ${n} record(s)`)
    copied += n
  }

  // 2. Auctions
  if (remappedAuctions.length > 0) {
    const n = await upsertBatch('auctions', remappedAuctions)
    ok(`auctions: ${n} record(s)`)
    copied += n
  }

  // 3. Supplies
  if (remappedSupplies.length > 0) {
    const n = await upsertBatch('supplies', remappedSupplies)
    ok(`supplies: ${n} record(s)`)
    copied += n
  }

  // 4. Auction sellers (composite key: auction_id + seller_email)
  if (remappedSellers.length > 0) {
    const n = await upsertBatchComposite('auctions_sellers', remappedSellers, [
      'auction_id',
      'seller_email'
    ])
    ok(`auctions_sellers: ${n} record(s)`)
    copied += n
  }

  // 5. Handicaps
  if (remappedHandicaps.length > 0) {
    const n = await upsertBatch('auctions_handicaps', remappedHandicaps)
    ok(`auctions_handicaps: ${n} record(s)`)
    copied += n
  }

  // 6. Supplies sellers (composite key: supply_id + seller_email)
  if (remappedSuppliesSellers.length > 0) {
    const n = await upsertBatchComposite('supplies_sellers', remappedSuppliesSellers, [
      'supply_id',
      'seller_email'
    ])
    ok(`supplies_sellers: ${n} record(s)`)
    copied += n
  }

  // 7. Bids
  if (remappedBids.length > 0) {
    const n = await upsertBatch('bids', remappedBids)
    ok(`bids: ${n} record(s)`)
    copied += n
  }

  // 8. Bid supplies
  if (remappedBidSupplies.length > 0) {
    const n = await upsertBatch('bid_supplies', remappedBidSupplies)
    ok(`bid_supplies: ${n} record(s)`)
    copied += n
  }

  // 9. Bids handicaps
  if (remappedBidsHandicaps.length > 0) {
    const n = await upsertBatchComposite('bids_handicaps', remappedBidsHandicaps, [
      'bid_id',
      'handicap_id'
    ])
    ok(`bids_handicaps: ${n} record(s)`)
    copied += n
  }

  // 10. Trainings
  if (remappedTrainings.length > 0) {
    const n = await upsertBatch('trainings', remappedTrainings)
    ok(`trainings: ${n} record(s)`)
    copied += n
  }

  // ============ Validation ============
  title('VALIDATION')

  // Verify auction exists in DEV
  const { data: devAuction } = await devDb
    .from('auctions')
    .select('id, name, type')
    .eq('id', auctionId)
    .single()

  if (devAuction) {
    ok(`Auction verified in DEV: "${devAuction.name}" (${devAuction.type})`)
  } else {
    err('Auction NOT found in DEV after copy!')
  }

  // Count records in DEV
  for (const id of auctionIds) {
    const { count: devBidCount } = await devDb
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('auction_id', id)
    info(`Bids for lot ${id.slice(0, 8)}...: ${devBidCount}`)
  }

  // ============ Done ============
  title('✅ COPY COMPLETE')
  console.log(`\n  ${colors.bright}${copied} total records copied to DEV${colors.reset}`)
  console.log(`\n  🔗 DEV URLs:`)

  if (groupId) {
    for (const a of allAuctions) {
      console.log(
        `  Buyer:  https://dev.crown-procurement.com/auctions/${groupId}/lots/${a.id}/buyer`
      )
      console.log(
        `  Seller: https://dev.crown-procurement.com/auctions/${groupId}/lots/${a.id}/seller`
      )
    }
  } else {
    console.log(`  https://dev.crown-procurement.com/auctions/${auctionId}`)
  }
  console.log('')

  await cleanup()
}

async function cleanup() {
  try {
    await prodDb.removeAllChannels?.()
    await devDb.removeAllChannels?.()
  } catch (e) {
    /* ignore */
  }
}

main().catch((e) => {
  console.error(`${colors.red}Fatal: ${e.message}${colors.reset}`)
  console.error(e.stack)
  process.exit(1)
})
