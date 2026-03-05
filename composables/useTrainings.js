import { ref, watch, onMounted, computed } from 'vue'

export default async function ({ auctionGroupId }) {
  const supabase = useSupabaseClient()
  const { profile } = useUser()
  const route = useRoute()

  const validatedScenarios = ref({
    trainings_losing: null,
    trainings_prebid_win: null,
    trainings_live_win: null
  })

  // Track which lots have been processed for scenario updates
  const processedLots = ref(new Set())

  /**
   * Clear the processed lots cache (called when training is reset)
   */
  const clearProcessedLots = () => {
    processedLots.value = new Set()
  }

  const getAuctionsAndScenarios = async () => {
    const { data: scenariosData } = await supabase
      .from('trainings')
      .select('trainings_losing, trainings_prebid_win, trainings_live_win')
      .eq('seller_email', profile.value?.email)
      .eq('auctions_group_settings_id', auctionGroupId)
      //Handle possible zero row returned
      .maybeSingle()

    if (scenariosData) {
      validatedScenarios.value = scenariosData
    }
  }

  /**
   * Get all lots in the auction group with their current status
   */
  const getAllLotsInGroup = async () => {
    const { data, error } = await supabase
      .from('auctions')
      .select('id, type, start_at, end_at, max_rank_displayed')
      .eq('auctions_group_settings_id', auctionGroupId)
      .eq('deleted', false)
      .order('lot_number')

    if (error) {
      console.error('Error fetching lots:', error)
      return []
    }

    return data || []
  }

  /**
   * Check if a lot is closed based on its timing
   */
  const isLotClosed = (lot) => {
    if (!lot.end_at) return false
    return new Date() >= new Date(lot.end_at)
  }

  /**
   * Update scenarios for all closed lots in a multi-lot training
   * This ensures scenarios are tracked even if user wasn't viewing a lot when it closed
   */
  const updateScenariosForAllClosedLots = async () => {
    const lots = await getAllLotsInGroup()

    for (const lot of lots) {
      // Skip if lot is not closed or already processed
      if (!isLotClosed(lot) || processedLots.value.has(lot.id)) {
        continue
      }

      // Update scenario for this lot
      await updateScenarioOnAuctionEnd(lot.id)
      processedLots.value.add(lot.id)
    }
  }

  const updateScenarioOnAuctionEnd = async (auctionId) => {
    try {
      // Get auction information
      const { data: auction, error: auctionError } = await supabase
        .from('auctions')
        .select('*')
        .eq('id', auctionId)
        .eq('auctions_group_settings_id', auctionGroupId)
        .single()

      if (auctionError || !auction) {
        console.error('Error getting auction:', auctionError)
        return
      }

      // Get user's rank in this auction
      const { fetchRank } = useRank()
      const userRank = await fetchRank(profile.value.id, auctionId)

      // Get user's last bid to determine if it was prebid or live bid
      const { data: userBids, error: bidsError } = await supabase
        .from('bids')
        .select('*')
        .eq('auction_id', auctionId)
        .eq('seller_id', profile.value.id)
        .order('created_at', { ascending: false })

      if (bidsError || !userBids || userBids.length === 0) return

      const lastPrebid = userBids.find((bid) => bid.type === 'prebid')
      const lastBid = userBids[0]
      const isPrebid =
        lastBid.type === 'prebid' ||
        lastPrebid?.price === lastBid.price ||
        auction.type === 'sealed-bid'

      // Determine which scenario to update based on rank and bid type
      let scenarioToUpdate = null
      console.log('userRank', userRank)

      // Special handling for Japanese no-rank: only one scenario "Finish the event"
      // Always mark as trainings_live_win regardless of actual rank
      const isJapaneseNoRank = auction.type === 'japanese' && auction.max_rank_displayed === 0
      if (isJapaneseNoRank) {
        scenarioToUpdate = 'trainings_live_win'
      } else if (userRank === 1) {
        // User won the auction
        if (isPrebid) {
          if (auction.type === 'sealed-bid' || auction.type === 'reverse') {
            scenarioToUpdate = 'trainings_live_win'
          } else {
            scenarioToUpdate = 'trainings_prebid_win'
          }
        } else {
          scenarioToUpdate = 'trainings_live_win'
        }
      } else {
        // User lost the auction
        scenarioToUpdate = 'trainings_losing'
      }
      console.log('scenarioToUpdate', scenarioToUpdate)
      // Update the scenario if we determined one
      if (scenarioToUpdate) {
        const updateData = {
          [scenarioToUpdate]: new Date().toISOString()
        }

        // Check if training record exists and get current values
        const { data: existingTraining } = await supabase
          .from('trainings')
          .select('*')
          .eq('seller_email', profile.value.email)
          .eq('auctions_group_settings_id', auctionGroupId)
          .maybeSingle()

        // console.log('existingTraining', existingTraining, scenarioToUpdate)

        if (existingTraining) {
          // Check if the scenario already has a date - don't overwrite if it does
          if (!existingTraining[scenarioToUpdate]) {
            // Update existing record only if scenario doesn't have a date yet
            await supabase.from('trainings').update(updateData).match({
              seller_email: profile.value.email,
              auctions_group_settings_id: auctionGroupId
            })
          }
        } else {
          // Create new record
          await supabase.from('trainings').insert({
            seller_email: profile.value.email,
            auctions_group_settings_id: auctionGroupId,
            ...updateData
          })
        }

        // Refresh scenarios
        await getAuctionsAndScenarios()
      }
    } catch (error) {
      console.error('Error updating training scenario:', error)
    }
  }

  // Check if this is a multi-lot training
  const isMultiLotTraining = computed(() => {
    return route.query.multilot === 'true'
  })

  // Watch for auction status changes in query params
  watch(
    () => route.query.status,
    async (newStatus) => {
      if (newStatus === 'closed' && route.params?.auctionId) {
        // For multi-lot: check all closed lots in the group
        if (isMultiLotTraining.value) {
          await updateScenariosForAllClosedLots()
        } else {
          // For single-lot: just update the current lot
          await updateScenarioOnAuctionEnd(route.params.auctionId)
        }
      }
    }
  )

  onMounted(async () => {
    await getAuctionsAndScenarios()

    // Check if auction is already closed on mount
    if (route.query.status === 'closed' && route.params?.auctionId) {
      if (isMultiLotTraining.value) {
        await updateScenariosForAllClosedLots()
      } else {
        await updateScenarioOnAuctionEnd(route.params.auctionId)
      }
    }
  })

  return {
    validatedScenarios,
    updateScenarioOnAuctionEnd,
    updateScenariosForAllClosedLots,
    getAuctionsAndScenarios,
    clearProcessedLots,
    isMultiLotTraining
  }
}
