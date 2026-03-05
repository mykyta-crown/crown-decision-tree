export default defineEventHandler(async (event) => {
  const { auctionId, supplierId } = getRouterParams(event)

  // Log request source for debugging
  const headers = getRequestHeaders(event)
  const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown'
  const userAgent = headers['user-agent'] || 'unknown'
  const referer = headers['referer'] || headers['referrer'] || 'unknown'

  console.log('[RANK REQUEST]', {
    auctionId,
    supplierId,
    ip,
    userAgent,
    referer,
    timestamp: new Date().toISOString()
  })

  const [auctionResult, rankResult] = await Promise.all([
    fetchAuction(auctionId),
    supabase.rpc('get_seller_rank', {
      p_seller_id: supplierId,
      p_auction_id: auctionId
    })
  ])

  const { data: auction } = auctionResult
  const { data: rank } = rankResult

  if (!(auction.max_rank_displayed > 0)) {
    return 0
  } else if (auction.max_rank_displayed && rank > auction.max_rank_displayed) {
    return 0
  } else {
    return rank
  }
})
