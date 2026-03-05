import dayjs from 'dayjs'

/**
 * Composable for resetting auctions (single or multi-lot)
 * Handles timing calculation for parallel/sequential modes
 */
export default function () {
  const supabase = useSupabaseClient()
  const route = useRoute()

  // Configuration
  const START_DELAY_SECONDS = 15 // Time before auction starts (first start)
  const RESET_DELAY_MINUTES = 1 // Time before auction starts after reset (allows time for prebids)
  const RESET_WAIT_MS = 1500 // Wait time after restart calls complete (increased for PROD latency)

  /**
   * Fetch group settings and all auctions in a group
   */
  async function fetchGroupData(auctionGroupId) {
    if (!auctionGroupId) {
      return { groupAuctions: null, auctionGroupSettings: null, isMultiLot: false }
    }

    const [{ data: settings }, { data: auctions }] = await Promise.all([
      supabase.from('auctions_group_settings').select('*').eq('id', auctionGroupId).single(),
      supabase
        .from('auctions')
        .select('id, duration, type, usage, start_at, end_at')
        .eq('auctions_group_settings_id', auctionGroupId)
        .order('lot_number')
    ])

    const groupAuctions = auctions && auctions.length > 0 ? auctions : null
    const isMultiLot = groupAuctions && groupAuctions.length > 1

    return {
      groupAuctions,
      auctionGroupSettings: settings,
      isMultiLot
    }
  }

  /**
   * Calculate timing for each auction based on timing rule
   * @param {boolean} isRestart - true for restart (1 min delay), false for initial start (15s delay)
   * @param {number} singleLotDuration - duration in minutes for single-lot auctions (optional)
   */
  function calculateTimings(
    groupAuctions,
    auctionGroupSettings,
    isMultiLot,
    isRestart = true,
    singleLotDuration = null
  ) {
    const startDate = isRestart
      ? dayjs().set('millisecond', 0).add(RESET_DELAY_MINUTES, 'minute')
      : dayjs().set('millisecond', 0).add(START_DELAY_SECONDS, 'second')
    const auctionTimings = []

    // For single-lot auctions, calculate timing if duration is provided
    if ((!isMultiLot || !groupAuctions || !auctionGroupSettings) && singleLotDuration !== null) {
      const endDate = startDate.add(singleLotDuration, 'minute').set('millisecond', 0)
      return {
        startDate,
        singleLotTiming: {
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString()
        },
        auctionTimings
      }
    }

    if (!isMultiLot || !groupAuctions || !auctionGroupSettings) {
      return { startDate, auctionTimings }
    }

    const isParallel = ['parallel', 'staggered'].includes(auctionGroupSettings.timing_rule)

    // Get effective duration for a lot (sealed-bid has duration=0 in DB)
    function getLotDuration(lot) {
      if (lot.type === 'sealed-bid') {
        // Training only: fixed 2 min
        if (lot.usage === 'training') return 2
        // Test/real: calculate from actual timing
        if (lot.start_at && lot.end_at) {
          const diff = dayjs(lot.end_at).diff(dayjs(lot.start_at), 'minute')
          return diff > 0 ? diff : 0
        }
        return 0
      }
      return +lot.duration
    }

    if (isParallel) {
      // Parallel: all lots start at the same time
      groupAuctions.forEach((lot) => {
        const endDate = startDate.add(getLotDuration(lot), 'minute').set('millisecond', 0)
        auctionTimings.push({
          id: lot.id,
          startAt: startDate.toISOString(),
          endAt: endDate.toISOString()
        })
      })
    } else {
      // Sequential: each lot starts after previous ends
      let cumulativeDuration = 0
      for (let i = 0; i < groupAuctions.length; i++) {
        const lot = groupAuctions[i]
        if (i > 0) {
          cumulativeDuration = groupAuctions.slice(0, i).reduce((total, prevLot) => {
            return total + getLotDuration(prevLot)
          }, 0)
        }
        const lotStart = startDate.add(cumulativeDuration, 'minute').set('millisecond', 0)
        const lotEnd = lotStart.add(getLotDuration(lot), 'minute').set('millisecond', 0)

        auctionTimings.push({
          id: lot.id,
          startAt: lotStart.toISOString(),
          endAt: lotEnd.toISOString()
        })
      }
    }

    return { startDate, auctionTimings }
  }

  /**
   * Call restart endpoint for all auctions
   * @param {Object} singleLotTiming - timing for single-lot auctions (optional)
   */
  async function restartAuctions(auctionIds, auctionTimings, singleLotTiming = null) {
    const results = await Promise.allSettled(
      auctionIds.map((id) => {
        const timing = auctionTimings.find((t) => t.id === id)
        // Use multi-lot timing if available, otherwise single-lot timing
        const finalTiming = timing || singleLotTiming
        return $fetch(`/api/v1/auctions/${id}/restart`, {
          method: 'POST',
          body: finalTiming ? { startAt: finalTiming.startAt, endAt: finalTiming.endAt } : {}
        })
      })
    )

    // Check for failures
    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length > 0) {
      console.error('[useAuctionReset] Some auctions failed to reset:', failures)
    }

    // Wait for backend to complete
    await new Promise((resolve) => setTimeout(resolve, RESET_WAIT_MS))

    return results
  }

  /**
   * Build query params for redirect, preserving important params
   * @param {string} options.status - explicit status to set ('active', 'upcoming', etc.)
   */
  function buildRedirectQuery(options = {}) {
    const { includeBots = true, includeStatus = false, status = 'active' } = options
    const query = {}

    if (includeBots) {
      query.bots = 'true'
    }
    if (includeStatus) {
      query.status = status
    }
    if (route.query.multilot) {
      query.multilot = route.query.multilot
    }
    if (route.query.type) {
      query.type = route.query.type
    }

    return query
  }

  /**
   * Navigate to lot 1 after reset (for multi-lot auctions)
   */
  async function redirectToLot1(auctionGroupId, groupAuctions, query) {
    const lot1Id = groupAuctions[0].id
    const userRole = route.path.includes('/buyer') ? 'buyer' : 'supplier'
    const targetPath = `/auctions/${auctionGroupId}/lots/${lot1Id}/${userRole}`

    await navigateTo(
      {
        path: targetPath,
        query
      },
      { replace: true }
    )
  }

  /**
   * Main reset function - handles entire reset flow
   * @param {boolean} options.isRestart - true for restart (1 min delay), false for initial start (15s delay)
   * @param {boolean} options.useDefaultTiming - true to use backend J+1 default (for Reset Training)
   */
  async function resetAuction(auctionId, auctionGroupId, options = {}) {
    const {
      includeBots = true,
      includeStatus = false,
      isRestart = true, // Default to restart (1 min delay)
      useDefaultTiming = false, // When true, don't pass timing (use backend J+1 default)
      onSuccess = null,
      forceRefresh = null,
      clearLocalLogs = null
    } = options

    // Fetch group data
    const { groupAuctions, auctionGroupSettings, isMultiLot } = await fetchGroupData(auctionGroupId)

    // Get auction IDs to reset
    const auctionIds = groupAuctions ? groupAuctions.map((a) => a.id) : [auctionId]

    let auctionTimings = []
    let singleLotTiming = null

    // Only calculate timing if not using default J+1 timing
    if (!useDefaultTiming) {
      // For single-lot, fetch auction duration
      let singleLotDuration = null
      if (!isMultiLot && auctionId) {
        const { data: auction } = await supabase
          .from('auctions')
          .select('duration, type, usage, start_at, end_at')
          .eq('id', auctionId)
          .single()
        // Sealed-bid has duration=0 in DB
        if (auction?.type === 'sealed-bid') {
          if (auction.usage === 'training') {
            singleLotDuration = 2
          } else if (auction.start_at && auction.end_at) {
            const diff = dayjs(auction.end_at).diff(dayjs(auction.start_at), 'minute')
            singleLotDuration = diff > 0 ? diff : 0
          } else {
            singleLotDuration = 0
          }
        } else {
          singleLotDuration = auction?.duration
        }
      }

      // Calculate timings
      const timings = calculateTimings(
        groupAuctions,
        auctionGroupSettings,
        isMultiLot,
        isRestart,
        singleLotDuration
      )
      auctionTimings = timings.auctionTimings
      singleLotTiming = timings.singleLotTiming || null
    }

    // Restart all auctions (pass null timing if useDefaultTiming to use backend J+1)
    await restartAuctions(auctionIds, auctionTimings, singleLotTiming)

    // Build redirect query - use 'upcoming' status when using default timing (J+1)
    const status = useDefaultTiming ? 'upcoming' : 'active'
    const query = buildRedirectQuery({ includeBots, includeStatus, status })

    // Handle navigation
    // If onSuccess is provided, let the caller handle navigation
    if (onSuccess) {
      if (forceRefresh) {
        await forceRefresh()
      }
      if (clearLocalLogs) {
        clearLocalLogs()
      }
      await onSuccess(query)
    } else if (isMultiLot && groupAuctions) {
      // Default multi-lot behavior: redirect to lot 1
      await redirectToLot1(auctionGroupId, groupAuctions, query)
    } else {
      // Single lot without onSuccess: just refresh data
      if (forceRefresh) {
        await forceRefresh()
      }
      if (clearLocalLogs) {
        clearLocalLogs()
      }
    }

    return { success: true, isMultiLot, auctionIds }
  }

  return {
    fetchGroupData,
    calculateTimings,
    restartAuctions,
    buildRedirectQuery,
    redirectToLot1,
    resetAuction
  }
}
