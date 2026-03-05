export default async function ({ auctionId: initialAuctionId, auctionGroupId = null }) {
  const supabase = useSupabaseClient()

  // Use a ref to track the current auction ID (supports lot switching)
  const currentAuctionId = ref(initialAuctionId)

  // Store interval IDs for all lots (keyed by auctionId)
  const intervalIds = ref({})

  // Cache group info to avoid refetching
  let groupAuctions = null
  let timingRule = null

  async function fetchGroupInfo() {
    if (!auctionGroupId || groupAuctions !== null) return

    try {
      // Fetch timing rule
      const { data: settings } = await supabase
        .from('auctions_group_settings')
        .select('timing_rule')
        .eq('id', auctionGroupId)
        .single()

      timingRule = settings?.timing_rule || 'serial'

      // Fetch all auctions in the group
      const { data: auctions } = await supabase
        .from('auctions')
        .select('id, usage')
        .eq('auctions_group_settings_id', auctionGroupId)
        .order('lot_number')

      groupAuctions = auctions || []

      console.log('[TrainingBots] Group info:', {
        timingRule,
        lotCount: groupAuctions.length,
        lotIds: groupAuctions.map((a) => a.id)
      })
    } catch (error) {
      console.error('[TrainingBots] Failed to fetch group info:', error)
      groupAuctions = []
      timingRule = 'serial'
    }
  }

  function stopBotsForLot(lotId) {
    if (intervalIds.value[lotId]) {
      // Only clear if it's an actual interval (not 'pending')
      if (intervalIds.value[lotId] !== 'pending') {
        clearInterval(intervalIds.value[lotId])
      }
      delete intervalIds.value[lotId]
      console.log('[TrainingBots] Stopped bots for lot:', lotId)
    }
  }

  function stopBots() {
    // Stop all bot intervals
    Object.keys(intervalIds.value).forEach((lotId) => {
      clearInterval(intervalIds.value[lotId])
    })
    intervalIds.value = {}
    console.log('[TrainingBots] Stopped all bots')
  }

  function startBotsForLot(lotId, initialDelay = 0) {
    // Don't start if already running or pending for this lot
    if (intervalIds.value[lotId]) {
      console.log('[TrainingBots] Bots already running/pending for lot:', lotId)
      return
    }

    // Mark as pending immediately to prevent race conditions
    intervalIds.value[lotId] = 'pending'

    // Use a timeout for the initial delay, then start the interval
    // Note: We don't call training immediately here - the restart endpoint handles
    // the initial training call for restarts. This prevents duplicate bot bids.
    const startInterval = () => {
      intervalIds.value[lotId] = setInterval(() => {
        $fetch(`/api/v1/auctions/${lotId}/training`, {
          method: 'POST'
        }).catch((err) => console.log('[TrainingBots] Training call error:', err))
      }, 10000)
      console.log('[TrainingBots] Started bots for lot:', lotId)
    }

    if (initialDelay > 0) {
      console.log(`[TrainingBots] Will start bots for lot ${lotId} after ${initialDelay}ms delay`)
      setTimeout(startInterval, initialDelay)
    } else {
      startInterval()
    }
  }

  async function startBots() {
    // Fetch group info if we have an auctionGroupId
    await fetchGroupInfo()

    // Check if parallel mode with multiple lots
    const isParallel = timingRule === 'parallel' || timingRule === 'staggered'
    const hasMultipleLots = groupAuctions && groupAuctions.length > 1

    if (isParallel && hasMultipleLots) {
      // PARALLEL MODE: Start bots for ALL lots
      // Check if bots are already running - don't restart if so
      const runningCount = Object.keys(intervalIds.value).length
      if (runningCount > 0) {
        console.log('[TrainingBots] Bots already running for', runningCount, 'lots (parallel mode)')
        return
      }

      console.log('[TrainingBots] Starting bots for ALL lots (parallel mode)')

      // Only start bots for training/test auctions
      const trainingLots = groupAuctions.filter(
        (lot) => lot.usage === 'training' || lot.usage === 'test'
      )

      // Start bots with different delays per lot for more realistic behavior
      trainingLots.forEach((lot, index) => {
        const delay = index * 2000 // 2 second stagger per lot
        startBotsForLot(lot.id, delay)
      })

      console.log(`[TrainingBots] Started bots for ${trainingLots.length} lots (staggered)`)
    } else {
      // SERIAL MODE: Only start bots for current lot
      // Stop bots on other lots, start on current lot
      const currentLotId = currentAuctionId.value

      // Stop any bots running on other lots
      Object.keys(intervalIds.value).forEach((lotId) => {
        if (lotId !== currentLotId) {
          stopBotsForLot(lotId)
        }
      })

      // Start bots on current lot if not already running
      if (!intervalIds.value[currentLotId]) {
        console.log('[TrainingBots] Starting bots for current lot:', currentLotId, '(serial mode)')
        startBotsForLot(currentLotId)
      } else {
        console.log('[TrainingBots] Bots already running for current lot (serial mode)')
      }
    }
  }

  function setAuctionId(newAuctionId) {
    currentAuctionId.value = newAuctionId
  }

  return {
    startBots,
    stopBots,
    setAuctionId
  }
}
