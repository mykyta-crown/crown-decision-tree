#!/usr/bin/env node

/**
 * Reset cloud_task references to null for Dutch prebids
 * Usage: node scripts/run.js reset_cloud_tasks.js <auction_group_id> --production
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ADMIN_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ADMIN_KEY')
  process.exit(1)
}

const auctionGroupId = process.argv[2]

if (!auctionGroupId) {
  console.error(
    '❌ Usage: node scripts/run.js reset_cloud_tasks.js <auction_group_id> --production'
  )
  console.error(
    '\nExample: node scripts/run.js reset_cloud_tasks.js d6123cf9-77d1-4558-a7aa-75e7f8ceb28d --prod'
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})

async function main() {
  console.log('🔧 RESET CLOUD TASKS REFERENCES\n')
  console.log(`Auction Group ID: ${auctionGroupId}\n`)

  // Find all Dutch auctions in this group
  const { data: auctions, error: auctionsError } = await supabase
    .from('auctions')
    .select('id, name, lot_number, type')
    .eq('auctions_group_settings_id', auctionGroupId)
    .eq('type', 'dutch')
    .eq('deleted', false)

  if (auctionsError) {
    console.error('❌ Error fetching auctions:', auctionsError.message)
    process.exit(1)
  }

  if (!auctions || auctions.length === 0) {
    console.log('ℹ️  No Dutch auctions found in this group')
    process.exit(0)
  }

  console.log(`📋 Found ${auctions.length} Dutch auction(s)\n`)

  let totalReset = 0

  for (const auction of auctions) {
    console.log(`\x1b[1mLot ${auction.lot_number}: ${auction.name}\x1b[0m`)

    // Find all prebids with cloud_task set
    const { data: prebids, error: prebidsError } = await supabase
      .from('bids')
      .select('id, seller_email, price, cloud_task')
      .eq('auction_id', auction.id)
      .eq('type', 'prebid')
      .not('cloud_task', 'is', null)

    if (prebidsError) {
      console.error(`  ❌ Error: ${prebidsError.message}\n`)
      continue
    }

    if (!prebids || prebids.length === 0) {
      console.log('  ℹ️  No prebids with cloud_task to reset\n')
      continue
    }

    console.log(`  📍 ${prebids.length} prebid(s) to reset`)

    // Reset cloud_task to null for all these prebids
    const { error: updateError } = await supabase
      .from('bids')
      .update({ cloud_task: null })
      .eq('auction_id', auction.id)
      .eq('type', 'prebid')
      .not('cloud_task', 'is', null)

    if (updateError) {
      console.error(`  ❌ Error resetting: ${updateError.message}\n`)
      continue
    }

    console.log(`  ✅ Reset ${prebids.length} cloud_task reference(s)`)

    // Show details
    for (const bid of prebids) {
      const taskId = bid.cloud_task?.split('/').pop() || 'unknown'
      console.log(`     • ${bid.seller_email}: ${bid.price} (task: ${taskId.substring(0, 12)}...)`)
    }

    console.log('')
    totalReset += prebids.length
  }

  console.log('================================================')
  console.log(`✅ Total: ${totalReset} cloud_task reference(s) reset to null\n`)
  console.log('💡 Next step: Run the recreation script')
  console.log('   npm run script recreate_cloud_tasks_prod.js -- --prod\n')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
