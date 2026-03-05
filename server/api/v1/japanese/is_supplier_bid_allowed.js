import dayjs from 'dayjs'

async function isSupplierAllowedToBid({
  auctionId,
  supplierId,
  rounds,
  askedPrice,
  bidTime,
  decrement
}) {
  console.log('isSupplierAllowedToBisd args:', {
    auctionId,
    supplierId,
    askedPrice,
    bidTime,
    decrement
  })

  const { data: bids, error } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', auctionId)
    .eq('seller_id', supplierId)
    .order('price', { ascending: false })
  if (error) {
    throw createError({
      ...ERROR_TYPES.DATABASE_ERROR,
      message: 'Error fetching supplier bids',
      data: { auctionId, supplierId }
    })
  }

  const currentRound = rounds.find((round) => {
    return (
      dayjs(bidTime).unix() >= dayjs(round.start_at).unix() &&
      dayjs(bidTime).unix() <= dayjs(round.end_at).unix()
    )
  })
  console.log('currentRound:', currentRound)
  if (!currentRound) {
    throw createError({
      ...ERROR_TYPES.INVALID_BID_TIME,
      message: 'Round is over - cannot allow bid at this time',
      data: { bidTime, rounds }
    })
  }

  if (currentRound.price !== askedPrice) {
    throw createError({
      ...ERROR_TYPES.INVALID_BID_PRICE,
      message: 'Bid price does not match current round price',
      data: {
        roundPrice: currentRound.price,
        askedPrice
      }
    })
  }

  if (bids.length > 0) {
    const lastBid = bids[0] // Since bids are ordered by price descending, first one is the last bid
    const expectedPrice = lastBid.price - decrement

    if (askedPrice < expectedPrice) {
      throw createError({
        ...ERROR_TYPES.INVALID_BID_DECREMENT,
        message: 'Bid price skips rounds - must follow proper decrement sequence',
        data: {
          lastBidPrice: lastBid.price,
          expectedPrice,
          askedPrice,
          decrement
        }
      })
    }
  }

  return true
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { supplierId, auctionId, type, price, created_at } = body
    console.log('isSupplierAllowedToBid body:', supplierId, auctionId, type, price, created_at)
    if (!supplierId || !auctionId || !price || !created_at) {
      throw createError({
        ...ERROR_TYPES.INVALID_INPUT,
        message: 'Missing required fields',
        data: { receivedBody: body }
      })
    }

    const { data: auction, error: auctionError } = await fetchAuction(auctionId)
    // console.log('auction:', auction), auctionError;
    if (auctionError) {
      throw createError({
        ...ERROR_TYPES.DATABASE_ERROR,
        message: 'Error fetching auction',
        data: { auctionId }
      })
    }

    if (!auction) {
      throw createError({
        ...ERROR_TYPES.NOT_FOUND,
        message: 'Auction not found',
        data: { auctionId }
      })
    }

    const plannedRounds = japaneseHelpers.generateAuctionRounds(auction)
    let isAllowed = false
    if (type === 'prebid') {
      isAllowed = true
    } else {
      isAllowed = await isSupplierAllowedToBid({
        auctionId,
        supplierId,
        rounds: plannedRounds,
        askedPrice: price,
        bidTime: created_at,
        decrement: auction.min_bid_decr
      })
    }
    console.log('isAllowed:', isAllowed)
    return {
      success: true,
      data: {
        isAllowed,
        auctionId,
        supplierId
      }
    }
  } catch (error) {
    console.log('error:', error)
    console.error('Error checking if supplier is allowed to bid:', {
      error: error.message,
      stack: error.stack,
      data: event.body
    })

    if (error.statusCode) {
      throw error
    }

    throw createError({
      ...ERROR_TYPES.INTERNAL_ERROR,
      data: event.body
    })
  }
})
