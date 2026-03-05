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
      <AuctionsJapaneseCurrentStateCard
        id="auctions-japanese-current-state-card"
        v-model:display-price-per-unit="displayPricePerUnit"
        :status="status.label"
      />
    </v-col>
    <v-col cols="12" md="6">
      <BidsLogsCard
        id="bids-logs-card"
        :bids="auction?.bids"
        :auction-id="route.params.auctionId"
      />
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="6">
      <AuctionsJapaneseSupplyBidCard
        id="auctions-japanese-supply-bid-card"
        :mode="status.label === 'upcoming' && isPrebidEnabled ? 'prebid-form' : 'read'"
        @prebid-updated="prebidUpdated"
      />
      <AuctionsJapaneseBidButton
        v-if="status.label === 'active' || (status.label === 'upcoming' && isPrebidEnabled)"
        id="auctions-japanese-bid-button"
      />
    </v-col>
    <v-col cols="12" md="6">
      <v-tabs-window v-model="roundDisplay">
        <v-tabs-window-item value="#blocks">
          <AuctionsJapaneseRoundsCard
            id="auctions-japanese-rounds-card"
            v-model="roundDisplay"
            :price-per-unit="displayPricePerUnit"
          />
        </v-tabs-window-item>
        <v-tabs-window-item value="#graph">
          <ChartsJapaneseRounds
            id="charts-japanese-rounds"
            v-model="roundDisplay"
            :is-buyer="false"
            :price-per-unit="displayPricePerUnit"
          />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-col>
  </v-row>
</template>

<script setup>
const route = useRoute()

const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { status } = useAuctionTimer(auction)

const roundDisplay = ref('#graph')
const displayPricePerUnit = ref(false)
const prebid = ref(0)
provide('prebid', prebid)

const isPrebidEnabled = computed(() => {
  return auction.value?.dutch_prebid_enabled
})

function prebidUpdated(newPrebid) {
  prebid.value = newPrebid
}
</script>

<style scoped>
:deep(.v-tabs-window) {
  overflow: visible;
}
</style>
