import pg from 'pg'

/**
 * Analyzer API — Supplier profiles and behavior (enriched with game theory metrics)
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
      WITH auction_filter AS (
        SELECT id, company_id, type, start_at, baseline, name AS auction_name, currency,
               auctions_group_settings_id
        FROM auctions
        WHERE usage = 'real' AND deleted = false AND published = true
          AND start_at <= NOW() AND (status IS NULL OR status != 'running')
          AND baseline > 1
      ),
      -- Winner per lot
      lot_winners AS (
        SELECT DISTINCT ON (auction_id) auction_id, seller_id, price
        FROM bids WHERE type = 'bid' AND price > 0
        ORDER BY auction_id, price ASC
      ),
      -- English behavior per supplier per lot
      english_lot AS (
        SELECT
          b.seller_id, b.auction_id,
          COUNT(*) AS bids_in_lot,
          MAX(b.price) AS first_price,
          MIN(b.price) AS best_price,
          -- Compression
          CASE WHEN MAX(b.price) > 0
            THEN ((MAX(b.price) - MIN(b.price)) / MAX(b.price) * 100)
            ELSE 0
          END AS compression,
          -- Start %BL
          CASE WHEN a.baseline > 0
            THEN (MAX(b.price) / a.baseline::numeric * 100)
            ELSE NULL
          END AS start_pct_bl,
          -- Best %BL
          CASE WHEN a.baseline > 0
            THEN (MIN(b.price) / a.baseline::numeric * 100)
            ELSE NULL
          END AS best_pct_bl,
          -- Reaction time
          EXTRACT(EPOCH FROM (MIN(b.created_at) - a.start_at)) / 60.0 AS reaction_min,
          -- Bidding duration
          EXTRACT(EPOCH FROM (MAX(b.created_at) - MIN(b.created_at))) / 60.0 AS bidding_duration_min
        FROM bids b
        JOIN auction_filter a ON a.id = b.auction_id
        WHERE b.type = 'bid' AND b.price > 0 AND a.type = 'reverse'
        GROUP BY b.seller_id, b.auction_id, a.baseline, a.start_at
        HAVING COUNT(*) >= 2
      ),
      -- English aggregates per supplier
      english_agg AS (
        SELECT
          seller_id,
          COUNT(*) AS english_lots,
          ROUND(AVG(compression)::numeric, 1) AS avg_compression,
          ROUND(STDDEV(compression)::numeric, 1) AS std_compression,
          ROUND(AVG(start_pct_bl)::numeric, 1) AS avg_start_pct,
          ROUND(AVG(best_pct_bl)::numeric, 1) AS avg_best_pct,
          ROUND(AVG(bids_in_lot)::numeric, 0) AS avg_bids_per_lot,
          ROUND(AVG(CASE WHEN reaction_min >= 0 THEN reaction_min END)::numeric, 1) AS avg_reaction_min,
          -- Late bidding: lots where they bid in last 20% of their session
          ROUND(AVG(CASE WHEN bidding_duration_min > 1 THEN bids_in_lot / bidding_duration_min ELSE NULL END)::numeric, 1) AS avg_bids_per_min
        FROM english_lot
        GROUP BY seller_id
      ),
      -- First bid reaction time (all auction types)
      first_bids AS (
        SELECT DISTINCT ON (b.auction_id, b.seller_id)
          b.seller_id, b.auction_id, b.created_at AS first_bid_at
        FROM bids b
        JOIN auction_filter a ON a.id = b.auction_id
        WHERE b.type = 'bid' AND b.price > 0 AND a.type = 'reverse'
        ORDER BY b.auction_id, b.seller_id, b.created_at ASC
      ),
      -- Prebid stats
      prebid_stats AS (
        SELECT
          b.seller_id,
          COUNT(*) AS total_prebids,
          COUNT(DISTINCT b.auction_id) AS lots_with_prebids,
          -- Avg prebid as %BL
          ROUND(AVG(CASE WHEN a.baseline > 0 THEN b.price / a.baseline::numeric * 100 END)::numeric, 1) AS avg_prebid_pct_bl
        FROM bids b
        JOIN auction_filter a ON a.id = b.auction_id
        WHERE b.type = 'prebid' AND b.price > 0
        GROUP BY b.seller_id
      ),
      -- Per-lot outcomes for each supplier (for scatter data)
      lot_outcomes AS (
        SELECT
          b.seller_id,
          a.id AS auction_id,
          a.type AS auction_type,
          a.auction_name,
          a.baseline,
          a.currency,
          a.start_at,
          MIN(b.price) AS supplier_best_price,
          CASE WHEN a.baseline > 0 THEN ROUND((MIN(b.price) / a.baseline::numeric * 100)::numeric, 1) END AS best_pct_bl,
          CASE WHEN a.baseline > 0 AND a.type = 'reverse' THEN ROUND((MAX(b.price) / a.baseline::numeric * 100)::numeric, 1) END AS start_pct_bl,
          lw.seller_id = b.seller_id AS won
        FROM (
          SELECT seller_id, auction_id, price, created_at
          FROM bids WHERE type IN ('bid', 'prebid') AND price > 0
        ) b
        JOIN auction_filter a ON a.id = b.auction_id
        LEFT JOIN lot_winners lw ON lw.auction_id = a.id
        GROUP BY b.seller_id, a.id, a.type, a.auction_name, a.baseline, a.currency, a.start_at, lw.seller_id
      )
      SELECT
        COALESCE(p.email, 'unknown-' || inv.seller_id::text) AS email,
        inv.seller_id,
        STRING_AGG(DISTINCT c.name, ', ') AS buyers,
        COUNT(DISTINCT a.company_id) AS buyer_count,
        -- Participation
        COUNT(DISTINCT a.id) AS lots_invited,
        COUNT(DISTINCT ags.id) AS events_invited,
        COUNT(DISTINCT CASE WHEN bid_exists.auction_id IS NOT NULL THEN a.id END) AS lots_bid,
        -- Wins
        COUNT(DISTINCT CASE WHEN lw.seller_id = inv.seller_id THEN a.id END) AS lots_won,
        SUM(CASE WHEN lw.seller_id = inv.seller_id THEN lw.price ELSE 0 END) AS spend_won,
        -- Win rate
        CASE WHEN COUNT(DISTINCT CASE WHEN bid_exists.auction_id IS NOT NULL THEN a.id END) > 0
          THEN ROUND(
            COUNT(DISTINCT CASE WHEN lw.seller_id = inv.seller_id THEN a.id END)::numeric
            / COUNT(DISTINCT CASE WHEN bid_exists.auction_id IS NOT NULL THEN a.id END) * 100
          )
          ELSE NULL
        END AS win_rate,
        -- Bid rate (participation)
        ROUND(
          COUNT(DISTINCT CASE WHEN bid_exists.auction_id IS NOT NULL THEN a.id END)::numeric
          / NULLIF(COUNT(DISTINCT a.id), 0) * 100
        ) AS bid_rate,
        -- English metrics
        COALESCE(MAX(ea.avg_compression), 0) AS avg_compression,
        MAX(ea.std_compression) AS std_compression,
        MAX(ea.avg_start_pct) AS avg_start_pct,
        MAX(ea.avg_best_pct) AS avg_best_pct,
        COALESCE(MAX(ea.avg_bids_per_lot), 0) AS avg_bids_per_lot,
        MAX(ea.avg_reaction_min) AS avg_reaction_min,
        MAX(ea.avg_bids_per_min) AS avg_bids_per_min,
        COALESCE(MAX(ea.english_lots), 0) AS english_lots,
        -- Total bids
        COALESCE(SUM(el.bids_in_lot), 0) AS total_bids,
        -- Prebids
        COALESCE(MAX(ps.total_prebids), 0) AS total_prebids,
        COALESCE(MAX(ps.lots_with_prebids), 0) AS lots_with_prebids,
        MAX(ps.avg_prebid_pct_bl) AS avg_prebid_pct_bl,
        -- Prebid revisions per lot
        CASE WHEN COALESCE(MAX(ps.lots_with_prebids), 0) > 0
          THEN ROUND(MAX(ps.total_prebids)::numeric / MAX(ps.lots_with_prebids), 1)
          ELSE 0
        END AS prebid_revisions_per_lot,
        -- Types
        STRING_AGG(DISTINCT a.type, ', ') AS auction_types,
        MODE() WITHIN GROUP (ORDER BY a.currency) AS currency
      FROM (
        SELECT as2.auction_id,
          COALESCE(
            (SELECT id FROM profiles WHERE email = as2.seller_email LIMIT 1),
            '00000000-0000-0000-0000-000000000000'::uuid
          ) AS seller_id,
          as2.seller_email
        FROM auctions_sellers as2
      ) inv
      JOIN auction_filter a ON a.id = inv.auction_id
      JOIN companies c ON c.id = a.company_id
      LEFT JOIN auctions_group_settings ags ON ags.id = a.auctions_group_settings_id
      LEFT JOIN profiles p ON p.id = inv.seller_id
      LEFT JOIN (
        SELECT DISTINCT auction_id, seller_id FROM bids WHERE type IN ('bid', 'prebid') AND price > 0
      ) bid_exists ON bid_exists.auction_id = a.id AND bid_exists.seller_id = inv.seller_id
      LEFT JOIN lot_winners lw ON lw.auction_id = a.id
      LEFT JOIN english_lot el ON el.auction_id = a.id AND el.seller_id = inv.seller_id
      LEFT JOIN english_agg ea ON ea.seller_id = inv.seller_id
      LEFT JOIN prebid_stats ps ON ps.seller_id = inv.seller_id
      WHERE inv.seller_id != '00000000-0000-0000-0000-000000000000'::uuid
      GROUP BY inv.seller_id, p.email
      ORDER BY lots_invited DESC
    `)

    // Fetch per-lot outcomes for scatter data
    const { rows: lotRows } = await client.query(`
      SELECT
        COALESCE(p.email, 'unknown') AS email,
        b.seller_id,
        a.name AS auction_name,
        a.type AS auction_type,
        a.baseline,
        a.currency,
        a.start_at,
        MIN(b.price) AS best_price,
        CASE WHEN a.baseline > 0 THEN ROUND((MIN(b.price) / a.baseline::numeric * 100)::numeric, 1) END AS best_pct_bl,
        CASE WHEN a.baseline > 0 AND a.type = 'reverse' THEN ROUND((MAX(b.price) / a.baseline::numeric * 100)::numeric, 1) END AS start_pct_bl,
        COUNT(*) AS bids,
        ROUND(((MAX(b.price) - MIN(b.price)) / NULLIF(MAX(b.price), 0) * 100)::numeric, 1) AS compression,
        (MIN(b.price) = (SELECT MIN(b2.price) FROM bids b2 WHERE b2.auction_id = a.id AND b2.type IN ('bid','prebid') AND b2.price > 0)) AS won
      FROM bids b
      JOIN (
        SELECT id, company_id, type, start_at, baseline, name, currency
        FROM auctions
        WHERE usage = 'real' AND deleted = false AND published = true
          AND start_at <= NOW() AND (status IS NULL OR status != 'running') AND baseline > 1
      ) a ON a.id = b.auction_id
      LEFT JOIN profiles p ON p.id = b.seller_id
      WHERE b.type IN ('bid', 'prebid') AND b.price > 0
      GROUP BY b.seller_id, a.id, a.name, a.type, a.baseline, a.currency, a.start_at, p.email
      ORDER BY a.start_at DESC
    `)

    // Build lot history map by seller
    const lotHistory = {}
    lotRows.forEach(r => {
      const email = r.email
      if (!lotHistory[email]) lotHistory[email] = []
      lotHistory[email].push({
        auction: r.auction_name,
        type: r.auction_type,
        start_at: r.start_at,
        best_pct_bl: r.best_pct_bl != null ? Number(r.best_pct_bl) : null,
        start_pct_bl: r.start_pct_bl != null ? Number(r.start_pct_bl) : null,
        compression: r.compression != null ? Number(r.compression) : 0,
        bids: Number(r.bids),
        won: r.won,
        best_price: Number(r.best_price),
        baseline: Number(r.baseline),
        currency: r.currency
      })
    })

    // Classify and enrich
    const classified = rows.map(s => {
      const n = (v) => v != null ? Number(v) : null
      const lots_invited = n(s.lots_invited) || 0
      const lots_bid = n(s.lots_bid) || 0
      const lots_won = n(s.lots_won) || 0
      const win_rate = n(s.win_rate)
      const avg_compression = n(s.avg_compression) || 0
      const std_compression = n(s.std_compression)
      const avg_start_pct = n(s.avg_start_pct)
      const avg_best_pct = n(s.avg_best_pct)
      const total_bids = n(s.total_bids) || 0
      const english_lots = n(s.english_lots) || 0
      const bid_rate = n(s.bid_rate) || 0
      const avg_reaction_min = n(s.avg_reaction_min)
      const prebid_revisions = n(s.prebid_revisions_per_lot) || 0

      // Profile classification (4 profiles)
      let profile = 'Passif'
      let profile_detail = ''

      const totalPrebids = n(s.total_prebids) || 0
      const lotsWithPrebids = n(s.lots_with_prebids) || 0
      const isDutchOnly = english_lots === 0 && lotsWithPrebids > 0
      const avg_bids_per_lot = n(s.avg_bids_per_lot) || 0

      if (lots_bid === 0) {
        profile = 'Passif'
        profile_detail = 'Invited ' + lots_invited + ' times, no participation yet'
      } else if (isDutchOnly && lots_won >= 2 && (win_rate || 0) >= 50) {
        profile = 'Expert'
        profile_detail = 'Knows exact market price, wins ' + (win_rate || 0) + '% via prebid'
      } else if (avg_compression === 0 && lots_won >= 2 && (win_rate || 0) >= 70) {
        profile = 'Expert'
        profile_detail = 'Sets one price, wins ' + (win_rate || 0) + '% — market expert'
      } else if (avg_compression > 12 || (avg_start_pct && avg_start_pct > 103 && avg_compression > 8) || (std_compression != null && std_compression > 5 && english_lots >= 2)) {
        profile = 'Volatile'
        profile_detail = 'Large price swings (' + avg_compression.toFixed(0) + '% compression) — unpredictable'
      } else if (avg_compression >= 3 && (win_rate || 0) >= 30) {
        profile = 'Competiteur'
        profile_detail = 'Active bidder, ' + avg_compression.toFixed(0) + '% compression, ' + (win_rate || 0) + '% win rate'
      } else if (isDutchOnly && lots_bid > 0) {
        profile = lots_won > 0 ? 'Expert' : 'Passif'
        profile_detail = lots_won > 0 ? 'Dutch participant, won ' + lots_won + ' lots' : 'Dutch participant, no wins yet'
      } else if (lots_bid > 0) {
        profile = 'Passif'
        profile_detail = 'Low activity — ' + lots_bid + ' lots, ' + avg_compression.toFixed(0) + '% compression'
      }

      // Intensity score (0-5) based on engagement level
      let intensity = 0
      if (bid_rate >= 80) intensity++
      if (bid_rate >= 50) intensity++
      if (avg_bids_per_lot >= 10) intensity += 2
      else if (avg_bids_per_lot >= 5) intensity++
      else if (totalPrebids > 0 && lotsWithPrebids >= lots_bid * 0.5) intensity++
      if (avg_compression >= 10) intensity++
      intensity = Math.min(intensity, 5)

      // Data confidence
      let confidence = 'low'
      if (lots_bid >= 5) confidence = 'high'
      else if (lots_bid >= 3) confidence = 'medium'

      // Predicted best %BL for future auctions
      const predicted_best_pct = avg_best_pct || (avg_start_pct ? avg_start_pct - avg_compression : null)

      // Risk flags
      const risks = []
      if (profile === 'Ghost') risks.push('ghost_recurring')
      if ((win_rate || 0) >= 90 && lots_won >= 3) risks.push('dominant_winner')
      if (lots_bid >= 5 && (win_rate || 0) === 0) risks.push('always_bid_never_win')
      if (avg_start_pct && avg_start_pct > 110) risks.push('extreme_high_entry')
      if (prebid_revisions >= 3) risks.push('unstable_prebid')

      return {
        ...s,
        lots_invited, lots_bid, lots_won,
        events_invited: n(s.events_invited) || 0,
        buyer_count: n(s.buyer_count) || 0,
        win_rate,
        bid_rate,
        spend_won: n(s.spend_won) || 0,
        total_bids,
        avg_compression,
        std_compression,
        avg_start_pct,
        avg_best_pct,
        avg_bids_per_lot: n(s.avg_bids_per_lot) || 0,
        avg_reaction_min,
        avg_bids_per_min: n(s.avg_bids_per_min),
        english_lots,
        total_prebids: n(s.total_prebids) || 0,
        lots_with_prebids: n(s.lots_with_prebids) || 0,
        avg_prebid_pct_bl: n(s.avg_prebid_pct_bl),
        prebid_revisions_per_lot: prebid_revisions,
        profile,
        profile_rank: { Expert: 1, Competiteur: 2, Volatile: 3, Passif: 4 }[profile] || 5,
        profile_detail,
        intensity,
        confidence,
        predicted_best_pct,
        risks,
        lot_history: lotHistory[s.email] || []
      }
    })

    return classified
  } finally {
    await client.end()
  }
})
