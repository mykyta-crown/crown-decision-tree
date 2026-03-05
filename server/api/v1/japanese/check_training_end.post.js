/**
 * Check if a Japanese training auction should end immediately
 * Called after a user leaves the auction to terminate without waiting for next round
 *
 * IMPORTANT: This only applies to TRAINING auctions.
 * For TEST and LIVE auctions, Japanese No-Rank continues until the timer ends.
 */
export default defineEventHandler(async (event) => {
  const { auctionId } = await readBody(event)

  if (!auctionId) {
    return { ended: false, reason: 'No auctionId provided' }
  }

  // Fetch auction
  const { data: auction, error: fetchError } = await fetchAuction(auctionId)

  if (fetchError || !auction) {
    console.error('[check_training_end] Error fetching auction:', fetchError)
    return { ended: false, reason: 'Failed to fetch auction' }
  }

  // Only for training Japanese auctions
  if (auction.type !== 'japanese') {
    return { ended: false, reason: 'Not a Japanese auction' }
  }

  if (auction.usage !== 'training') {
    return { ended: false, reason: 'Not a training auction' }
  }

  // No-Rank trainings should NOT end early - they must run all rounds
  if (!(auction.max_rank_displayed > 0)) {
    return { ended: false, reason: 'No-Rank training must run all rounds' }
  }

  // Check auction status
  const status = auctionStatus({ startAt: auction.start_at, endAt: auction.end_at })
  if (status !== 'active') {
    return { ended: false, reason: `Auction is not active (status: ${status})` }
  }

  // Check if all sellers have exited
  const { data: sellers, error: sellersError } = await supabase
    .from('auctions_sellers')
    .select('exit_time, seller_email')
    .eq('auction_id', auctionId)

  if (sellersError) {
    console.error('[check_training_end] Error fetching sellers:', sellersError)
    return { ended: false, reason: 'Failed to fetch sellers' }
  }

  if (!sellers || sellers.length === 0) {
    return { ended: false, reason: 'No sellers found' }
  }

  // Get all bids to find which sellers have participated
  const { data: allBids } = await supabase
    .from('bids')
    .select('seller_email')
    .eq('auction_id', auctionId)

  const participatingSellers = new Set(allBids?.map((b) => b.seller_email) || [])

  // Condition 1: All sellers have exited
  const allSellersExited = sellers.every((s) => s.exit_time !== null)

  // Condition 2: All participating sellers (those who placed bids) have exited
  // This handles the case where some sellers never placed any bids
  const allParticipantsExited =
    participatingSellers.size > 0 &&
    sellers
      .filter((s) => participatingSellers.has(s.seller_email))
      .every((s) => s.exit_time !== null)

  console.log('[check_training_end] Sellers status:', {
    auctionId,
    totalSellers: sellers.length,
    participatingSellers: participatingSellers.size,
    sellersWithExitTime: sellers.filter((s) => s.exit_time !== null).length,
    allSellersExited,
    allParticipantsExited
  })

  if (allSellersExited || allParticipantsExited) {
    const reason = allSellersExited ? 'all_sellers_exited' : 'all_participants_exited'
    console.log(`[check_training_end] 🛑 ENDING TRAINING AUCTION ${auctionId} - ${reason}`)

    // End the auction immediately
    const { error: updateError } = await supabase
      .from('auctions')
      .update({ end_at: new Date().toISOString() })
      .eq('id', auctionId)

    if (updateError) {
      console.error('[check_training_end] Error updating auction end_at:', updateError)
      return { ended: false, reason: 'Failed to update auction' }
    }

    return { ended: true }
  }

  return { ended: false, reason: 'Not all participants have exited yet' }
})
