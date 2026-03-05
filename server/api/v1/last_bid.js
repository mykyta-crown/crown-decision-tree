export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  // Check si auction est closed && si ce n'est pas une english
  try {
    if (!body?.auctionId) {
      throw createError({
        ...ERROR_TYPES.INVALID_INPUT,
        data: { receivedBody: body }
      })
    }

    const { auctionId } = body
    const { data: auction, error: errorFetchAuction } = await fetchAuction(auctionId)
    if (errorFetchAuction) {
      throw createError({
        statusCode: errorFetchAuction.statusCode,
        message: errorFetchAuction.message
      })
    }
    const status = auctionStatus({ startAt: auction.start_at, endAt: auction.end_at })
    if (status !== 'closed') {
      return { success: false, message: 'Auction is not closed.' }
    }
    if (auction.type !== 'japanese' && auction.type !== 'dutch') {
      return { success: false, message: 'Auction is not a japanese auction.' }
    }

    const { data: allBids, error } = await supabase
      .from('bids')
      .select('*')
      .eq('auction_id', auction.id)
      .order('price', { ascending: true })

    //#TODO Gérer la différence  dutch / japanese

    return {
      success: true,
      data: {
        message: `Return lowest bid for auction ${auction.id}`,
        auctionId: auction.id,
        lowestBid: allBids.length > 0 ? allBids[0] : null
      }
    }
  } catch (error) {
    console.error('Error in last bid:', {
      error: error.message,
      stack: error.stack,
      data: {
        auctionId: body?.auction?.id,
        round: body?.round
      }
    })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      ...ERROR_TYPES.INTERNAL_ERROR,
      data: {
        auctionId: body?.auction?.id,
        round: body?.round
      }
    })
  }
})
