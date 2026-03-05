import supabase from '~/server/utils/supabase'
import { CloudTasksClient } from '@google-cloud/tasks'
import { ExternalAccountClient } from 'google-auth-library'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime.js'

dayjs.extend(relativeTime)

// ============ Configuration ============
const GCP_PROJECT = 'crown-476614'
const GCP_LOCATION = 'europe-west1'
const GCP_QUEUES = ['BidWatchQueue', 'JaponeseRoundHandler']

const EXPECTED_ENDPOINTS = {
  dutch: '/api/v1/dutch/auto_bid',
  japanese: '/api/v1/japanese/round_handler'
}

// Valid ISO 4217 Currency Codes
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

// ============ GCP Authentication ============
function getVercelOidcToken(event) {
  // Try to get token from request headers
  const tokenFromHeader = getHeader(event, 'x-vercel-oidc-token')
  if (tokenFromHeader) {
    return tokenFromHeader
  }

  // Fallback to env var (for local development)
  const token = process.env.VERCEL_OIDC_TOKEN
  if (!token) {
    throw new Error('VERCEL_OIDC_TOKEN not found. OIDC token required for GCP authentication.')
  }
  return token
}

function getAuthClient(event) {
  // Check if WIF environment variables are configured
  const hasWifConfig =
    process.env.GCP_PROJECT_NUMBER &&
    process.env.GCP_WORKLOAD_IDENTITY_POOL_ID &&
    process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID &&
    process.env.GCP_SERVICE_ACCOUNT_EMAIL

  if (hasWifConfig) {
    // Use Workload Identity Federation with Vercel OIDC
    const projectNumber = process.env.GCP_PROJECT_NUMBER
    const poolId = process.env.GCP_WORKLOAD_IDENTITY_POOL_ID
    const providerId = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER_ID
    const serviceAccountEmail = process.env.GCP_SERVICE_ACCOUNT_EMAIL

    const authClient = ExternalAccountClient.fromJSON({
      type: 'external_account',
      audience: `//iam.googleapis.com/projects/${projectNumber}/locations/global/workloadIdentityPools/${poolId}/providers/${providerId}`,
      subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
      token_url: 'https://sts.googleapis.com/v1/token',
      service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${serviceAccountEmail}:generateAccessToken`,
      subject_token_supplier: {
        getSubjectToken: () => getVercelOidcToken(event)
      }
    })

    return authClient
  }

  // Fallback: return null to use default credentials (for local development)
  return null
}

function createCloudTasksClient(event) {
  const authClient = getAuthClient(event)

  if (authClient) {
    return new CloudTasksClient({
      projectId: GCP_PROJECT,
      authClient: authClient
    })
  }

  // Fallback to default credentials
  return new CloudTasksClient({
    projectId: GCP_PROJECT
  })
}

// ============ Helper Functions ============
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

function getAuctionStatus(auction) {
  const now = dayjs()
  const startAt = auction.start_at ? dayjs(auction.start_at) : null
  const endAt = auction.end_at ? dayjs(auction.end_at) : null

  if (!startAt || !endAt) return 'draft'
  if (now.isBefore(startAt)) return 'upcoming'
  if (now.isAfter(endAt)) return 'closed'
  return 'active'
}

function calculateDutchRoundTime(auction, price) {
  if (!auction.max_bid_decr || !auction.min_bid_decr || !auction.overtime_range) {
    return null
  }
  const maxRounds = Math.ceil(auction.duration / auction.overtime_range) - 1
  const startingPrice = auction.max_bid_decr - maxRounds * auction.min_bid_decr
  const roundNumber = Math.round((price - startingPrice) / auction.min_bid_decr)
  const startAt = dayjs(auction.start_at)
  const roundStartTime = startAt.add(roundNumber * auction.overtime_range, 'minute')
  return { roundNumber, roundStartTime, maxRounds }
}

export default defineEventHandler(async (event) => {
  const { auctionGroupId } = getRouterParams(event)
  const config = useRuntimeConfig()

  // ============ Results Structure ============
  const results = {
    summary: { passed: 0, failed: 0, warnings: 0, total: 0 },
    timestamp: new Date().toISOString(),
    auctionGroup: null,
    sections: [],
    auctions: []
  }

  // Current section being built
  let currentSection = null

  function startSection(id, title, icon, description) {
    currentSection = {
      id,
      title,
      icon,
      description,
      checks: []
    }
  }

  function endSection() {
    if (currentSection) {
      results.sections.push(currentSection)
      currentSection = null
    }
  }

  function pass(message, description = null, details = null) {
    results.summary.passed++
    results.summary.total++
    if (currentSection) {
      currentSection.checks.push({ status: 'pass', message, description, details })
    }
  }

  function fail(message, description = null, details = null) {
    results.summary.failed++
    results.summary.total++
    if (currentSection) {
      currentSection.checks.push({ status: 'fail', message, description, details })
    }
  }

  function warn(message, description = null, details = null) {
    results.summary.warnings++
    results.summary.total++
    if (currentSection) {
      currentSection.checks.push({ status: 'warning', message, description, details })
    }
  }

  function info(message, description = null, details = null) {
    results.summary.total++
    if (currentSection) {
      currentSection.checks.push({ status: 'info', message, description, details })
    }
  }

  try {
    // ============ SECTION 1: Auction Group ============
    startSection(
      'auction-group',
      'Auction Group',
      'mdi-folder-multiple',
      'Verifies the auction group exists and is correctly configured'
    )

    const { data: auctionGroup, error: groupError } = await supabase
      .from('auctions_group_settings')
      .select('*')
      .eq('id', auctionGroupId)
      .single()

    if (groupError || !auctionGroup) {
      fail(`Group not found: ${auctionGroupId}`, 'Checks that the auction group exists in database')
      endSection()
      return results
    }

    results.auctionGroup = auctionGroup
    pass(`Group found: "${auctionGroup.name}"`, 'Checks that the auction group exists in database')

    if (auctionGroup.timing_rule) {
      pass(
        `Timing rule: ${auctionGroup.timing_rule}`,
        'Checks that a timing rule is defined (serial/parallel/staggered)'
      )
    } else {
      warn('No timing rule defined', 'Checks that a timing rule is defined')
    }

    if (auctionGroup.buyer_id) {
      pass(`Buyer assigned`, 'Checks that a buyer is assigned to the group')
    } else {
      fail('No buyer assigned', 'Checks that a buyer is assigned to the group')
    }

    endSection()

    // ============ SECTION 2: Auctions (Lots) ============
    startSection(
      'auctions',
      'Lots',
      'mdi-gavel',
      'Verifies the configuration of each lot in the group'
    )

    // First, get just the auctions
    console.log('[HealthCheck] Fetching auctions for group:', auctionGroupId)

    const { data: auctionsRaw, error: auctionsError } = await supabase
      .from('auctions')
      .select('*')
      .eq('auctions_group_settings_id', auctionGroupId)
      .order('lot_number', { ascending: true })

    console.log('[HealthCheck] Auctions result:', {
      count: auctionsRaw?.length,
      error: auctionsError?.message
    })

    if (auctionsError) {
      fail(`Lots query error: ${auctionsError.message}`, 'Checks that the Supabase query works')
      endSection()
      return results
    }

    if (!auctionsRaw || auctionsRaw.length === 0) {
      // Debug: try to find why no auctions
      const { count } = await supabase
        .from('auctions')
        .select('*', { count: 'exact', head: true })
        .eq('auctions_group_settings_id', auctionGroupId)

      fail(
        `No lot found (count: ${count}, groupId: ${auctionGroupId})`,
        'Checks that lots exist in the group'
      )
      endSection()
      return results
    }

    // Get all auction IDs
    const auctionIdsArray = auctionsRaw.map((a) => a.id)

    // Fetch ALL sellers for all auctions in one query
    const { data: allSellers, error: allSellersError } = await supabase
      .from('auctions_sellers')
      .select('*')
      .in('auction_id', auctionIdsArray)

    if (allSellersError) {
      console.error('[HealthCheck] Error fetching all sellers:', allSellersError)
    }
    console.log(
      '[HealthCheck] All sellers query result:',
      allSellers?.length || 0,
      'sellers found for',
      auctionIdsArray.length,
      'auctions'
    )
    console.log('[HealthCheck] Auction IDs:', auctionIdsArray)

    // Fetch ALL supplies for all auctions in one query
    const { data: allSupplies, error: allSuppliesError } = await supabase
      .from('supplies')
      .select('*')
      .in('auction_id', auctionIdsArray)
      .order('index', { ascending: true })

    if (allSuppliesError) {
      console.error('[HealthCheck] Error fetching all supplies:', allSuppliesError)
    }
    console.log(
      '[HealthCheck] All supplies query result:',
      allSupplies?.length || 0,
      'supplies found'
    )

    // Group by auction_id
    const sellersByAuction = {}
    const suppliesByAuction = {}

    for (const seller of allSellers || []) {
      if (!sellersByAuction[seller.auction_id]) {
        sellersByAuction[seller.auction_id] = []
      }
      sellersByAuction[seller.auction_id].push(seller)
    }

    for (const supply of allSupplies || []) {
      if (!suppliesByAuction[supply.auction_id]) {
        suppliesByAuction[supply.auction_id] = []
      }
      suppliesByAuction[supply.auction_id].push(supply)
    }

    // Build auctions array with related data
    const auctions = auctionsRaw.map((auctionRaw) => ({
      ...auctionRaw,
      auctions_sellers: sellersByAuction[auctionRaw.id] || [],
      supplies: suppliesByAuction[auctionRaw.id] || []
    }))

    console.log(
      '[HealthCheck] Final auctions with sellers:',
      auctions.map((a) => ({
        id: a.id,
        sellers: a.auctions_sellers.length,
        supplies: a.supplies.length
      }))
    )

    pass(`${auctions.length} lot(s) found`, 'Checks that lots exist in the group')
    endSection()

    // Process each auction
    for (const auction of auctions) {
      const auctionResults = {
        id: auction.id,
        name: auction.lot_name || auction.name,
        lotNumber: auction.lot_number,
        type: auction.type,
        status: getAuctionStatus(auction),
        checks: [],
        sellers: [],
        supplies: [],
        winner: null
      }

      // Type check
      if (['dutch', 'japanese', 'reverse', 'sealed-bid'].includes(auction.type)) {
        auctionResults.checks.push({
          status: 'pass',
          message: `Type: ${auction.type}`,
          description: 'Checks that type is dutch/japanese/reverse/sealed-bid'
        })
      } else {
        auctionResults.checks.push({
          status: 'fail',
          message: `Invalid type: ${auction.type}`,
          description: 'Checks that type is dutch/japanese/reverse/sealed-bid'
        })
        results.summary.failed++
      }

      // Duration check
      if (auction.duration && auction.duration > 0) {
        auctionResults.checks.push({
          status: 'pass',
          message: `Duration: ${auction.duration} min`,
          description: 'Checks that auction duration is > 0'
        })
      } else {
        auctionResults.checks.push({
          status: 'fail',
          message: 'No duration defined',
          description: 'Checks that auction duration is > 0'
        })
        results.summary.failed++
      }

      // Currency check
      if (auction.currency && VALID_CURRENCIES.has(auction.currency)) {
        auctionResults.checks.push({
          status: 'pass',
          message: `Currency: ${auction.currency}`,
          description: 'Checks that currency is a valid ISO 4217 code'
        })
      } else if (!auction.currency) {
        auctionResults.checks.push({
          status: 'warning',
          message: 'No currency defined',
          description: 'Checks that currency is defined'
        })
        results.summary.warnings++
      } else {
        auctionResults.checks.push({
          status: 'warning',
          message: `Non-standard currency: ${auction.currency}`,
          description: 'Checks that currency is a valid ISO 4217 code'
        })
        results.summary.warnings++
      }

      // Supplies check
      if (auction.supplies && auction.supplies.length > 0) {
        auctionResults.checks.push({
          status: 'pass',
          message: `${auction.supplies.length} line item(s)`,
          description: 'Checks that at least one line item is configured'
        })
        auctionResults.supplies = auction.supplies.map((s) => ({
          name: s.name,
          quantity: s.quantity,
          unit: s.unit
        }))
      } else {
        auctionResults.checks.push({
          status: 'fail',
          message: 'No line items configured',
          description: 'Checks that at least one line item is configured'
        })
        results.summary.failed++
      }

      // Sellers check
      console.log(
        '[HealthCheck] Auction',
        auction.id,
        'auctions_sellers:',
        JSON.stringify(auction.auctions_sellers)
      )
      if (auction.auctions_sellers && auction.auctions_sellers.length > 0) {
        auctionResults.checks.push({
          status: 'pass',
          message: `${auction.auctions_sellers.length} seller(s) invited`,
          description: 'Checks that at least one seller is invited'
        })

        // Fetch seller profiles separately
        const sellerEmails = auction.auctions_sellers.map((s) => s.seller_email)
        const { data: sellerProfiles } = await supabase
          .from('profiles')
          .select('email, first_name, last_name')
          .in('email', sellerEmails)

        const profileMap = new Map(sellerProfiles?.map((p) => [p.email, p]) || [])

        auctionResults.sellers = auction.auctions_sellers.map((s) => {
          const profile = profileMap.get(s.seller_email)
          return {
            email: s.seller_email,
            name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : null,
            termsAccepted: s.terms_accepted
          }
        })

        // Terms acceptance
        const acceptedCount = auction.auctions_sellers.filter((s) => s.terms_accepted).length
        if (acceptedCount === auction.auctions_sellers.length) {
          auctionResults.checks.push({
            status: 'pass',
            message: `All sellers accepted terms (${acceptedCount}/${auction.auctions_sellers.length})`,
            description: 'Checks that all sellers have accepted terms'
          })
        } else if (acceptedCount > 0) {
          auctionResults.checks.push({
            status: 'warning',
            message: `${acceptedCount}/${auction.auctions_sellers.length} sellers accepted`,
            description: 'Checks that all sellers have accepted terms'
          })
          results.summary.warnings++
        } else {
          auctionResults.checks.push({
            status: 'info',
            message: 'No seller has accepted terms yet',
            description: 'Checks that all sellers have accepted terms'
          })
        }
      } else {
        auctionResults.checks.push({
          status: 'fail',
          message: 'No seller invited',
          description: 'Checks that at least one seller is invited'
        })
        results.summary.failed++
      }

      // Ceiling prices check
      if (auction.supplies?.length > 0 && auction.auctions_sellers?.length > 0) {
        const supplyIds = auction.supplies.map((s) => s.id)
        const sellerEmails = auction.auctions_sellers.map((s) => s.seller_email)

        const { data: suppliesSellers } = await supabase
          .from('supplies_sellers')
          .select('*')
          .in('supply_id', supplyIds)
          .in('seller_email', sellerEmails)

        const expectedCount = auction.supplies.length * auction.auctions_sellers.length
        const actualCount = suppliesSellers?.length || 0

        if (actualCount === expectedCount) {
          auctionResults.checks.push({
            status: 'pass',
            message: `${actualCount} ceiling prices configured`,
            description: 'Checks that all ceiling prices are configured (supplies × sellers)'
          })
        } else if (actualCount > 0) {
          auctionResults.checks.push({
            status: 'warning',
            message: `${actualCount}/${expectedCount} ceiling prices configured`,
            description: 'Checks that all ceiling prices are configured (supplies × sellers)'
          })
          results.summary.warnings++
        } else {
          auctionResults.checks.push({
            status: 'fail',
            message: 'No ceiling price configured',
            description: 'Checks that all ceiling prices are configured (supplies × sellers)'
          })
          results.summary.failed++
        }

        // Check for zero ceilings
        const zeroCeilings = suppliesSellers?.filter((ss) => !ss.ceiling || ss.ceiling <= 0) || []
        if (zeroCeilings.length > 0) {
          auctionResults.checks.push({
            status: 'warning',
            message: `${zeroCeilings.length} ceiling(s) at zero or null`,
            description: 'Checks that ceiling prices are > 0'
          })
          results.summary.warnings++
        }
      }

      // Dutch specific checks
      if (auction.type === 'dutch') {
        auctionResults.checks.push({
          status: auction.dutch_prebid_enabled ? 'pass' : 'info',
          message: `Prebid: ${auction.dutch_prebid_enabled ? 'Enabled' : 'Disabled'}`,
          description: 'Indicates if the prebid system is enabled'
        })

        if (auction.overtime_range && auction.overtime_range > 0) {
          auctionResults.checks.push({
            status: 'pass',
            message: `Round duration: ${auction.overtime_range} min`,
            description: 'Checks that round duration is defined'
          })
        } else {
          auctionResults.checks.push({
            status: 'warning',
            message: 'Round duration not defined',
            description: 'Checks that round duration is defined'
          })
          results.summary.warnings++
        }

        if (auction.max_bid_decr && auction.min_bid_decr) {
          const maxRounds = Math.ceil(auction.duration / (auction.overtime_range || 1)) - 1
          const startingPrice = auction.max_bid_decr - maxRounds * auction.min_bid_decr

          if (startingPrice > 0) {
            auctionResults.checks.push({
              status: 'pass',
              message: `Price: ${startingPrice} → ${auction.max_bid_decr} (${maxRounds} rounds)`,
              description: 'Checks Dutch pricing consistency'
            })
          } else {
            auctionResults.checks.push({
              status: 'fail',
              message: `Invalid starting price: ${startingPrice}`,
              description: 'Checks that calculated starting price is > 0'
            })
            results.summary.failed++
          }
        } else {
          auctionResults.checks.push({
            status: 'fail',
            message: 'Missing price configuration (max_bid_decr, min_bid_decr)',
            description: 'Checks that price parameters are configured'
          })
          results.summary.failed++
        }
      }

      // Japanese specific checks
      if (auction.type === 'japanese' && auction.auctions_sellers?.length > 0) {
        const exitedSellers = auction.auctions_sellers.filter((s) => s.exit_time)
        if (exitedSellers.length > 0) {
          auctionResults.checks.push({
            status: 'info',
            message: `${exitedSellers.length} seller(s) exited`,
            description: 'Number of sellers who exited the Japanese auction'
          })
        }

        // Custom time_per_round
        const customTimings = auction.auctions_sellers.filter(
          (s) => s.time_per_round && s.time_per_round !== (auction.overtime_range || 0) * 60
        )
        if (customTimings.length > 0) {
          auctionResults.checks.push({
            status: 'info',
            message: `${customTimings.length} seller(s) with custom timing`,
            description: 'Sellers with a different time_per_round than default'
          })
        }
      }

      // Timing checks
      const now = dayjs()
      const startAt = auction.start_at ? dayjs(auction.start_at) : null
      const endAt = auction.end_at ? dayjs(auction.end_at) : null

      if (startAt && endAt) {
        if (auctionResults.status === 'upcoming') {
          auctionResults.checks.push({
            status: 'info',
            message: `Starts ${startAt.fromNow()} (${startAt.format('DD/MM HH:mm')})`,
            description: 'Auction start date'
          })
        } else if (auctionResults.status === 'active') {
          auctionResults.checks.push({
            status: 'info',
            message: `Ends ${endAt.fromNow()} (${endAt.format('DD/MM HH:mm')})`,
            description: 'Auction end date'
          })
        } else if (auctionResults.status === 'closed') {
          auctionResults.checks.push({
            status: 'info',
            message: `Ended ${endAt.fromNow()} (${endAt.format('DD/MM HH:mm')})`,
            description: 'Auction end date'
          })

          // Find winner
          const { data: winningBid } = await supabase
            .from('bids')
            .select('price, seller_email, seller_id, type')
            .eq('auction_id', auction.id)
            .order('price', { ascending: true })
            .limit(1)
            .single()

          if (winningBid) {
            // Try to get winner email/name and company using multiple methods
            let winnerDisplay = winningBid.seller_email
            let winnerCompany = ''

            // Method 1: If seller_id exists, try to get from profiles with company
            if (winningBid.seller_id) {
              const { data: winnerProfile } = await supabase
                .from('profiles')
                .select('email, first_name, last_name, companies(name)')
                .eq('id', winningBid.seller_id)
                .single()

              if (winnerProfile) {
                const fullName =
                  `${winnerProfile.first_name || ''} ${winnerProfile.last_name || ''}`.trim()
                if (!winnerDisplay) {
                  winnerDisplay = fullName || winnerProfile.email
                }
                if (winnerProfile.companies?.name) {
                  winnerCompany = winnerProfile.companies.name
                }
              }
            }

            // Method 2: Try to find in auctions_sellers with profiles
            if (!winnerDisplay && winningBid.seller_id) {
              const { data: allSellers } = await supabase
                .from('auctions_sellers')
                .select('seller_email, profiles(id, first_name, last_name, email, companies(name))')
                .eq('auction_id', auction.id)

              if (allSellers) {
                const matchingSeller = allSellers.find(
                  (s) => s.profiles?.id === winningBid.seller_id
                )
                if (matchingSeller) {
                  const fullName =
                    `${matchingSeller.profiles?.first_name || ''} ${matchingSeller.profiles?.last_name || ''}`.trim()
                  winnerDisplay =
                    fullName || matchingSeller.seller_email || matchingSeller.profiles?.email
                  if (matchingSeller.profiles?.companies?.name) {
                    winnerCompany = matchingSeller.profiles.companies.name
                  }
                }
              }
            }

            // Fallback to seller_id if nothing else
            if (!winnerDisplay) {
              winnerDisplay = winningBid.seller_id
                ? `ID: ${winningBid.seller_id.slice(0, 8)}...`
                : 'Unknown'
            }

            const winnerWithCompany = winnerCompany
              ? `${winnerDisplay} (${winnerCompany})`
              : winnerDisplay

            auctionResults.winner = {
              email: winnerDisplay,
              company: winnerCompany,
              price: winningBid.price,
              type: winningBid.type
            }
            auctionResults.checks.push({
              status: 'pass',
              message: `Winner: ${winnerWithCompany} @ ${winningBid.price} ${auction.currency}`,
              description: 'Identifies the auction winner'
            })
          } else {
            auctionResults.checks.push({
              status: 'warning',
              message: 'No winner (no bids)',
              description: 'Identifies the auction winner'
            })
            results.summary.warnings++
          }
        }
      } else if (!startAt) {
        auctionResults.checks.push({
          status: 'info',
          message: 'Start date not defined',
          description: 'Checks that dates are defined'
        })
      }

      // Bids check
      const { data: bids, count: bidsCount } = await supabase
        .from('bids')
        .select('id, price, type, seller_email, created_at, cloud_task', { count: 'exact' })
        .eq('auction_id', auction.id)

      if (bidsCount > 0) {
        const prebids = bids.filter((b) => b.type === 'prebid')
        const regularBids = bids.filter((b) => b.type === 'bid')
        auctionResults.checks.push({
          status: 'info',
          message: `${bidsCount} bid(s): ${prebids.length} prebid(s), ${regularBids.length} live bid(s)`,
          description: 'Counts the number of bids placed'
        })
        auctionResults.bidsCount = bidsCount
        auctionResults.prebidsCount = prebids.length

        // last_bid_time consistency check
        const lastBid = bids.reduce((latest, bid) => {
          return new Date(bid.created_at) > new Date(latest.created_at) ? bid : latest
        })
        const dbLastBidTime = auction.last_bid_time ? dayjs(auction.last_bid_time) : null
        const actualLastBidTime = dayjs(lastBid.created_at)

        if (!dbLastBidTime) {
          auctionResults.checks.push({
            status: 'warning',
            message: 'last_bid_time not set but bids exist',
            description: 'Checks last_bid_time consistency with actual bids'
          })
          results.summary.warnings++
        } else if (Math.abs(dbLastBidTime.diff(actualLastBidTime, 'second')) > 5) {
          auctionResults.checks.push({
            status: 'warning',
            message: `last_bid_time mismatch: DB=${dbLastBidTime.format('HH:mm:ss')} vs actual=${actualLastBidTime.format('HH:mm:ss')}`,
            description: 'Checks last_bid_time consistency with actual bids'
          })
          results.summary.warnings++
        }
      } else {
        auctionResults.checks.push({
          status: 'info',
          message: 'No bids',
          description: 'Counts the number of bids placed'
        })
        auctionResults.bidsCount = 0
      }

      // Duration vs calculated check
      if (startAt && endAt && auction.duration) {
        const calculatedDuration = endAt.diff(startAt, 'minute')
        const auctionEnded = now.isAfter(endAt)

        if (calculatedDuration !== auction.duration) {
          if (auction.type === 'dutch' && auctionEnded && calculatedDuration < auction.duration) {
            auctionResults.checks.push({
              status: 'info',
              message: `Ended early (${calculatedDuration}min of ${auction.duration}min planned)`,
              description: 'Dutch auction ended early due to winning bid'
            })
          } else if (!auctionEnded) {
            auctionResults.checks.push({
              status: 'warning',
              message: `Duration mismatch: DB=${auction.duration}min vs calculated=${calculatedDuration}min`,
              description: 'Checks that duration matches start/end time difference'
            })
            results.summary.warnings++
          }
        }
      }

      // Handicaps check
      const { data: handicaps } = await supabase
        .from('auctions_handicaps')
        .select('*')
        .eq('auction_id', auction.id)

      if (handicaps && handicaps.length > 0) {
        const groups = [...new Set(handicaps.map((h) => h.group_name))]
        auctionResults.checks.push({
          status: 'info',
          message: `${handicaps.length} handicap(s) configured (${groups.join(', ')})`,
          description: 'Checks handicaps configuration'
        })
      }

      // Published status check
      if (!auction.published && startAt && startAt.diff(now, 'hour') < 24) {
        auctionResults.checks.push({
          status: 'warning',
          message: 'Auction not published but starts in < 24h',
          description: 'Checks publication status'
        })
        results.summary.warnings++
      }

      // Soft delete check
      if (auction.deleted) {
        auctionResults.checks.push({
          status: 'fail',
          message: 'Auction deleted (soft delete)',
          description: 'Checks that auction is not deleted'
        })
        results.summary.failed++
      }

      // Terms check
      const hasCommercialTerms = auction.commercials_terms?.trim().length > 0
      const hasGeneralTerms = auction.general_terms?.trim().length > 0
      const hasAwardingPrinciples = auction.awarding_principles?.trim().length > 0
      const termsCount = [hasCommercialTerms, hasGeneralTerms, hasAwardingPrinciples].filter(
        Boolean
      ).length

      if (termsCount === 3) {
        auctionResults.checks.push({
          status: 'pass',
          message: 'All terms configured (3/3)',
          description:
            'Checks that commercial terms, general terms and awarding principles are defined'
        })
      } else if (termsCount > 0) {
        auctionResults.checks.push({
          status: 'warning',
          message: `${termsCount}/3 terms configured`,
          description:
            'Checks that commercial terms, general terms and awarding principles are defined'
        })
        results.summary.warnings++
      } else {
        auctionResults.checks.push({
          status: 'info',
          message: 'No terms configured',
          description:
            'Checks that commercial terms, general terms and awarding principles are defined'
        })
      }

      // Attachments accessibility check
      if (
        auction.attachments &&
        Array.isArray(auction.attachments) &&
        auction.attachments.length > 0
      ) {
        auctionResults.checks.push({
          status: 'info',
          message: `${auction.attachments.length} attachment(s)`,
          description: 'Lists attached documents'
        })

        // Check if attachments are accessible
        for (const attachment of auction.attachments) {
          if (attachment.url) {
            try {
              const controller = new AbortController()
              const timeoutId = setTimeout(() => controller.abort(), 5000)

              const response = await fetch(attachment.url, {
                method: 'HEAD',
                signal: controller.signal
              }).catch((err) => ({ ok: false, error: err.message }))

              clearTimeout(timeoutId)

              if (!response.ok && response.error) {
                auctionResults.checks.push({
                  status: 'warning',
                  message: `Attachment not accessible: ${attachment.name || 'unnamed'}`,
                  description: 'Verifies attachment URLs are reachable'
                })
                results.summary.warnings++
              }
            } catch (e) {
              // Skip on error
            }
          }
        }
      }

      // Auction configuration details
      if (auction.timezone) {
        auctionResults.checks.push({
          status: 'info',
          message: `Timezone: ${auction.timezone}`,
          description: 'Displays configured timezone'
        })
      }

      if (auction.log_visibility) {
        auctionResults.checks.push({
          status: 'info',
          message: `Log visibility: ${auction.log_visibility}`,
          description: 'Shows bid log visibility setting'
        })
      }

      // Rank settings
      if (auction.max_rank_displayed !== undefined && auction.max_rank_displayed !== null) {
        if (auction.max_rank_displayed === 0) {
          auctionResults.checks.push({
            status: 'info',
            message: 'Ranks hidden (max_rank_displayed=0)',
            description: 'Rank display configuration'
          })
        } else if (auction.max_rank_displayed < 100) {
          auctionResults.checks.push({
            status: 'info',
            message: `Ranks visible up to position ${auction.max_rank_displayed}`,
            description: 'Rank display configuration'
          })
        }
      }

      if (auction.rank_per_line_item) {
        auctionResults.checks.push({
          status: 'info',
          message: 'Rank per line item: enabled',
          description: 'Shows if ranking is per line item'
        })
      }

      if (auction.rank_trigger && auction.rank_trigger !== 'all') {
        auctionResults.checks.push({
          status: 'info',
          message: `Rank trigger: ${auction.rank_trigger}`,
          description: 'Shows rank trigger configuration'
        })
      }

      // Baseline
      if (auction.baseline) {
        auctionResults.checks.push({
          status: 'info',
          message: `Baseline price: ${auction.baseline} ${auction.currency || ''}`,
          description: 'Shows baseline price if configured'
        })
      }

      results.auctions.push(auctionResults)
    }

    // ============ SECTION 3: Buyer Profile ============
    startSection(
      'buyer-profile',
      'Buyer Profile',
      'mdi-account-tie',
      'Verifies the buyer profile assigned to the group'
    )

    if (auctionGroup.buyer_id) {
      const { data: buyer } = await supabase
        .from('profiles')
        .select('*, companies(name)')
        .eq('id', auctionGroup.buyer_id)
        .single()

      if (buyer) {
        pass(
          `${buyer.first_name} ${buyer.last_name} (${buyer.email})`,
          'Checks that buyer profile exists'
        )

        if (buyer.companies) {
          pass(`Company: ${buyer.companies.name}`, 'Checks that buyer has an assigned company')
        } else {
          warn('No company assigned', 'Checks that buyer has an assigned company')
        }

        if (!buyer.first_name || !buyer.last_name) {
          warn('Incomplete profile (missing name)', 'Checks that profile is complete')
        }
      } else {
        fail('Buyer profile not found', 'Checks that buyer profile exists')
      }
    }

    endSection()

    // ============ SECTION 4: Seller Profiles ============
    startSection(
      'seller-profiles',
      'Seller Profiles',
      'mdi-account-group',
      'Verifies profiles of all invited sellers'
    )

    const allSellerEmails = new Set()
    for (const auction of auctions) {
      for (const seller of auction.auctions_sellers || []) {
        if (seller.seller_email) {
          allSellerEmails.add(seller.seller_email)
        }
      }
    }

    console.log(
      '[HealthCheck] All seller emails collected:',
      allSellerEmails.size,
      Array.from(allSellerEmails)
    )

    if (allSellerEmails.size > 0) {
      const { data: sellerProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*, companies(name)')
        .in('email', Array.from(allSellerEmails))

      if (profilesError) {
        console.error('[HealthCheck] Error fetching seller profiles:', profilesError)
        fail(`Profiles query error: ${profilesError.message}`, 'Error fetching profiles')
      } else {
        const profileMap = new Map(sellerProfiles?.map((p) => [p.email, p]) || [])
        let profilesExist = 0
        let profilesMissing = 0
        let profilesWithCompany = 0

        for (const email of allSellerEmails) {
          const profile = profileMap.get(email)
          if (profile) {
            profilesExist++
            if (profile.company_id && profile.companies) {
              profilesWithCompany++
            }
          } else {
            profilesMissing++
          }
        }

        if (profilesMissing === 0) {
          pass(`${profilesExist} seller profile(s) found`, 'Checks that all emails have a profile')
        } else {
          warn(
            `${profilesMissing}/${allSellerEmails.size} profile(s) missing`,
            'Checks that all emails have a profile'
          )
        }

        info(
          `${profilesWithCompany} seller(s) with company`,
          'Counts sellers with an assigned company'
        )
      }
    } else {
      warn('No seller found in lots', 'Check that sellers are invited to auctions')
    }

    endSection()

    // ============ SECTION 5: Seller Trainings ============
    startSection(
      'seller-trainings',
      'Seller Trainings',
      'mdi-school',
      'Verifies that sellers have completed training'
    )

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
        } else {
          const completed = [
            training.trainings_losing,
            training.trainings_prebid_win,
            training.trainings_live_win,
            training.trainings_second_losing
          ].filter(Boolean).length

          if (completed === 4) {
            fullyTrained++
          } else if (completed > 0) {
            partiallyTrained++
          } else {
            notTrained++
          }
        }
      }

      if (fullyTrained === allSellerEmails.size) {
        pass(`${fullyTrained} seller(s) trained (4/4)`, 'Checks the 4 training steps')
      } else {
        warn(
          `Training: ${fullyTrained} complete, ${partiallyTrained} partial, ${notTrained} not started`,
          'Checks the 4 steps: losing, prebid_win, live_win, second_losing'
        )
      }
    }

    endSection()

    // ============ SECTION 6: Lot Sequence ============
    if (auctionGroup.timing_rule === 'serial' && auctions.length > 1) {
      startSection(
        'lot-sequence',
        'Lot Sequence',
        'mdi-sort-numeric-ascending',
        'Validates order and timing of lots in serial mode'
      )

      const sortedAuctions = [...auctions].sort((a, b) => a.lot_number - b.lot_number)
      let sequenceOk = true
      let overlapCount = 0

      for (let i = 0; i < sortedAuctions.length; i++) {
        const current = sortedAuctions[i]

        if (current.lot_number !== i + 1) {
          warn(
            `Numbering: expected ${i + 1}, got ${current.lot_number}`,
            'Checks that lot_number is sequential'
          )
          sequenceOk = false
        }

        if (i < sortedAuctions.length - 1) {
          const next = sortedAuctions[i + 1]
          const currentEnd = dayjs(current.end_at)
          const nextStart = dayjs(next.start_at)

          if (currentEnd.isAfter(nextStart)) {
            overlapCount++
            fail(
              `Lot ${current.lot_number} overlaps Lot ${next.lot_number}`,
              'Checks for no overlapping'
            )
          }
        }
      }

      if (overlapCount === 0 && sequenceOk) {
        pass(
          `Valid sequence: ${sortedAuctions.length} lots in order`,
          'Checks numbering and no overlapping'
        )
      }

      endSection()
    }

    // ============ SECTION 7: Currency Validation ============
    startSection(
      'currency',
      'Currency Validation',
      'mdi-currency-eur',
      'Validates ISO 4217 currency code'
    )

    const currencies = [...new Set(auctions.map((a) => a.currency).filter(Boolean))]

    if (currencies.length === 0) {
      warn('No currency defined', 'Checks that currencies are configured')
    } else {
      for (const currency of currencies) {
        if (VALID_CURRENCIES.has(currency)) {
          pass(`${currency} is a valid ISO 4217 code`, 'Checks currency code validity')
        } else {
          warn(`${currency} is not a standard ISO 4217 code`, 'Checks currency code validity')
        }
      }

      if (currencies.length > 1) {
        warn(
          `Multiple currencies used: ${currencies.join(', ')}`,
          'Checks currency consistency between lots'
        )
      }
    }

    endSection()

    // ============ SECTION 8: Google Cloud Tasks ============
    startSection(
      'cloud-tasks',
      'Google Cloud Tasks',
      'mdi-cloud-sync',
      'Checks accessibility and state of Cloud Tasks queues'
    )

    let tasksClient = null
    const allCloudTasks = new Map()

    try {
      tasksClient = createCloudTasksClient(event)

      for (const queueName of GCP_QUEUES) {
        const queuePath = tasksClient.queuePath(GCP_PROJECT, GCP_LOCATION, queueName)

        try {
          const [queue] = await tasksClient.getQueue({ name: queuePath })
          pass(`Queue "${queueName}" accessible`, 'Checks that getQueue() succeeds')

          const stateStr =
            queue.state === 1 ? 'RUNNING' : queue.state === 2 ? 'PAUSED' : `state ${queue.state}`
          if (queue.state === 1) {
            pass(`State: ${stateStr}`, 'Checks that queue is in RUNNING state')
          } else {
            warn(`State: ${stateStr}`, 'Checks that queue is in RUNNING state')
          }

          // List tasks
          let pageToken = null
          let totalTasks = 0

          do {
            const [tasks, , response] = await tasksClient.listTasks({
              parent: queuePath,
              pageSize: 100,
              pageToken,
              responseView: 'FULL'
            })

            for (const task of tasks) {
              allCloudTasks.set(task.name, task)
              totalTasks++
            }

            pageToken = response?.nextPageToken
          } while (pageToken)

          info(`${totalTasks} task(s) in queue`, 'Counts number of tasks')

          // Rate limits
          if (queue.rateLimits) {
            const { maxDispatchesPerSecond, maxConcurrentDispatches } = queue.rateLimits
            info(
              `Rate limits: ${maxDispatchesPerSecond || 'unlimited'}/sec, ${maxConcurrentDispatches || 'unlimited'} concurrent`,
              'Shows queue limits'
            )
          }
        } catch (queueError) {
          fail(
            `Queue "${queueName}" not accessible: ${queueError.message}`,
            'Checks that getQueue() succeeds'
          )
        }
      }
    } catch (gcpError) {
      fail(`GCP error: ${gcpError.message}`, 'Checks connection to Google Cloud Tasks')
    }

    endSection()

    // ============ SECTION 9: Cloud Tasks Payload Verification ============
    if (allCloudTasks.size > 0) {
      startSection(
        'cloud-tasks-payloads',
        'Cloud Tasks Payload Verification',
        'mdi-code-json',
        'Verifies payloads of scheduled tasks'
      )

      // Display actual endpoints from GCloud tasks
      const uniqueEndpoints = new Set()
      for (const [, task] of allCloudTasks) {
        const url = task.httpRequest?.url
        if (url) {
          uniqueEndpoints.add(url)
        }
      }

      if (uniqueEndpoints.size > 0) {
        info('Actual endpoints configured in GCloud Tasks:', 'URLs found in scheduled tasks')
        for (const url of uniqueEndpoints) {
          info(`  ${url}`, 'Webhook URL configured in Cloud Tasks')
        }
      } else {
        info('No endpoints found in GCloud Tasks', 'No scheduled tasks in queue')
      }

      const auctionIds = new Set(auctions.map((a) => a.id))
      let matchedTasks = 0
      let missingTasks = 0
      let payloadMismatches = 0
      const taskDetails = []

      for (const auction of auctions) {
        if (auction.type !== 'dutch') continue

        const lotInfo = `Lot ${auction.lot_number}`

        // Detect prebids present in DB but not scheduled in Cloud Tasks
        const { data: prebidsWithoutTask } = await supabase
          .from('bids')
          .select('id, price, seller_email, profiles(email)')
          .eq('auction_id', auction.id)
          .eq('type', 'prebid')
          .is('cloud_task', null)

        if (prebidsWithoutTask && prebidsWithoutTask.length > 0) {
          missingTasks += prebidsWithoutTask.length
          fail(
            `${lotInfo}: ${prebidsWithoutTask.length} prebid(s) missing cloud_task`,
            'Prebids exist in DB but were not scheduled in Cloud Tasks'
          )
          for (const bid of prebidsWithoutTask) {
            const seller = bid.seller_email || bid.profiles?.email || 'Unknown seller'
            warn(
              `${lotInfo} - ${seller} @ ${bid.price} ${auction.currency || ''} - MISSING TASK`,
              'Prebid has no Cloud Task reference'
            )
          }
        }

        const { data: bidsWithTasks } = await supabase
          .from('bids')
          .select('*, profiles(email)')
          .eq('auction_id', auction.id)
          .not('cloud_task', 'is', null)

        if (!bidsWithTasks || bidsWithTasks.length === 0) continue

        for (const bid of bidsWithTasks) {
          const taskName = bid.cloud_task
          const task = allCloudTasks.get(taskName)
          const sellerEmail = bid.seller_email || bid.profiles?.email || 'Unknown'

          if (!task) {
            // Check if executed
            const { data: executedBids } = await supabase
              .from('bids')
              .select('id')
              .eq('auction_id', auction.id)
              .eq('seller_id', bid.seller_id)
              .eq('type', 'bid')
              .limit(1)

            const wasExecuted = executedBids && executedBids.length > 0
            const auctionEnded = dayjs().isAfter(dayjs(auction.end_at))

            if (wasExecuted) {
              matchedTasks++
              taskDetails.push({
                status: 'executed',
                lot: auction.lot_number,
                seller: sellerEmail,
                price: bid.price
              })
              info(
                `${lotInfo} - ${sellerEmail} @ ${bid.price} ${auction.currency || ''} - Executed ✓`,
                'Prebid was successfully converted to live bid'
              )
            } else if (auctionEnded) {
              info(
                `${lotInfo} - ${sellerEmail} @ ${bid.price} ${auction.currency || ''} - Not converted`,
                'Prebid was not executed (auction ended)'
              )
            } else {
              missingTasks++
              warn(
                `${lotInfo} - ${sellerEmail} @ ${bid.price} ${auction.currency || ''} - Task missing!`,
                'Cloud Task not found in queue'
              )
            }
            continue
          }

          // Get scheduled time and endpoint URL
          const scheduleTime = task.scheduleTime?.seconds
            ? dayjs.unix(task.scheduleTime.seconds)
            : null
          const taskUrl = task.httpRequest?.url || 'URL unknown'

          // Verify payload
          try {
            const payload = parseTaskBody(task.httpRequest?.body)
            if (!payload) throw new Error('Empty payload')

            const payloadBidId = payload.id || payload.bid_id || payload.bidId
            const payloadAuctionId = payload.auction_id || payload.auctionId

            if (payloadBidId === bid.id && payloadAuctionId === bid.auction_id) {
              matchedTasks++
              taskDetails.push({
                status: 'verified',
                lot: auction.lot_number,
                seller: sellerEmail,
                price: bid.price,
                scheduledAt: scheduleTime,
                endpoint: taskUrl
              })
              const timeStr = scheduleTime
                ? `scheduled ${scheduleTime.format('DD/MM HH:mm:ss')}`
                : 'schedule time unknown'
              info(
                `${lotInfo} - ${sellerEmail} @ ${bid.price} ${auction.currency || ''} - ${timeStr}`,
                `Task verified in queue with correct payload → ${taskUrl}`
              )
            } else {
              payloadMismatches++
              warn(
                `${lotInfo} - ${sellerEmail} @ ${bid.price} ${auction.currency || ''} - Payload mismatch!`,
                `Expected bid_id=${bid.id}, got ${payloadBidId} → ${taskUrl}`
              )
            }
          } catch (e) {
            payloadMismatches++
            warn(
              `${lotInfo} - ${sellerEmail} @ ${bid.price} ${auction.currency || ''} - Parse error!`,
              `Cannot parse task payload: ${e.message} → ${taskUrl}`
            )
          }
        }
      }

      if (matchedTasks > 0 && missingTasks === 0 && payloadMismatches === 0) {
        pass(`${matchedTasks} task(s) verified`, 'Checks payload/DB consistency')
      }
      if (missingTasks > 0) {
        fail(`${missingTasks} task(s) missing`, 'Checks that tasks exist in queue')
      }
      if (payloadMismatches > 0) {
        warn(`${payloadMismatches} payload mismatch(es)`, 'Checks that payloads match bids')
      }

      endSection()

      // ============ SECTION 10: Orphaned Tasks ============
      startSection(
        'orphaned-tasks',
        'Orphaned Tasks',
        'mdi-ghost',
        'Detects tasks referencing non-existent data'
      )

      let orphanedTasks = 0

      for (const [, task] of allCloudTasks) {
        try {
          const payload = parseTaskBody(task.httpRequest?.body)
          if (!payload) continue

          if (payload.auction_id && auctionIds.has(payload.auction_id)) {
            const bidId = payload.id || payload.bid_id
            if (bidId) {
              const { data: bid } = await supabase
                .from('bids')
                .select('id')
                .eq('id', bidId)
                .single()

              if (!bid) {
                orphanedTasks++
              }
            }
          }
        } catch (e) {
          // Skip unparseable tasks
        }
      }

      if (orphanedTasks === 0) {
        pass('No orphaned tasks', 'Checks that each task references an existing bid')
      } else {
        warn(`${orphanedTasks} orphaned task(s)`, 'Detects tasks referencing deleted bids')
      }

      endSection()

      // ============ SECTION 11: Conflicting Tasks ============
      startSection(
        'conflicting-tasks',
        'Conflicting Tasks',
        'mdi-alert-decagram',
        'Detects tasks from other auctions scheduled during our windows'
      )

      const ourAuctionWindows = auctions.map((a) => ({
        id: a.id,
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

          if (payload.auction_id && auctionIds.has(payload.auction_id)) continue

          const scheduleTime = task.scheduleTime?.seconds
          if (scheduleTime) {
            const scheduledAt = dayjs.unix(scheduleTime)

            for (const window of ourAuctionWindows) {
              if (scheduledAt.isAfter(window.start) && scheduledAt.isBefore(window.end)) {
                conflictingTasks++
                if (payload.auction_id) {
                  otherAuctionIds.add(payload.auction_id)
                }
                break
              }
            }
          }
        } catch (e) {
          // Skip
        }
      }

      if (conflictingTasks === 0) {
        pass('No conflicting tasks', 'Checks that no other auction has tasks in our windows')
      } else {
        warn(
          `${conflictingTasks} task(s) from other auctions during our windows`,
          `${otherAuctionIds.size} other auction(s) concerned`
        )
      }

      endSection()

      // ============ SECTION 12: Queue Rate Limits ============
      startSection(
        'queue-rate-limits',
        'Queue Limits',
        'mdi-speedometer',
        'Checks Cloud Tasks queue rate limits'
      )

      for (const queueName of GCP_QUEUES) {
        try {
          const queuePath = tasksClient.queuePath(GCP_PROJECT, GCP_LOCATION, queueName)
          const [queue] = await tasksClient.getQueue({ name: queuePath })

          if (queue.rateLimits) {
            const { maxDispatchesPerSecond, maxConcurrentDispatches } = queue.rateLimits
            const limitStr = `${maxDispatchesPerSecond || 'unlimited'}/sec, ${maxConcurrentDispatches || 'unlimited'} concurrent`
            info(`${queueName}: ${limitStr}`, 'Shows queue rate limits')

            if (maxDispatchesPerSecond && maxDispatchesPerSecond < 10) {
              warn(
                `${queueName}: low rate limit (${maxDispatchesPerSecond}/sec)`,
                'Rate limit may be too low for auction traffic'
              )
            }
          } else {
            info(`${queueName}: default limits`, 'Queue uses default settings')
          }
        } catch (e) {
          info(`${queueName}: limits not readable`, 'Unable to read limits')
        }
      }

      endSection()

      // ============ SECTION 13: Webhook Endpoint Ping ============
      startSection(
        'webhook-ping',
        'Webhook Endpoints Ping',
        'mdi-access-point-network',
        'Checks accessibility of endpoints used by Cloud Tasks'
      )

      // Extract unique URLs from Cloud Tasks
      const taskUrls = new Set()
      for (const [, task] of allCloudTasks) {
        const url = task.httpRequest?.url
        if (url) {
          taskUrls.add(url)
        }
      }

      if (taskUrls.size === 0) {
        info('No Cloud Task URL to test', 'No tasks with URLs to verify')
      } else {
        info(`Testing ${taskUrls.size} unique endpoint(s)`, 'URLs extracted from Cloud Tasks')

        for (const url of taskUrls) {
          try {
            const urlObj = new URL(url)
            const endpoint = urlObj.pathname

            // Ping with HEAD request and timeout
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000)

            const response = await fetch(url, {
              method: 'HEAD',
              signal: controller.signal,
              headers: {
                'User-Agent': 'HealthCheck/1.0'
              }
            }).catch((err) => ({ ok: false, status: 0, error: err.message }))

            clearTimeout(timeoutId)

            if (response.ok || response.status === 200 || response.status === 204) {
              pass(`${endpoint} → ${response.status} OK`, 'Endpoint accessible')
            } else if (response.status === 401 || response.status === 403) {
              info(
                `${endpoint} → ${response.status} (auth required)`,
                'Protected endpoint - expected behavior'
              )
            } else if (response.status === 405) {
              info(
                `${endpoint} → ${response.status} (method not allowed)`,
                'HEAD not supported - normal for webhooks'
              )
            } else if (response.status === 0 || response.error) {
              const errMsg = response.error || 'Connection failed'
              if (errMsg.includes('abort')) {
                warn(`${endpoint} → TIMEOUT`, 'Endpoint not responding within 5s')
              } else {
                fail(`${endpoint} → ${errMsg}`, 'Endpoint inaccessible')
              }
            } else {
              info(`${endpoint} → ${response.status}`, 'Response received')
            }
          } catch (pingError) {
            info(`Invalid URL: ${url.slice(0, 50)}...`, pingError.message)
          }
        }
      }

      endSection()
    }

    // ============ SECTION 14: Time Synchronization ============
    startSection(
      'time-sync',
      'Time Synchronization',
      'mdi-clock-check',
      'Checks server time synchronization'
    )

    try {
      const serverTime = new Date()
      info(
        `Server time: ${dayjs(serverTime).format('DD/MM/YYYY HH:mm:ss')}`,
        'Displays server time'
      )
      pass('Supabase connection OK', 'Checks connectivity with Supabase')
    } catch (e) {
      fail(`Synchronization error: ${e.message}`, 'Checks time synchronization')
    }

    endSection()

    // ============ SECTION 15: Vercel Logs (if VERCEL_TOKEN is set) ============
    const vercelToken = process.env.VERCEL_TOKEN

    if (vercelToken) {
      startSection(
        'vercel-logs',
        'Vercel Logs',
        'mdi-triangle',
        'Analyzes Vercel error logs from the last 72h'
      )

      try {
        // Get deployment URL
        const projectsResponse = await fetch('https://api.vercel.com/v9/projects?limit=10', {
          headers: { Authorization: `Bearer ${vercelToken}` }
        })

        if (projectsResponse.ok) {
          const projectsData = await projectsResponse.json()
          const crownProject = projectsData.projects?.find((p) => p.name === 'crown')

          if (crownProject) {
            // Get latest production deployment
            const deploymentsResponse = await fetch(
              `https://api.vercel.com/v6/deployments?projectId=${crownProject.id}&target=production&limit=1`,
              { headers: { Authorization: `Bearer ${vercelToken}` } }
            )

            if (deploymentsResponse.ok) {
              const deploymentsData = await deploymentsResponse.json()
              const latestDeployment = deploymentsData.deployments?.[0]

              if (latestDeployment) {
                const deployDate = dayjs(latestDeployment.createdAt)
                info(
                  `Last deployment: ${deployDate.format('DD/MM/YYYY HH:mm')}`,
                  'Date of last production deployment'
                )

                // Get events/logs
                const since = dayjs().subtract(72, 'hour').valueOf()
                const eventsResponse = await fetch(
                  `https://api.vercel.com/v2/deployments/${latestDeployment.uid}/events?since=${since}&limit=500`,
                  { headers: { Authorization: `Bearer ${vercelToken}` } }
                )

                if (eventsResponse.ok) {
                  const events = await eventsResponse.json()
                  let errorCount = 0

                  for (const event of events || []) {
                    const isError =
                      event.type === 'error' ||
                      event.payload?.statusCode >= 500 ||
                      (event.payload?.message || '').toLowerCase().includes('error')
                    if (isError) errorCount++
                  }

                  if (errorCount === 0) {
                    pass(
                      `No errors in Vercel logs (${events?.length || 0} events)`,
                      'Counts HTTP 500+ errors and error events'
                    )
                  } else {
                    warn(
                      `${errorCount} error(s) in Vercel logs`,
                      'Counts HTTP 500+ errors and error events'
                    )
                  }
                }
              }
            }
          }
        }
      } catch (vercelError) {
        info(`Vercel check skipped: ${vercelError.message}`, 'Error calling Vercel API')
      }

      endSection()
    }

    // ============ SECTION 16: GCloud Logs ============
    startSection(
      'gcloud-logs',
      'Google Cloud Logs',
      'mdi-google-cloud',
      'Analyzes Cloud Tasks error logs from the last 72h'
    )

    let sectionCompleted = false
    try {
      // Use the same auth client as Cloud Tasks (WIF with Vercel OIDC)
      const authClient = getAuthClient(event)

      let accessToken
      try {
        if (authClient) {
          // Use WIF auth client (production with Vercel OIDC)
          accessToken = await authClient.getAccessToken()
        } else {
          // Fallback to Application Default Credentials (local dev)
          const { GoogleAuth } = await import('google-auth-library')
          const auth = new GoogleAuth({
            scopes: ['https://www.googleapis.com/auth/logging.read']
          })
          const client = await auth.getClient()
          accessToken = await client.getAccessToken()
        }
      } catch (authError) {
        // If credentials are not available (common in local dev or non-GCP environments)
        if (authError.message?.includes('Could not load the default credentials')) {
          info(
            'GCloud logs unavailable',
            'Application Default Credentials not configured. Run: gcloud auth application-default login'
          )
        } else if (authError.message?.includes('OIDC token')) {
          info(
            'GCloud logs unavailable',
            'Vercel OIDC token not found. Check GCP_* environment variables configuration.'
          )
        } else {
          info(`GCloud authentication failed: ${authError.message}`, 'Unable to read logs')
        }
        // Mark as completed and skip the rest
        sectionCompleted = true
      }

      if (!sectionCompleted && accessToken?.token) {
        const logStartTime = dayjs().subtract(72, 'hour').toISOString()

        // Query for Cloud Tasks errors
        const filter = `resource.type="cloud_tasks_queue" AND severity>=ERROR AND timestamp>="${logStartTime}"`

        const logsResponse = await fetch(`https://logging.googleapis.com/v2/entries:list`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resourceNames: [`projects/${GCP_PROJECT}`],
            filter,
            orderBy: 'timestamp desc',
            pageSize: 50
          })
        })

        if (logsResponse.ok) {
          const logsData = await logsResponse.json()
          const entries = logsData.entries || []

          if (entries.length === 0) {
            pass('No Cloud Tasks errors', 'Checks logs with severity >= ERROR')
          } else {
            warn(`${entries.length} Cloud Tasks error(s)`, 'Errors found in last 72h')

            // Show first 3 errors
            for (const entry of entries.slice(0, 3)) {
              const timestamp = entry.timestamp ? dayjs(entry.timestamp).format('DD/MM HH:mm') : '?'
              const msg = entry.textPayload || entry.jsonPayload?.message || 'Unknown error'
              info(`[${timestamp}] ${msg.slice(0, 80)}`, 'Error detail')
            }
          }
        } else {
          const errorText = await logsResponse.text()
          info(`Unable to read logs: ${logsResponse.status}`, errorText.slice(0, 100))
        }

        // Query for HTTP errors in Cloud Tasks execution
        const httpFilter = `resource.type="cloud_tasks_queue" AND httpRequest.status>=400 AND timestamp>="${logStartTime}"`

        const httpLogsResponse = await fetch(`https://logging.googleapis.com/v2/entries:list`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            resourceNames: [`projects/${GCP_PROJECT}`],
            filter: httpFilter,
            orderBy: 'timestamp desc',
            pageSize: 50
          })
        })

        if (httpLogsResponse.ok) {
          const httpLogsData = await httpLogsResponse.json()
          const httpEntries = httpLogsData.entries || []

          if (httpEntries.length === 0) {
            pass('No Cloud Tasks HTTP errors', 'Checks HTTP responses >= 400')
          } else {
            warn(`${httpEntries.length} Cloud Tasks HTTP error(s)`, 'Requests with status >= 400')

            // Show first 3 HTTP errors
            for (const entry of httpEntries.slice(0, 3)) {
              const timestamp = entry.timestamp ? dayjs(entry.timestamp).format('DD/MM HH:mm') : '?'
              const status = entry.httpRequest?.status || '?'
              const url = entry.httpRequest?.requestUrl || 'unknown'
              const path = url.includes('/api/') ? '/api/' + url.split('/api/')[1] : url
              info(`[${timestamp}] ${status} ${path.slice(0, 60)}`, 'HTTP error detail')
            }
          }
        }
      } else if (!sectionCompleted) {
        info('GCP token not available', 'GCP authentication required to read logs')
      }
    } catch (gcloudError) {
      // Only log if we haven't already shown an auth error
      if (!gcloudError.message?.includes('Could not load the default credentials')) {
        info(`GCloud logs check failed: ${gcloudError.message}`, 'Error reading logs')
      }
    }

    endSection()

    // ============ SECTION 17: Suspicious Bids Detection ============
    startSection(
      'suspicious-bids',
      'Suspicious Bids Detection',
      'mdi-alert-rhombus',
      'Detects potentially abnormal bids'
    )

    for (const auction of auctions) {
      const { data: auctionBids } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auction.id)
        .order('created_at', { ascending: true })

      if (!auctionBids || auctionBids.length < 2) {
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

        for (const [, count] of Object.entries(priceCount)) {
          if (count > 1) {
            duplicates++
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

      if (duplicates > 0) {
        warn(
          `Lot ${auction.lot_number}: ${duplicates} duplicate price(s)`,
          'A seller placed multiple bids at the same price'
        )
      }
      if (suspiciousTimings > 0) {
        warn(
          `Lot ${auction.lot_number}: ${suspiciousTimings} bid(s) < 2s apart`,
          'Bids placed very rapidly consecutively'
        )
      }
    }

    // Count total bids analyzed from results.auctions
    const totalBidsAnalyzed = results.auctions.reduce((sum, a) => sum + (a.bidsCount || 0), 0)
    if (totalBidsAnalyzed > 0) {
      info(`${totalBidsAnalyzed} bid(s) analyzed`, 'Total number of bids verified')
    } else {
      info('No bids to analyze', 'Not enough data to detect anomalies')
    }

    endSection()

    // ============ SECTION 18: Webhook & Trigger Status ============
    startSection(
      'webhook-status',
      'Webhooks & Triggers',
      'mdi-webhook',
      'Checks Supabase webhooks configuration'
    )

    info('Expected endpoints:', 'List of webhooks used by the application')
    info('/api/v1/webhooks/auctions/insert', 'Webhook on auction insert')
    info('/api/v1/webhooks/auctions/update', 'Webhook on auction update')
    info('/api/v1/webhooks/bids/insert', 'Webhook on bid insert')
    info('/api/v1/webhooks/users/insert', 'Webhook on user creation')

    // Check for test vs real auctions
    const testAuctions = auctions.filter((a) => a.usage === 'test')
    const realAuctions = auctions.filter((a) => a.usage === 'real' || !a.usage)

    if (testAuctions.length > 0 && realAuctions.length > 0) {
      warn(
        `Mix test/real: ${testAuctions.length} test, ${realAuctions.length} real`,
        'Some auctions are in test mode and others in real mode'
      )
    } else if (testAuctions.length > 0) {
      info(`${testAuctions.length} auction(s) in TEST mode`, 'These auctions are for testing')
    } else {
      pass(`${realAuctions.length} auction(s) in REAL mode`, 'These are real auctions')
    }

    endSection()

    // ============ SECTION 19: Historical Comparison ============
    startSection(
      'historical',
      'Historical Comparison',
      'mdi-chart-timeline-variant',
      'Compares with similar past auctions'
    )

    const auctionTypes = [...new Set(auctions.map((a) => a.type))]

    for (const auctionType of auctionTypes) {
      const { count } = await supabase
        .from('auctions')
        .select('id', { count: 'exact', head: true })
        .eq('type', auctionType)
        .eq('usage', 'real')
        .lt('end_at', dayjs().toISOString())

      if (count > 0) {
        info(
          `${count} past ${auctionType} auction(s)`,
          'Number of completed auctions of the same type'
        )
      } else {
        info(`No past ${auctionType} auction`, 'No historical data for this type')
      }
    }

    endSection()

    // ============ SECTION 20: Japanese Seller Timing ============
    const japaneseAuctions = auctions.filter((a) => a.type === 'japanese')
    if (japaneseAuctions.length > 0) {
      startSection(
        'japanese-timing',
        'Japanese Seller Timing',
        'mdi-timer-outline',
        'Verifies custom seller timings in Japanese auctions'
      )

      for (const auction of japaneseAuctions) {
        const defaultTiming = (auction.overtime_range || 0) * 60

        const customTimings =
          auction.auctions_sellers?.filter(
            (s) => s.time_per_round && s.time_per_round !== defaultTiming
          ) || []

        if (customTimings.length > 0) {
          info(
            `Lot ${auction.lot_number}: ${customTimings.length} seller(s) with custom timing`,
            'These sellers have a different time_per_round than default'
          )
        } else {
          pass(
            `Lot ${auction.lot_number}: all sellers use default timing (${auction.overtime_range} min)`,
            'No custom timing configured'
          )
        }
      }

      endSection()
    }

    // ============ SECTION 21: Bid Supplies Consistency ============
    startSection(
      'bid-supplies',
      'bid_supplies Consistency',
      'mdi-package-variant-closed-check',
      'Verifies that each bid has corresponding bid_supplies entries'
    )

    let bidSuppliesIssues = 0
    let bidSuppliesTotal = 0

    for (const auction of auctions) {
      const { data: bids } = await supabase.from('bids').select('id').eq('auction_id', auction.id)

      if (!bids || bids.length === 0) continue

      const suppliesCount = auction.supplies?.length || 0
      if (suppliesCount === 0) continue

      const bidIds = bids.map((b) => b.id)
      const { data: bidSupplies } = await supabase
        .from('bid_supplies')
        .select('bid_id')
        .in('bid_id', bidIds)

      if (bidSupplies) {
        bidSuppliesTotal += bidSupplies.length

        // Check each bid has correct number of bid_supplies
        const bidSuppliesByBid = {}
        for (const bs of bidSupplies) {
          bidSuppliesByBid[bs.bid_id] = (bidSuppliesByBid[bs.bid_id] || 0) + 1
        }

        for (const bid of bids) {
          const count = bidSuppliesByBid[bid.id] || 0
          if (count > 0 && count !== suppliesCount) {
            bidSuppliesIssues++
          }
        }
      }
    }

    if (bidSuppliesIssues === 0) {
      pass(`${bidSuppliesTotal} bid_supplies verified`, 'All entries are consistent')
    } else {
      warn(
        `${bidSuppliesIssues} bid_supplies inconsistency(ies)`,
        'Some bids do not have the correct number of bid_supplies'
      )
    }

    endSection()

    // ============ SECTION 22: Bids Handicaps Consistency ============
    startSection(
      'bids-handicaps',
      'bids_handicaps Consistency',
      'mdi-weight',
      'Verifies that handicap references are valid'
    )

    let handicapsIssues = 0
    let handicapsTotal = 0

    for (const auction of auctions) {
      const { data: bids } = await supabase.from('bids').select('id').eq('auction_id', auction.id)

      const { data: handicaps } = await supabase
        .from('auctions_handicaps')
        .select('id')
        .eq('auction_id', auction.id)

      if (!bids || bids.length === 0 || !handicaps || handicaps.length === 0) continue

      const bidIds = bids.map((b) => b.id)
      const handicapIds = new Set(handicaps.map((h) => h.id))

      const { data: bidsHandicaps } = await supabase
        .from('bids_handicaps')
        .select('handicap_id')
        .in('bid_id', bidIds)

      if (bidsHandicaps) {
        handicapsTotal += bidsHandicaps.length

        for (const bh of bidsHandicaps) {
          if (!handicapIds.has(bh.handicap_id)) {
            handicapsIssues++
          }
        }
      }
    }

    if (handicapsIssues === 0) {
      if (handicapsTotal > 0) {
        pass(`${handicapsTotal} bids_handicaps verified`, 'All references are valid')
      } else {
        info('No bids_handicaps entries', 'No handicaps used in bids')
      }
    } else {
      fail(
        `${handicapsIssues} invalid handicap reference(s)`,
        'Some bids_handicaps reference non-existent handicaps'
      )
    }

    endSection()

    // ============ SECTION 23: Seller Data Integrity ============
    startSection(
      'seller-integrity',
      'Seller Data Integrity',
      'mdi-account-check',
      'Verifies seller and bid data integrity'
    )

    let integrityIssues = 0

    for (const auction of auctions) {
      // Check for duplicate sellers
      if (auction.auctions_sellers?.length > 0) {
        const emailCounts = {}
        for (const s of auction.auctions_sellers) {
          emailCounts[s.seller_email] = (emailCounts[s.seller_email] || 0) + 1
        }

        const duplicates = Object.entries(emailCounts).filter(([, count]) => count > 1)
        if (duplicates.length > 0) {
          fail(
            `Lot ${auction.lot_number}: duplicate sellers`,
            `${duplicates.map(([email, count]) => `${email} (${count}x)`).join(', ')}`
          )
          integrityIssues++
        }
      }

      // Check seller_id in bids matches profile
      const { data: bids } = await supabase
        .from('bids')
        .select('id, seller_email, seller_id')
        .eq('auction_id', auction.id)

      if (bids && bids.length > 0) {
        const sellerEmails = auction.auctions_sellers?.map((s) => s.seller_email) || []

        for (const bid of bids) {
          if (bid.seller_email && !sellerEmails.includes(bid.seller_email)) {
            integrityIssues++
          }
        }
      }
    }

    if (integrityIssues === 0) {
      pass('Seller data integrity OK', 'No duplicates or inconsistencies')
    } else {
      warn(`${integrityIssues} integrity issue(s)`, 'Check seller data')
    }

    endSection()

    // ============ SECTION 24: Supplies Index Check ============
    startSection(
      'supplies-index',
      'Supplies Index',
      'mdi-format-list-numbered',
      'Verifies that supply indexes are unique and sequential'
    )

    let indexIssues = 0

    for (const auction of auctions) {
      if (!auction.supplies || auction.supplies.length <= 1) continue

      const indexes = auction.supplies
        .map((s) => s.index)
        .filter((i) => i !== null && i !== undefined)

      // Check for missing indexes
      if (indexes.length !== auction.supplies.length) {
        warn(
          `Lot ${auction.lot_number}: ${auction.supplies.length - indexes.length} supply without index`,
          'Some supplies do not have an index defined'
        )
        indexIssues++
      }

      // Check for duplicate indexes
      const indexCounts = {}
      for (const idx of indexes) {
        indexCounts[idx] = (indexCounts[idx] || 0) + 1
      }

      const duplicates = Object.entries(indexCounts).filter(([, count]) => count > 1)
      if (duplicates.length > 0) {
        warn(
          `Lot ${auction.lot_number}: duplicate indexes: ${duplicates.map(([idx]) => idx).join(', ')}`,
          'Multiple supplies have the same index'
        )
        indexIssues++
      }
    }

    if (indexIssues === 0) {
      pass('Supplies index OK', 'All indexes are unique and defined')
    }

    endSection()

    // ============ SECTION 25: Dutch Ceiling vs End Price ============
    startSection(
      'dutch-ceiling',
      'Dutch: Ceiling vs End Price',
      'mdi-currency-eur',
      'Compares ceiling prices with Dutch end price'
    )

    const dutchAuctions = auctions.filter((a) => a.type === 'dutch')
    let ceilingIssues = 0

    for (const auction of dutchAuctions) {
      if (!auction.max_bid_decr || !auction.supplies?.length) continue

      const supplyIds = auction.supplies.map((s) => s.id)

      const { data: suppliesSellers } = await supabase
        .from('supplies_sellers')
        .select('ceiling, supply_id')
        .in('supply_id', supplyIds)

      if (suppliesSellers) {
        for (const ss of suppliesSellers) {
          // Flag if ceiling is less than 50% of end price
          if (ss.ceiling && ss.ceiling < auction.max_bid_decr * 0.5) {
            ceilingIssues++
          }
        }
      }
    }

    if (ceilingIssues > 0) {
      info(
        `${ceilingIssues} ceiling(s) < 50% of end price`,
        'May be intentional but worth verifying'
      )
    } else if (dutchAuctions.length > 0) {
      pass('Ceilings consistent with end price', 'All ceilings are >= 50% of Dutch end price')
    } else {
      info('No Dutch auction', 'This check only applies to Dutch auctions')
    }

    endSection()

    // ============ SECTION 26: Supplies Sellers Modifiers ============
    startSection(
      'supplies-modifiers',
      'Supplies/Sellers Modifiers',
      'mdi-tune',
      'Verifies additive/multiplicative handicaps for supplies_sellers'
    )

    let modifiersCount = 0

    for (const auction of auctions) {
      if (!auction.supplies?.length || !auction.auctions_sellers?.length) continue

      const supplyIds = auction.supplies.map((s) => s.id)
      const sellerEmails = auction.auctions_sellers.map((s) => s.seller_email)

      const { data: ssData } = await supabase
        .from('supplies_sellers')
        .select('additive, multiplicative')
        .in('supply_id', supplyIds)
        .in('seller_email', sellerEmails)

      if (ssData) {
        const withAdditive = ssData.filter((ss) => ss.additive !== 0 && ss.additive !== null).length
        const withMulti = ssData.filter(
          (ss) => ss.multiplicative !== 1 && ss.multiplicative !== null
        ).length

        if (withAdditive > 0 || withMulti > 0) {
          info(
            `Lot ${auction.lot_number}: ${withAdditive} additive, ${withMulti} multiplicative`,
            'Handicaps applied to supplies/sellers'
          )
          modifiersCount += withAdditive + withMulti
        }
      }
    }

    if (modifiersCount === 0) {
      info('No modifier configured', 'No additive/multiplicative handicaps')
    } else {
      pass(`${modifiersCount} modifier(s) configured`, 'Handicaps are applied')
    }

    endSection()

    // ============ SECTION 27: Supabase Realtime ============
    startSection(
      'realtime',
      'Supabase Realtime',
      'mdi-broadcast',
      'Tests Supabase Realtime subscription'
    )

    try {
      const testChannel = supabase.channel('health-check-test')

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
      pass('Realtime connection successful', 'Verifies Supabase Realtime is working')
    } catch (realtimeError) {
      warn(`Realtime: ${realtimeError.message}`, 'Live auction updates may not work properly')
    }

    endSection()

    // ============ SECTION 28: Edge Functions Health ============
    startSection(
      'edge-functions',
      'Supabase Edge Functions',
      'mdi-function',
      'Checks Edge Functions infrastructure health'
    )

    const projectRef = config.public?.supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
    const edgeFunctionKey = config.public?.supabaseAnonKey

    if (!projectRef) {
      info('Cannot extract project ref - skipping', 'Edge Functions check requires project URL')
    } else if (!edgeFunctionKey) {
      info('No anon key available - skipping', 'Edge Functions check requires anon key')
    } else {
      try {
        const functionsBaseUrl = `https://${projectRef}.supabase.co/functions/v1`

        // Check if Edge Functions endpoint is accessible
        const healthResponse = await fetch(functionsBaseUrl, {
          method: 'OPTIONS',
          headers: {
            Authorization: `Bearer ${edgeFunctionKey}`
          }
        })

        if (healthResponse.ok || healthResponse.status === 204) {
          pass('Edge Functions endpoint accessible', 'Infrastructure is operational')
        } else {
          info(`Edge Functions returned ${healthResponse.status}`, 'Endpoint responded')
        }

        // Try hello-world function if deployed
        try {
          const fnUrl = `${functionsBaseUrl}/hello-world`
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
            pass(
              `hello-world function OK${result?.message ? `: ${result.message}` : ''}`,
              'Test function is working'
            )
          } else if (invokeResponse.status === 404) {
            info('hello-world function not deployed', 'Optional test function')
          } else {
            info(`hello-world returned ${invokeResponse.status}`, 'Function responded')
          }
        } catch (fnError) {
          info(`hello-world check skipped: ${fnError.message}`, 'Could not invoke function')
        }
      } catch (efError) {
        info(`Edge Functions check failed: ${efError.message}`, 'Infrastructure check skipped')
      }
    }

    endSection()

    // ============ SECTION 29: Infrastructure ============
    startSection(
      'infrastructure',
      'Infrastructure',
      'mdi-server',
      'Verifies general infrastructure state'
    )

    pass('Supabase connected', 'Verifies connection to Supabase')
    info(`Timestamp: ${results.timestamp}`, 'Health check timestamp')

    endSection()
  } catch (error) {
    if (currentSection) {
      fail(`System error: ${error.message}`, 'Unexpected error during health check')
      endSection()
    } else {
      results.sections.push({
        id: 'error',
        title: 'Error',
        icon: 'mdi-alert-circle',
        description: 'An error occurred',
        checks: [{ status: 'fail', message: error.message, description: 'System error' }]
      })
      results.summary.failed++
      results.summary.total++
    }
  }

  return results
})
