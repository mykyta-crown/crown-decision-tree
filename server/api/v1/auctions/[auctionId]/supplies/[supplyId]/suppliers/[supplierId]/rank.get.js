// API endpoint to get supplier rank for a specific supply/line item
// Similar to the global rank endpoint but for individual supplies

export default defineEventHandler(async (event) => {
  const { auctionId, supplyId, supplierId } = getRouterParams(event)

  try {
    // Fetch auction and rank in parallel
    const [auctionResult, rankResult] = await Promise.all([
      fetchAuction(auctionId),
      supabase.rpc('get_supply_rank', {
        p_auction_id: auctionId,
        p_seller_id: supplierId,
        p_supply_id: supplyId
      })
    ])

    const { data: auction } = auctionResult
    let finalRank = rankResult.data // Access .data from RPC result
    let bids = [] // Define outside
    let fetchedBidsCount = -1

    // Fallback: Calculate rank in JS if SQL returns -2 (Auction not started) or -1 (Not found/Rank calculation failed)
    if (finalRank === -2 || finalRank === null || finalRank === -1) {
      // Handle null too
      const { data: fetchedBids, error: bidsError } = await supabase
        .from('bids')
        .select('created_at, seller_id, bid_supplies(supply_id, price)')
        .eq('auction_id', auctionId)

      if (bidsError) throw bidsError

      fetchedBidsCount = fetchedBids ? fetchedBids.length : 0

      // Filter bids that have the target supply
      bids = fetchedBids.filter(
        (bid) => bid.bid_supplies && bid.bid_supplies.some((bs) => bs.supply_id === supplyId)
      )

      if (bids && bids.length > 0) {
        // Get seller emails for handicaps
        const sellerIds = [...new Set(bids.map((b) => b.seller_id))]
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', sellerIds)

        if (profilesError) throw profilesError

        const emailMap = {}
        profiles?.forEach((p) => {
          emailMap[p.id] = p.email
        })

        // Get handicaps for this supply
        const { data: handicaps, error: handicapsError } = await supabase
          .from('supplies_sellers')
          .select('seller_email, additive, multiplicative')
          .eq('supply_id', supplyId)

        if (handicapsError) throw handicapsError

        const handicapMap = {}
        handicaps?.forEach((h) => {
          handicapMap[h.seller_email] = h
        })

        // Get supply quantity
        const { data: supply, error: supplyError } = await supabase
          .from('supplies')
          .select('quantity')
          .eq('id', supplyId)
          .single()

        if (supplyError) throw supplyError

        const quantity = supply?.quantity || 1

        // Calculate best price per seller
        const sellerBestPrices = {}

        bids.forEach((bid) => {
          const supplyBid = bid.bid_supplies.find((bs) => bs.supply_id === supplyId) // Should be only one due to filter
          if (!supplyBid) return

          const email = emailMap[bid.seller_id]
          const handicap = handicapMap[email] || { additive: 0, multiplicative: 1 }

          // Calculate total price with handicaps
          const price = supplyBid.price
          const additive = handicap.additive || 0
          const multiplicative = handicap.multiplicative || 1

          const totalPrice = (price + additive) * multiplicative * quantity

          if (
            !sellerBestPrices[bid.seller_id] ||
            totalPrice < sellerBestPrices[bid.seller_id].price
          ) {
            sellerBestPrices[bid.seller_id] = {
              price: totalPrice,
              time: new Date(bid.created_at).getTime()
            }
          }
        })

        // Sort sellers
        const sortedSellers = Object.keys(sellerBestPrices).sort((a, b) => {
          const priceDiff = sellerBestPrices[a].price - sellerBestPrices[b].price
          if (Math.abs(priceDiff) > 0.0001) return priceDiff
          return sellerBestPrices[a].time - sellerBestPrices[b].time
        })

        // Find rank
        const rankIndex = sortedSellers.indexOf(supplierId)
        if (rankIndex !== -1) {
          finalRank = rankIndex + 1
        } else {
          finalRank = -1 // Not found
        }
      } else {
        finalRank = -1 // No bids
      }
    }

    // Apply max_rank_displayed logic in all cases
    if (!(auction.max_rank_displayed > 0)) {
      return 0
    } else if (auction.max_rank_displayed && finalRank > auction.max_rank_displayed) {
      return 0
    }

    return finalRank
  } catch (error) {
    return { error: error.message, stack: error.stack }
  }
})
