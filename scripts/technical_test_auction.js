#!/usr/bin/env node

/**
 * Technical Test Script for eAuction
 *
 * Usage: node scripts/technical_test_auction.js <auction_group_id>
 *
 * This script checks that everything is properly configured for an auction:
 * - Supabase: auction group, lots, supplies, sellers, handicaps
 * - Google Cloud: Cloud Tasks queues accessibility
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { CloudTasksClient } from '@google-cloud/tasks'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'
import { spawnSync } from 'child_process'

dayjs.extend(relativeTime)

// ============ Expected Endpoints ============
const EXPECTED_ENDPOINTS = {
  dutch: '/api/v1/dutch/auto_bid',
  japanese: '/api/v1/japanese/round_handler'
}

// ============ Valid ISO 4217 Currency Codes ============
const VALID_CURRENCIES = new Set([
  'EUR',
  'USD',
  'GBP',
  'CHF',
  'JPY',
  'CAD',
  'AUD',
  'CNY',
  'INR',
  'BRL',
  'MXN',
  'KRW',
  'SGD',
  'HKD',
  'NOK',
  'SEK',
  'DKK',
  'NZD',
  'ZAR',
  'RUB',
  'PLN',
  'CZK',
  'HUF',
  'RON',
  'BGN',
  'HRK',
  'TRY',
  'ILS',
  'AED',
  'SAR',
  'THB',
  'MYR',
  'IDR',
  'PHP',
  'VND',
  'TWD',
  'ARS',
  'CLP',
  'COP',
  'PEN'
])

// ============ Configuration ============
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ADMIN_KEY || process.env.SUPABASE_SERVICE_KEY
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY

const GCP_PROJECT = 'crown-476614'
const GCP_LOCATION = 'europe-west1'
const GCP_QUEUES = ['BidWatchQueue', 'JaponeseRoundHandler']

// ============ Colors for console output ============
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

const log = {
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}═══ ${msg} ═══${colors.reset}`),
  section: (msg) => console.log(`\n${colors.cyan}▶ ${msg}${colors.reset}`),
  success: (msg) => console.log(`  ${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`  ${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`  ${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`  ${colors.gray}ℹ${colors.reset} ${msg}`),
  item: (msg) => console.log(`    ${colors.gray}•${colors.reset} ${msg}`)
}

// ============ Results tracking ============
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: []
}

function pass(msg) {
  results.passed++
  log.success(msg)
}

function fail(msg) {
  results.failed++
  results.errors.push(msg)
  log.error(msg)
}

function warn(msg) {
  results.warnings++
  log.warning(msg)
}

// ============ Helper Functions ============

// Parse Cloud Task body (handles Uint8Array, Buffer, or base64 string)
function parseTaskBody(bodyRaw) {
  if (!bodyRaw) return null
  let payloadJson
  if (bodyRaw instanceof Uint8Array || Buffer.isBuffer(bodyRaw)) {
    payloadJson = Buffer.from(bodyRaw).toString('utf-8')
  } else if (typeof bodyRaw === 'string') {
    payloadJson = Buffer.from(bodyRaw, 'base64').toString('utf-8')
  } else {
    throw new Error(`Unknown body type: ${typeof bodyRaw}`)
  }
  return JSON.parse(payloadJson)
}

// Ping a webhook endpoint to check if it's reachable
async function pingEndpoint(url) {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    })
    clearTimeout(timeout)

    return { ok: true, status: response.status }
  } catch (error) {
    return { ok: false, error: error.message }
  }
}

// Calculate expected Dutch round time for a given price
function calculateDutchRoundTime(auction, price) {
  if (!auction.max_bid_decr || !auction.min_bid_decr || !auction.overtime_range) {
    return null
  }

  const maxRounds = Math.ceil(auction.duration / auction.overtime_range) - 1
  const startingPrice = auction.max_bid_decr - maxRounds * auction.min_bid_decr

  // Which round is this price in?
  const roundNumber = Math.round((price - startingPrice) / auction.min_bid_decr)

  // Calculate time for that round
  const startAt = dayjs(auction.start_at)
  const roundStartTime = startAt.add(roundNumber * auction.overtime_range, 'minute')

  return { roundNumber, roundStartTime, maxRounds }
}

// ============ GCloud Auth Helper ============
async function ensureGCloudAuth() {
  try {
    // Try to create a client and make a simple call to test credentials
    const testClient = new CloudTasksClient()
    const queuePath = testClient.queuePath(GCP_PROJECT, GCP_LOCATION, GCP_QUEUES[0])
    await testClient.getQueue({ name: queuePath })
    return testClient
  } catch (error) {
    if (error.message.includes('Could not load the default credentials')) {
      log.warning('GCloud credentials not found, launching authentication...')
      console.log(
        `\n${colors.yellow}Opening browser for Google Cloud authentication...${colors.reset}\n`
      )

      // Run gcloud auth application-default login
      const result = spawnSync('gcloud', ['auth', 'application-default', 'login'], {
        stdio: 'inherit',
        shell: true
      })

      if (result.status !== 0) {
        throw new Error(
          'GCloud authentication failed. Please run manually: gcloud auth application-default login'
        )
      }

      console.log(`\n${colors.green}Authentication successful!${colors.reset}\n`)

      // Return a new client with the fresh credentials
      return new CloudTasksClient()
    }
    throw error
  }
}

async function cleanupClients(supabase, tasksClient) {
  // Close Cloud Tasks gRPC channel (keeps event loop alive if left open)
  try {
    if (tasksClient && typeof tasksClient.close === 'function') {
      await tasksClient.close()
    }
  } catch (e) {
    // ignore cleanup errors
  }

  // Close Supabase realtime connections so the script can exit
  try {
    if (supabase) {
      await supabase.removeAllChannels?.()
      await supabase.realtime?.close?.()
    }
  } catch (e) {
    // ignore cleanup errors
  }
}

// ============ Main Script ============
async function main() {
  const auctionGroupId = process.argv[2]

  if (!auctionGroupId) {
    console.error(
      `${colors.red}Usage: node scripts/technical_test_auction.js <auction_group_id>${colors.reset}`
    )
    console.error('\nExample: node scripts/technical_test_auction.js abc123-def456-...')
    process.exit(1)
  }

  if (!SUPABASE_KEY) {
    console.error(
      `${colors.red}Error: SUPABASE_ADMIN_KEY or SUPABASE_SERVICE_KEY environment variable is required${colors.reset}`
    )
    process.exit(1)
  }

  log.title('TECHNICAL TEST - eAuction')
  console.log(`${colors.gray}Auction Group ID: ${auctionGroupId}${colors.reset}`)
  console.log(`${colors.gray}Date: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}${colors.reset}`)

  // Initialize Supabase
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  })

  let tasksClient // keep reference for cleanup

  // ============ 1. Check Auction Group ============
  log.section('1. Auction Group')

  const { data: auctionGroup, error: groupError } = await supabase
    .from('auctions_group_settings')
    .select('*')
    .eq('id', auctionGroupId)
    .single()

  if (groupError || !auctionGroup) {
    fail(`Auction group not found: ${auctionGroupId}`)
    printSummary()
    process.exit(1)
  }

  pass(`Auction group found: "${auctionGroup.name}"`)
  log.info(`Timing rule: ${auctionGroup.timing_rule || 'not set'}`)
  log.info(`Buyer ID: ${auctionGroup.buyer_id}`)

  // ============ 2. Check Auctions (Lots) ============
  log.section('2. Auctions (Lots)')

  const { data: auctions, error: auctionsError } = await supabase
    .from('auctions')
    .select('*')
    .eq('auctions_group_settings_id', auctionGroupId)
    .order('lot_number', { ascending: true })

  if (auctionsError) {
    fail(`Error fetching auctions: ${auctionsError.message}`)
  } else if (!auctions || auctions.length === 0) {
    fail('No auctions found in this group')
  } else {
    pass(`Found ${auctions.length} auction(s)`)
  }

  // Check each auction
  for (const auction of auctions || []) {
    console.log(
      `\n  ${colors.bright}Lot ${auction.lot_number}: ${auction.name || auction.lot_name || 'Unnamed'}${colors.reset}`
    )

    // Basic info
    log.info(`ID: ${auction.id}`)
    log.info(`Type: ${auction.type}`)
    log.info(`Status: ${auction.published ? 'Published' : 'Draft'}`)

    // Timing checks
    const now = dayjs()
    const startAt = dayjs(auction.start_at)
    const endAt = dayjs(auction.end_at)

    if (!auction.start_at) {
      fail('Start date not set')
    } else if (startAt.isBefore(now)) {
      if (endAt.isAfter(now)) {
        warn(`Auction is ACTIVE (started ${startAt.fromNow()})`)
      } else {
        warn(`Auction has ENDED (${endAt.fromNow()})`)

        // Show winner for ended auctions
        // Get all bids (both 'bid' and 'prebid' types) and find the lowest price
        const {
          data: allBids,
          error: bidsError,
          count: bidsCount
        } = await supabase
          .from('bids')
          .select('id, price, type, seller_id, seller_email', { count: 'exact' })
          .eq('auction_id', auction.id)
          .order('price', { ascending: true })

        // Debug - can be removed later
        // log.info(`DEBUG: auction.id=${auction.id}, bidsCount=${bidsCount}, allBids=${JSON.stringify(allBids?.slice(0,2))}`)

        if (bidsError) {
          log.info(`Could not fetch bids: ${bidsError.message}`)
        } else if (allBids && allBids.length > 0) {
          const winningBid = allBids[0]

          // Fetch winner profile - try multiple methods
          let winnerName = 'Unknown'
          let winnerCompany = ''

          // Method 1: Try to get from profiles table using seller_id
          if (winningBid.seller_id) {
            const { data: winnerProfile } = await supabase
              .from('profiles')
              .select('email, first_name, last_name')
              .eq('id', winningBid.seller_id)
              .single()

            if (winnerProfile) {
              const fullName =
                `${winnerProfile.first_name || ''} ${winnerProfile.last_name || ''}`.trim()
              winnerName = fullName || winnerProfile.email || 'Unknown'

              // Try to get company from auctions_sellers
              const { data: sellerData } = await supabase
                .from('auctions_sellers')
                .select('profiles(company)')
                .eq('auction_id', auction.id)
                .eq('seller_email', winnerProfile.email)
                .single()

              if (sellerData?.profiles?.company) {
                winnerCompany = ` (${sellerData.profiles.company})`
              }
            }
          }

          // Method 2: If still unknown, try auctions_sellers to get email using seller_email match
          if (winnerName === 'Unknown') {
            // Get all sellers for this auction and try to match by seller_id
            const { data: allSellers } = await supabase
              .from('auctions_sellers')
              .select('seller_email, profiles(id, first_name, last_name)')
              .eq('auction_id', auction.id)

            if (allSellers) {
              const matchingSeller = allSellers.find((s) => s.profiles?.id === winningBid.seller_id)
              if (matchingSeller) {
                const fullName =
                  `${matchingSeller.profiles?.first_name || ''} ${matchingSeller.profiles?.last_name || ''}`.trim()
                winnerName = fullName || matchingSeller.seller_email
              }
            }
          }

          // Method 3: Use seller_email from bid if available
          if (winnerName === 'Unknown' && winningBid.seller_email) {
            winnerName = winningBid.seller_email
          }

          const priceFormatted = new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: auction.currency || 'EUR'
          }).format(winningBid.price)
          const bidType = winningBid.type === 'prebid' ? ' (prebid)' : ''
          log.success(`🏆 Winner: ${winnerName}${winnerCompany} @ ${priceFormatted}${bidType}`)
        } else {
          log.info('No bids placed - no winner')
        }
      }
    } else {
      pass(`Starts ${startAt.fromNow()} (${startAt.format('DD/MM/YYYY HH:mm')})`)
    }

    if (!auction.end_at) {
      fail('End date not set')
    } else {
      log.info(`Ends: ${endAt.format('DD/MM/YYYY HH:mm')} (duration: ${auction.duration}min)`)
    }

    // Configuration checks
    if (!auction.currency) {
      fail('Currency not set')
    } else {
      pass(`Currency: ${auction.currency}`)
    }

    if (auction.type === 'dutch') {
      if (!auction.max_bid_decr) warn('max_bid_decr not set (Dutch auction)')
      if (!auction.min_bid_decr) warn('min_bid_decr not set (Dutch auction)')
      log.info(`Dutch prebid: ${auction.dutch_prebid_enabled ? 'Enabled' : 'Disabled'}`)
    }

    if (auction.type === 'japanese') {
      if (!auction.overtime_range) warn('overtime_range not set (Japanese auction)')
      log.info(`Round duration: ${auction.overtime_range} min`)
    }

    // ============ 3. Check Supplies ============
    const { data: supplies, error: suppliesError } = await supabase
      .from('supplies')
      .select('*')
      .eq('auction_id', auction.id)
      .order('index', { ascending: true })

    if (suppliesError) {
      fail(`Error fetching supplies: ${suppliesError.message}`)
    } else if (!supplies || supplies.length === 0) {
      fail('No supplies (line items) configured')
    } else {
      pass(`${supplies.length} supply line(s) configured`)
      for (const supply of supplies) {
        log.item(`${supply.name}: ${supply.quantity} ${supply.unit}`)
      }
    }

    // ============ 4. Check Sellers ============
    const { data: sellers, error: sellersError } = await supabase
      .from('auctions_sellers')
      .select('*')
      .eq('auction_id', auction.id)

    if (sellersError) {
      fail(`Error fetching sellers: ${sellersError.message}`)
    } else if (!sellers || sellers.length === 0) {
      fail('No sellers invited')
    } else {
      pass(`${sellers.length} seller(s) invited`)

      // Check if sellers have profiles
      const sellerEmails = sellers.map((s) => s.seller_email)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('email, first_name, last_name, companies(name)')
        .in('email', sellerEmails)

      const profileMap = new Map(profiles?.map((p) => [p.email, p]) || [])

      for (const seller of sellers) {
        const profile = profileMap.get(seller.seller_email)
        const termsStatus = seller.terms_accepted ? '✓ terms accepted' : '○ terms pending'

        if (profile) {
          const company = profile.companies?.name || 'No company'
          log.item(
            `${seller.seller_email} - ${profile.first_name} ${profile.last_name} (${company}) [${termsStatus}]`
          )
        } else {
          log.item(
            `${seller.seller_email} - ${colors.yellow}No profile yet${colors.reset} [${termsStatus}]`
          )
        }
      }
    }

    // ============ 5. Check Supplies Sellers (Ceilings) ============
    if (supplies && supplies.length > 0 && sellers && sellers.length > 0) {
      const supplyIds = supplies.map((s) => s.id)
      const sellerEmails = sellers.map((s) => s.seller_email)

      const { data: suppliesSellers, error: ssError } = await supabase
        .from('supplies_sellers')
        .select('*')
        .in('supply_id', supplyIds)
        .in('seller_email', sellerEmails)

      const expectedCount = supplies.length * sellers.length
      const actualCount = suppliesSellers?.length || 0

      if (ssError) {
        fail(`Error fetching supplies_sellers: ${ssError.message}`)
      } else if (actualCount === 0) {
        fail('No ceiling prices configured for sellers')
      } else if (actualCount < expectedCount) {
        warn(`Only ${actualCount}/${expectedCount} ceiling prices configured`)
      } else {
        pass(`All ${actualCount} ceiling prices configured`)
      }

      // Check for zero or null ceilings
      const zeroCeilings = suppliesSellers?.filter((ss) => !ss.ceiling || ss.ceiling <= 0) || []
      if (zeroCeilings.length > 0) {
        warn(`${zeroCeilings.length} ceiling(s) have zero or null value`)
      }
    }

    // ============ 6. Check Handicaps ============
    const { data: handicaps } = await supabase
      .from('auctions_handicaps')
      .select('*')
      .eq('auction_id', auction.id)

    if (handicaps && handicaps.length > 0) {
      pass(`${handicaps.length} handicap option(s) configured`)
      const groups = [...new Set(handicaps.map((h) => h.group_name))]
      log.info(`Groups: ${groups.join(', ')}`)
    } else {
      log.info('No handicaps configured (optional)')
    }

    // ============ 7. Check Existing Bids ============
    const { data: bids, count: bidCount } = await supabase
      .from('bids')
      .select('*', { count: 'exact' })
      .eq('auction_id', auction.id)

    if (bidCount > 0) {
      log.info(`${bidCount} bid(s) already placed`)

      // Check for scheduled Cloud Tasks (Dutch prebids)
      if (auction.type === 'dutch') {
        const scheduledBids = bids?.filter((b) => b.cloud_task) || []
        if (scheduledBids.length > 0) {
          log.info(`${scheduledBids.length} prebid(s) scheduled in Cloud Tasks`)
        }
      }

      // Verify last_bid_time consistency
      if (bids && bids.length > 0) {
        const lastBid = bids.reduce((latest, bid) => {
          return new Date(bid.created_at) > new Date(latest.created_at) ? bid : latest
        })
        const dbLastBidTime = auction.last_bid_time ? dayjs(auction.last_bid_time) : null
        const actualLastBidTime = dayjs(lastBid.created_at)

        if (!dbLastBidTime) {
          warn('last_bid_time not set but bids exist')
        } else if (Math.abs(dbLastBidTime.diff(actualLastBidTime, 'second')) > 5) {
          warn(
            `last_bid_time mismatch: DB=${dbLastBidTime.format('HH:mm:ss')} vs actual=${actualLastBidTime.format('HH:mm:ss')}`
          )
        }
      }
    }

    // ============ 8. Check bid_supplies consistency ============
    if (bids && bids.length > 0 && supplies && supplies.length > 0) {
      const bidIds = bids.map((b) => b.id)
      const { data: bidSupplies } = await supabase
        .from('bid_supplies')
        .select('*')
        .in('bid_id', bidIds)

      if (bidSupplies && bidSupplies.length > 0) {
        // Check each bid has bid_supplies for all supplies
        for (const bid of bids) {
          const bidSupplyCount = bidSupplies.filter((bs) => bs.bid_id === bid.id).length
          if (bidSupplyCount !== supplies.length && bidSupplyCount > 0) {
            warn(
              `Bid ${bid.id.slice(0, 8)}... has ${bidSupplyCount}/${supplies.length} bid_supplies`
            )
          }
        }
        pass(`${bidSupplies.length} bid_supplies entries verified`)
      }
    }

    // ============ 9. Check bids_handicaps consistency ============
    if (bids && bids.length > 0 && handicaps && handicaps.length > 0) {
      const bidIds = bids.map((b) => b.id)
      const handicapIds = handicaps.map((h) => h.id)

      const { data: bidsHandicaps } = await supabase
        .from('bids_handicaps')
        .select('*')
        .in('bid_id', bidIds)

      if (bidsHandicaps && bidsHandicaps.length > 0) {
        // Check all handicap references are valid
        const invalidHandicaps = bidsHandicaps.filter((bh) => !handicapIds.includes(bh.handicap_id))
        if (invalidHandicaps.length > 0) {
          fail(`${invalidHandicaps.length} bids_handicaps reference invalid handicap_id`)
        } else {
          pass(`${bidsHandicaps.length} bids_handicaps entries verified`)
        }
      }
    }

    // ============ 10. Terms acceptance status ============
    if (sellers && sellers.length > 0) {
      const acceptedCount = sellers.filter((s) => s.terms_accepted).length
      if (acceptedCount === sellers.length) {
        pass(`All ${acceptedCount} sellers accepted terms`)
      } else if (acceptedCount > 0) {
        warn(`${acceptedCount}/${sellers.length} sellers accepted terms`)
      } else {
        log.info('No sellers have accepted terms yet')
      }
    }

    // ============ 11. Timing consistency ============
    if (auction.start_at && auction.end_at && auction.duration) {
      const calculatedDuration = dayjs(auction.end_at).diff(dayjs(auction.start_at), 'minute')
      const auctionEnded = dayjs().isAfter(dayjs(auction.end_at))

      if (calculatedDuration !== auction.duration) {
        // For Dutch auctions that have ended, shorter duration is expected (early win)
        if (auction.type === 'dutch' && auctionEnded && calculatedDuration < auction.duration) {
          log.info(
            `Auction ended early (${calculatedDuration}min of ${auction.duration}min planned) - winner bid placed`
          )
        } else if (!auctionEnded) {
          // Only warn for ongoing/upcoming auctions
          warn(
            `Duration mismatch: DB=${auction.duration}min vs calculated=${calculatedDuration}min`
          )
        }
      }
    }

    // ============ 12. Dutch pricing verification ============
    if (
      auction.type === 'dutch' &&
      auction.max_bid_decr &&
      auction.min_bid_decr &&
      auction.overtime_range &&
      auction.duration
    ) {
      const maxRounds = Math.ceil(auction.duration / auction.overtime_range) - 1
      const startingPrice = auction.max_bid_decr - maxRounds * auction.min_bid_decr

      log.info(
        `Dutch pricing: ${maxRounds} rounds, starting at ${startingPrice}, ending at ${auction.max_bid_decr}`
      )

      if (startingPrice <= 0) {
        fail(`Dutch starting price would be ${startingPrice} (<=0)`)
      } else {
        pass(`Dutch pricing valid: ${startingPrice} → ${auction.max_bid_decr}`)
      }
    }

    // ============ 13. Japanese exit_time check ============
    if (auction.type === 'japanese' && sellers && sellers.length > 0) {
      const exitedSellers = sellers.filter((s) => s.exit_time)
      const activeSellers = sellers.filter((s) => !s.exit_time)

      if (exitedSellers.length > 0) {
        log.info(`Japanese: ${activeSellers.length} active, ${exitedSellers.length} exited`)
        for (const seller of exitedSellers) {
          log.item(`${seller.seller_email} exited at ${dayjs(seller.exit_time).format('HH:mm:ss')}`)
        }
      }
    }

    // ============ 14. Soft delete check ============
    if (auction.deleted) {
      fail('Auction is soft-deleted (deleted=true)')
    }

    // ============ 15. Published status ============
    const auctionStartAt = dayjs(auction.start_at)
    const currentTime = dayjs()
    if (!auction.published && auctionStartAt.diff(currentTime, 'hour') < 24) {
      warn('Auction starts in < 24h but is NOT published')
    }

    // ============ 16. Auction Configuration Details ============
    // Timezone
    if (!auction.timezone) {
      log.info('Timezone not set (will use default)')
    } else {
      log.info(`Timezone: ${auction.timezone}`)
    }

    // Log visibility
    if (auction.log_visibility) {
      log.info(`Log visibility: ${auction.log_visibility}`)
    }

    // Rank settings
    if (auction.max_rank_displayed !== undefined && auction.max_rank_displayed !== null) {
      if (auction.max_rank_displayed === 0) {
        log.info('Ranks hidden (max_rank_displayed=0)')
      } else if (auction.max_rank_displayed < 100) {
        log.info(`Ranks visible up to position ${auction.max_rank_displayed}`)
      }
    }
    if (auction.rank_per_line_item) {
      log.info('Rank per line item: ENABLED')
    }
    if (auction.rank_trigger && auction.rank_trigger !== 'all') {
      log.info(`Rank trigger: ${auction.rank_trigger}`)
    }

    // Baseline
    if (auction.baseline) {
      log.info(`Baseline price: ${auction.baseline} ${auction.currency || ''}`)
    }

    // ============ 17. Seller data integrity ============
    if (sellers && sellers.length > 0) {
      // Check for duplicate sellers
      const emailCounts = {}
      for (const s of sellers) {
        emailCounts[s.seller_email] = (emailCounts[s.seller_email] || 0) + 1
      }
      const duplicates = Object.entries(emailCounts).filter(([, count]) => count > 1)
      if (duplicates.length > 0) {
        fail(
          `Duplicate sellers found: ${duplicates.map(([email, count]) => `${email} (${count}x)`).join(', ')}`
        )
      }

      // Verify seller_id in bids matches profile with that email
      if (bids && bids.length > 0) {
        const sellerEmails = sellers.map((s) => s.seller_email)
        const { data: sellerProfiles } = await supabase
          .from('profiles')
          .select('id, email')
          .in('email', sellerEmails)

        const emailToProfileId = new Map(sellerProfiles?.map((p) => [p.email, p.id]) || [])

        for (const bid of bids) {
          if (bid.seller_email && bid.seller_id) {
            const expectedProfileId = emailToProfileId.get(bid.seller_email)
            if (expectedProfileId && expectedProfileId !== bid.seller_id) {
              warn(
                `Bid ${bid.id.slice(0, 8)}...: seller_id doesn't match profile for ${bid.seller_email}`
              )
            }
          }
          // Verify bid seller_email is in auctions_sellers
          if (bid.seller_email && !sellerEmails.includes(bid.seller_email)) {
            fail(
              `Bid ${bid.id.slice(0, 8)}...: seller_email "${bid.seller_email}" not in auctions_sellers`
            )
          }
        }
      }
    }

    // ============ 18. Supplies index check ============
    if (supplies && supplies.length > 1) {
      const hasIndex = supplies.every((s) => s.index !== null && s.index !== undefined)
      if (!hasIndex) {
        warn('Some supplies missing index (ordering may be incorrect)')
      }
      // Check for duplicate indexes
      const indexCounts = {}
      for (const s of supplies) {
        if (s.index !== null) {
          indexCounts[s.index] = (indexCounts[s.index] || 0) + 1
        }
      }
      const dupIndexes = Object.entries(indexCounts).filter(([, count]) => count > 1)
      if (dupIndexes.length > 0) {
        warn(`Duplicate supply indexes: ${dupIndexes.map(([idx]) => idx).join(', ')}`)
      }
    }

    // ============ 19. Dutch ceiling vs end price check ============
    if (auction.type === 'dutch' && auction.max_bid_decr && supplies && supplies.length > 0) {
      const supplyIds = supplies.map((s) => s.id)
      const { data: suppliesSellersData } = await supabase
        .from('supplies_sellers')
        .select('*, supplies(name)')
        .in('supply_id', supplyIds)

      if (suppliesSellersData && suppliesSellersData.length > 0) {
        // For Dutch, ceiling should generally be >= max_bid_decr (end price)
        // This is per supply so we need to consider quantities
        let ceilingIssues = 0
        for (const ss of suppliesSellersData) {
          if (ss.ceiling && ss.ceiling < auction.max_bid_decr * 0.5) {
            // Flag if ceiling is less than 50% of end price (might be intentional but worth warning)
            ceilingIssues++
          }
        }
        if (ceilingIssues > 0) {
          log.info(
            `${ceilingIssues} ceiling(s) significantly below Dutch end price (may be intentional)`
          )
        }
      }
    }

    // ============ 20. Supplies_sellers additive/multiplicative check ============
    if (supplies && supplies.length > 0 && sellers && sellers.length > 0) {
      const supplyIds = supplies.map((s) => s.id)
      const sellerEmails = sellers.map((s) => s.seller_email)

      const { data: ssData } = await supabase
        .from('supplies_sellers')
        .select('*')
        .in('supply_id', supplyIds)
        .in('seller_email', sellerEmails)

      if (ssData && ssData.length > 0) {
        const hasHandicaps = ssData.some((ss) => ss.additive !== 0 || ss.multiplicative !== 1)
        if (hasHandicaps) {
          const withAdditive = ssData.filter((ss) => ss.additive !== 0).length
          const withMulti = ssData.filter((ss) => ss.multiplicative !== 1).length
          log.info(`Supply handicaps: ${withAdditive} additive, ${withMulti} multiplicative`)
        }
      }
    }
  }

  // ============ 8. Check Google Cloud Tasks ============
  log.section('3. Google Cloud Tasks')

  tasksClient
  const allCloudTasks = new Map() // taskName -> task

  try {
    // This will auto-login if credentials are missing
    tasksClient = await ensureGCloudAuth()

    for (const queueName of GCP_QUEUES) {
      const queuePath = tasksClient.queuePath(GCP_PROJECT, GCP_LOCATION, queueName)

      try {
        const [queue] = await tasksClient.getQueue({ name: queuePath })
        pass(`Queue "${queueName}" accessible`)
        log.info(`State: ${queue.state}`)

        // List ALL tasks in queue (paginate if needed)
        let pageToken = null
        let totalTasks = 0

        do {
          const [tasks, , response] = await tasksClient.listTasks({
            parent: queuePath,
            pageSize: 100,
            pageToken,
            responseView: 'FULL' // Required to get the task body
          })

          for (const task of tasks) {
            allCloudTasks.set(task.name, task)
            totalTasks++
          }

          pageToken = response?.nextPageToken
        } while (pageToken)

        if (totalTasks > 0) {
          log.info(`${totalTasks} task(s) in queue`)
        } else {
          log.info('Queue is empty')
        }
      } catch (queueError) {
        fail(`Queue "${queueName}" not accessible: ${queueError.message}`)
      }
    }
  } catch (gcpError) {
    fail(`Google Cloud Tasks error: ${gcpError.message}`)
    if (gcpError.message.includes('credentials')) {
      log.info('Authentication failed. Try running manually: gcloud auth application-default login')
    }
  }

  // ============ 9. Verify Cloud Tasks Payloads vs Database ============
  log.section('4. Cloud Tasks Payload Verification')

  for (const auction of auctions || []) {
    console.log(
      `\n  ${colors.bright}Lot ${auction.lot_number}: ${auction.name || auction.lot_name || 'Unnamed'} (${auction.type})${colors.reset}`
    )

    if (auction.type === 'dutch') {
      // First, detect prebids that exist in DB but are NOT scheduled in Cloud Tasks
      const { data: prebidsWithoutTask } = await supabase
        .from('bids')
        .select('*, profiles(email, first_name, last_name)')
        .eq('auction_id', auction.id)
        .eq('type', 'prebid')
        .is('cloud_task', null)

      if (prebidsWithoutTask && prebidsWithoutTask.length > 0) {
        fail(
          `${prebidsWithoutTask.length} prebid(s) missing cloud_task (not scheduled in Cloud Tasks)`
        )
        for (const bid of prebidsWithoutTask) {
          const sellerDisplay = bid.profiles?.email || bid.seller_email
          log.item(
            `MISSING TASK for prebid ${bid.id.slice(0, 8)}... (${sellerDisplay}) price=${bid.price}`
          )
        }
      }

      // Get all bids with cloud_task for this auction
      const { data: bidsWithTasks } = await supabase
        .from('bids')
        .select('*, profiles(email, first_name, last_name)')
        .eq('auction_id', auction.id)
        .not('cloud_task', 'is', null)

      // ============ DUTCH AUCTION: Verify prebids ============
      if (!bidsWithTasks || bidsWithTasks.length === 0) {
        log.info('No scheduled prebids found')
        continue
      }

      log.info(`${bidsWithTasks.length} prebid(s) with cloud_task reference`)

      let matchedTasks = 0
      let missingTasks = 0
      let payloadMismatches = 0

      for (const bid of bidsWithTasks) {
        const taskName = bid.cloud_task
        const task = allCloudTasks.get(taskName)

        if (!task) {
          // Task is missing from queue - check if it was already executed
          // A prebid task is removed from queue after successful execution

          // For Dutch auctions: check if there's ANY 'bid' type record from the same seller
          // The bid price can be different from prebid price (bid is placed at current round price)
          const { data: executedBids } = await supabase
            .from('bids')
            .select('id, price, type, created_at')
            .eq('auction_id', auction.id)
            .eq('seller_id', bid.seller_id)
            .eq('type', 'bid')
            .order('created_at', { ascending: false })
            .limit(1)

          const wasExecuted = executedBids && executedBids.length > 0
          const auctionEnded = dayjs().isAfter(dayjs(auction.end_at))

          if (wasExecuted) {
            // Task executed successfully - a real bid was placed
            matchedTasks++
            const executedBid = executedBids[0]
            const priceFormatted = new Intl.NumberFormat('fr-FR').format(executedBid.price)
            log.item(
              `${colors.green}EXECUTED${colors.reset} Task for bid ${bid.id.slice(0, 8)}... (${bid.profiles?.email || bid.seller_email})`
            )
            log.item(
              `  Bid placed at ${priceFormatted} on ${dayjs(executedBid.created_at).format('HH:mm:ss')}`
            )
          } else if (auctionEnded) {
            // Auction ended but no bid was placed - prebid was cancelled or seller didn't participate
            log.item(
              `${colors.yellow}NOT EXECUTED${colors.reset} Task for bid ${bid.id.slice(0, 8)}... (${bid.profiles?.email || bid.seller_email})`
            )
            log.item(
              `  Prebid at ${new Intl.NumberFormat('fr-FR').format(bid.price)} was not converted to a bid`
            )
          } else {
            // Task is missing but auction is still ongoing - this is a problem
            missingTasks++
            log.item(
              `${colors.red}MISSING${colors.reset} Task for bid ${bid.id.slice(0, 8)}... (${bid.profiles?.email || bid.seller_email})`
            )
            log.item(`  Expected: ${taskName}`)
          }
          continue
        }

        // Verify task is in the correct queue (BidWatchQueue for Dutch)
        const expectedQueuePath = `projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/queues/BidWatchQueue`
        if (!task.name.startsWith(expectedQueuePath)) {
          fail(`Task for bid ${bid.id.slice(0, 8)}... is in WRONG QUEUE! Expected BidWatchQueue`)
          log.item(`  Actual: ${task.name}`)
        }

        // Decode and verify payload
        try {
          const payload = parseTaskBody(task.httpRequest?.body)
          if (!payload) {
            throw new Error('Empty payload')
          }

          // ====== ADVANCED CHECKS ======

          // 1. Verify HTTP method
          const httpMethod = task.httpRequest?.httpMethod
          if (httpMethod !== 'POST') {
            warn(`Task uses ${httpMethod} instead of POST`)
          }

          // 2. Verify URL endpoint
          const taskUrl = task.httpRequest?.url
          const expectedEndpoint = EXPECTED_ENDPOINTS.dutch
          if (taskUrl && !taskUrl.includes(expectedEndpoint)) {
            warn(
              `Task URL doesn't match expected endpoint: ${taskUrl} (expected: *${expectedEndpoint})`
            )
          }

          // 3. Verify schedule time
          const scheduleTime = task.scheduleTime?.seconds
          const scheduledAt = scheduleTime ? dayjs.unix(scheduleTime) : null
          const auctionStart = dayjs(auction.start_at)
          const auctionEnd = dayjs(auction.end_at)

          if (scheduledAt) {
            // Check if scheduled AFTER auction starts
            if (scheduledAt.isBefore(auctionStart)) {
              warn(`Bid ${bid.id.slice(0, 8)}... scheduled BEFORE auction starts!`)
            }
            // Check if scheduled AFTER auction ends
            if (scheduledAt.isAfter(auctionEnd)) {
              // Check if there's already a lower bid - if so, this is expected (prebid won't execute)
              const { data: lowerBids } = await supabase
                .from('bids')
                .select('id, price')
                .eq('auction_id', auction.id)
                .eq('type', 'bid')
                .lt('price', bid.price)
                .limit(1)

              const sellerInfo = bid.profiles?.email || bid.seller_email
              if (lowerBids && lowerBids.length > 0) {
                log.info(
                  `Bid ${bid.id.slice(0, 8)}... (${sellerInfo}) won't execute (lower bid exists at ${new Intl.NumberFormat('fr-FR').format(lowerBids[0].price)})`
                )
              } else {
                warn(`Bid ${bid.id.slice(0, 8)}... (${sellerInfo}) scheduled AFTER auction ends!`)
              }
            }
          }

          // 4. Verify price/round coherence
          const roundInfo = calculateDutchRoundTime(auction, bid.price)
          if (roundInfo && scheduledAt) {
            const expectedTime = roundInfo.roundStartTime.subtract(5, 'second') // 5 sec buffer
            const timeDiff = Math.abs(scheduledAt.diff(expectedTime, 'second'))

            // Allow 10 seconds tolerance
            if (timeDiff > 10) {
              warn(
                `Bid ${bid.id.slice(0, 8)}... price=${bid.price} (round ${roundInfo.roundNumber}): schedule mismatch by ${timeDiff}s`
              )
            }
          }

          // ====== PAYLOAD VERIFICATION ======
          const issues = []
          const payloadBidId = payload.id || payload.bid_id || payload.bidId
          const payloadAuctionId = payload.auction_id || payload.auctionId
          const payloadSellerId = payload.seller_id || payload.sellerId

          if (payloadBidId !== bid.id) {
            issues.push(`bid_id mismatch: payload=${payloadBidId}, db=${bid.id}`)
          }
          if (payloadAuctionId !== bid.auction_id) {
            issues.push(`auction_id mismatch: payload=${payloadAuctionId}, db=${bid.auction_id}`)
          }
          if (payloadSellerId !== bid.seller_id) {
            issues.push(`seller_id mismatch: payload=${payloadSellerId}, db=${bid.seller_id}`)
          }
          if (payload.price !== undefined && payload.price !== bid.price) {
            issues.push(`price mismatch: payload=${payload.price}, db=${bid.price}`)
          }

          const sellerDisplay = bid.profiles?.email || bid.seller_email
          if (issues.length > 0) {
            payloadMismatches++
            log.item(
              `${colors.yellow}MISMATCH${colors.reset} Bid ${bid.id.slice(0, 8)}... (${sellerDisplay})`
            )
            for (const issue of issues) {
              log.item(`  ${colors.yellow}${issue}${colors.reset}`)
            }
          } else {
            matchedTasks++
            const status = scheduledAt?.isBefore(dayjs())
              ? `${colors.red}OVERDUE${colors.reset}`
              : scheduledAt?.fromNow() || 'unknown'
            const roundStr = roundInfo ? ` [R${roundInfo.roundNumber}/${roundInfo.maxRounds}]` : ''
            const priceFormatted = new Intl.NumberFormat('fr-FR').format(bid.price)
            log.item(
              `${colors.green}OK${colors.reset} Bid ${bid.id.slice(0, 8)}... (${sellerDisplay}) price=${priceFormatted}${roundStr} → ${status} (${scheduledAt?.format('HH:mm:ss') || '?'})`
            )
          }
        } catch (parseError) {
          payloadMismatches++
          log.item(
            `${colors.red}ERROR${colors.reset} Cannot parse payload for bid ${bid.id.slice(0, 8)}... - ${parseError.message}`
          )
        }
      }

      // Summary for Dutch
      if (matchedTasks === bidsWithTasks.length) {
        pass(`All ${matchedTasks} prebid task(s) verified`)
      } else {
        if (missingTasks > 0) fail(`${missingTasks} task(s) missing from queue`)
        if (payloadMismatches > 0) fail(`${payloadMismatches} payload mismatch(es)`)
      }
    } else if (auction.type === 'japanese') {
      // ============ JAPANESE AUCTION: Verify round handler ============
      const queuePath = `projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/queues/JaponeseRoundHandler`

      // Find tasks for this auction
      const auctionTasks = []
      for (const [, task] of allCloudTasks) {
        if (!task.name.startsWith(queuePath)) continue

        try {
          const payload = parseTaskBody(task.httpRequest?.body)
          if (payload && payload.auction_id === auction.id) {
            auctionTasks.push({ task, payload })
          }
        } catch (e) {
          // Skip unparseable tasks
        }
      }

      if (auctionTasks.length === 0) {
        const now = dayjs()
        const startAt = dayjs(auction.start_at)

        if (startAt.isAfter(now)) {
          log.info('No round handler task yet (auction not started)')
        } else if (dayjs(auction.end_at).isBefore(now)) {
          log.info('No round handler task (auction ended)')
        } else {
          warn('Auction is active but no round handler task found!')
        }
        continue
      }

      log.info(`${auctionTasks.length} round handler task(s) found`)

      for (const { task, payload } of auctionTasks) {
        const scheduleTime = task.scheduleTime?.seconds
        const scheduledAt = scheduleTime ? dayjs.unix(scheduleTime) : null
        const issues = []

        // ====== ADVANCED CHECKS ======

        // 1. Verify HTTP method
        const httpMethod = task.httpRequest?.httpMethod
        if (httpMethod !== 'POST') {
          issues.push(`Uses ${httpMethod} instead of POST`)
        }

        // 2. Verify URL endpoint
        const taskUrl = task.httpRequest?.url
        const expectedEndpoint = EXPECTED_ENDPOINTS.japanese
        if (taskUrl && !taskUrl.includes(expectedEndpoint)) {
          issues.push(`URL doesn't match: ${taskUrl} (expected: *${expectedEndpoint})`)
        }

        // 3. Verify auction_id
        if (payload.auction_id !== auction.id) {
          issues.push('auction_id mismatch')
        }

        // 4. Verify round timing vs auction config
        if (payload.round !== undefined && auction.overtime_range) {
          const auctionStart = dayjs(auction.start_at)
          const expectedRoundStart = auctionStart.add(
            payload.round * auction.overtime_range,
            'minute'
          )

          if (scheduledAt) {
            const timeDiff = Math.abs(scheduledAt.diff(expectedRoundStart, 'second'))
            if (timeDiff > 30) {
              // 30 seconds tolerance
              issues.push(`Round ${payload.round} schedule mismatch by ${timeDiff}s`)
            }
          }

          // 5. Verify total rounds vs duration
          const maxRounds = Math.floor(auction.duration / auction.overtime_range)
          if (payload.round > maxRounds) {
            issues.push(`Round ${payload.round} exceeds max rounds (${maxRounds})`)
          }
        }

        if (issues.length > 0) {
          for (const issue of issues) {
            warn(issue)
          }
        } else {
          pass('Round handler task verified')
        }

        // Show round info
        const roundStr = payload.round !== undefined ? `Round ${payload.round}` : 'Unknown round'
        const timeStr = scheduledAt ? scheduledAt.format('HH:mm:ss') : 'unknown'
        log.item(`${roundStr}: scheduled ${timeStr}`)
        if (auction.overtime_range) {
          log.item(`  Round duration: ${auction.overtime_range} min`)
        }
      }
    } else if (auction.type === 'reverse' || auction.type === 'sealed-bid') {
      // ============ REVERSE/SEALED-BID AUCTION ============
      // These don't use Cloud Tasks scheduling, just verify bids exist
      const { data: allBids, count } = await supabase
        .from('bids')
        .select('*', { count: 'exact' })
        .eq('auction_id', auction.id)

      if (count > 0) {
        log.info(`${count} bid(s) in database (no Cloud Tasks for ${auction.type})`)

        // Show bid distribution by seller
        const bidsBySeller = {}
        for (const bid of allBids || []) {
          const key = bid.seller_email || bid.seller_id
          bidsBySeller[key] = (bidsBySeller[key] || 0) + 1
        }

        for (const [seller, bidCount] of Object.entries(bidsBySeller)) {
          log.item(`${seller}: ${bidCount} bid(s)`)
        }
      } else {
        log.info('No bids yet')
      }
    }
  }

  // ============ 10. Check for orphaned tasks ============
  log.section('5. Orphaned Tasks Check')

  // Get all auction IDs in this group
  const auctionIds = new Set((auctions || []).map((a) => a.id))
  let orphanedTasks = 0

  for (const [, task] of allCloudTasks) {
    try {
      const payload = parseTaskBody(task.httpRequest?.body)
      if (!payload) continue

      // Check if this task belongs to one of our auctions
      if (payload.auction_id && auctionIds.has(payload.auction_id)) {
        // Check if the bid still exists in DB (for Dutch prebids)
        const bidId = payload.id || payload.bid_id
        if (bidId) {
          const { data: bid } = await supabase.from('bids').select('id').eq('id', bidId).single()

          if (!bid) {
            orphanedTasks++
            log.item(
              `${colors.yellow}ORPHANED${colors.reset} Task references deleted bid: ${bidId.slice(0, 8)}...`
            )
          }
        }
      }
    } catch (e) {
      // Skip unparseable tasks
    }
  }

  if (orphanedTasks === 0) {
    pass('No orphaned tasks found')
  } else {
    warn(`${orphanedTasks} orphaned task(s) found (referencing deleted bids)`)
  }

  // ============ 11. Check for Conflicting Tasks from Other Auctions ============
  log.section('6. Conflicting Tasks Check')

  // Find tasks that are scheduled during our auction windows but belong to OTHER auctions
  const ourAuctionWindows = (auctions || []).map((a) => ({
    id: a.id,
    name: a.name || a.lot_name,
    lot: a.lot_number,
    start: dayjs(a.start_at),
    end: dayjs(a.end_at),
    type: a.type
  }))

  let conflictingTasks = 0
  const otherAuctionIds = new Set()

  for (const [, task] of allCloudTasks) {
    try {
      const payload = parseTaskBody(task.httpRequest?.body)
      if (!payload) continue

      // Skip tasks that belong to our auctions
      if (payload.auction_id && auctionIds.has(payload.auction_id)) continue

      // Check if this task is scheduled during one of our auction windows
      const scheduleTime = task.scheduleTime?.seconds
      if (scheduleTime) {
        const scheduledAt = dayjs.unix(scheduleTime)

        for (const window of ourAuctionWindows) {
          // Task is scheduled during our auction window
          if (scheduledAt.isAfter(window.start) && scheduledAt.isBefore(window.end)) {
            conflictingTasks++
            if (payload.auction_id) {
              otherAuctionIds.add(payload.auction_id)
            }

            // Check if it's in the same queue our auction type uses
            const isInBidWatchQueue = task.name.includes('BidWatchQueue')
            const isInJapaneseQueue = task.name.includes('JaponeseRoundHandler')

            if (
              (window.type === 'dutch' && isInBidWatchQueue) ||
              (window.type === 'japanese' && isInJapaneseQueue)
            ) {
              log.item(
                `${colors.yellow}CONFLICT${colors.reset} Task from another auction scheduled during Lot ${window.lot} (${scheduledAt.format('HH:mm:ss')})`
              )
              if (payload.auction_id) {
                log.item(`  Other auction: ${payload.auction_id.slice(0, 8)}...`)
              }
            }
            break
          }
        }
      }
    } catch (e) {
      // Skip unparseable tasks
    }
  }

  if (conflictingTasks === 0) {
    pass('No conflicting tasks from other auctions')
  } else {
    warn(
      `${conflictingTasks} task(s) from ${otherAuctionIds.size} other auction(s) scheduled during our windows`
    )
    log.info('These may cause queue delays if not expected')
  }

  // ============ 12. Check Buyer Profile ============
  log.section('7. Buyer Profile')

  const { data: buyer } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .eq('id', auctionGroup.buyer_id)
    .single()

  if (buyer) {
    pass(`Buyer: ${buyer.first_name} ${buyer.last_name} (${buyer.email})`)
    if (buyer.companies) {
      log.info(`Company: ${buyer.companies.name}`)
    } else {
      warn('Buyer has no company assigned')
    }

    // Check profile completeness
    if (!buyer.first_name || !buyer.last_name) {
      warn('Buyer profile incomplete (missing name)')
    }
    if (!buyer.phone) {
      log.info('Buyer phone not set (optional)')
    }
  } else {
    fail('Buyer profile not found')
  }

  // ============ 12. Check Trainings ============
  log.section('8. Seller Trainings')

  // Get all seller emails from all auctions
  const allSellerEmails = new Set()
  for (const auction of auctions || []) {
    const { data: auctionSellers } = await supabase
      .from('auctions_sellers')
      .select('seller_email')
      .eq('auction_id', auction.id)

    for (const seller of auctionSellers || []) {
      allSellerEmails.add(seller.seller_email)
    }
  }

  if (allSellerEmails.size > 0) {
    const { data: trainings } = await supabase
      .from('trainings')
      .select('*')
      .eq('auctions_group_settings_id', auctionGroupId)
      .in('seller_email', Array.from(allSellerEmails))

    const trainingMap = new Map(trainings?.map((t) => [t.seller_email, t]) || [])

    let fullyTrained = 0
    let partiallyTrained = 0
    let notTrained = 0

    for (const email of allSellerEmails) {
      const training = trainingMap.get(email)

      if (!training) {
        notTrained++
        log.item(`${email}: ${colors.red}No training record${colors.reset}`)
      } else {
        const completed = [
          training.trainings_losing,
          training.trainings_prebid_win,
          training.trainings_live_win,
          training.trainings_second_losing
        ].filter(Boolean).length

        if (completed === 4) {
          fullyTrained++
          log.item(`${email}: ${colors.green}Fully trained (4/4)${colors.reset}`)
        } else if (completed > 0) {
          partiallyTrained++
          log.item(`${email}: ${colors.yellow}Partially trained (${completed}/4)${colors.reset}`)
        } else {
          notTrained++
          log.item(`${email}: ${colors.red}Training not started${colors.reset}`)
        }
      }
    }

    if (fullyTrained === allSellerEmails.size) {
      pass(`All ${fullyTrained} sellers fully trained`)
    } else if (notTrained === allSellerEmails.size) {
      warn('No sellers have completed training')
    } else {
      warn(
        `Training status: ${fullyTrained} complete, ${partiallyTrained} partial, ${notTrained} not started`
      )
    }
  } else {
    log.info('No sellers to check for training')
  }

  // ============ 13. Check Seller Profiles ============
  log.section('9. Seller Profiles')

  if (allSellerEmails.size > 0) {
    const { data: sellerProfiles } = await supabase
      .from('profiles')
      .select('*, companies(name)')
      .in('email', Array.from(allSellerEmails))

    const profileMap = new Map(sellerProfiles?.map((p) => [p.email, p]) || [])

    let profilesExist = 0
    let profilesMissing = 0
    let profilesWithCompany = 0
    let profilesIncomplete = 0

    for (const email of allSellerEmails) {
      const profile = profileMap.get(email)

      if (!profile) {
        profilesMissing++
        log.item(
          `${email}: ${colors.red}No profile (auth.users → profiles sync may have failed)${colors.reset}`
        )
      } else {
        profilesExist++

        // Check company
        if (profile.company_id && profile.companies) {
          profilesWithCompany++
        }

        // Check profile completeness
        if (!profile.first_name || !profile.last_name) {
          profilesIncomplete++
          log.item(`${email}: ${colors.yellow}Profile incomplete (missing name)${colors.reset}`)
        }
      }
    }

    if (profilesMissing === 0) {
      pass(`All ${profilesExist} seller profile(s) exist`)
    } else {
      warn(`${profilesMissing}/${allSellerEmails.size} seller(s) missing profile`)
    }

    if (profilesWithCompany > 0) {
      log.info(`${profilesWithCompany} seller(s) have company assigned`)
    }
    if (profilesIncomplete > 0) {
      log.info(`${profilesIncomplete} profile(s) incomplete`)
    }
  } else {
    log.info('No sellers to check for profiles')
  }

  // ============ 14. Check Webhook Configuration ============
  log.section('10. Webhook & Trigger Status')

  // Check if auction has required webhook triggers configured
  // This is informational - we can't directly check DB triggers from here
  log.info('Webhook endpoints expected:')
  log.item('/api/v1/webhooks/auctions/insert')
  log.item('/api/v1/webhooks/auctions/update')
  log.item('/api/v1/webhooks/bids/insert')
  log.item('/api/v1/webhooks/users/insert')

  // Check if any auctions have test=true
  const testAuctions = (auctions || []).filter((a) => a.test === true)
  const realAuctions = (auctions || []).filter((a) => a.test === false || a.test === null)

  if (testAuctions.length > 0 && realAuctions.length > 0) {
    warn(`Mixed test/real auctions: ${testAuctions.length} test, ${realAuctions.length} real`)
  } else if (testAuctions.length > 0) {
    log.info(`All ${testAuctions.length} auction(s) are TEST auctions`)
  } else {
    pass(`All ${realAuctions.length} auction(s) are REAL auctions`)
  }

  // ============ 15. Webhook Endpoint Ping ============
  log.section('11. Webhook Endpoint Ping')

  // Extract unique URLs from Cloud Tasks
  const taskUrls = new Set()
  for (const [, task] of allCloudTasks) {
    const url = task.httpRequest?.url
    if (url) {
      taskUrls.add(url)
    }
  }

  if (taskUrls.size === 0) {
    log.info('No Cloud Task URLs to ping')
  } else {
    log.info(`Testing ${taskUrls.size} unique endpoint(s) from Cloud Tasks...`)

    for (const url of taskUrls) {
      try {
        // Extract endpoint path for display
        const urlObj = new URL(url)
        const endpoint = urlObj.pathname

        // Ping the endpoint
        const result = await pingEndpoint(url)

        if (result.ok) {
          // Note: Most webhook endpoints return 401/405 for HEAD requests, which is expected
          if (result.status === 200 || result.status === 204) {
            pass(`${endpoint} → ${result.status} OK`)
          } else if (result.status === 401 || result.status === 403) {
            log.item(`${endpoint} → ${result.status} (auth required - expected)`)
          } else if (result.status === 405) {
            log.item(`${endpoint} → ${result.status} (method not allowed - expected for webhooks)`)
          } else {
            log.item(`${endpoint} → ${result.status}`)
          }
        } else {
          // Connection error
          if (result.error.includes('ENOTFOUND') || result.error.includes('ECONNREFUSED')) {
            fail(`${endpoint} → UNREACHABLE (${result.error})`)
          } else if (result.error.includes('abort')) {
            warn(`${endpoint} → TIMEOUT`)
          } else {
            warn(`${endpoint} → ${result.error}`)
          }
        }
      } catch (parseError) {
        log.item(`Invalid URL: ${url}`)
      }
    }
  }

  // ============ 16. Lot Sequence Validation (Serial Timing) ============
  log.section('12. Lot Sequence Validation')

  if (auctionGroup.timing_rule === 'serial' && auctions && auctions.length > 1) {
    // Sort by lot_number
    const sortedAuctions = [...auctions].sort((a, b) => a.lot_number - b.lot_number)

    let sequenceOk = true
    let overlapCount = 0
    let gapIssues = 0

    for (let i = 0; i < sortedAuctions.length; i++) {
      const current = sortedAuctions[i]

      // Check lot_number sequence
      if (current.lot_number !== i + 1) {
        warn(`Lot numbering gap: expected ${i + 1}, got ${current.lot_number}`)
        sequenceOk = false
      }

      // Check for overlaps with next lot
      if (i < sortedAuctions.length - 1) {
        const next = sortedAuctions[i + 1]
        const currentEnd = dayjs(current.end_at)
        const nextStart = dayjs(next.start_at)

        if (currentEnd.isAfter(nextStart)) {
          overlapCount++
          fail(`Lot ${current.lot_number} overlaps with Lot ${next.lot_number}`)
          log.item(`  Lot ${current.lot_number} ends: ${currentEnd.format('HH:mm:ss')}`)
          log.item(`  Lot ${next.lot_number} starts: ${nextStart.format('HH:mm:ss')}`)
        } else {
          const gapMinutes = nextStart.diff(currentEnd, 'minute')
          if (gapMinutes < 1) {
            gapIssues++
            warn(
              `Only ${gapMinutes * 60 + (nextStart.diff(currentEnd, 'second') % 60)}s between Lot ${current.lot_number} and ${next.lot_number}`
            )
          } else if (gapMinutes > 30) {
            log.info(
              `${gapMinutes} min gap between Lot ${current.lot_number} and ${next.lot_number}`
            )
          }
        }
      }
    }

    if (overlapCount === 0 && sequenceOk) {
      pass(`Serial sequence valid: ${sortedAuctions.length} lots in order, no overlaps`)
    }
    if (gapIssues > 0) {
      warn(`${gapIssues} lot(s) have very short gaps (< 1 min)`)
    }
  } else if (auctionGroup.timing_rule === 'parallel') {
    log.info('Parallel timing: lots can run simultaneously')
  } else if (auctions && auctions.length === 1) {
    log.info('Single lot auction, no sequence to validate')
  }

  // ============ 17. Documents & Terms Verification ============
  log.section('13. Documents & Terms')

  for (const auction of auctions || []) {
    const hasCommercialTerms =
      auction.commercials_terms && auction.commercials_terms.trim().length > 0
    const hasGeneralTerms = auction.general_terms && auction.general_terms.trim().length > 0
    const hasAwardingPrinciples =
      auction.awarding_principles && auction.awarding_principles.trim().length > 0
    const hasAttachments =
      auction.attachments && Array.isArray(auction.attachments) && auction.attachments.length > 0

    const termsCount = [hasCommercialTerms, hasGeneralTerms, hasAwardingPrinciples].filter(
      Boolean
    ).length

    if (termsCount === 3) {
      log.item(`Lot ${auction.lot_number}: All terms configured ✓`)
    } else if (termsCount > 0) {
      log.item(`Lot ${auction.lot_number}: ${termsCount}/3 terms configured`)
      if (!hasCommercialTerms)
        log.item(`  ${colors.yellow}Missing: commercials_terms${colors.reset}`)
      if (!hasGeneralTerms) log.item(`  ${colors.yellow}Missing: general_terms${colors.reset}`)
      if (!hasAwardingPrinciples)
        log.item(`  ${colors.yellow}Missing: awarding_principles${colors.reset}`)
    } else {
      log.item(`Lot ${auction.lot_number}: ${colors.yellow}No terms configured${colors.reset}`)
    }

    if (hasAttachments) {
      log.item(`  ${auction.attachments.length} attachment(s)`)
      // Check if attachments are accessible (basic URL check)
      for (const attachment of auction.attachments) {
        if (attachment.url) {
          try {
            const result = await pingEndpoint(attachment.url)
            if (!result.ok) {
              warn(`Attachment not accessible: ${attachment.name || attachment.url}`)
            }
          } catch (e) {
            // Skip
          }
        }
      }
    }
  }

  // ============ 18. Supabase Realtime Test ============
  log.section('14. Supabase Realtime')

  try {
    // Create a test subscription to verify realtime is working
    const testChannel = supabase.channel('technical-test')

    const realtimePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        testChannel.unsubscribe()
        reject(new Error('Realtime connection timeout'))
      }, 5000)

      testChannel
        .on('system', { event: '*' }, () => {
          // Any system event means connection works
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            clearTimeout(timeout)
            testChannel.unsubscribe()
            resolve(true)
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            clearTimeout(timeout)
            testChannel.unsubscribe()
            reject(new Error(`Realtime status: ${status}`))
          }
        })
    })

    await realtimePromise
    pass('Supabase Realtime connection successful')
  } catch (realtimeError) {
    warn(`Supabase Realtime: ${realtimeError.message}`)
    log.info('Live auction updates may not work properly')
  }

  // ============ 19. Edge Functions Health Check (Infrastructure) ============
  log.section('15. Supabase Edge Functions (infra health check)')

  // Note: This project doesn't use Edge Functions for auctions.
  // This check verifies Supabase Edge Functions infrastructure is operational.

  // Extract project ref from SUPABASE_URL
  const projectRef = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]

  // Use anon key for Edge Functions (simulates frontend calls)
  const edgeFunctionKey = SUPABASE_ANON_KEY || SUPABASE_KEY

  if (!projectRef) {
    log.info('Cannot extract project ref from SUPABASE_URL - skipping')
  } else if (!edgeFunctionKey) {
    log.info('No SUPABASE_ANON_KEY available - skipping Edge Functions check')
  } else {
    log.info(`Testing with ${SUPABASE_ANON_KEY ? 'anon key' : 'service key'}`)

    // Check if Edge Functions endpoint is accessible
    try {
      const functionsBaseUrl = `${SUPABASE_URL}/functions/v1`
      const healthResponse = await fetch(functionsBaseUrl, {
        method: 'OPTIONS',
        headers: {
          Authorization: `Bearer ${edgeFunctionKey}`
        }
      })

      if (healthResponse.ok || healthResponse.status === 204) {
        log.success('Edge Functions endpoint is accessible')
      } else {
        log.info(`Edge Functions endpoint returned ${healthResponse.status}`)
      }
    } catch (efEndpointError) {
      log.info(`Edge Functions endpoint not reachable: ${efEndpointError.message}`)
    }

    // Try to invoke hello-world function (if deployed)
    try {
      const fnUrl = `${SUPABASE_URL}/functions/v1/hello-world`
      const invokeResponse = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${edgeFunctionKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: 'HealthCheck' })
      })

      if (invokeResponse.ok) {
        const result = await invokeResponse.json().catch(() => null)
        log.success(`hello-world function OK${result?.message ? `: ${result.message}` : ''}`)
      } else if (invokeResponse.status === 404) {
        log.info('hello-world function not deployed (optional)')
      } else {
        log.info(`hello-world returned ${invokeResponse.status}`)
      }
    } catch (fnError) {
      log.info(`hello-world check skipped: ${fnError.message}`)
    }
  }

  // ============ 20. Suspicious Bids Detection ============
  log.section('16. Suspicious Bids Detection')

  for (const auction of auctions || []) {
    const { data: auctionBids } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auction.id)
      .order('created_at', { ascending: true })

    if (!auctionBids || auctionBids.length < 2) {
      log.info(`Lot ${auction.lot_number}: Not enough bids to analyze`)
      continue
    }

    let duplicates = 0
    let suspiciousTimings = 0

    // Group bids by seller
    const bidsBySeller = {}
    for (const bid of auctionBids) {
      const key = bid.seller_id || bid.seller_email
      if (!bidsBySeller[key]) bidsBySeller[key] = []
      bidsBySeller[key].push(bid)
    }

    // Check for duplicates and suspicious patterns
    for (const [, bids] of Object.entries(bidsBySeller)) {
      // Check for duplicate prices from same seller
      const priceCount = {}
      for (const bid of bids) {
        priceCount[bid.price] = (priceCount[bid.price] || 0) + 1
      }

      for (const [price, count] of Object.entries(priceCount)) {
        if (count > 1) {
          duplicates++
          log.item(
            `${colors.yellow}DUPLICATE${colors.reset} Lot ${auction.lot_number}: Seller has ${count} bids at price ${price}`
          )
        }
      }

      // Check for rapid-fire bids (< 2 seconds apart)
      for (let i = 1; i < bids.length; i++) {
        const timeDiff = dayjs(bids[i].created_at).diff(dayjs(bids[i - 1].created_at), 'second')
        if (timeDiff < 2 && timeDiff >= 0) {
          suspiciousTimings++
        }
      }
    }

    if (duplicates === 0 && suspiciousTimings === 0) {
      log.item(`Lot ${auction.lot_number}: No suspicious bids detected`)
    } else {
      if (suspiciousTimings > 0) {
        log.item(
          `${colors.yellow}RAPID${colors.reset} Lot ${auction.lot_number}: ${suspiciousTimings} bid(s) placed < 2s apart`
        )
      }
    }
  }

  // ============ 21. Cloud Tasks Queue Rate Limits ============
  log.section('17. Queue Rate Limits')

  if (tasksClient) {
    for (const queueName of GCP_QUEUES) {
      try {
        const queuePath = tasksClient.queuePath(GCP_PROJECT, GCP_LOCATION, queueName)
        const [queue] = await tasksClient.getQueue({ name: queuePath })

        if (queue.rateLimits) {
          const { maxDispatchesPerSecond, maxConcurrentDispatches } = queue.rateLimits
          log.item(`${queueName}:`)
          log.item(`  Max dispatches/sec: ${maxDispatchesPerSecond || 'unlimited'}`)
          log.item(`  Max concurrent: ${maxConcurrentDispatches || 'unlimited'}`)

          // Warn if limits seem too low for auction traffic
          if (maxDispatchesPerSecond && maxDispatchesPerSecond < 10) {
            warn(`${queueName} rate limit may be too low (${maxDispatchesPerSecond}/sec)`)
          }
        } else {
          log.item(`${queueName}: Default rate limits`)
        }
      } catch (e) {
        log.item(`${queueName}: Cannot read rate limits`)
      }
    }
  } else {
    log.info('Queue rate limits check skipped (no GCP client)')
  }

  // ============ 22. Historical Comparison ============
  log.section('18. Historical Comparison')

  // Find similar past auctions for comparison
  const auctionTypes = [...new Set((auctions || []).map((a) => a.type))]

  for (const auctionType of auctionTypes) {
    const { data: pastAuctions, count } = await supabase
      .from('auctions')
      .select('id, name, start_at, end_at, duration', { count: 'exact' })
      .eq('type', auctionType)
      .eq('test', false)
      .lt('end_at', dayjs().toISOString())
      .order('end_at', { ascending: false })
      .limit(10)

    if (count > 0) {
      log.info(`Found ${count} past ${auctionType} auction(s)`)

      // Calculate average duration
      const durations = pastAuctions.filter((a) => a.duration).map((a) => a.duration)
      if (durations.length > 0) {
        const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length

        // Compare with our auctions
        const ourAuctionsOfType = (auctions || []).filter((a) => a.type === auctionType)
        for (const our of ourAuctionsOfType) {
          if (our.duration && Math.abs(our.duration - avgDuration) > avgDuration * 0.5) {
            log.item(
              `Lot ${our.lot_number}: Duration (${our.duration}min) differs significantly from average (${Math.round(avgDuration)}min)`
            )
          }
        }
      }
    } else {
      log.info(`No past ${auctionType} auctions to compare`)
    }
  }

  // ============ 23. Japanese time_per_round Check ============
  log.section('19. Japanese Seller Timing')

  const japaneseAuctions = (auctions || []).filter((a) => a.type === 'japanese')

  if (japaneseAuctions.length > 0) {
    for (const auction of japaneseAuctions) {
      const { data: sellers } = await supabase
        .from('auctions_sellers')
        .select('seller_email, time_per_round')
        .eq('auction_id', auction.id)

      if (sellers && sellers.length > 0) {
        const customTimings = sellers.filter(
          (s) => s.time_per_round && s.time_per_round !== auction.overtime_range * 60
        )

        if (customTimings.length > 0) {
          log.item(
            `Lot ${auction.lot_number}: ${customTimings.length} seller(s) with custom time_per_round`
          )
          for (const s of customTimings) {
            log.item(
              `  ${s.seller_email}: ${s.time_per_round}s (default: ${auction.overtime_range * 60}s)`
            )
          }
        } else {
          log.item(
            `Lot ${auction.lot_number}: All sellers use default timing (${auction.overtime_range} min)`
          )
        }
      }
    }
  } else {
    log.info('No Japanese auctions in this group')
  }

  // ============ 24. Time Synchronization Check ============
  log.section('20. Time Synchronization')

  try {
    // Method 1: Use HTTP Date header from Supabase REST API
    const localTimeBefore = dayjs()
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`
      }
    })
    const localTimeAfter = dayjs()

    const serverDateHeader = response.headers.get('date')
    if (serverDateHeader) {
      const serverTime = dayjs(serverDateHeader)
      // Use midpoint of request for more accurate comparison
      const localTime = localTimeBefore.add(localTimeAfter.diff(localTimeBefore) / 2, 'millisecond')
      const diffSeconds = Math.abs(serverTime.diff(localTime, 'second'))

      if (diffSeconds < 5) {
        pass(`Time sync OK (diff: ${diffSeconds}s)`)
      } else if (diffSeconds < 30) {
        warn(`Time difference: ${diffSeconds}s between local and server`)
      } else {
        fail(`Significant time difference: ${diffSeconds}s - this may cause auction timing issues!`)
      }

      log.info(`Server: ${serverTime.format('HH:mm:ss')} (from HTTP Date header)`)
      log.info(`Local:  ${localTime.format('HH:mm:ss')}`)
    } else {
      // Fallback: Try RPC function if it exists
      try {
        const { data: serverTimeData } = await supabase.rpc('now')
        if (serverTimeData) {
          const serverTime = dayjs(serverTimeData)
          const localTime = dayjs()
          const diffSeconds = Math.abs(serverTime.diff(localTime, 'second'))
          log.info(`Server (RPC): ${serverTime.format('HH:mm:ss')}`)
          log.info(`Local:        ${localTime.format('HH:mm:ss')}`)
          log.info(`Difference:   ${diffSeconds}s`)
        }
      } catch (rpcError) {
        log.info(`Local time: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`)
        log.info('Server time check not available (no Date header, no RPC)')
      }
    }
  } catch (e) {
    log.info(`Time sync check failed: ${e.message}`)
  }

  // ============ 25. Currency Validation ============
  log.section('21. Currency Validation')

  const currencies = [...new Set((auctions || []).map((a) => a.currency).filter(Boolean))]

  if (currencies.length === 0) {
    warn('No currency set on any auction')
  } else {
    for (const currency of currencies) {
      if (VALID_CURRENCIES.has(currency)) {
        pass(`Currency "${currency}" is valid ISO 4217`)
      } else {
        warn(`Currency "${currency}" is not a standard ISO 4217 code`)
      }
    }

    if (currencies.length > 1) {
      warn(`Multiple currencies used: ${currencies.join(', ')}`)
    }
  }

  // ============ 26. Vercel & GCloud Logs Check ============
  log.section('22. Error Logs (Vercel & GCloud)')

  // Check logs from the last 72 hours
  const logStartTime = dayjs().subtract(72, 'hour')
  const logEndTime = dayjs()

  log.info(
    `Checking logs from last 72h (${logStartTime.format('DD/MM HH:mm')} to ${logEndTime.format('DD/MM HH:mm')})`
  )

  // Check Vercel logs
  try {
    log.info('Fetching Vercel logs...')

    const projectRoot = new URL('..', import.meta.url).pathname

    // Helper function to run vercel command with auto-login
    const runVercelCmd = (args, options = {}) => {
      let result = spawnSync('vercel', args, {
        encoding: 'utf-8',
        timeout: 60000,
        cwd: projectRoot,
        ...options
      })

      // If not logged in, trigger login and retry
      if (
        result.status !== 0 &&
        (result.stderr?.includes('not logged in') ||
          result.stderr?.includes('No credentials found'))
      ) {
        log.warning('Vercel CLI not logged in, launching authentication...')
        console.log(
          `\n${colors.yellow}Opening browser for Vercel authentication...${colors.reset}\n`
        )

        const loginResult = spawnSync('vercel', ['login'], {
          stdio: 'inherit'
        })

        if (loginResult.status === 0) {
          console.log(`\n${colors.green}Vercel authentication successful!${colors.reset}\n`)
          result = spawnSync('vercel', args, {
            encoding: 'utf-8',
            timeout: 60000,
            cwd: projectRoot,
            ...options
          })
        }
      }
      return result
    }

    // Step 1: Get the latest production deployment URL using vercel ls
    const lsResult = runVercelCmd(['ls', 'crown', '--prod'])

    let deploymentUrl = null
    if (lsResult.status === 0 && lsResult.stdout) {
      // Look for deployment URL in output (format: crown-xxxxx.vercel.app or crown-xxxxx-team.vercel.app)
      const urlMatch = lsResult.stdout.match(/(crown-[a-z0-9-]+(?:-[a-z0-9]+)?\.vercel\.app)/)
      if (urlMatch) {
        deploymentUrl = urlMatch[1]
      }
      // Debug: show what we got
      if (!deploymentUrl) {
        log.info('vercel ls output (first 300 chars):')
        log.item(lsResult.stdout.slice(0, 300))
      }
    }

    if (!deploymentUrl) {
      log.info('Could not find production deployment URL - skipping Vercel logs')
      if (lsResult.stderr) {
        log.item(`stderr: ${lsResult.stderr.slice(0, 200)}`)
      }
    } else {
      log.info(`Production deployment: ${deploymentUrl}`)

      // Step 2: Fetch logs via Vercel API (last 72h)
      // Requires VERCEL_TOKEN env var
      const vercelToken = process.env.VERCEL_TOKEN

      if (!vercelToken) {
        log.info('VERCEL_TOKEN not set - skipping historical logs check')
        log.item('Set VERCEL_TOKEN env var to enable Vercel logs checking')
      } else {
        try {
          // First, get deployment info by URL to get the deployment ID
          const deploymentInfoUrl = `https://api.vercel.com/v13/deployments/${deploymentUrl}`
          const infoResponse = await fetch(deploymentInfoUrl, {
            headers: { Authorization: `Bearer ${vercelToken}` }
          })

          if (!infoResponse.ok) {
            log.info(`Could not get deployment info: ${infoResponse.status}`)
            const errorBody = await infoResponse.text()
            log.item(errorBody.slice(0, 200))
          } else {
            const deploymentInfo = await infoResponse.json()
            const deploymentId = deploymentInfo.id

            // Show deployment date
            if (deploymentInfo.createdAt) {
              const deployDate = dayjs(deploymentInfo.createdAt)
              log.info(`Last deployment: ${deployDate.format('DD/MM/YYYY HH:mm')}`)
            }

            if (!deploymentId) {
              log.info('Could not get deployment ID from API')
            } else {
              // Fetch runtime logs
              const since = logStartTime.valueOf()
              const logsUrl = `https://api.vercel.com/v2/deployments/${deploymentId}/events?since=${since}&limit=500&direction=backward`

              const logsResponse = await fetch(logsUrl, {
                headers: { Authorization: `Bearer ${vercelToken}` }
              })

              if (logsResponse.ok) {
                const events = await logsResponse.json()
                let errorCount = 0
                const errors = []

                // Find oldest and newest log timestamps
                let oldestLog = null
                let newestLog = null

                // Filter for error events
                for (const event of events || []) {
                  // Track oldest/newest timestamps
                  if (event.created) {
                    if (!oldestLog || event.created < oldestLog) oldestLog = event.created
                    if (!newestLog || event.created > newestLog) newestLog = event.created
                  }

                  const isError =
                    event.type === 'error' ||
                    event.payload?.statusCode >= 500 ||
                    (event.payload?.message || '').toLowerCase().includes('error')

                  if (isError) {
                    errorCount++
                    if (errors.length < 5) {
                      const time = event.created ? dayjs(event.created).format('DD/MM HH:mm') : ''
                      const msg = event.payload?.message || event.payload?.path || event.type
                      errors.push(`[${time}] ${msg}`.slice(0, 120))
                    }
                  }
                }

                // Show logs date range
                if (oldestLog && newestLog) {
                  log.info(
                    `Logs range: ${dayjs(oldestLog).format('DD/MM HH:mm')} → ${dayjs(newestLog).format('DD/MM HH:mm')}`
                  )
                }

                const eventCount = Array.isArray(events) ? events.length : 0
                if (errorCount === 0) {
                  pass(`No errors in Vercel logs (${eventCount} events checked)`)
                } else {
                  warn(`${errorCount} error(s) found in Vercel logs`)
                  for (const err of errors) {
                    log.item(err)
                  }
                }
              } else {
                log.info(`Vercel logs API error: ${logsResponse.status}`)
              }
            }
          }
        } catch (apiError) {
          log.info(`Vercel API call failed: ${apiError.message}`)
        }
      }
    }
  } catch (vercelError) {
    log.info(`Vercel logs check skipped: ${vercelError.message}`)
  }

  // Check GCloud logs for Cloud Tasks
  try {
    log.info('Fetching GCloud Tasks logs...')

    // Format timestamp for gcloud (RFC3339)
    const gcpStartTime = logStartTime.toISOString()

    // Build the full command as a string to avoid shell splitting issues
    const gcloudQuery = `resource.type="cloud_tasks_queue" AND severity>=ERROR AND timestamp>="${gcpStartTime}"`
    const gcloudCmd = `gcloud logging read '${gcloudQuery}' --project=${GCP_PROJECT} --format=json --limit=20`

    let gcloudResult = spawnSync(gcloudCmd, [], {
      encoding: 'utf-8',
      timeout: 60000,
      shell: true
    })

    // If auth/credentials failed, trigger login and retry
    const needsAuth =
      gcloudResult.status !== 0 &&
      gcloudResult.stderr &&
      (gcloudResult.stderr.includes('auth') ||
        gcloudResult.stderr.includes('credentials') ||
        gcloudResult.stderr.includes('Could not load the default credentials') ||
        gcloudResult.stderr.includes('not authenticated'))

    if (needsAuth) {
      log.warning('GCloud CLI needs re-authentication, launching login...')
      console.log(
        `\n${colors.yellow}Opening browser for Google Cloud authentication...${colors.reset}\n`
      )

      const loginResult = spawnSync('gcloud', ['auth', 'login'], {
        stdio: 'inherit',
        shell: true
      })

      if (loginResult.status === 0) {
        console.log(`\n${colors.green}GCloud authentication successful!${colors.reset}\n`)
        // Retry fetching logs
        gcloudResult = spawnSync(gcloudCmd, [], {
          encoding: 'utf-8',
          timeout: 60000,
          shell: true
        })
      }
    }

    if (gcloudResult.status === 0 && gcloudResult.stdout) {
      try {
        const logs = JSON.parse(gcloudResult.stdout || '[]')

        if (logs.length === 0) {
          pass('No errors found in GCloud Tasks logs')
        } else {
          warn(`${logs.length} error(s) found in GCloud Tasks logs`)
          for (const logEntry of logs.slice(0, 5)) {
            const timestamp = logEntry.timestamp
              ? dayjs(logEntry.timestamp).format('HH:mm:ss')
              : '?'
            const msg = logEntry.textPayload || logEntry.jsonPayload?.message || 'Unknown error'
            log.item(`[${timestamp}] ${msg.slice(0, 100)}`)
          }
          if (logs.length > 5) {
            log.item(`... and ${logs.length - 5} more`)
          }
        }
      } catch (parseErr) {
        log.info('Could not parse GCloud logs response')
      }
    } else if (gcloudResult.stderr && gcloudResult.stderr.includes('not authenticated')) {
      log.info('GCloud CLI not authenticated - run: gcloud auth login')
    } else {
      log.info(`Could not fetch GCloud logs (exit code: ${gcloudResult.status})`)
      if (gcloudResult.stderr) {
        log.item(`stderr: ${gcloudResult.stderr.slice(0, 300)}`)
      }
      if (gcloudResult.error) {
        log.item(`error: ${gcloudResult.error.message}`)
      }
      if (!gcloudResult.stderr && !gcloudResult.error) {
        log.item('No error details - check if gcloud CLI is installed and authenticated')
      }
    }
  } catch (gcloudError) {
    log.info(`GCloud logs check skipped: ${gcloudError.message}`)
  }

  // Also check for HTTP errors in Cloud Tasks execution
  try {
    log.info('Fetching Cloud Tasks HTTP errors...')

    const httpQuery = `resource.type="cloud_tasks_queue" AND httpRequest.status>=400 AND timestamp>="${logStartTime.toISOString()}"`
    const httpCmd = `gcloud logging read '${httpQuery}' --project=${GCP_PROJECT} --format=json --limit=20`

    const httpErrorResult = spawnSync(httpCmd, [], {
      encoding: 'utf-8',
      timeout: 60000,
      shell: true
    })

    if (httpErrorResult.status === 0 && httpErrorResult.stdout) {
      try {
        const httpLogs = JSON.parse(httpErrorResult.stdout || '[]')

        if (httpLogs.length === 0) {
          pass('No HTTP errors in Cloud Tasks execution')
        } else {
          warn(`${httpLogs.length} HTTP error(s) in Cloud Tasks`)
          for (const entry of httpLogs.slice(0, 5)) {
            const timestamp = entry.timestamp ? dayjs(entry.timestamp).format('HH:mm:ss') : '?'
            const status = entry.httpRequest?.status || '?'
            const url = entry.httpRequest?.requestUrl || 'unknown'
            // Extract just the path from URL
            const path = url.includes('/api/') ? '/api/' + url.split('/api/')[1] : url
            log.item(`[${timestamp}] ${status} ${path.slice(0, 60)}`)
          }
          if (httpLogs.length > 5) {
            log.item(`... and ${httpLogs.length - 5} more`)
          }
        }
      } catch (parseErr) {
        // Silent fail
      }
    }
  } catch (httpError) {
    // Silent fail for HTTP error check
  }

  // ============ Summary ============
  printSummary()

  // Cleanup to allow process to exit cleanly
  await cleanupClients(supabase, tasksClient)
}

function printSummary() {
  log.title('SUMMARY')

  console.log(`\n  ${colors.green}Passed: ${results.passed}${colors.reset}`)
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`)
  console.log(`  ${colors.yellow}Warnings: ${results.warnings}${colors.reset}`)

  if (results.failed === 0 && results.warnings === 0) {
    console.log(
      `\n${colors.green}${colors.bright}✓ All checks passed! Auction is ready.${colors.reset}\n`
    )
  } else if (results.failed === 0) {
    console.log(
      `\n${colors.yellow}${colors.bright}⚠ Auction is ready but has warnings.${colors.reset}\n`
    )
  } else {
    console.log(
      `\n${colors.red}${colors.bright}✗ Auction has ${results.failed} issue(s) to fix:${colors.reset}`
    )
    for (const error of results.errors) {
      console.log(`  ${colors.red}• ${error}${colors.reset}`)
    }
    console.log()
  }
}

// Run
main().catch((err) => {
  console.error(`${colors.red}Fatal error: ${err.message}${colors.reset}`)
  process.exit(1)
})
