import pg from 'pg'

/**
 * Analyzer API — Fetches all completed real auctions from PROD (read-only)
 * Uses PG_URL_READONLY to ensure no write operations are possible
 */
export default defineEventHandler(async () => {
  const connectionString = process.env.PG_URL_READONLY
  if (!connectionString) {
    throw createError({ statusCode: 500, message: 'PG_URL_READONLY not configured' })
  }

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    const { rows } = await client.query(`
      SELECT
        a.id,
        a.name,
        a.type,
        a.baseline,
        a.currency,
        a.start_at,
        a.end_at,
        a.duration,
        a.created_at,
        c.name AS company_name,
        -- Event grouping
        ags.id AS event_id,
        ags.name AS event_name,
        -- Sellers count
        COALESCE(s.seller_count, 0) AS sellers_invited,
        -- Bids count
        COALESCE(b.bid_count, 0) AS bid_count,
        -- Prebids count
        COALESCE(pb.prebid_count, 0) AS prebid_count,
        -- Best price (bids first, fallback to prebids)
        COALESCE(best_bid.best_price, best_pb.best_prebid) AS best_price,
        -- Savings
        CASE
          WHEN a.baseline > 0 AND COALESCE(best_bid.best_price, best_pb.best_prebid) > 0
          THEN ((1 - COALESCE(best_bid.best_price, best_pb.best_prebid) / a.baseline::numeric) * 100)::numeric(10,2)
          ELSE NULL
        END AS saving_pct,
        CASE
          WHEN a.baseline > 0 AND COALESCE(best_bid.best_price, best_pb.best_prebid) > 0
          THEN (a.baseline - COALESCE(best_bid.best_price, best_pb.best_prebid))::numeric(12,2)
          ELSE NULL
        END AS saving_abs,
        -- Dutch: was won by auto-prebid?
        CASE
          WHEN a.type = 'dutch' AND first_bid.cloud_task IS NOT NULL THEN true
          WHEN a.type = 'dutch' AND first_bid.cloud_task IS NULL THEN false
          ELSE NULL
        END AS dutch_won_by_prebid,
        -- English: number of active bidders (distinct ranks)
        COALESCE(bidders.active_bidders, 0) AS active_bidders,
        -- Competition intensity (bids per minute)
        CASE
          WHEN EXTRACT(EPOCH FROM (bid_timing.last_bid - bid_timing.first_bid)) > 60
          THEN ROUND(
            (COALESCE(b.bid_count, 0)::numeric /
            (EXTRACT(EPOCH FROM (bid_timing.last_bid - bid_timing.first_bid)) / 60))::numeric, 1
          )
          ELSE NULL
        END AS bids_per_minute
      FROM auctions a
      JOIN companies c ON c.id = a.company_id
      LEFT JOIN auctions_group_settings ags ON ags.id = a.auctions_group_settings_id
      -- Sellers invited
      LEFT JOIN (
        SELECT auction_id, COUNT(*) AS seller_count
        FROM auctions_sellers GROUP BY auction_id
      ) s ON s.auction_id = a.id
      -- Live bids count
      LEFT JOIN (
        SELECT auction_id, COUNT(*) AS bid_count
        FROM bids WHERE type = 'bid' GROUP BY auction_id
      ) b ON b.auction_id = a.id
      -- Prebids count
      LEFT JOIN (
        SELECT auction_id, COUNT(*) AS prebid_count
        FROM bids WHERE type = 'prebid' GROUP BY auction_id
      ) pb ON pb.auction_id = a.id
      -- Best bid price (use bids first, fall back to prebids for Japanese/Dutch without bids)
      LEFT JOIN (
        SELECT auction_id, MIN(price) AS best_price
        FROM bids WHERE type = 'bid' AND price > 0 GROUP BY auction_id
      ) best_bid ON best_bid.auction_id = a.id
      LEFT JOIN (
        SELECT auction_id, MIN(price) AS best_prebid
        FROM bids WHERE type = 'prebid' AND price > 0 GROUP BY auction_id
      ) best_pb ON best_pb.auction_id = a.id
      -- First bid (for Dutch: check if auto-prebid)
      LEFT JOIN LATERAL (
        SELECT cloud_task
        FROM bids
        WHERE auction_id = a.id AND type = 'bid'
        ORDER BY created_at ASC LIMIT 1
      ) first_bid ON true
      -- Active bidders for English
      LEFT JOIN (
        SELECT auction_id, COUNT(DISTINCT rank) AS active_bidders
        FROM bids WHERE type = 'bid' AND price > 0 GROUP BY auction_id
      ) bidders ON bidders.auction_id = a.id
      -- Bid timing (for bids_per_minute)
      LEFT JOIN (
        SELECT auction_id, MIN(created_at) AS first_bid, MAX(created_at) AS last_bid
        FROM bids WHERE type = 'bid' GROUP BY auction_id
      ) bid_timing ON bid_timing.auction_id = a.id
      WHERE a.usage = 'real'
        AND a.deleted = false
        AND a.published = true
        AND a.start_at <= NOW()
        AND (a.status IS NULL OR a.status != 'running')
        AND a.baseline > 1
      ORDER BY a.start_at DESC
    `)

    // Convert string numbers to actual numbers for proper sorting
    return rows.map(r => ({
      ...r,
      baseline: Number(r.baseline) || 0,
      sellers_invited: Number(r.sellers_invited) || 0,
      bid_count: Number(r.bid_count) || 0,
      prebid_count: Number(r.prebid_count) || 0,
      best_price: r.best_price != null ? Number(r.best_price) : null,
      saving_pct: r.saving_pct != null ? Number(r.saving_pct) : null,
      saving_abs: r.saving_abs != null ? Number(r.saving_abs) : null,
      active_bidders: Number(r.active_bidders) || 0,
      bids_per_minute: r.bids_per_minute != null ? Number(r.bids_per_minute) : null,
      duration: Number(r.duration) || 0
    }))
  } finally {
    await client.end()
  }
})
