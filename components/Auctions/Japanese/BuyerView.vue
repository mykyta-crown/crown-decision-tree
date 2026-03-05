<template>
  <div id="dashboard-capture" :data-auction-id="auction?.id || route.params.auctionId">
    <v-row>
      <v-col cols="12" md="3" class="d-flex align-stretch">
        <ProgressCircularTimer :start-at="auction?.start_at" :end-at="auction?.end_at" />
      </v-col>
      <v-col cols="12" md="3" class="d-flex align-stretch flex-column justify-space-between">
        <v-card class="h-100 px-1">
          <v-card-title class="d-flex flex-column pt-4">
            <PricingDisplayToggle v-model="displayPricePerUnit" />
          </v-card-title>
          <v-card-text class="d-flex flex-column">
            <PricingRow
              :img="{ src: '/icons/baseline_icon.svg', width: 30 }"
              :title="t('pricing.baseline')"
            >
              <template #content>
                <span class="text-h6 font-weight-bold">{{ baseline.value }}</span>
                <span class="currency-suffix">{{ baseline.currency }}</span>
              </template>
            </PricingRow>
            <v-divider class="my-2" color="grey-lighten-2" />
            <AuctionsJapanesePricingCards :display-price-per-unit="displayPricePerUnit" />
            <v-divider class="my-2" color="grey-lighten-2" />
            <PricingRow
              :img="{ src: '/icons/price_icon.svg', width: 50 }"
              :title="t('pricing.priceSaving')"
            >
              <template #content>
                <div v-if="status.label === 'closed' && lowestBid" class="d-flex align-center ga-5">
                  <span class="d-flex align-center justify-space-between ga-1">
                    <span class="text-h6 font-weight-bold"> {{ pricesaving.value }}</span>
                    <span class="currency-suffix">{{ pricesaving.currency }}</span>
                  </span>
                  <v-spacer />
                  <span
                    v-if="status.label === 'closed' && lowestBid"
                    class="text-success d-flex align-start h-100 text-no-wrap"
                  >
                    {{ formatNumber(percentSaving) }} %
                  </span>
                </div>
                <div v-else>
                  {{ t('messages.noBidYet') }}
                </div>
              </template>
            </PricingRow>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <BidsLogsCard
          id="activity-log-capture"
          :bids="auction?.bids"
          :auction-id="route.params.auctionId"
        />
      </v-col>
    </v-row>
    <v-row>
      <v-col
        cols="12"
        :md="auction.auctions_sellers.length === 1 || roundDisplay === '#blocks' ? '6' : '5'"
      >
        <AuctionsJapaneseSupplyBidCard class="mb-4" />
        <AuctionsJapaneseRoundTimer class="mb-4" />
        <AuctionsJapaneseParticipantsCard
          :auction="auction"
          :bids="auction.bids"
          :best-bids-by-companies="lowerBidsByComp"
        />
      </v-col>
      <v-col
        cols="12"
        :md="auction.auctions_sellers.length === 1 || roundDisplay === '#blocks' ? '6' : '7'"
      >
        <v-tabs-window v-model="roundDisplay">
          <v-tabs-window-item value="#blocks">
            <AuctionsJapaneseRoundsCard
              v-model="roundDisplay"
              :is-buyer="true"
              :price-per-unit="displayPricePerUnit"
            />
          </v-tabs-window-item>
          <v-tabs-window-item value="#graph">
            <ChartsJapaneseRounds
              id="bids-chart-capture"
              v-model="roundDisplay"
              :is-buyer="true"
              :price-per-unit="displayPricePerUnit"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// import { active } from 'd3';
import _ from 'lodash'
const { t } = useTranslations()
const route = useRoute()

const roundDisplay = ref('#graph')
const displayPricePerUnit = ref(false)

const { auction, lowerBidsByComp } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { status } = useAuctionTimer(auction)
const { activeRound } = useJapaneseRounds(auction)

const lowestBid = computed(() => {
  return _.minBy(auction.value?.bids, (e) => e.price)?.price
})
const savings = computed(() => {
  const value =
    auction.value.baseline - lowestBid.value > 0 ? auction.value.baseline - lowestBid.value : 0
  return displayPricePerUnit.value ? value / auction?.value.supplies[0].quantity : value
})

const percentSaving = computed(() => {
  let value
  if (lowestBid.value) {
    value = auction.value.baseline - lowestBid.value
  } else {
    value = auction.value.baseline - activeRound?.value.price
  }
  const percent = (value * 100) / auction.value.baseline
  return percent > 0 ? percent : 0
})

const baseline = computed(() => {
  return formatNumber(
    displayPricePerUnit.value
      ? auction?.value.baseline / auction?.value.supplies[0].quantity
      : auction?.value.baseline,
    'currency',
    auction?.value.currency,
    1,
    2,
    true
  )
})

const pricesaving = computed(() => {
  if (lowestBid.value) {
    return formatNumber(
      savings?.value > 0 ? savings?.value : 0,
      'currency',
      auction?.value.currency,
      1,
      2,
      true
    )
  } else {
    return formatNumber(
      auction?.value.baseline - activeRound.value.price > 0
        ? auction?.value.baseline - activeRound.value.price
        : 0,
      'currency',
      auction?.value.currency,
      1,
      2,
      true
    )
  }
})
</script>
<style scoped>
.currency-suffix {
  font-size: 14px;
  margin-left: 5px;
}
:deep(.v-tabs-window) {
  overflow: visible;
}
</style>
