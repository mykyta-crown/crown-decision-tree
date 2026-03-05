/**
 * Composable for tracking pre-bid status across all lots in a multi-lot auction group
 * Used for multi-lot training guidance flow
 *
 * Uses Nuxt's useState for shared reactive state across components (SSR-safe)
 */

/**
 * Clear the cached state for an auction group (e.g., when training is reset)
 */
export function clearMultiLotPrebidsCache(auctionGroupId) {
  if (import.meta.client) {
    const stateKey = `multiLotPrebids-${auctionGroupId}`
    // Reset to default empty state (not null to avoid null reference errors)
    const state = useState(stateKey)
    if (state.value) {
      state.value = {
        lots: [],
        prebidsByLot: new Map(),
        loading: true,
        prebidVersion: 0,
        justPlacedPrebid: false,
        initialized: false
      }
    }
  }
}

export default async function ({ auctionGroupId }) {
  const supabase = useSupabaseClient()
  const { user } = useUser()

  // Use useState for shared reactive state across components (Nuxt 3 SSR-safe)
  // This ensures [auctionGroupId].vue and supplier.vue share the SAME reactive state
  const stateKey = `multiLotPrebids-${auctionGroupId}`
  const sharedState = useState(stateKey, () => ({
    lots: [],
    prebidsByLot: new Map(),
    loading: true,
    prebidVersion: 0,
    justPlacedPrebid: false,
    initialized: false
  }))

  // Create refs that point to the shared state for reactivity
  // Add null checks for safety (in case state was cleared externally)
  const lots = computed({
    get: () => sharedState.value?.lots ?? [],
    set: (v) => {
      if (sharedState.value) sharedState.value.lots = v
    }
  })
  const prebidsByLot = computed({
    get: () => sharedState.value?.prebidsByLot ?? new Map(),
    set: (v) => {
      if (sharedState.value) sharedState.value.prebidsByLot = v
    }
  })
  const loading = computed({
    get: () => sharedState.value?.loading ?? true,
    set: (v) => {
      if (sharedState.value) sharedState.value.loading = v
    }
  })
  // Version counter to force reactivity when prebids change
  const prebidVersion = computed({
    get: () => sharedState.value?.prebidVersion ?? 0,
    set: (v) => {
      if (sharedState.value) sharedState.value.prebidVersion = v
    }
  })

  /**
   * Fetch all lots in the auction group with prebid requirements
   */
  async function fetchLots() {
    if (!auctionGroupId) {
      lots.value = []
      return
    }

    const { data, error } = await supabase
      .from('auctions')
      .select('id, lot_number, lot_name, name, dutch_prebid_enabled, type, start_at, end_at')
      .eq('auctions_group_settings_id', auctionGroupId)
      .eq('deleted', false)
      .order('lot_number')

    if (error) {
      console.error('[useMultiLotPrebids] Error fetching lots:', error)
      lots.value = []
      return
    }

    lots.value = data || []
  }

  /**
   * Check if a lot requires prebid
   */
  function lotRequiresPrebid(lot) {
    // English (reverse) auctions always require prebid
    if (lot.type === 'reverse') return true
    // Dutch auctions with prebid enabled
    if (lot.type === 'dutch' && lot.dutch_prebid_enabled) return true
    // Sealed-bid has no pre-bid phase - bids happen during the active auction
    if (lot.type === 'sealed-bid') return false
    // Japanese auctions with prebid
    if (lot.type === 'japanese' && lot.dutch_prebid_enabled) return true
    // Preferred Dutch with prebid
    if (lot.type === 'preferred-dutch' && lot.dutch_prebid_enabled) return true
    return false
  }

  /**
   * Check if user has placed prebid for a specific lot
   */
  async function checkPrebidForLot(lotId) {
    if (!user.value?.id) return false

    const { data, error } = await supabase
      .from('bids')
      .select('id')
      .eq('auction_id', lotId)
      .eq('seller_id', user.value.id)
      .eq('type', 'prebid')
      .limit(1)

    if (error) {
      console.error('[useMultiLotPrebids] Error checking prebid:', error)
      return false
    }

    return data && data.length > 0
  }

  /**
   * Refresh prebid status for all lots
   */
  async function refreshPrebidStatus() {
    loading.value = true
    const newPrebidStatus = new Map()

    for (const lot of lots.value) {
      if (lotRequiresPrebid(lot)) {
        const hasPrebid = await checkPrebidForLot(lot.id)
        newPrebidStatus.set(lot.id, hasPrebid)
      } else {
        // Lots without prebid requirement are considered "done"
        newPrebidStatus.set(lot.id, true)
      }
    }

    prebidsByLot.value = newPrebidStatus
    loading.value = false
  }

  /**
   * Get lots that require prebid
   */
  const lotsRequiringPrebid = computed(() => {
    return lots.value.filter(lotRequiresPrebid)
  })

  /**
   * Check if all required prebids have been placed
   */
  const allPrebidsPlaced = computed(() => {
    const lotsCount = lots.value.length
    const requiringCount = lotsRequiringPrebid.value.length
    if (lotsCount === 0) return false
    if (requiringCount === 0) return true

    return lotsRequiringPrebid.value.every((lot) => {
      return prebidsByLot.value.get(lot.id) === true
    })
  })

  /**
   * Get the next lot that needs a prebid (in lot_number order)
   */
  const nextLotNeedingPrebid = computed(() => {
    return (
      lotsRequiringPrebid.value.find((lot) => {
        return prebidsByLot.value.get(lot.id) !== true
      }) || null
    )
  })

  /**
   * Get prebid progress stats
   */
  const prebidProgress = computed(() => {
    const total = lotsRequiringPrebid.value.length
    if (total === 0) {
      return { completed: 0, total: 0, percentage: 100 }
    }

    const completed = lotsRequiringPrebid.value.filter((lot) => {
      return prebidsByLot.value.get(lot.id) === true
    }).length

    return {
      completed,
      total,
      percentage: Math.round((completed / total) * 100)
    }
  })

  /**
   * Check if a specific lot has prebid
   */
  function hasPrebidForLot(lotId) {
    return prebidsByLot.value.get(lotId) === true
  }

  /**
   * Check if current lot has prebid (convenience function)
   */
  function currentLotHasPrebid(currentLotId) {
    return prebidsByLot.value.get(currentLotId) === true
  }

  /**
   * Mark a lot as having prebid (optimistic update)
   */
  function markLotPrebidPlaced(lotId) {
    if (!sharedState.value) return

    const currentMap = sharedState.value.prebidsByLot
    currentMap.set(lotId, true)
    const newVersion = sharedState.value.prebidVersion + 1
    // Force reactivity by creating a new Map and incrementing version
    sharedState.value = {
      ...sharedState.value,
      prebidsByLot: new Map(currentMap),
      prebidVersion: newVersion
    }
  }

  // justPlacedPrebid uses the shared state
  const justPlacedPrebid = computed({
    get: () => sharedState.value?.justPlacedPrebid ?? false,
    set: (v) => {
      if (sharedState.value) {
        sharedState.value = { ...sharedState.value, justPlacedPrebid: v }
      }
    }
  })

  /**
   * Called after a prebid is submitted to trigger the "switch to next lot" guidance
   */
  function onPrebidSubmitted(lotId) {
    if (!sharedState.value) return
    markLotPrebidPlaced(lotId)
    sharedState.value = { ...sharedState.value, justPlacedPrebid: true }
  }

  /**
   * Clear the just placed prebid flag (called when navigating)
   */
  function clearJustPlacedPrebid() {
    if (!sharedState.value) return
    sharedState.value = { ...sharedState.value, justPlacedPrebid: false }
  }

  /**
   * Reset all state (called after training reset)
   * Clears prebid status - does NOT re-fetch from DB to avoid race condition
   * where bids haven't been deleted yet
   */
  async function resetState() {
    if (!sharedState.value) return
    // Clear prebid status completely - don't re-fetch from DB
    // The backend is deleting bids async, so querying now would get stale data
    sharedState.value = {
      ...sharedState.value,
      prebidsByLot: new Map(),
      justPlacedPrebid: false,
      prebidVersion: sharedState.value.prebidVersion + 1, // Force reactivity
      initialized: true // Mark as initialized with empty state
    }

    // Re-fetch lots (structure only, not prebid status)
    await fetchLots()
  }

  // Initialize only once (check if already initialized)
  if (sharedState.value && !sharedState.value.initialized) {
    await fetchLots()
    await refreshPrebidStatus()
    sharedState.value = { ...sharedState.value, initialized: true }
  }

  // Realtime subscription to detect auction updates (start_at, end_at changes)
  // Uses existing useRealtime composable for consistency
  const { subscribedData: realtimeLots } = useRealtime({
    table: 'auctions',
    filter: `auctions_group_settings_id=eq.${auctionGroupId}`,
    select: 'id, lot_number, lot_name, name, dutch_prebid_enabled, type, start_at, end_at'
  })

  // Watch realtime updates and sync to shared state
  watch(
    realtimeLots,
    (newLots) => {
      if (newLots && newLots.length > 0 && sharedState.value) {
        sharedState.value = {
          ...sharedState.value,
          lots: newLots,
          prebidVersion: (sharedState.value.prebidVersion || 0) + 1
        }
      }
    },
    { deep: true }
  )

  const instance = {
    lots,
    prebidsByLot,
    loading,
    lotsRequiringPrebid,
    allPrebidsPlaced,
    nextLotNeedingPrebid,
    prebidProgress,
    justPlacedPrebid,
    prebidVersion,
    fetchLots,
    refreshPrebidStatus,
    checkPrebidForLot,
    hasPrebidForLot,
    currentLotHasPrebid,
    markLotPrebidPlaced,
    onPrebidSubmitted,
    clearJustPlacedPrebid,
    resetState,
    lotRequiresPrebid
  }

  return instance
}
