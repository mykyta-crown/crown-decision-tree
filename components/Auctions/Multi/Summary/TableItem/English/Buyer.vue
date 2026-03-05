<template>
  <td>
    <div v-if="status.label === 'upcoming'">
      <v-tooltip
        text="Accepted terms"
        content-class="bg-white text-black border"
        location="top right"
      >
        <template #activator="{ props }">
          <v-icon
            v-if="acceptedTerms === suppliersId.length"
            v-bind="props"
            icon="mdi-checkbox-multiple-outline"
            size="small"
            inline
          />
          <div v-else v-bind="props" class="text-no-wrap">
            {{ acceptedTerms }} / {{ suppliersId.length }}
          </div>
        </template>
      </v-tooltip>
    </div>
  </td>
  <td class="d-flex align-center justify-start">
    <v-tooltip
      :text="auction.lot_name"
      content-class="bg-white text-black border"
      location="top right"
    >
      <template #activator="{ props }">
        <span class="text-truncate" v-bind="props">
          {{ auction.lot_name }}
        </span>
      </template>
    </v-tooltip>
  </td>
  <td>
    <div class="text-body-1">
      <v-chip
        label
        size="small"
        variant="flat"
        :color="status.color"
        class="text-capitalize chip-status"
      >
        {{ t(`status.${status.label}`) }}
      </v-chip>
    </div>
  </td>
  <td>
    <v-row class="h-full min-time-width">
      <v-col cols="6" class="text-right d-flex justify-end align-center">
        <span v-if="status.label !== 'closed'" class="text-no-wrap"
          >{{ currentDuration }} / {{ auction.duration }} min</span
        >
        <span v-else class="text-no-wrap">{{ currentDuration }} / {{ currentDuration }}</span>
      </v-col>
      <v-col cols="6" class="d-flex align-center">
        <v-progress-linear
          rounded-bar
          rounded="pill"
          height="10"
          class="progress-linear"
          :model-value="remainingPercentage"
          bg-color="grey-ligthen-3"
          :color="timerColor"
        />
      </v-col>
    </v-row>
  </td>
  <td>
    {{ lowestBid.totalBidPriceWithHandicaps > 0 ? lowestBid.seller?.companies?.name || '-' : '-' }}
  </td>
  <td v-if="lowestBid.totalBidPriceWithHandicaps > 0">
    {{ formatNumber(lowestBid.totalBidPriceWithHandicaps, 'currency', auction.currency) }}
  </td>
  <td v-else>-</td>
  <td>
    <div class="d-flex align-center justify-center ga-4">
      <div>
        {{
          prebidsSubmited.length > 0 && savings > 0
            ? formatNumber(savings, 'currency', auction.currency)
            : '-'
        }}
      </div>
      <div class="text-success">{{ percentSavings > 0 ? formatNumber(percentSavings) : 0 }}%</div>
    </div>
  </td>
</template>
<script setup>
import { sumBy } from 'lodash'

const props = defineProps(['auctionId'])

const supabase = useSupabaseClient()
const { t } = useTranslations()

const { auction, fetchAuction } = useRealtimeAuction({ auctionId: props.auctionId })
await fetchAuction()

const { bids, fetchBids } = useRealtimeBids({ auctionId: props.auctionId, poll: true })
await fetchBids()

// Pass bids to useTotalValue to avoid duplicate subscriptions
const { bestBidsTotalValue } = await useTotalValue({ auctionId: props.auctionId, bids })

const { data: auctionSellers } = await supabase
  .from('auctions_sellers')
  .select('*')
  .eq('auction_id', props.auctionId)

const acceptedTerms = sumBy(auctionSellers, (s) => +s.terms_accepted) || 0

const { data: sellersProfiles } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in(
    'email',
    auctionSellers.map((s) => s.seller_email)
  )

const suppliersId = sellersProfiles.map((p) => p.id)

const { status, endInDuration, duration } = useAuctionTimer(auction)

const currentDuration = computed(() => {
  if (status.value.label === 'active') {
    return endInDuration.value.format('mm:ss')
  } else if (status.value.label === 'closed') {
    return duration.value.format('mm:ss')
  } else {
    return '00:00'
  }
})

const remainingPercentage = computed(() => {
  if (status.value.label === 'active') {
    return (endInDuration.value / duration.value) * 100
  } else if (status.value.label === 'closed') {
    return 0
  } else {
    return 100
  }
})

const isOvertime = computed(() => {
  return endInDuration.value / (1000 * 60) < auction.value.overtime_range
})

const is1MinRemaining = computed(() => {
  return endInDuration.value / (1000 * 60) < 1
})

const timerColor = computed(() => {
  if (status.value.label === 'closed') {
    return 'grey'
  }
  if (status.value.label == 'upcoming') {
    return 'green-pastel'
  }
  if (is1MinRemaining.value) {
    return 'error'
  } else if (isOvertime.value) {
    return 'warning'
  } else {
    return 'green'
  }
})

const lowestBid = computed(() => {
  return bestBidsTotalValue.value[0] || { price: 0 }
})

const savings = computed(() => {
  return lowestBid.value.totalBidPriceWithHandicaps > 0
    ? auction.value.baseline - lowestBid.value.totalBidPriceWithHandicaps
    : 0
})

const percentSavings = computed(() => {
  return lowestBid.value.totalBidPriceWithHandicaps > 0
    ? (savings.value / auction.value.baseline) * 100
    : 0
})

const prebidsSubmited = computed(() => {
  const prebids = bids.value.filter((bid) => bid.type == 'prebid')
  return suppliersId.map((id) => prebids.find((bid) => bid.seller_id === id)).filter((bid) => bid)
})
</script>
<style scoped>
.progress-linear :deep(.v-progress-linear__determinate) {
  border: 2px solid rgb(var(--v-theme-grey-ligthen-3));
}
.progress-linear {
  max-width: 100px;
}
.min-time-width {
  min-width: 250px;
}
@media screen and (max-width: 1080px) {
  .min-time-width {
    min-width: 350px;
  }
}
</style>
