<template>
  <td>
    <div class="d-flex align-center justify-start ga-4">
      <div>
        <v-tooltip
          v-if="
            isDataLoaded &&
            validatedTermsSupplier &&
            !prebidPlaced &&
            status?.label !== 'closed' &&
            auction?.type !== 'sealed-bid'
          "
          :key="isDataLoaded"
          text="Pre-bid required"
          content-class="bg-white text-black border"
          location="top right"
        >
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-alert-outline" size="small" inline />
          </template>
        </v-tooltip>
      </div>
      <span class="text-no-wrap">
        {{ auction?.lot_name || '' }}
      </span>
    </div>
  </td>
  <td>
    <div class="text-body-1">
      <v-chip
        label
        size="small"
        variant="flat"
        :color="status?.color || 'grey'"
        class="text-capitalize"
      >
        {{ status?.label ? t(`status.${status.label}`) : '' }}
      </v-chip>
    </div>
  </td>
  <td>
    <v-row class="h-full min-time-width">
      <v-col cols="6" class="text-right d-flex justify-end align-center">
        <span v-if="status?.label !== 'closed'" class="text-no-wrap"
          >{{ currentDuration }} / {{ auction?.duration || 0 }} min</span
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
    <v-chip
      label
      size="small"
      variant="flat"
      :color="hideRank ? '#F8F8F8' : badgeColor"
      class="text-capitalize font-weight-bold"
    >
      {{ hideRank ? '-' : rank }}
    </v-chip>
  </td>
  <td v-if="lowestBid.totalBidPriceWithHandicaps > 0" class="text-no-wrap">
    {{ formatNumber(lowestBid.totalBidPriceWithHandicaps, 'currency', auction?.currency || 'EUR') }}
  </td>
  <td v-else>-</td>
</template>
<script setup>
const props = defineProps(['auctionId'])

const { t } = useTranslations()
const route = useRoute()
const supabase = useSupabaseClient()
const { user } = useUser()

// Use lighter useRealtimeAuction instead of useUserAuctionBids for faster loading
const { auction, fetchAuction } = useRealtimeAuction({ auctionId: props.auctionId })
await fetchAuction()

// Lazy-load rank only when auction is active or closed (not during upcoming)
const { fetchRank } = useRank()
const rank = ref(-1) // -1 = not loaded yet, displays as "-"

const { bids, fetchBids, dataVersion } = useRealtimeBids({ auctionId: props.auctionId, poll: true })
await fetchBids()

// Pass bids to useTotalValue to avoid duplicate subscriptions
const { bestBidsTotalValue } = await useTotalValue({ auctionId: props.auctionId, bids })

const { status, endInDuration, duration } = useAuctionTimer(auction)

// Fetch rank when auction becomes active/closed OR when bids change (dataVersion tracks all events)
watch(
  [() => status.value?.label, dataVersion],
  async ([newStatus]) => {
    if ((newStatus === 'active' || newStatus === 'closed') && user.value?.id) {
      const newRank = await fetchRank(user.value.id, props.auctionId)
      rank.value = newRank
    }
  },
  { immediate: true }
)

const auctionSellers = ref([])
const sellersProfiles = ref([])

watch(
  route,
  async () => {
    const { data: updatedSeller } = await supabase
      .from('auctions_sellers')
      .select('*')
      .eq('auction_id', props.auctionId)
      .single()
    auctionSellers.value = updatedSeller

    const { data: updatedProfiles } = await supabase
      .from('profiles')
      .select('*, companies(*)')
      .in('email', updatedSeller.seller_email)
    sellersProfiles.value = updatedProfiles
  },
  { immediate: true }
)

const currentDuration = computed(() => {
  if (status.value?.label === 'active') {
    return endInDuration.value.format('mm:ss')
  } else if (status.value?.label === 'closed') {
    return duration.value.format('mm:ss')
  } else {
    return '00:00'
  }
})

const remainingPercentage = computed(() => {
  if (status.value?.label === 'active') {
    return (endInDuration.value / duration.value) * 100
  } else if (status.value?.label === 'closed') {
    return 0
  } else {
    return 100
  }
})

const isOvertime = computed(() => {
  return endInDuration.value / (1000 * 60) < (auction.value?.overtime_range || 0)
})
const is1MinRemaining = computed(() => {
  return endInDuration.value / (1000 * 60) < 1
})
const timerColor = computed(() => {
  if (status.value?.label === 'closed') {
    return 'grey'
  }
  if (status.value?.label == 'upcoming') {
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

const validatedTermsSupplier = computed(() => {
  if (Array.isArray(auctionSellers.value)) {
    return false
  }
  return !!auctionSellers.value?.terms_accepted
})
const prebidPlaced = computed(() => {
  if (!bids.value || !Array.isArray(bids.value)) {
    return false
  }
  return !!bids.value.find((bid) => bid.type === 'prebid')
})

const isDataLoaded = computed(() => {
  return !!(auction.value && status.value && bids.value && !Array.isArray(auctionSellers.value))
})

const lowestBid = computed(() => {
  return bestBidsTotalValue.value[0] || { price: 0 }
})

const { getColors } = useColorSchema()
const colorsMap = await getColors()

// Hide rank for sealed-bid until auction is closed
const hideRank = computed(() => {
  if (auction.value?.type === 'sealed-bid' && status.value?.label !== 'closed') return true
  return auction.value?.max_rank_displayed === 0 || rank.value <= 0
})

const badgeColor = computed(() => {
  if (lowestBid.value.price > 0 && colorsMap.value) {
    return colorsMap.value[lowestBid.value.supplier?.email].secondary || '#F8F8F8'
  } else {
    return '#F8F8F8'
  }
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
