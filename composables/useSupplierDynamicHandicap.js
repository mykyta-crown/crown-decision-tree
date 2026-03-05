import { groupBy } from 'lodash'

export default function useSupplierDynamichandicap({ auctionId }) {
  const supabase = useSupabaseClient()

  const handicaps = ref([])

  async function fetchHandicaps() {
    const { data } = await supabase
      .from('auctions_handicaps')
      .select('*')
      .eq('auction_id', auctionId)
      .order('amount', { ascending: false })

    handicaps.value = data
    return data
  }

  const selectedHandicaps = computed(() => {
    return handicaps.value.filter((handicap) => handicap.selected)
  })

  async function fetchBidsHandicaps(handicapIds = handicaps.value.map((handicap) => handicap.id)) {
    const { data } = await supabase
      .from('bids_handicaps')
      .select('*')
      .in('handicap_id', handicapIds)

    return data
  }

  const handicapsGroups = computed(() => {
    return groupBy(handicaps.value, 'group_name')
  })

  fetchHandicaps()

  return { handicaps, fetchHandicaps, handicapsGroups, selectedHandicaps, fetchBidsHandicaps }
}
