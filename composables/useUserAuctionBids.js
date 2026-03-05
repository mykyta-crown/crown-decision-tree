import { ref, triggerRef } from 'vue'
import { useMemoize } from '@vueuse/core'
import dayjs from 'dayjs'
import _ from 'lodash'

// Store memoized functions at module level so we can clear their caches
let initializeAuction
let fetchSellersSupplies
let enrichRealtimeBids

// Function to clear all memoize caches (used by PDF export)
export function clearAuctionMemoizeCache() {
  if (initializeAuction?.cache) {
    initializeAuction.cache.clear()
  }
  if (fetchSellersSupplies?.cache) {
    fetchSellersSupplies.cache.clear()
  }
  if (enrichRealtimeBids?.cache) {
    enrichRealtimeBids.cache.clear()
  }
  console.log('[useUserAuctionBids] Memoize caches cleared')
}

initializeAuction = useMemoize(
  async (supabase, auctionId) => {
    // Guard against undefined auctionId
    if (!auctionId) {
      console.warn('[useUserAuctionBids] initializeAuction called with undefined auctionId')
      return { auctionSupplies: [], auctionSellers: [], auctionProfiles: [] }
    }

    const [{ data: auctionSupplies }, { data: auctionSellers }] = await Promise.all([
      supabase
        .from('supplies')
        .select('*')
        .eq('auction_id', auctionId)
        .order('index', { ascending: true }),
      supabase.from('auctions_sellers').select('*').eq('auction_id', auctionId)
    ])

    const { data: auctionProfiles } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .in(
        'email',
        (auctionSellers || []).map((seller) => seller.seller_email)
      )

    return {
      auctionSupplies: auctionSupplies || [],
      auctionSellers: auctionSellers || [],
      auctionProfiles: auctionProfiles || []
    }
  },
  {
    getKey: (supabase, auctionId) => auctionId || 'undefined'
  }
)

fetchSellersSupplies = useMemoize(
  async (supabase, isBuyer, auctionId) => {
    // Guard against undefined auctionId
    if (!auctionId) {
      console.warn('[useUserAuctionBids] fetchSellersSupplies called with undefined auctionId')
      return { suppliesSellersData: [] }
    }

    const { auctionSupplies, auctionSellers } = await initializeAuction(supabase, auctionId)

    // Get all supply IDs and seller emails
    const supplyIds = (auctionSupplies || []).map((supply) => supply.id)
    const sellerEmails = (auctionSellers || []).map((as) => as.seller_email)

    // Determine which table to use based on user type
    const suppliesSellersTable = isBuyer ? 'supplies_sellers' : 'supplies_sellers_view'

    // Fetch supplies_sellers data
    const { data: suppliesSellersData } = await supabase
      .from(suppliesSellersTable)
      .select('*')
      .in('supply_id', supplyIds)
      .in('seller_email', sellerEmails)

    return {
      suppliesSellersData
    }
  },
  {
    getKey: (supabase, isBuyer, auctionId) => `${isBuyer}_${auctionId}`
  }
)

// Helper function to add delay for retry logic
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

enrichRealtimeBids = useMemoize(
  async (supabase, realtimeBids, auctionId) => {
    // Guard against undefined auctionId
    if (!auctionId) {
      console.warn('[useUserAuctionBids] enrichRealtimeBids called with undefined auctionId')
      return []
    }

    const { auctionSupplies, auctionProfiles } = await initializeAuction(supabase, auctionId)

    const supplyIds = (auctionSupplies || []).map((supply) => supply.id)

    // Retry logic to handle race condition with bid_supplies
    let bidSupplies = []
    let retryCount = 0
    const maxRetries = 3
    const retryDelays = [50, 100, 200] // ms

    while (retryCount <= maxRetries) {
      const { data } = await supabase
        .from('bid_supplies')
        .select('id, price, supplies(*), bids(*)')
        .in('supply_id', supplyIds)

      bidSupplies = data || []

      // Check if all bids have their bid_supplies
      const allBidsHaveSupplies = realtimeBids.value.every((bid) => {
        return bidSupplies.some((bs) => bs.bids?.id === bid.id)
      })

      if (allBidsHaveSupplies || retryCount === maxRetries) {
        break
      }

      // Wait before retrying
      if (retryCount < maxRetries) {
        await sleep(retryDelays[retryCount])
        retryCount++
      }
    }

    // console.log('bidSupplies', bidSupplies, 'retries:', retryCount)

    const bids = realtimeBids.value
      .map((bid) => {
        const supplies = bidSupplies.filter((bs) => {
          return bs.bids?.id === bid.id
        })

        return {
          ...bid,
          bid_supplies: supplies,
          profiles: auctionProfiles.find((profile) => profile.id === bid.seller_id)
        }
      })
      .sort((a, b) => +dayjs(b.created_at) - +dayjs(a.created_at))

    return bids
  },
  {
    getKey: (supabase, realtimeBids, auctionId) => {
      return `${auctionId}_${realtimeBids.value.map((bid) => bid.id).join(',')}`
    }
  }
)

export default async function ({ auctionId }) {
  const supabase = useSupabaseClient()
  const { isBuyer, getSession } = useUser()

  const { auction: realtimeAuction, fetchAuction } = useRealtimeAuction({ auctionId })
  const { bids: realtimeBids, fetchBids } = useRealtimeBids({ auctionId })

  const auction = ref(null)
  const rank = ref(null)

  const { fetchRank } = useRank()

  async function setRank() {
    const { user } = await getSession()
    const newRank = await fetchRank(user.value.id, auctionId)

    // Preserve 0 for hidden ranks (max_rank_displayed exceeded)
    // -1 = no bids/not found, 0 = hidden, > 0 = actual rank
    rank.value = newRank >= 0 ? newRank : -1
    // Force reactivity trigger
    triggerRef(rank)
  }

  const lastAuctionUpdate = ref(dayjs())
  const loading = ref(true)

  async function updateAuction() {
    const { auctionSupplies, auctionSellers, auctionProfiles } = await initializeAuction(
      supabase,
      auctionId
    )

    const { suppliesSellersData } = await fetchSellersSupplies(supabase, isBuyer, auctionId)

    const supplies = auctionSupplies.map((supply) => {
      const suppliesSellers = suppliesSellersData
        .filter((suplySeller) => suplySeller.supply_id === supply.id)
        .map((suplySeller) => {
          const seller_profile = auctionProfiles.find(
            (profile) => profile.email === suplySeller.seller_email
          )
          const identifier = seller_profile?.companies?.name ?? suplySeller.seller_email

          return { ...suplySeller, seller_profile, identifier }
        })

      return { ...supply, supplies_sellers: suppliesSellers }
    })

    const sellers = auctionSellers.map((seller) => {
      const seller_profile = auctionProfiles.find((existProfile) => {
        return existProfile.email === seller.seller_email
      })

      const identifier = seller_profile?.companies?.name ?? seller.seller_email

      return { ...seller, seller_profile, identifier }
    })

    auction.value = {
      ...realtimeAuction.value,
      bids: await enrichRealtimeBids(supabase, realtimeBids, auctionId),
      supplies,
      auctions_sellers: sellers
    }
    // Force reactivity trigger
    triggerRef(auction)

    // console.log('auction.value', auction.value)

    lastAuctionUpdate.value = dayjs()
    loading.value = false
  }

  const lowerBidsByComp = ref(null)

  function getLastestBidsByCompanies(auction) {
    // Filter out bids with incomplete data (missing profiles or companies)
    const validBids = auction.bids.filter(
      (bid) => bid.profiles && bid.profiles.companies && bid.profiles.companies.name
    )

    if (validBids.length === 0) {
      console.warn('[getLastestBidsByCompanies] No valid bids with complete profile/company data')
      return []
    }

    const byCompanies = _.groupBy(validBids, (bid) => bid.profiles.companies.name)

    const cleanedBestBids = _.mapValues(byCompanies, (company) => {
      const bestBid = _.minBy(company, (bid) => bid.price)
      return Object.assign({}, bestBid, {
        company: bestBid.profiles.companies,
        user: bestBid.profiles,
        timestamp: +dayjs(bestBid.created_at)
      })
    })

    return _.orderBy(cleanedBestBids, ['price', 'timestamp'], ['asc', 'asc']).map((bid, i) => ({
      rank: i + 1,
      ...bid
    }))
  }

  async function updateData() {
    try {
      await updateAuction()
      await setRank()
      lowerBidsByComp.value = getLastestBidsByCompanies(auction.value)
    } catch (err) {
      console.error('[Auction] Update failed:', err)
    }
  }

  watch(
    realtimeAuction,
    async () => {
      await updateData()
    },
    { deep: true }
  )

  watch(
    realtimeBids,
    async () => {
      await updateData()
    },
    { deep: true }
  )

  async function fetchData() {
    await fetchAuction()
    await fetchBids()
  }

  await fetchData()

  // Polling every 10 seconds to keep data fresh and lastAuctionUpdate updated
  setInterval(async () => {
    await fetchData()
    await updateData()
  }, 10000)

  const forceRefresh = async () => {
    console.log('[useUserAuctionBids] Force refreshing auction data...')
    clearAuctionMemoizeCache()
    await fetchData()
    await updateData()
  }

  return {
    auction,
    lowerBidsByComp,
    updateAuction,
    setRank,
    lastAuctionUpdate,
    rank,
    loading,
    forceRefresh
  }
}
