/**
 * Script de migration des Cloud Tasks après changement d'organisation GCP
 *
 * Ce script :
 * 1. Récupère tous les prebids avec cloud_task pour des enchères futures
 * 2. Supprime les anciennes Cloud Tasks (sur l'ancien projet)
 * 3. Crée de nouvelles Cloud Tasks sur le nouveau projet GCP
 * 4. Met à jour la colonne cloud_task dans la base de données
 *
 * Usage:
 *   node scripts/migrations/migrateCloudTasks.js [--dry-run]
 *
 * Options:
 *   --dry-run : Affiche les actions sans les exécuter
 */

import { createClient } from '@supabase/supabase-js'
import { CloudTasksClient } from '@google-cloud/tasks'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
dayjs.extend(duration)

// Configuration Supabase
const SUPABASE_URL = 'https://jgwbqdpxygwsnswtnrxf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY environment variable is required')
  console.log('   Set it with: export SUPABASE_SERVICE_KEY="your-service-key"')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// Configuration GCP - Nouveau projet
const GCP_PROJECT_ID = process.env.GCP_PROJECT_ID
const GCP_LOCATION = 'europe-west1'
const GCP_QUEUE_DUTCH = 'BidWatchQueue'
const GCP_ENDPOINT = process.env.GCP_ENDPOINT || 'https://crown-procurement.vercel.app'

if (!GCP_PROJECT_ID) {
  console.error('❌ GCP_PROJECT_ID environment variable is required')
  console.log('   Set it with: export GCP_PROJECT_ID="your-new-project-id"')
  process.exit(1)
}

// Parse arguments
const isDryRun = process.argv.includes('--dry-run')

console.log('='.repeat(60))
console.log('Migration des Cloud Tasks - GCP Organization Migration')
console.log('='.repeat(60))
console.log('')
console.log(
  `Mode: ${isDryRun ? '🔍 DRY RUN (aucune modification)' : '🚀 LIVE (modifications appliquées)'}`
)
console.log(`Nouveau projet GCP: ${GCP_PROJECT_ID}`)
console.log(`Endpoint: ${GCP_ENDPOINT}`)
console.log('')

// ============================================================================
// Dutch Helpers (copié de server/utils/dutch/helpers.js)
// ============================================================================

function maxNbRounds(totalDuration, roundDuration) {
  return Math.ceil(totalDuration / roundDuration) - 1
}

function calculateStartingPrice(endingPrice, maxRounds, amountPerRound) {
  const totalDecrease = maxRounds * (amountPerRound * 100)
  const startingPrice = (endingPrice * 100 - totalDecrease) / 100
  return Math.max(startingPrice, 0)
}

function findRoundTime(
  startingPrice,
  startTime,
  maxRounds,
  roundDuration,
  pricePerRound,
  targetPrice
) {
  let targetRound = null

  for (let roundNum = 0; roundNum <= maxRounds; roundNum++) {
    const roundPrice = (startingPrice * 100 + pricePerRound * 100 * roundNum) / 100
    if (roundPrice === targetPrice) {
      targetRound = roundNum
      break
    }
  }

  if (targetRound === null) {
    return null
  }

  const timeElapsed = dayjs.duration(targetRound * roundDuration, 'minute')
  const roundTime = dayjs(startTime).add(timeElapsed.asSeconds(), 'second')
  return roundTime.unix()
}

function calculateTimeToBid(auction, bid, auctionSeller) {
  const maxRounds = maxNbRounds(auction.duration, auction.overtime_range)
  const startingPrice = calculateStartingPrice(
    auction.max_bid_decr,
    maxRounds,
    auction.min_bid_decr
  )

  const timeToBid = findRoundTime(
    startingPrice,
    auction.start_at,
    maxRounds,
    auction.overtime_range,
    auction.min_bid_decr,
    bid.price
  )

  if (!timeToBid) {
    return null
  }

  let delayBeforeBid = 0

  if (auctionSeller?.time_per_round) {
    const roundDuration = auction.overtime_range * 60
    if (auctionSeller.time_per_round < roundDuration) {
      delayBeforeBid = roundDuration - auctionSeller.time_per_round
    }
  }

  return timeToBid + delayBeforeBid
}

// ============================================================================
// Cloud Tasks Functions
// ============================================================================

async function createCloudTask(payload, scheduleTime) {
  const client = new CloudTasksClient()

  const parent = client.queuePath(GCP_PROJECT_ID, GCP_LOCATION, GCP_QUEUE_DUTCH)
  const url = `${GCP_ENDPOINT}/api/v1/dutch/auto_bid`

  const task = {
    httpRequest: {
      httpMethod: 'POST',
      url: url,
      body: Buffer.from(JSON.stringify(payload)).toString('base64'),
      headers: { 'Content-Type': 'application/json' }
    },
    scheduleTime: {
      seconds: scheduleTime
    }
  }

  const [response] = await client.createTask({ parent, task })
  return response.name
}

async function deleteCloudTask(taskName) {
  // Extraire le project ID du nom de la task pour utiliser le bon client
  const taskProjectMatch = taskName.match(/projects\/([^/]+)\//)
  if (!taskProjectMatch) {
    throw new Error(`Invalid task name format: ${taskName}`)
  }

  const client = new CloudTasksClient()

  try {
    await client.deleteTask({ name: taskName })
    return true
  } catch (error) {
    // Task might already be deleted or executed
    if (error.code === 5) {
      // NOT_FOUND
      console.log(`    ⚠️  Task déjà supprimée ou exécutée: ${taskName}`)
      return false
    }
    throw error
  }
}

// ============================================================================
// Main Migration Logic
// ============================================================================

async function fetchPrebidsToMigrate() {
  const { data, error } = await supabase
    .from('bids')
    .select(
      `
      id,
      auction_id,
      cloud_task,
      price,
      seller_id,
      type,
      created_at,
      profiles!bids_seller_id_fkey(email),
      auctions!bids_auction_id_fkey(
        id,
        name,
        type,
        start_at,
        end_at,
        duration,
        overtime_range,
        max_bid_decr,
        min_bid_decr,
        status,
        published,
        deleted
      )
    `
    )
    .not('cloud_task', 'is', null)
    .gt('auctions.start_at', new Date().toISOString())
    .eq('auctions.deleted', false)
    .in('type', ['prebid', 'pre'])

  if (error) {
    throw new Error(`Failed to fetch prebids: ${error.message}`)
  }

  // Filter out null auctions (can happen with join)
  return data.filter((bid) => bid.auctions !== null)
}

async function fetchAuctionSeller(auctionId, sellerEmail) {
  if (!sellerEmail) return null

  const { data, error } = await supabase
    .from('auctions_sellers')
    .select('*')
    .eq('auction_id', auctionId)
    .eq('seller_email', sellerEmail)
    .single()

  if (error) {
    console.log(`    ⚠️  Pas de auction_seller trouvé pour ${sellerEmail}`)
    return null
  }

  return data
}

async function updateBidCloudTask(bidId, newTaskName) {
  const { error } = await supabase.from('bids').update({ cloud_task: newTaskName }).eq('id', bidId)

  if (error) {
    throw new Error(`Failed to update bid ${bidId}: ${error.message}`)
  }
}

async function migrate() {
  console.log('📋 Récupération des prebids à migrer...')
  console.log('')

  const prebids = await fetchPrebidsToMigrate()

  if (prebids.length === 0) {
    console.log('✅ Aucun prebid à migrer!')
    return
  }

  console.log(`📊 ${prebids.length} prebid(s) trouvé(s) à migrer:`)
  console.log('')

  // Group by auction for display
  const byAuction = prebids.reduce((acc, bid) => {
    const auctionId = bid.auction_id
    if (!acc[auctionId]) {
      acc[auctionId] = {
        auction: bid.auctions,
        bids: []
      }
    }
    acc[auctionId].bids.push(bid)
    return acc
  }, {})

  for (const [auctionId, data] of Object.entries(byAuction)) {
    console.log(`📦 ${data.auction.name}`)
    console.log(`   Type: ${data.auction.type} | Start: ${data.auction.start_at}`)
    console.log(`   ${data.bids.length} prebid(s):`)
    for (const bid of data.bids) {
      console.log(`   - Prix: ${bid.price} | Old Task: ${bid.cloud_task.split('/').pop()}`)
    }
    console.log('')
  }

  if (isDryRun) {
    console.log('🔍 Mode DRY RUN - Aucune modification effectuée')
    console.log('')
    console.log('Pour exécuter la migration, relancez sans --dry-run:')
    console.log('  node scripts/migrations/migrateCloudTasks.js')
    return
  }

  console.log('='.repeat(60))
  console.log('🚀 Début de la migration...')
  console.log('='.repeat(60))
  console.log('')

  let successCount = 0
  let errorCount = 0

  for (const bid of prebids) {
    const auction = bid.auctions
    const sellerEmail = bid.profiles?.email

    console.log(`🔄 Migration du bid ${bid.id}`)
    console.log(`   Auction: ${auction.name}`)
    console.log(`   Prix: ${bid.price}`)

    try {
      // 1. Fetch auction seller for timing calculation
      const auctionSeller = await fetchAuctionSeller(auction.id, sellerEmail)

      // 2. Calculate new schedule time
      const timeToBid = calculateTimeToBid(auction, bid, auctionSeller)

      if (!timeToBid) {
        console.log('   ❌ Impossible de calculer le timing pour ce bid')
        errorCount++
        continue
      }

      const timeToCallAutoBid = timeToBid - 5 // 5 seconds buffer
      const scheduledDate = dayjs.unix(timeToCallAutoBid).format('YYYY-MM-DD HH:mm:ss')

      console.log(`   ⏰ Nouvelle programmation: ${scheduledDate}`)

      // 3. Try to delete old task (might fail if already executed)
      console.log('   🗑️  Suppression ancienne task...')
      try {
        await deleteCloudTask(bid.cloud_task)
        console.log('   ✅ Ancienne task supprimée')
      } catch (deleteError) {
        console.log(`   ⚠️  Erreur suppression (continuing): ${deleteError.message}`)
      }

      // 4. Create new task on new GCP project
      console.log(`   ➕ Création nouvelle task sur ${GCP_PROJECT_ID}...`)
      const newTaskName = await createCloudTask(bid, timeToCallAutoBid)
      console.log(`   ✅ Nouvelle task: ${newTaskName.split('/').pop()}`)

      // 5. Update database
      console.log('   💾 Mise à jour base de données...')
      await updateBidCloudTask(bid.id, newTaskName)
      console.log('   ✅ Base de données mise à jour')

      successCount++
      console.log('')
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`)
      errorCount++
      console.log('')
    }
  }

  console.log('='.repeat(60))
  console.log('📊 Résumé de la migration')
  console.log('='.repeat(60))
  console.log(`✅ Succès: ${successCount}`)
  console.log(`❌ Erreurs: ${errorCount}`)
  console.log(`📊 Total: ${prebids.length}`)
}

// Run migration
migrate()
  .then(() => {
    console.log('')
    console.log('🏁 Migration terminée')
    process.exit(0)
  })
  .catch((error) => {
    console.error('')
    console.error('❌ Erreur fatale:', error.message)
    process.exit(1)
  })
