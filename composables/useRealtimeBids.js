import { useDebounceFn } from '@vueuse/core'

export default function ({ auctionId, poll = false, pollInterval = 10000 }) {
  const supabase = useSupabaseClient()
  const bids = ref([])

  // Track if initial fetch has been done to avoid duplicate fetches
  let initialFetchDone = false

  // Use useBroadcast for realtime subscription (listens to broadcast_bids_auction_id=eq.{auctionId})
  // dataVersion increments on any change (INSERT, UPDATE, DELETE) - exposed for watchers
  const { dataVersion } = useBroadcast({
    table: 'bids',
    filter: `auction_id=eq.${auctionId}`
  })

  // Custom fetch that includes profile joins (useBroadcast only fetches basic fields)
  async function fetchBids() {
    const { data } = await supabase
      .from('bids')
      .select('*, profiles(*, companies(*))')
      .eq('auction_id', auctionId)
    bids.value = data || []
    initialFetchDone = true
    return bids
  }

  // Debounced fetch to avoid excessive database calls during rapid bid updates
  const debouncedFetchBids = useDebounceFn(async () => {
    await fetchBids()
  }, 300)

  // When broadcast subscription receives any event (INSERT, UPDATE, DELETE), fetch full data
  // Skip if we haven't done initial fetch yet (will be done by component calling fetchBids)
  watch(dataVersion, () => {
    if (initialFetchDone) {
      debouncedFetchBids()
    }
  })

  // Optional polling fallback for components where broadcast events may be missed
  // (e.g., summary table rows that don't have useUserAuctionBids' built-in polling)
  if (poll && import.meta.client) {
    const pollingId = setInterval(async () => {
      if (initialFetchDone) {
        await fetchBids()
      }
    }, pollInterval)

    onScopeDispose(() => {
      clearInterval(pollingId)
    })
  }

  return { bids, fetchBids, dataVersion }
}
