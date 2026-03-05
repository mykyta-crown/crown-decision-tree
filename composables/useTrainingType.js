import { ref } from 'vue'
// This composable is made to defined the eAuction Type.
// There's 6 possible eAuction Types:
// - Sealed-bid (timer is at 0)
// - English (auction.type === reverse)
// - Dutch (auction.type === dutch)
// - Dutch preffered (auction.type === preferred-dutch && check supplier si timer_per_round est défini)
// - Japanese (auction.type === japanese)
// - Japanese no rank (auction.type === japanese && max_rank_displayed === 0)

// We need to check if there's handicap (through a custom route and multilot (count auction with same auction_group_settings_id)).

export default async function ({ auctionId }) {
  const supabase = useSupabaseClient()
  // const route = useRoute()
  const { profile } = useUser()
  const auctionGroupId = ref(null)

  const auctionType = ref('english')
  const isHandicaps = ref([])
  const isMultilot = ref(false)
  const isPrebid = ref(false)

  async function getAuctionType() {
    try {
      // Get auction data
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select(
          `
          *,
          auctions_sellers(*),
          supplies(*, supplies_sellers(*))
        `
        )
        .eq('id', auctionId)
        .single()

      if (auctionError) {
        console.error('Error fetching auction:', auctionError)
        return
      }

      // Get auction group ID for multilot check
      auctionGroupId.value = auction.auctions_group_settings_id
      const got_fixed_handicap = auction.supplies.some((supply) =>
        supply.supplies_sellers.some(
          (seller) => seller.additive !== 0 || seller.multiplicative !== 1
        )
      )
      if (got_fixed_handicap) {
        isHandicaps.value.push('fixed_handicap')
      }
      // Check if multilot (count auctions with same auction_group_settings_id)
      const { count: multilotCount, error: multilotError } = await supabase
        .from('auctions')
        .select('id', { count: 'exact', head: true })
        .eq('auctions_group_settings_id', auctionGroupId.value)
        .eq('deleted', false)

      if (multilotError) {
        console.error('Error checking multilot:', multilotError)
      } else {
        isMultilot.value = multilotCount > 1
      }

      // Check if prebid is enabled
      isPrebid.value = auction.dutch_prebid_enabled && auction.type !== 'sealed-bid'

      // Also check if there are any dynamic handicaps in the database for this auction
      // parse email cause there's '+' in the email
      const parsedEmail = profile.value.email.replace('+', '%2B')
      const handicapsRetrieved = await $fetch(
        `/api/v1/auctions/${auctionId}/handicaps?sellerEmail=${parsedEmail}`,
        {
          method: 'GET'
        }
      )
      if (handicapsRetrieved) {
        isHandicaps.value.push('dynamic_handicap')
      }

      // Determine auction type based on auction data
      let typeValue = null

      // Check for sealed-bid (timer is at 0)
      if (auction.type === 'sealed-bid') {
        typeValue = 'sealed-bid'
      } else if (auction.type === 'reverse') {
        // Check for English (auction.type === reverse)
        typeValue = 'english'
      } else if (auction.type === 'dutch') {
        // Check for Dutch (auction.type === dutch)
        // Check if it's Dutch preferred (check if any supplier has timer_per_round defined)
        const hasTimerPerRound = auction.auctions_sellers?.some((seller) => seller.time_per_round)
        typeValue = hasTimerPerRound ? 'dutch-preferred' : 'dutch'
      } else if (auction.type === 'japanese') {
        // Check for Japanese (auction.type === japanese)
        // Check if it's Japanese no rank (max_rank_displayed === 0)
        typeValue = auction.max_rank_displayed === 0 ? 'japanese-no-rank' : 'japanese'
      }
      auctionType.value = typeValue
    } catch (error) {
      console.error('Error in getAuctionType:', error)
    }
  }

  // Call immediately so values are available right away
  await getAuctionType()

  return {
    auctionType,
    isHandicaps,
    isMultilot,
    isPrebid
  }
}
