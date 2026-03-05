/**
 * Reschedules Dutch/Japanese prebids that have no cloud_task (typically created while webhooks were disabled).
 *
 * Usage:
 *   WEBHOOK_BEARER_TOKEN=xxx SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node scripts/repairPrebids.js
 *   # Optional filters:
 *   --auction-id <uuid>   Only repair a specific auction
 *   --limit <n>           Limit number of prebids (default 200)
 *   --since <ISO>         Only prebids created after this timestamp
 *
 * What it does:
 * - Fetches prebids where cloud_task IS NULL.
 * - Calls the webhook /api/v1/webhooks/bids/insert with Authorization: Bearer <WEBHOOK_BEARER_TOKEN>
 *   so the scheduler rebuilds Cloud Tasks and updates bids.cloud_task.
 */

import { createClient } from '@supabase/supabase-js'

const argv = process.argv.slice(2)

function getArg(flag, fallback = null) {
  const idx = argv.findIndex((a) => a === flag)
  if (idx === -1) return fallback
  return argv[idx + 1] || fallback
}

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ADMIN_KEY
const WEBHOOK_BEARER_TOKEN = process.env.WEBHOOK_BEARER_TOKEN
const WEBHOOK_BASE_URL =
  process.env.WEBHOOK_BASE_URL || 'https://app.crown-procurement.com/api/v1/webhooks'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  process.exit(1)
}

if (!WEBHOOK_BEARER_TOKEN) {
  console.error('Missing WEBHOOK_BEARER_TOKEN (used to call /api/v1/webhooks/bids/insert)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function fetchPrebids({ auctionId, limit, since }) {
  let query = supabase
    .from('bids')
    .select('*')
    .eq('type', 'prebid')
    .is('cloud_task', null)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (auctionId) {
    query = query.eq('auction_id', auctionId)
  }

  if (since) {
    query = query.gte('created_at', since)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(`Error fetching prebids: ${error.message}`)
  }
  return data || []
}

async function replayWebhook(bid) {
  const url = `${WEBHOOK_BASE_URL}/bids/insert`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${WEBHOOK_BEARER_TOKEN}`
    },
    body: JSON.stringify({ record: bid })
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Webhook failed (${res.status}): ${text}`)
  }
}

async function main() {
  const auctionId = getArg('--auction-id', null)
  const limit = Number(getArg('--limit', 200))
  const since = getArg('--since', null)

  console.log('Fetching prebids with cloud_task IS NULL', { auctionId, limit, since })
  const prebids = await fetchPrebids({ auctionId, limit, since })
  console.log(`Found ${prebids.length} prebids to repair`)

  let success = 0
  for (const bid of prebids) {
    try {
      await replayWebhook(bid)
      success += 1
      console.log(`✅ Replayed bid ${bid.id} (auction ${bid.auction_id})`)
    } catch (err) {
      console.error(`❌ Failed bid ${bid.id}: ${err.message}`)
    }
  }

  console.log(`Done. Success: ${success}/${prebids.length}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
