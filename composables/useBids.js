import dayjs from 'dayjs'
import { groupBy, map } from 'lodash'

export default async function ({ auctionId }) {
  const supabase = useSupabaseClient()
  const { user } = useUser()

  const { updateAuction, auction } = await useUserAuctionBids({ auctionId })

  const lastPrebids = computed(() => {
    const prebids = auction.value.bids.filter(
      (bid) => bid.type === 'prebid' || auction.value.type === 'sealed-bid'
    )
    const prebidBySeller = groupBy(prebids, 'seller_id')
    const lastPrebidsBySellers = Object.entries(prebidBySeller).map(([sellerId, bids]) => {
      const lastSellerPrebid = bids.sort((a, b) => +dayjs(b.created_at) - +dayjs(a.created_at))[0]
      return {
        seller_id: sellerId,
        lastSellerPrebid
      }
    })
    const reducedPrebids = lastPrebidsBySellers.reduce((acc, current) => {
      acc[current.seller_id] = current.lastSellerPrebid
      return acc
    }, {})
    return reducedPrebids
  })

  const lastJapanesePrebid = computed(() => {
    const prebids = auction.value.bids.filter((bid) => bid.type === 'prebid')
    const prebidBySeller = groupBy(prebids, 'seller_id')
    const lastPrebidsBySellers = Object.entries(prebidBySeller).map(([key, value]) => {
      const lastSellerPrebid = value.sort((a, b) => a.price - b.price)[0]
      return {
        seller_id: key,
        lastSellerPrebid
      }
    })

    const reducedPrebids = lastPrebidsBySellers.reduce((acc, current) => {
      acc[current.seller_id] = current.lastSellerPrebid
      return acc
    }, {})
    return reducedPrebids
  })

  const lastPrebidFromUser = computed(() => {
    return auction.value.type === 'japanese'
      ? lastJapanesePrebid.value[user.value.id]
      : lastPrebids.value[user.value.id]
  })

  async function insertBid(supplies, bidOptions, handicaps) {
    // console.time('insertBid')
    const { data: insertedBid, error: errorInsertBid } = await supabase.rpc('insert_bid', {
      p_auction_id: auctionId,
      p_seller_id: bidOptions.sellerId || user.value.id,
      p_supplies: supplies,
      p_bid_type: bidOptions.type,
      p_handicaps: map(handicaps, (handicap) => {
        return {
          id: handicap.id
        }
      })
    })

    if (errorInsertBid) {
      console.error('Error inserting bid:', errorInsertBid)
      return
    }

    // console.log('insertedBid', insertedBid)

    updateAuction()
    // console.timeEnd('insertBid')
  }

  return { insertBid, lastPrebids, lastPrebidFromUser, lastJapanesePrebid }
}
