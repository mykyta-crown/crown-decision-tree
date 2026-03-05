<template>
  <v-row>
    <v-col cols="12" md="3" class="d-flex align-stretch">
      <ProgressCircularTimer
        id="progress-circular-timer"
        :start-at="auction?.start_at"
        :end-at="auction?.end_at"
      />
    </v-col>
    <v-col md="3" class="d-flex align-stretch flex-column justify-space-between">
      <AuctionsRankCard id="auctions-rank-card" :status="status.label" />
    </v-col>
    <v-col col="6">
      <BidsLogsCard
        id="bids-logs-card"
        :bids="auction?.bids"
        :auction-id="route.params.auctionId"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col
      v-if="status.label === 'upcoming' || !previousDetailsBid || auction.type === 'sealed-bid'"
    >
      <v-slide-y-transition>
        <PreBidTableSeller
          id="pre-bid-table-seller"
          :is-training-mode="isTrainingMode"
          :is-multi-lot-training="isMultiLotTraining"
          :current-lot-has-prebid="currentLotHasPrebid"
          @prebid-submitted="onPrebidSubmitted"
        />
      </v-slide-y-transition>
    </v-col>
    <v-col v-else>
      <v-slide-y-transition>
        <BidTableSeller id="bid-table-seller" />
      </v-slide-y-transition>
    </v-col>
  </v-row>
</template>

<script setup>
const { t } = useTranslations()
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { status } = useAuctionTimer(auction)

// Inject training state from parent (works for both single-lot and multi-lot)
const isTrainingMode = inject('isTrainingMode', ref(false))
const isMultiLotTraining = inject('isMultiLotTraining', ref(false))
const currentLotHasPrebid = inject('currentLotHasPrebid', ref(true))
const onPrebidSubmitted = inject('onPrebidSubmitted', () => {})

// To replicate behavior used on Dutch auctions
const prebid = ref(0)
provide('prebid', prebid)

const previousDetailsBid = computed(() => {
  return auction.value?.bids[0]?.bid_supplies
})
</script>
