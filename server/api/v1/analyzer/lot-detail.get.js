import pg from 'pg'

/**
 * Analyzer API — Lot detail with full bid timeline and per-supplier analysis
 * Read-only via PG_URL_READONLY
 * Query params: ?id=auction_uuid
 */
export default defineEventHandler(async (event) => {
  const connectionString = process.env.PG_URL_READONLY
  if (!connectionString) throw createError({ statusCode: 500, message: 'PG_URL_READONLY not configured' })

  const query = getQuery(event)
  const lotId = query.id
  if (!lotId) throw createError({ statusCode: 400, message: 'id parameter required' })

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    // Auction info
    const { rows: [auction] } = await client.query(`
      SELECT a.id, a.name, a.type, a.baseline, a.currency, a.start_at, a.end_at,
        a.duration, a.overtime_range, c.name AS company_name,
        ags.name AS event_name
      FROM auctions a
      JOIN companies c ON c.id = a.company_id
      LEFT JOIN auctions_group_settings ags ON ags.id = a.auctions_group_settings_id
      WHERE a.id = $1
    `, [lotId])

    if (!auction) throw createError({ statusCode: 404, message: 'Lot not found' })

    // All bids (timeline)
    const { rows: bids } = await client.query(`
      SELECT b.id, b.type, b.price, b.rank, b.created_at, b.cloud_task IS NOT NULL AS auto_prebid,
        b.seller_id, COALESCE(p.email, 'unknown') AS seller_email
      FROM bids b
      LEFT JOIN profiles p ON p.id = b.seller_id
      WHERE b.auction_id = $1
      ORDER BY b.created_at ASC
    `, [lotId])

    // Invited suppliers
    const { rows: invited } = await client.query(`
      SELECT as2.seller_email, as2.terms_accepted, as2.last_connection, as2.exit_time,
        p.id AS seller_id
      FROM auctions_sellers as2
      LEFT JOIN profiles p ON p.email = as2.seller_email
      WHERE as2.auction_id = $1
    `, [lotId])

    // Build per-supplier analysis
    const baseline = Number(auction.baseline) || 0
    const startAt = new Date(auction.start_at)
    const supplierMap = {}

    // Init from invited list
    invited.forEach(inv => {
      const email = inv.seller_email
      supplierMap[email] = {
        email,
        seller_id: inv.seller_id,
        invited: true,
        terms_accepted: inv.terms_accepted,
        connected: !!inv.last_connection,
        exit_time: inv.exit_time,
        bids: [],
        prebids: [],
        total_bids: 0,
        total_prebids: 0,
        first_bid_price: null,
        best_bid_price: null,
        start_pct_bl: null,
        best_pct_bl: null,
        compression: 0,
        reaction_sec: null,
        won: false,
        auto_prebid_win: false
      }
    })

    // Process bids
    const bestPrice = bids.filter(b => b.type === 'bid' && b.price > 0).reduce((min, b) => Math.min(min, b.price), Infinity)
    const bestPrebid = bids.filter(b => b.type === 'prebid' && b.price > 0).reduce((min, b) => Math.min(min, b.price), Infinity)
    const winningPrice = bestPrice < Infinity ? bestPrice : (bestPrebid < Infinity ? bestPrebid : null)

    bids.forEach(b => {
      const email = b.seller_email
      if (!supplierMap[email]) {
        supplierMap[email] = {
          email, seller_id: b.seller_id, invited: false, terms_accepted: null,
          connected: true, exit_time: null, bids: [], prebids: [],
          total_bids: 0, total_prebids: 0, first_bid_price: null, best_bid_price: null,
          start_pct_bl: null, best_pct_bl: null, compression: 0,
          reaction_sec: null, won: false, auto_prebid_win: false
        }
      }
      const s = supplierMap[email]
      const bidData = {
        price: Number(b.price),
        type: b.type,
        rank: b.rank,
        time: b.created_at,
        seconds_from_start: (new Date(b.created_at) - startAt) / 1000,
        pct_bl: baseline > 0 ? Number(((b.price / baseline) * 100).toFixed(1)) : null,
        auto_prebid: b.auto_prebid
      }

      if (b.type === 'bid') {
        s.bids.push(bidData)
        s.total_bids++
        if (!s.first_bid_price) s.first_bid_price = bidData.price
        if (!s.best_bid_price || bidData.price < s.best_bid_price) s.best_bid_price = bidData.price
        if (s.reaction_sec === null) s.reaction_sec = bidData.seconds_from_start
      } else if (b.type === 'prebid') {
        s.prebids.push(bidData)
        s.total_prebids++
      }
    })

    // Calculate derived metrics per supplier
    const suppliers = Object.values(supplierMap).map(s => {
      if (s.first_bid_price && baseline > 0) {
        s.start_pct_bl = Number(((s.first_bid_price / baseline) * 100).toFixed(1))
      }
      if (s.best_bid_price && baseline > 0) {
        s.best_pct_bl = Number(((s.best_bid_price / baseline) * 100).toFixed(1))
      } else if (s.prebids.length > 0) {
        const bestPb = Math.min(...s.prebids.map(p => p.price))
        s.best_pct_bl = baseline > 0 ? Number(((bestPb / baseline) * 100).toFixed(1)) : null
        s.best_bid_price = bestPb
      }
      if (s.first_bid_price && s.best_bid_price && s.first_bid_price > 0) {
        s.compression = Number((((s.first_bid_price - s.best_bid_price) / s.first_bid_price) * 100).toFixed(1))
      }
      // Won?
      if (winningPrice && s.best_bid_price && Math.abs(s.best_bid_price - winningPrice) < 0.01) {
        s.won = true
        if (s.bids.length > 0 && s.bids[0].auto_prebid) s.auto_prebid_win = true
      }
      // Step aggressiveness (English): median of successive bid deltas
      if (s.bids.length >= 2) {
        const deltas = []
        for (let i = 1; i < s.bids.length; i++) {
          deltas.push(s.bids[i - 1].price - s.bids[i].price)
        }
        deltas.sort((a, b) => a - b)
        s.step_aggressiveness = Number((deltas[Math.floor(deltas.length / 2)] / (baseline || 1) * 100).toFixed(2))
      }
      // Late bid ratio (English): % of bids in last 20% of their bidding session
      if (s.bids.length >= 3) {
        const firstT = s.bids[0].seconds_from_start
        const lastT = s.bids[s.bids.length - 1].seconds_from_start
        const duration = lastT - firstT
        if (duration > 30) {
          const threshold = firstT + duration * 0.8
          const lateBids = s.bids.filter(b => b.seconds_from_start >= threshold).length
          s.late_bid_ratio = Number(((lateBids / s.bids.length) * 100).toFixed(0))
        }
      }
      // Distance to winner
      if (winningPrice && s.best_bid_price && !s.won) {
        s.delta_vs_winner = Number((((s.best_bid_price - winningPrice) / winningPrice) * 100).toFixed(1))
      }
      return s
    })

    // Sort: winner first, then by best price
    suppliers.sort((a, b) => {
      if (a.won && !b.won) return -1
      if (!a.won && b.won) return 1
      return (a.best_bid_price || Infinity) - (b.best_bid_price || Infinity)
    })

    return {
      auction: {
        ...auction,
        baseline: Number(auction.baseline) || 0,
        duration: Number(auction.duration) || 0,
        winning_price: winningPrice,
        saving_pct: baseline > 0 && winningPrice ? Number((((baseline - winningPrice) / baseline) * 100).toFixed(2)) : null
      },
      suppliers,
      bid_timeline: bids.map(b => ({
        price: Number(b.price),
        type: b.type,
        rank: b.rank,
        time: b.created_at,
        seconds_from_start: (new Date(b.created_at) - startAt) / 1000,
        seller_email: b.seller_email,
        auto_prebid: b.auto_prebid,
        pct_bl: baseline > 0 ? Number(((b.price / baseline) * 100).toFixed(1)) : null
      }))
    }
  } finally {
    await client.end()
  }
})
