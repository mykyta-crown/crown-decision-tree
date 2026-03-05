<template>
  <div id="dashboard-capture" :data-auction-id="auction?.id || auctionId">
    <v-row>
      <v-col cols="12" md="6" xl="3" class="d-flex align-stretch">
        <ProgressCircularTimer />
      </v-col>
      <v-col cols="12" md="6" xl="3" class="d-flex align-stretch flex-column justify-space-between">
        <v-card class="h-100 px-1">
          <v-card-text class="d-flex flex-column justify-space-between">
            <PricingRow
              :img="{ src: '/icons/baseline_icon.svg', width: 30 }"
              :title="t('pricing.baseline')"
              class="py-1"
            >
              <template #content>
                <span class="text-h6 font-weight-bold">{{ baseline.value }}</span>
                <span class="currency-suffix">{{ baseline.currency }}</span>
              </template>
            </PricingRow>
            <v-divider class="my-2" color="grey-lighten-2" />
            <PricingRow
              :img="{ src: '/icons/bid_icon.svg', width: 40 }"
              :title="t('pricing.lowestCurrentBid')"
              class="py-2"
            >
              <template #content>
                <span v-if="lowestBid">
                  <span class="text-h6 font-weight-bold">{{ lowestCurrentBid.value }}</span>
                  <span class="currency-suffix">{{ lowestCurrentBid.currency }}</span>
                </span>
                <span v-else>{{ t('messages.noBidYet') }}</span>
              </template>
            </PricingRow>
            <v-divider class="my-2" color="grey-lighten-2" />
            <PricingRow
              :img="{ src: '/icons/price_icon.svg', width: 50 }"
              class="pt-3"
              :title="t('pricing.priceSaving')"
            >
              <template #content>
                <div class="d-flex align-center ga-5">
                  <span v-if="lowestBid">
                    <span class="text-h6 font-weight-bold"> {{ pricesaving.value }}</span>
                    <span class="currency-suffix">{{ pricesaving.currency }}</span>
                  </span>
                  <span v-else>{{ t('messages.noBidYet') }}</span>
                  <v-spacer />
                  <span class="text-success d-flex align-start h-100 text-no-wrap">
                    {{ formatNumber(percentSaving) }} %
                  </span>
                </div>
              </template>
            </PricingRow>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" xl="6">
        <BidsLogsCard id="activity-log-capture" :auction-id="route.params.auctionId" />
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="5.5" xl="5">
        <LeaderboardCard />
      </v-col>
      <v-col cols="6.5" xl="7">
        <BidsLinesChart
          id="bids-chart-capture"
          :start-date="
            auction.type !== 'sealed-bid' ? realTimeAuction.start_at : auction.created_at
          "
          :end-date="realTimeAuction.end_at"
          :bids-total-value="bidsTotalValue"
          :suppliers="sellers"
          :time-unit="auction.type === 'sealed-bid' ? 'day' : 'minute'"
          :aggregate-prebids="auction.type !== 'sealed-bid'"
        />
      </v-col>
    </v-row>
    <v-row align="start">
      <v-col>
        <BidTableBuyer id="bid-table-capture" />
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
// Use translations
const { t } = useTranslations()

const route = useRoute()
const auctionId = route.params.auctionId

const supabase = useSupabaseClient()

const { auction: realTimeAuction } = useRealtimeAuction({ auctionId })

const { data: auction } = await supabase
  .from('auctions')
  .select('*, auctions_sellers(*)')
  .eq('id', auctionId)
  .single()
const { data: sellers } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in(
    'email',
    auction.auctions_sellers.map((s) => s.seller_email)
  )

provide('auction', auction)
provide('sellers', sellers)

const { bidsTotalValue, bestBidsTotalValue } = await useTotalValue({ auctionId })

const lowestBid = computed(() => {
  return bestBidsTotalValue.value[0]?.totalBidPriceWithHandicaps
})

const savings = computed(() => {
  return auction.baseline - lowestBid.value > 0 ? auction.baseline - lowestBid.value : 0
})

const percentSaving = computed(() => {
  const percent = ((auction.baseline - lowestBid.value) * 100) / auction.baseline
  return percent > 0 ? percent : 0
})

const baseline = computed(() => {
  return formatNumber(auction.baseline, 'currency', auction.currency, 1, 2, true)
})

const lowestCurrentBid = computed(() => {
  return formatNumber(lowestBid?.value, 'currency', auction.currency, 1, 2, true)
})

const pricesaving = computed(() => {
  return formatNumber(savings?.value, 'currency', auction.currency, 1, 2, true)
})
</script>
<style scoped>
.currency-suffix {
  font-size: 14px;
  margin-left: 5px;
}
</style>
