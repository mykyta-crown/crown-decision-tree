<template>
  <v-row justify="center">
    <v-col v-if="status.label === 'upcoming'" cols="12" class="text-center">
      <v-btn-primary
        height="44"
        class="px-16 mt-4"
        :disabled="disablePrebidButton"
        @click="showModal"
      >
        {{ label }}
      </v-btn-primary>
    </v-col>
    <v-col v-else cols="12" class="text-center d-flex justify-center ga-3">
      <v-btn-secondary
        height="44"
        class="px-16 mt-4"
        variant="outlined"
        color="error"
        :disabled="
          status.label === 'closed' ||
          disableBidButtonByPrebid ||
          !isSupplierBidAllowed ||
          alreadyPlacedBid
        "
        @click="leaveAuction"
      >
        {{ t('bidButton.leaveEAuction') }}
      </v-btn-secondary>
      <v-btn-primary
        height="44"
        class="px-16 mt-4"
        :disabled="
          status.label === 'closed' ||
          disableBidButtonByPrebid ||
          disableBidButtonByNoPlacedPrebid ||
          !allowUserToBidDuringLive ||
          alreadyPlacedBid
        "
        :prepend-icon="disableBidButtonByPrebid ? 'mdi-checkbox-marked-outline' : ''"
        @click="showModal"
      >
        {{ disableBidButtonByPrebid ? t('bidButton.offerAccepted') : t('bidButton.acceptOffer') }}
      </v-btn-primary>
    </v-col>
    <ConfirmBidDialog
      v-model="showConfirmModal"
      :bid-price="clickedPrice"
      :is-prebid="status.label === 'upcoming'"
      :auction-type="auction.type"
      @confirmed="addBid"
    />
    <AuctionsJapaneseLeavingDialog v-model="showLeavingDialog" @redirect="redirect()" />
    <AuctionsJapaneseWarningDialog
      v-if="
        status.label === 'active' &&
        displayBidWarning &&
        isSupplierBidAllowed &&
        !showLeavingDialog &&
        !showConfirmModal
      "
      v-model="displayBidWarning"
      :timer="currentRoundTimeLeft"
      :bid-price="clickedPrice"
      :auction-type="auction.type"
      @redirect="redirect()"
      @confirmed="addBid"
    />
    <AuctionsJapaneseEarlyEndDialog v-model="leavingSupplier" />
  </v-row>
</template>

<script setup>
import dayjs from 'dayjs'
import { onMounted } from 'vue'

const props = defineProps({
  sellerId: {
    type: String,
    default: null
  },
  sellerEmail: {
    type: String,
    default: null
  }
})

const { t } = useTranslations()

const supabase = useSupabaseClient()
const { user } = useUser()
const route = useRoute()

const { auction, updateAuction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { status, start, now } = useAuctionTimer(auction)
const { activeRound, rounds } = useJapaneseRounds(auction)
const { lastPrebids, lastPrebidFromUser: lastPrebidFromUserComposable } = await useBids({
  auctionId: route.params.auctionId
})
const { fetchRank } = useRank()

const isSupplierBidAllowed = ref(true)
const leavingSupplier = ref(false)

const prebid = inject('prebid')

const showConfirmModal = ref(false)
const showLeavingDialog = ref(false)
const clickedPrice = ref(0)
const displayBidWarning = ref(false)

const alreadyPlacedBid = ref(false)

let openedOnce = false
const checkedBidOnceThisRound = ref(false)

const currentRoundTimeLeft = computed(() => {
  return dayjs
    .duration(
      auction.value.overtime_range * 1000 * 60 -
        ((now.value - start.value) % (auction.value.overtime_range * 1000 * 60))
    )
    .seconds()
})

async function getExitTime() {
  const { data: auctionSeller } = await supabase
    .from('auctions_sellers')
    .select('exit_time')
    .match({
      seller_email: user.value.email,
      auction_id: auction.value.id
    })
    .single()

  return auctionSeller?.exit_time
}

const sellerId = computed(() => {
  return props.sellerId || user.value.id
})

const sellerEmail = computed(() => {
  return props.sellerEmail || user.value.email
})

// For Japanese auctions, we need the lowest price prebid (most competitive)
// Use the composable's lastPrebidFromUser which handles Japanese auction logic correctly
// But if sellerId prop is provided (admin viewing as seller), use lastPrebids with that sellerId
const lastPrebidFromUser = computed(() => {
  if (props.sellerId) {
    // Admin viewing as specific seller - get their lowest prebid for Japanese
    const sellerPrebids = auction.value.bids.filter(
      (bid) => bid.type === 'prebid' && bid.seller_id === props.sellerId
    )
    if (sellerPrebids.length === 0) return undefined
    // Return the lowest price prebid (most competitive for Japanese descending)
    return sellerPrebids.sort((a, b) => a.price - b.price)[0]
  }
  // Normal user - use composable which handles Japanese logic
  return lastPrebidFromUserComposable.value
})

const exitTime = await getExitTime()
console.log('[BidButton DEBUG] Initial exitTime check:', exitTime)
if (exitTime) {
  console.log('[BidButton DEBUG] Setting isSupplierBidAllowed=false on component init')
  isSupplierBidAllowed.value = false
}

async function redirect() {
  console.log('[BidButton DEBUG] redirect() called - setting exit_time in DB')
  await supabase
    .from('auctions_sellers')
    .update({
      exit_time: now.value
    })
    .match({
      seller_email: sellerEmail.value,
      auction_id: auction.value.id
    })

  console.log('[BidButton DEBUG] Setting isSupplierBidAllowed=false after redirect')
  isSupplierBidAllowed.value = false

  // For training auctions only, check if auction should end immediately
  // This allows No-Rank trainings to end without waiting for the next round
  if (auction.value.usage === 'training') {
    console.log('[BidButton DEBUG] Training auction - checking if should end immediately')
    try {
      const { ended } = await $fetch('/api/v1/japanese/check_training_end', {
        method: 'POST',
        body: { auctionId: auction.value.id }
      })
      console.log('[BidButton DEBUG] check_training_end result:', { ended })
      // If ended, the realtime subscription will update the auction status
    } catch (error) {
      console.error('[BidButton DEBUG] Error checking training end:', error)
    }
  }
}

const lastBidValue = computed(() => {
  // Create a copy before sorting to avoid mutating the original array
  const sortedBidsByLowestPrice = [...auction.value.bids].sort((a, b) => a.price - b.price)
  return sortedBidsByLowestPrice[0]?.price || 0
})

//Close the bidding modal when timer under 10sec so it doesn't overlap with the warning modal
watch(displayBidWarning, (value) => {
  if (value) {
    showConfirmModal.value = false
    openedOnce = true
  }
})

// Open warning modal or redirect to homepage when no bid placed
watch(currentRoundTimeLeft, () => {
  if (currentRoundTimeLeft.value >= 10) {
    openedOnce = false
  }
  // Timer under 10sec, seller hasn't accepted current round && Warning not openedOnce
  if (
    currentRoundTimeLeft.value <= 10 &&
    (lastBidValue.value === 0 || lastBidValue.value > activeRound.value.price) &&
    !alreadyPlacedBid.value &&
    !openedOnce &&
    !displayBidWarning.value
  ) {
    console.log('[BidButton DEBUG] Opening warning dialog (timer <= 10, lastBid > activeRound)')
    displayBidWarning.value = !showConfirmModal.value
    openedOnce = true
  } else {
    // Redirect if no bid placed at end of round time
    if (
      currentRoundTimeLeft.value == 0 &&
      (lastBidValue.value === 0 || lastBidValue.value > activeRound.value.price) &&
      openedOnce &&
      !isSupplierBidAllowed.value
    ) {
      console.log('[BidButton DEBUG] Auto-redirect triggered (timer=0, isSupplierBidAllowed=false)')
      redirect()
    }
  }
})

watch(
  activeRound,
  async (current, previous) => {
    console.log('[BidButton DEBUG] activeRound watch triggered', {
      current: current?.price,
      previous: previous?.price
    })
    if (previous && current.price !== previous.price) {
      console.log(
        '[BidButton DEBUG] Round changed, resetting checkedBidOnceThisRound and alreadyPlacedBid'
      )
      checkedBidOnceThisRound.value = false
      alreadyPlacedBid.value = false
      await checkIfSupplierBidded()
    }

    if (status.value.label === 'active' && !checkedBidOnceThisRound.value) {
      console.log(
        '[BidButton DEBUG] Calling checkIfSupplierSkippedARound (status=active, not checked this round)'
      )
      await checkIfSupplierSkippedARound()
    }
    //Set the clickedPrice to bid at the current price
    if (activeRound.value.price !== clickedPrice.value) {
      showConfirmModal.value = false
      openedOnce = false
      clickedPrice.value = activeRound.value.price
    }
  },
  { immediate: true }
)

function showModal() {
  if (status.value.label === 'upcoming' && prebid?.price) {
    clickedPrice.value = prebid.value.price
  } else {
    clickedPrice.value = activeRound.value.price
  }

  showConfirmModal.value = true
}

function leaveAuction() {
  //#TODO A checker ce qu'on fait niveau back, modifier ici
  showLeavingDialog.value = true
  displayBidWarning.value = false
  // return router.push('/home')
}
// Disable the prebid button if the last prebid from the user is the same as the current prebid
const disablePrebidButton = computed(() => {
  if (status.value.label === 'upcoming' && lastPrebidFromUser.value?.price) {
    return prebid?.value === 0 ? true : prebid?.value[0]?.price === lastPrebidFromUser.value?.price
  } else {
    return forbidPrebidDuringLive.value
  }
})

// Disable the bid button until the current round reaches the user's prebid price
// In descending Japanese auctions: disable when current price > prebid (haven't reached prebid yet)
const disableBidButtonByPrebid = computed(() => {
  // If no prebid, don't disable by this rule
  if (!lastPrebidFromUser.value?.price) return false

  // In descending auctions, disable when current round price is HIGHER than prebid
  // Enable when round reaches or goes below prebid price
  const result = activeRound.value.price > lastPrebidFromUser.value?.price
  console.log(
    '[BidButton DEBUG] disableBidButtonByPrebid:',
    result,
    `(activeRound ${activeRound.value?.price} > prebid ${lastPrebidFromUser.value?.price})`
  )
  return result
})
const disableBidButtonByNoPlacedPrebid = computed(() => {
  return lastPrebidFromUser.value === undefined && auction.value?.dutch_prebid_enabled
})

const allowUserToBidDuringLive = computed(() => {
  const result = status.value.label === 'active' && isSupplierBidAllowed.value
  console.log(
    '[BidButton DEBUG] allowUserToBidDuringLive:',
    result,
    `(status=${status.value.label}, isSupplierBidAllowed=${isSupplierBidAllowed.value})`
  )
  return result
})

const forbidPrebidDuringLive = computed(() => {
  if (status.value.label === 'upcoming') {
    return false
  }
  if (auction.value.dutch_prebid_enabled) {
    return !lastPrebidFromUser.value?.price && status.value.label === 'active'
  } else {
    return false
  }
})

const label = computed(() => {
  if (status.value.label === 'active' || status.value.label === 'closed') {
    return t('bidButton.bidAtCurrentPrice')
  }

  if (status.value.label === 'upcoming') {
    return lastPrebidFromUser.value ? t('bidButton.changePrebid') : t('bidButton.submitPrebid')
  }

  return ''
})

async function addBid(bidPrice) {
  const bidType = status.value.label === 'upcoming' ? 'prebid' : 'bid'

  if (bidType === 'prebid') {
    // Vérifier qu'un prebid à ce prix n'existe pas déjà pour éviter les doublons
    const existingPrebidAtPrice = auction.value.bids.find(
      (bid) => bid.seller_id === sellerId.value && bid.type === 'prebid' && bid.price === bidPrice
    )
    if (existingPrebidAtPrice) {
      updateAuction()
      alreadyPlacedBid.value = true
      isSupplierBidAllowed.value = true
      return
    }
  }

  // Fetch supplies to create proper bid_supplies records via insert_bid RPC
  // This ensures get_seller_rank() calculates rank consistently for all sellers
  const { data: supplies } = await supabase
    .from('supplies')
    .select('id')
    .eq('auction_id', route.params.auctionId)

  const bidSupplies = (supplies || []).map((supply) => ({
    supply_id: supply.id,
    price: bidPrice,
    quantity: 1
  }))

  await supabase.rpc('insert_bid', {
    p_auction_id: route.params.auctionId,
    p_seller_id: sellerId.value,
    p_supplies: bidSupplies,
    p_bid_type: bidType,
    p_handicaps: []
  })

  updateAuction()

  alreadyPlacedBid.value = true
  isSupplierBidAllowed.value = true
}

async function checkIfSupplierSkippedARound() {
  // We need to check if the supplier skipped bidding a round
  // We retrieve his last bid and compare it to the current and previous round
  // If the supplier skipped a round, we need to update the auction status
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', route.params.auctionId)
    .eq('seller_id', sellerId.value)
    .order('price', { ascending: true })

  console.log('[BidButton DEBUG] checkIfSupplierSkippedARound called')
  console.log(
    '[BidButton DEBUG] activeRound:',
    activeRound.value?.price,
    'index:',
    activeRound.value?.index
  )
  console.log('[BidButton DEBUG] bids count:', bids?.length)

  if (bids.length > 0) {
    const lowestBid = bids[0]
    const currentRoundIndex = rounds.value.findIndex(
      (round) => round.price === activeRound.value.price
    )
    const previousRound = rounds.value[currentRoundIndex == 0 ? 0 : currentRoundIndex - 1]

    console.log('[BidButton DEBUG] lowestBid.price:', lowestBid.price)
    console.log('[BidButton DEBUG] currentRoundIndex:', currentRoundIndex)
    console.log('[BidButton DEBUG] previousRound.price:', previousRound?.price)

    const exitTime = await getExitTime()
    console.log('[BidButton DEBUG] exitTime from DB:', exitTime)

    if (exitTime) {
      console.log('[BidButton DEBUG] Setting isSupplierBidAllowed=false due to exitTime')
      isSupplierBidAllowed.value = false
    }

    const skipCheck = lowestBid.price > previousRound.price
    console.log(
      '[BidButton DEBUG] skipCheck (lowestBid > previousRound):',
      skipCheck,
      `(${lowestBid.price} > ${previousRound?.price})`
    )

    if (skipCheck) {
      console.log('[BidButton DEBUG] Setting isSupplierBidAllowed=false due to skipped round')
      isSupplierBidAllowed.value = false

      // We wait for 500ms before showing the end dialog.
      // If Auction end after 500ms the user will see Early end dialog AND normal end Dialog
      setTimeout(async () => {
        const rank = await fetchRank(sellerId.value, auction.value.id)

        if (exitTime && status.value.label === 'active' && rank !== 1) {
          leavingSupplier.value = true
        }
      }, 500)
    } else if (!exitTime) {
      console.log('[BidButton DEBUG] Setting isSupplierBidAllowed=true (no skip, no exitTime)')
      isSupplierBidAllowed.value = true
    } else {
      console.log('[BidButton DEBUG] isSupplierBidAllowed stays false (no skip but has exitTime)')
    }
  } else if (activeRound.value.index > 1) {
    console.log('[BidButton DEBUG] Setting isSupplierBidAllowed=false (no bids but round > 1)')
    isSupplierBidAllowed.value = false
  }

  console.log('[BidButton DEBUG] Final isSupplierBidAllowed:', isSupplierBidAllowed.value)
  checkedBidOnceThisRound.value = true
}

async function checkIfSupplierBidded() {
  //Check if supplier already placed a bid this round
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', route.params.auctionId)
    .eq('seller_id', sellerId.value)
    .order('price', { ascending: true })
  if (bids && bids.length > 0) {
    const lowestBid = bids[0]
    if (lowestBid.price <= activeRound.value.price) {
      alreadyPlacedBid.value = true
    }
  } else {
    alreadyPlacedBid.value = false
  }
}

// Watch for bids added by admin (or realtime) to close warning dialog and update state
watch(
  () => auction.value.bids,
  async () => {
    // Check if a bid was placed at current round price (could be from admin)
    const bidAtCurrentPrice = auction.value.bids.some(
      (bid) =>
        bid.seller_id === sellerId.value &&
        bid.type === 'bid' &&
        bid.price <= activeRound.value?.price
    )

    if (bidAtCurrentPrice && !alreadyPlacedBid.value) {
      console.log(
        '[BidButton DEBUG] Bid detected at current price (possibly from admin), closing dialogs'
      )
      alreadyPlacedBid.value = true
      displayBidWarning.value = false
      showConfirmModal.value = false
    }
  },
  { deep: true }
)

onMounted(() => {
  checkIfSupplierBidded()
})
</script>
