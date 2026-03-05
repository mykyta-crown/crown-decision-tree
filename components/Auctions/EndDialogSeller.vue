<template>
  <!-- Debug button to force open dialog (only in test mode) -->
  <v-btn
    v-if="auction?.test && !dialog"
    color="primary"
    position="fixed"
    location="bottom right"
    icon="mdi-bug"
    size="large"
    class="ma-4"
    style="z-index: 9999"
    @click="openDialog"
  >
    <v-icon>mdi-bug</v-icon>
    <v-tooltip activator="parent" location="left"> Force open EndDialog (test mode) </v-tooltip>
  </v-btn>

  <v-dialog v-model="dialog" scroll-strategy="none" persistent width="800">
    <v-card class="pb-10 text-center relative">
      <v-img
        v-if="rank === 1 && shouldShowRank && totalBidPrice"
        src="/images/winner-pov.svg"
        cover
        class="absolute"
        width="100% "
      />
      <v-container style="max-width: 550px">
        <v-row align="center">
          <v-col
            cols="12"
            :class="[
              'text-h4 font-weight-bold d-flex flex-column align-center',
              { 'mt-10': rank === 1 && shouldShowRank && totalBidPrice }
            ]"
          >
            <!-- Winner with visible rank (must have placed a bid) -->
            <img v-if="shouldShowRank && totalBidPrice" height="145" width="200" :src="rankImg" />
            <!-- Dutch: show No_rank_dutch -->
            <img
              v-else-if="auction.type === 'dutch'"
              src="/images/ranks/No_rank_dutch.svg"
              height="170"
            />
            <!-- User placed a bid but rank is hidden -->
            <AuctionsNoRankIllustration v-else-if="totalBidPrice" class="mb-6" />
            <!-- User didn't place a bid - show loser illustration -->
            <img v-else src="/images/auction-loser.svg" height="145" width="200" class="mb-6" />
            <span>
              {{ t('endDialogSeller.auctionEnded') }}
            </span>
          </v-col>
        </v-row>

        <!-- Rank and price message (for winners with visible rank) -->
        <v-row v-if="shouldShowRank && totalBidPrice" align="center" class="mt-4">
          <v-col cols="12">
            <div
              class="text-body-1"
              v-html="
                t('endDialogSeller.finishedRank', {
                  rank: rank,
                  price: formatNumber(totalBidPrice, 'currency', auction.currency)
                })
              "
            />
          </v-col>
        </v-row>

        <!-- Message when rank is hidden - show bid price only (non-Dutch) -->
        <v-row
          v-else-if="auction.type !== 'dutch' && rank && totalBidPrice"
          align="center"
          class="mt-4"
        >
          <v-col cols="12">
            <div
              class="text-body-1"
              v-html="
                t('endDialogSeller.finishedBidding', {
                  price: formatNumber(totalBidPrice, 'currency', auction.currency)
                })
              "
            />
          </v-col>
        </v-row>

        <!-- Dutch loser message - show ending price (only if someone bid) -->
        <v-row
          v-else-if="auction.type === 'dutch' && dutchEndingPrice && hasAnyBid"
          align="center"
          class="mt-4"
        >
          <v-col cols="12">
            <div
              class="text-body-1"
              v-html="
                t('dutchEndDialog.endedAtPrice', {
                  price: formatNumber(dutchEndingPrice, 'currency', auction.currency),
                  currency: auction.currency
                })
              "
            />
          </v-col>
        </v-row>

        <!-- Line-item ranking table for seller (simple view, not expansion panels) -->
        <AuctionsEndDialogContentSeller />

        <!-- Dutch auction: show supplies table -->
        <v-row
          v-if="auction.type === 'dutch' && dutchCurrentSupplies?.length"
          align="center"
          class="mt-4"
        >
          <v-col cols="12">
            <AuctionsSuppliesBidsTable :lines-items-bids="dutchCurrentSupplies" />
          </v-col>
        </v-row>

        <!-- Contact message - shown for all -->
        <v-row align="center" class="mt-4">
          <v-col cols="12">
            <div class="text-grey text-body-1">
              {{ t('endDialogSeller.contactMessage') }}
            </div>
          </v-col>
        </v-row>
      </v-container>
      <v-card-actions class="d-flex justify-center">
        <v-btn-primary
          v-if="!nextAuction"
          size="x-large"
          color="primary"
          class="px-10"
          @click="dialog = false"
        >
          {{ t('endDialogSeller.backToAuction') }}
        </v-btn-primary>
        <v-btn-primary
          v-else
          size="x-large"
          color="primary"
          class="px-10"
          :to="`/auctions/${auction.auctions_group_settings_id}/lots/${nextAuction.id}/supplier`"
        >
          {{ t('endDialogSeller.nextLot') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const { t } = useTranslations()
const route = useRoute()
const { user } = useUser()
const { getNextAuction } = useNextAuction()

const { auction, fetchAuction } = await useRealtimeAuction({ auctionId: route.params.auctionId })
await fetchAuction()

const { status } = await useAuctionTimer(auction)
const { fetchRank } = useRank()
const winner = ref(null)
const rank = ref(null)

const nextAuction = ref(null)
const dialog = ref(false)

// Check if there's an external trigger to open dialog (from parent via provide/inject)
const externalDialogTrigger = inject('openEndDialogTrigger', null)
if (externalDialogTrigger) {
  watch(externalDialogTrigger, (shouldOpen) => {
    if (shouldOpen) {
      openDialog()
      externalDialogTrigger.value = false // Reset trigger
    }
  })
}

// Get user's total bid price with handicaps
const { bestBidsTotalValue } = await useTotalValue({ auctionId: route.params.auctionId })
const totalBidPrice = computed(() => {
  const userBid = bestBidsTotalValue.value?.find((bid) => bid.seller.id === user.value.id)
  return userBid?.totalBidPriceWithHandicaps || 0
})

// Check if any seller placed a bid in the auction
const hasAnyBid = computed(() => {
  return bestBidsTotalValue.value?.some((bid) => bid.totalBidPriceWithHandicaps > 0) || false
})

// Check if user's rank should be displayed based on max_rank_displayed setting
const shouldShowRank = computed(() => {
  const maxRank = auction.value?.max_rank_displayed
  // If max_rank_displayed is 0 or not set, don't show any rank
  if (!maxRank || maxRank === 0) return false
  // Show rank only if user's rank is within the allowed display range
  return rank.value && rank.value <= maxRank
})

// Dutch auction specific logic - get ending price and supplies
const { activeRound, currentSupplies: dutchCurrentSupplies } =
  auction.value?.type === 'dutch'
    ? useDutchRounds(auction)
    : { activeRound: ref(null), currentSupplies: ref([]) }

const dutchEndingPrice = computed(() => {
  return activeRound?.value?.price || 0
})

const rankImg = computed(() => {
  // Utiliser les images de rang pour tous les types d'enchères (1-10, sinon loser)
  if (+rank.value >= 1 && +rank.value <= 10) {
    return `/images/ranks/Rank_${rank.value}.svg`
  }
  return '/images/auction-loser.svg'
})

// Function to open the dialog (can be called manually or by watch)
const openDialog = async () => {
  // Update the auction to validate the status before showing the popup.
  await fetchAuction()

  // Validate current user rank
  rank.value = await fetchRank(user.value.id, auction.value.id)
  // Find next auction using current status
  nextAuction.value = await getNextAuction(auction)
  // Open modal
  dialog.value = true
}

// No need for defineExpose - using provide/inject pattern instead

watch(status, async () => {
  if (status.value.label === 'closed') {
    // check status again to be sure it's closed
    const currentStatus = getAuctionStatus(
      auction.value?.start_at,
      auction.value?.end_at,
      auction.value?.type
    )

    if (currentStatus.label === 'closed') {
      await openDialog()
    }
  }
})
</script>
<style scoped>
.medal {
  width: 100px;
  height: 100px;
  margin-bottom: -50px;
  z-index: 2;
  border-radius: 15px;
  font-size: 50px;
}
.absolute {
  position: absolute;
  top: 0px;
  height: 50%;
}
.relative {
  position: relative;
  z-index: 1;
}
</style>
