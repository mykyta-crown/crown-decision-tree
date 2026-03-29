import pg from 'pg'

/**
 * Analyzer API — Competition pairs with head-to-head win rates
 * Read-only via PG_URL_READONLY
 */
export default defineEventHandler(async () => {
  const connectionString = process.env.PG_URL_READONLY
  if (!connectionString) throw createError({ statusCode: 500, message: 'PG_URL_READONLY not configured' })

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    const { rows } = await client.query(`
      WITH af AS (
        SELECT id FROM auctions
        WHERE usage = 'real' AND deleted = false AND published = true
          AND start_at <= NOW() AND (status IS NULL OR status != 'running') AND baseline > 1
      ),
      lot_winners AS (
        SELECT DISTINCT ON (auction_id) auction_id, seller_id
        FROM bids WHERE type IN ('bid','prebid') AND price > 0
        ORDER BY auction_id, price ASC
      ),
      winner_emails AS (
        SELECT lw.auction_id, COALESCE(p.email, 'unknown') AS winner_email
        FROM lot_winners lw
        LEFT JOIN profiles p ON p.id = lw.seller_id
      )
      SELECT
        a1.seller_email AS s1,
        a2.seller_email AS s2,
        COUNT(DISTINCT a1.auction_id) AS count,
        COUNT(DISTINCT CASE WHEN w.winner_email = a1.seller_email THEN a1.auction_id END) AS s1_wins,
        COUNT(DISTINCT CASE WHEN w.winner_email = a2.seller_email THEN a1.auction_id END) AS s2_wins
      FROM auctions_sellers a1
      JOIN auctions_sellers a2
        ON a1.auction_id = a2.auction_id AND a1.seller_email < a2.seller_email
      JOIN af ON af.id = a1.auction_id
      LEFT JOIN winner_emails w ON w.auction_id = a1.auction_id
      GROUP BY a1.seller_email, a2.seller_email
      HAVING COUNT(DISTINCT a1.auction_id) >= 3
      ORDER BY count DESC
      LIMIT 20
    `)

    // Enrich with names and companies
    const emails = new Set()
    rows.forEach(r => { emails.add(r.s1); emails.add(r.s2) })
    const { rows: profiles } = await client.query(`
      SELECT p.email, p.first_name, p.last_name, c.name AS company
      FROM profiles p
      LEFT JOIN companies c ON c.id = p.company_id
      WHERE p.email = ANY($1)
    `, [Array.from(emails)])
    const profileMap = {}
    profiles.forEach(p => {
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
      profileMap[p.email] = { name: name || p.email.split('@')[0], company: p.company || '' }
    })
    const getInfo = (email) => profileMap[email] || { name: email.split('@')[0], company: '' }

    return rows.map(r => ({
      s1: r.s1, s2: r.s2,
      s1_name: getInfo(r.s1).name,
      s1_company: getInfo(r.s1).company,
      s2_name: getInfo(r.s2).name,
      s2_company: getInfo(r.s2).company,
      count: Number(r.count),
      s1_wins: Number(r.s1_wins),
      s2_wins: Number(r.s2_wins),
      other_wins: Number(r.count) - Number(r.s1_wins) - Number(r.s2_wins)
    }))
  } finally {
    await client.end()
  }
})
