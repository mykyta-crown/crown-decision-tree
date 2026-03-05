import dayjs from 'dayjs'
import { orderBy } from 'lodash'

import { useMemoize } from '@vueuse/core'

// Default enriched bid structure for early returns
const createDefaultEnrichedBid = (bid) => ({
  bid,
  seller: null,
  bidSupplies: [],
  bidHandicaps: [],
  totalBidPrice: 0,
  totalBidPriceWithHandicaps: 0
})

const getAuctionData = useMemoize(async (auctionId) => {
  const supabase = useSupabaseClient()
  const { user, isAdmin } = useUser()

  const { data: auction } = await supabase
    .from('auctions')
    .select('*, supplies(*), auctions_sellers(*)')
    .eq('id', auctionId)
    .single()

  // Handle case where auction is not found or not accessible
  if (!auction) {
    return {
      auction: null,
      sellers: [],
      suppliesSeller: [],
      auctionHandicaps: []
    }
  }

  const suppliesTable =
    user.value.id === auction.buyer_id || isAdmin.value
      ? 'supplies_sellers'
      : 'supplies_sellers_view'

  // Then parallelize the dependent requests
  const [{ data: sellers }, { data: suppliesSeller }, { data: auctionHandicaps }] =
    await Promise.all([
      // Get the suppliers profiles.
      supabase
        .from('profiles')
        .select('*, companies(*)')
        .in(
          'email',
          (auction.auctions_sellers || []).map((s) => s.seller_email)
        ),
      // Get suppliers supplies.
      supabase
        .from(suppliesTable)
        .select('*')
        .in(
          'supply_id',
          (auction.supplies || []).map((s) => s.id)
        ),
      // Get auction handicaps options.
      supabase.from('auctions_handicaps').select('*').eq('auction_id', auctionId)
    ])

  if (suppliesTable === 'supplies_sellers_view') {
    suppliesSeller.forEach((supply) => {
      supply.multiplicative = 1
      supply.additive = 0
    })
  }

  return {
    auction,
    sellers: sellers || [],
    suppliesSeller: suppliesSeller || [],
    auctionHandicaps: auctionHandicaps || []
  }
})

const updateBidsHandicaps = useMemoize(
  async (handicapIds, bidsIds) => {
    const supabase = useSupabaseClient()

    if (!bidsIds || bidsIds.length === 0 || !handicapIds || handicapIds.length === 0) {
      return []
    }

    const { data: bidsHandicapsData } = await supabase
      .from('bids_handicaps')
      .select('*')
      .in('handicap_id', handicapIds)
      .in('bid_id', bidsIds)

    return bidsHandicapsData || []
  },
  {
    getKey(handicapIds, bidsIds) {
      return `${handicapIds.join(',')}-${bidsIds.join(',')}`
    }
  }
)

const updateBidsSupplies = useMemoize(
  async (supplyIds, bidsIds) => {
    const supabase = useSupabaseClient()

    if (!bidsIds || bidsIds.length === 0 || !supplyIds || supplyIds.length === 0) {
      return []
    }

    const { data: bidsSuppliesData } = await supabase
      .from('bid_supplies')
      .select('*')
      .in('supply_id', supplyIds)
      .in('bid_id', bidsIds)

    return bidsSuppliesData || []
  },
  {
    getKey(supplyIds, bidsIds) {
      return `${supplyIds.join(',')}-${bidsIds.join(',')}`
    }
  }
)

export default async function ({ auctionId, bids: externalBids = null }) {
  const { auction, sellers, suppliesSeller, auctionHandicaps } = await getAuctionData(auctionId)

  // Use external bids if provided, otherwise create own subscription (for backwards compatibility)
  let bids
  if (externalBids) {
    bids = externalBids
  } else {
    const realtimeBids = useRealtimeBids({ auctionId })
    bids = realtimeBids.bids
    await realtimeBids.fetchBids()
  }

  // Declare refs used to calculate price.
  const bidsSupplies = ref([])
  const bidsHandicaps = ref([])
  // Version counter to force computed recalculation
  const dataVersion = ref(0)

  async function bidsHandler() {
    // Handle case where auction is not loaded
    if (!auction || !auction.supplies) {
      bidsHandicaps.value = []
      bidsSupplies.value = []
      return
    }

    // Handle case where bids is not loaded
    if (!bids.value) {
      bidsHandicaps.value = []
      bidsSupplies.value = []
      return
    }

    const handicapIds = auctionHandicaps.map((h) => h.id)
    const supplyIds = auction.supplies.map((s) => s.id)
    const bidIds = bids.value.map((b) => b.id)

    // Clear cache to ensure fresh data for new bids
    updateBidsHandicaps.clear()
    updateBidsSupplies.clear()

    const [bidsHandicapsData, bidsSuppliesData] = await Promise.all([
      updateBidsHandicaps(handicapIds, bidIds),
      updateBidsSupplies(supplyIds, bidIds)
    ])

    bidsHandicaps.value = bidsHandicapsData
    bidsSupplies.value = bidsSuppliesData
    // Increment version to force computed recalculation
    dataVersion.value++
  }

  await bidsHandler()

  function enrichBidWithTotalValue(bid) {
    const seller = sellers.find((s) => s.id === bid.seller_id)

    // Handle case where auction is not loaded or seller not found
    if (!auction?.supplies || !seller) {
      if (!seller) {
        console.warn(
          '[useTotalValue] Seller not found for bid:',
          bid.id,
          'seller_id:',
          bid.seller_id
        )
      }
      if (!auction?.supplies) {
        console.warn('[useTotalValue] Auction supplies not loaded for bid:', bid.id)
      }
      return createDefaultEnrichedBid(bid)
    }

    const bidHandicaps = bidsHandicaps.value.filter((h) => h.bid_id === bid.id)

    let bidSupplies = []

    if (auction.type === 'reverse' || auction.type === 'sealed-bid') {
      bidSupplies = bidsSupplies.value
        .filter((s) => s.bid_id === bid.id)
        .map((bidSupply) => {
          // console.log('bidSupply', bidSupply.bid_id, bid)
          const sellerSupply = suppliesSeller.find((s) => {
            return s.seller_email === seller?.email && s.supply_id === bidSupply.supply_id
          })

          const auctionSupply = auction.supplies.find((s) => s.id === bidSupply.supply_id)

          return {
            sellerSupply,
            totalValue: formatTotalValue(sellerSupply, auctionSupply?.quantity, bidSupply.price)
          }
        })
    } else {
      const firstSupply = auction.supplies?.[0]
      if (firstSupply) {
        const supplyUnitPrice = bid.price / firstSupply.quantity
        bidSupplies.push({
          sellerSupply: { additive: 0, multiplicative: 1 },
          totalValue: formatTotalValue(
            {
              additive: 0,
              multiplicative: 1
            },
            firstSupply.quantity,
            supplyUnitPrice
          )
        })
      }
    }

    const totalBidPrice = bidSupplies.reduce((total, supplyTotalValue) => {
      return total + supplyTotalValue.totalValue.totalPrice
    }, 0)

    const totalBidPriceWithHandicaps = bidHandicaps.reduce((total, bidHandicap) => {
      const handicap = auctionHandicaps.find((h) => h.id === bidHandicap.handicap_id)
      return total + handicap.amount
    }, totalBidPrice)

    return {
      bid,
      seller,
      bidSupplies,
      bidHandicaps,
      totalBidPrice,
      totalBidPriceWithHandicaps
    }
  }

  watch(
    bids,
    async () => {
      await bidsHandler()
    },
    { deep: true }
  )

  const bidsTotalValue = computed(() => {
    // Access dataVersion to track it as a dependency (forces recalculation when data updates)
    void dataVersion.value
    return bids.value.map(enrichBidWithTotalValue).filter((b) => b.totalBidPrice > 0)
  })

  const bestBidsTotalValue = computed(() => {
    const sellersBids = sellers
      .map(({ email }) => {
        const sellerBids = bidsTotalValue.value.filter(({ seller, totalBidPrice }) => {
          return seller.email === email && totalBidPrice > 0
        })

        // Sort by price first, then by timestamp (oldest bid wins at same price)
        return orderBy(
          sellerBids,
          ['totalBidPriceWithHandicaps', (enrichedBid) => +dayjs(enrichedBid.bid.created_at)],
          ['asc', 'asc']
        )[0]
      })
      .filter((b) => !!b)

    return orderBy(
      sellersBids,
      [
        'totalBidPriceWithHandicaps',
        (enrichedBid) => {
          return +dayjs(enrichedBid.bid.created_at)
        }
      ],
      ['asc', 'asc']
    )
  })

  function findSellerBestBid(sellerEmailOrId) {
    return bestBidsTotalValue.value.find(({ seller }) => {
      return seller.id === sellerEmailOrId || seller.email === sellerEmailOrId
    })
  }

  function findSellerSupplyPrice(sellerEmailOrId, supplyId) {
    const bestBid = findSellerBestBid(sellerEmailOrId)
    return bestBid?.bidSupplies.find((s) => s.sellerSupply.supply_id === supplyId)
  }

  const rankedSellers = computed(() => {
    return orderBy(sellers, (seller) => {
      const bestBidIndex = bestBidsTotalValue.value.findIndex((bid) => {
        return bid.seller.email === seller.email
      })

      return bestBidIndex < 0 ? 1000 : bestBidIndex
    })
  })

  // Cache for supply ranks to avoid repeated API calls
  const supplyRanksCache = ref({})

  // Clear rank cache whenever bids change
  watch(
    bids,
    () => {
      supplyRanksCache.value = {}
    },
    { deep: true }
  )

  async function getSupplyRank(sellerEmailOrId, supplyId) {
    const cacheKey = `${sellerEmailOrId}-${supplyId}`

    // Return cached value if available
    if (supplyRanksCache.value[cacheKey] !== undefined) {
      return supplyRanksCache.value[cacheKey]
    }

    // Find seller ID from email or ID
    const seller = sellers.find((s) => s.id === sellerEmailOrId || s.email === sellerEmailOrId)
    if (!seller) {
      return -1
    }

    try {
      // Call the API endpoint to get supply-specific rank
      const rank = await $fetch(
        `/api/v1/auctions/${auctionId}/supplies/${supplyId}/suppliers/${seller.id}/rank`
      )

      // Cache the result
      supplyRanksCache.value[cacheKey] = rank

      return rank
    } catch (error) {
      console.error('Error fetching supply rank:', error)
      return -1
    }
  }

  // Get all supply ranks for a seller (useful for bid tables)
  async function getSupplyRanks(sellerEmailOrId) {
    const ranks = {}

    for (const supply of auction.supplies) {
      ranks[supply.id] = await getSupplyRank(sellerEmailOrId, supply.id)
    }

    return ranks
  }

  // Manually clear rank cache (useful for forcing refresh)
  function clearSupplyRankCache() {
    supplyRanksCache.value = {}
  }

  return {
    enrichBidWithTotalValue,
    bidsTotalValue,
    bestBidsTotalValue,
    rankedSellers,
    findSellerSupplyPrice,
    findSellerBestBid,
    getSupplyRank,
    getSupplyRanks,
    clearSupplyRankCache
  }
}
