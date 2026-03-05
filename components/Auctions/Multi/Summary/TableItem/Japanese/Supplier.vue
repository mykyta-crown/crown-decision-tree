<template>
  <td>
    <div class="d-flex align-center justify-start ga-4">
      <div>
        <v-tooltip
          v-if="
            validatedTermsSupplier &&
            !prebidPlaced &&
            status.label !== 'closed' &&
            auction.dutch_prebid_enabled
          "
          text="Pre-Bid required"
          content-class="bg-white text-black border"
          location="top right"
        >
          <template #activator="{ props }">
            <v-icon v-bind="props" icon="mdi-alert-outline" size="small" inline />
          </template>
        </v-tooltip>
      </div>
      <span class="text-no-wrap">
        {{ auction.lot_name }}
      </span>
    </div>
  </td>
  <td>
    <div class="text-body-1">
      <v-chip label size="small" variant="flat" :color="status.color" class="text-capitalize">
        {{ status.label }}
      </v-chip>
    </div>
  </td>
  <td>
    <div class="d-flex align-center justify-center ga-2 h-full min-time-width">
      <span class="text-no-wrap">{{ currentDuration }} / {{ auction.duration }} min</span>
      <v-progress-linear
        rounded-bar
        rounded="pill"
        height="10"
        class="progress-linear w-33"
        :model-value="remainingPercentage"
        bg-color="grey-ligthen-3"
        :color="timerColor"
      />
    </div>
  </td>
  <td>
    <v-chip
      variant="text"
      class="font-weight-bold rounded"
      :style="{ 'background-color': badgeColor }"
    >
      <span>{{ displayedRound + 1 }}</span>
    </v-chip>
  </td>
  <td>
    {{ formatNumber(rounds[displayedRound]?.price, 'currency', auction.currency) }}
  </td>
</template>
<script setup>
const props = defineProps(['auctionId'])
const route = useRoute()

const supabase = useSupabaseClient()

const { auction, fetchAuction } = useRealtimeAuction({ auctionId: props.auctionId })
await fetchAuction()

const { nbPassedRounds } = useJapaneseRounds(auction)

const { bids, fetchBids } = useRealtimeBids({ auctionId: props.auctionId, poll: true })
await fetchBids()

const { status, endInDuration, duration } = useAuctionTimer(auction)

const displayedRound = ref(0)

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

const validatedTermsSupplier = computed(() => {
  return !!auctionSellers.value.terms_accepted
})
const prebidPlaced = computed(() => {
  return !!bids.value.find((bid) => bid.type === 'prebid')
})

const lowestBid = computed(() => {
  if (bids.value.length === 0) {
    return { price: 0 }
  } else {
    const lowestBidFound = bids.value.reduce((prev, current) => {
      return prev.price < current.price ? prev : current
    }, 0)
    return Object.assign(lowestBidFound, {
      supplier: sellersProfiles.value.find((p) => p.id === lowestBidFound.seller_id)
    })
  }
})

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

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const badgeColor = computed(() => {
  if (lowestBid.value.price > 0 && colorsMap.value) {
    return colorsMap[lowestBid.value.supplier?.email]?.secondary || '#F8F8F8'
  } else {
    return '#F8F8F8'
  }
})

const maxNbRounds = computed(() => {
  return Math.ceil(auction.value.duration / auction.value.overtime_range)
})

const rounds = computed(() => {
  const maxPrice = auction.value.max_bid_decr
  return Array.from({ length: maxNbRounds.value }, (r, i) => {
    const price = maxPrice - i * auction.value.min_bid_decr
    return {
      price
    }
  })
})
watch(
  [status, nbPassedRounds],
  async () => {
    if (status.value.label === 'closed') {
      const { data } = await $fetch('/api/v1/last_bid', {
        method: 'POST',
        body: {
          auctionId: props.auctionId
        }
      })
      if (data.lowestBid) {
        displayedRound.value = rounds.value.findIndex((e) => e.price === data.lowestBid?.price)
      } else {
        displayedRound.value = nbPassedRounds.value - 1
      }
    } else {
      displayedRound.value = nbPassedRounds.value
    }
  },
  { immediate: true }
)
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
