import pg from 'pg'

/**
 * Analyzer API — Events (auctions grouped by auctions_group_settings)
 * Read-only via PG_URL_READONLY
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
      WITH lot_data AS (
        SELECT
          a.id,
          a.auctions_group_settings_id,
          a.company_id,
          a.type,
          a.start_at,
          a.baseline,
          a.currency,
          COALESCE(best_bid.best_price, best_pb.best_prebid, 0) AS best_price,
          COALESCE(sel_agg.seller_count, 0) AS seller_count,
          COALESCE(bid_agg.bid_count, 0) AS bid_count,
          COALESCE(pb_agg.prebid_count, 0) AS prebid_count
        FROM auctions a
        LEFT JOIN (
          SELECT auction_id, MIN(price) AS best_price
          FROM bids WHERE type = 'bid' AND price > 0 GROUP BY auction_id
        ) best_bid ON best_bid.auction_id = a.id
        LEFT JOIN (
          SELECT auction_id, MIN(price) AS best_prebid
          FROM bids WHERE type = 'prebid' AND price > 0 GROUP BY auction_id
        ) best_pb ON best_pb.auction_id = a.id
        LEFT JOIN (
          SELECT auction_id, COUNT(*) AS seller_count
          FROM auctions_sellers GROUP BY auction_id
        ) sel_agg ON sel_agg.auction_id = a.id
        LEFT JOIN (
          SELECT auction_id, COUNT(*) AS bid_count
          FROM bids WHERE type = 'bid' GROUP BY auction_id
        ) bid_agg ON bid_agg.auction_id = a.id
        LEFT JOIN (
          SELECT auction_id, COUNT(*) AS prebid_count
          FROM bids WHERE type = 'prebid' GROUP BY auction_id
        ) pb_agg ON pb_agg.auction_id = a.id
        WHERE a.usage = 'real'
          AND a.deleted = false
          AND a.published = true
          AND a.start_at <= NOW()
          AND (a.status IS NULL OR a.status != 'running')
          AND a.baseline > 1
      ),
      -- Unique suppliers per event (across all lots)
      event_suppliers AS (
        SELECT ags.id AS event_id, COUNT(DISTINCT sel.seller_email) AS unique_suppliers
        FROM auctions_group_settings ags
        JOIN auctions a ON a.auctions_group_settings_id = ags.id
        JOIN auctions_sellers sel ON sel.auction_id = a.id
        WHERE a.usage = 'real' AND a.deleted = false AND a.published = true
          AND a.start_at <= NOW() AND (a.status IS NULL OR a.status != 'running')
          AND a.baseline > 1
        GROUP BY ags.id
      )
      SELECT
        ags.id AS event_id,
        ags.name AS event_name,
        ags.timing_rule,
        c.name AS company_name,
        COUNT(ld.id) AS lot_count,
        STRING_AGG(DISTINCT ld.type, ', ') AS types,
        MIN(ld.start_at) AS first_start,
        MAX(ld.start_at) AS last_start,
        ld.currency,
        SUM(ld.baseline) AS total_baseline,
        SUM(CASE WHEN ld.best_price > 0 THEN ld.best_price ELSE 0 END) AS total_spend,
        SUM(CASE WHEN ld.baseline > 0 AND ld.best_price > 0 THEN ld.baseline - ld.best_price ELSE 0 END) AS total_saved,
        CASE
          WHEN SUM(ld.baseline) > 0 AND SUM(CASE WHEN ld.best_price > 0 THEN ld.best_price ELSE 0 END) > 0
          THEN ((1 - SUM(CASE WHEN ld.best_price > 0 THEN ld.best_price ELSE 0 END)::numeric / SUM(ld.baseline)::numeric) * 100)::numeric(10,2)
          ELSE NULL
        END AS saving_pct,
        COALESCE(es.unique_suppliers, 0) AS unique_suppliers,
        SUM(ld.seller_count) AS total_invitations,
        SUM(ld.bid_count) AS total_bids,
        SUM(ld.prebid_count) AS total_prebids,
        COUNT(CASE WHEN ld.bid_count > 0 THEN 1 END) AS lots_with_bids
      FROM auctions_group_settings ags
      JOIN lot_data ld ON ld.auctions_group_settings_id = ags.id
      JOIN companies c ON c.id = ld.company_id
      LEFT JOIN event_suppliers es ON es.event_id = ags.id
      GROUP BY ags.id, ags.name, ags.timing_rule, c.name, ld.currency, es.unique_suppliers
      ORDER BY first_start DESC
    `)

    return rows.map(r => ({
      ...r,
      lot_count: Number(r.lot_count) || 0,
      total_baseline: Number(r.total_baseline) || 0,
      total_spend: Number(r.total_spend) || 0,
      total_saved: Number(r.total_saved) || 0,
      saving_pct: r.saving_pct != null ? Number(r.saving_pct) : null,
      unique_suppliers: Number(r.unique_suppliers) || 0,
      total_invitations: Number(r.total_invitations) || 0,
      total_bids: Number(r.total_bids) || 0,
      total_prebids: Number(r.total_prebids) || 0,
      lots_with_bids: Number(r.lots_with_bids) || 0
    }))
  } finally {
    await client.end()
  }
})
