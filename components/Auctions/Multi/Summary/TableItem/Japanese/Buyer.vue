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
      <v-chip label size="small" variant="flat" :color="status.color" class="text-capitalize">
        {{ status.label }}
      </v-chip>
    </div>
  </td>
  <td class="d-flex">
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
  <td class="text-truncate">
    {{ lowestBid.price > 0 ? lowestBid.supplier?.companies?.name || '-' : '-' }}
  </td>
  <td>
    {{ formatNumber(rounds[displayedRound]?.price, 'currency', auction.currency) }}
  </td>
  <td>
    <div class="d-flex align-center justify-center ga-4">
      <div class="text-no-wrap">
        {{
          (!auction.dutch_prebid_enabled || prebidsSubmited.length > 0) && savings > 0
            ? formatNumber(savings, 'currency', auction.currency)
            : '-'
        }}
      </div>
      <div class="text-success text-no-wrap">
        {{ percentSavings > 0 ? formatNumber(percentSavings) : 0 }}%
      </div>
    </div>
  </td>
</template>
<script setup>
import _, { sumBy } from 'lodash'
import dayjs from 'dayjs'
const props = defineProps(['auctionId'])

const supabase = useSupabaseClient()

const { auction, fetchAuction } = useRealtimeAuction({ auctionId: props.auctionId })
await fetchAuction()

const { nbPassedRounds } = useJapaneseRounds(auction)

const { status, endInDuration, duration } = useAuctionTimer(auction)

const { bids, fetchBids } = useRealtimeBids({ auctionId: props.auctionId, poll: true })
await fetchBids()

const displayedRound = ref(0)

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

const bestBid = computed(() => {
  // Create a copy before sorting to avoid mutating the original array
  const lowestBids = [...bids.value]
    .sort((a, b) => dayjs(a.created_at) - dayjs(b.created_at))
    .reduce(
      (acc, bid) => {
        if (bid.price < acc.price) {
          return bid
        }
        return acc
      },
      { price: Infinity }
    )
  return lowestBids
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

const currentRound = computed(() => {
  const foundRound = rounds.value?.find((e) => e && e.price === bestBid?.value?.price)
  if (status.value.label === 'closed' && foundRound) {
    return rounds.value.indexOf(foundRound)
  } else {
    return nbPassedRounds.value
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

const lowestBid = computed(() => {
  if (bids.value.length === 0) {
    return { price: 0, type: 'prebid' }
  } else {
    const orderedBids = _.orderBy(bids.value, ['price', 'created_at'], ['asc', 'asc'])
    return Object.assign(orderedBids[0], {
      supplier: sellersProfiles.find((p) => p.id === orderedBids[0].seller_id)
    })
  }
})
const savings = computed(() => {
  if (lowestBid.value.type === 'prebid') {
    return status.value.label === 'closed' ? auction.value.baseline - lowestBid.value.price : 0
  } else {
    return lowestBid.value.price > 0 ? auction.value.baseline - lowestBid.value.price : 0
  }
})

const percentSavings = computed(() => {
  return lowestBid.value.price > 0 ? (savings.value / auction.value.baseline) * 100 : 0
})

const suppliersId = sellersProfiles.map((p) => p.id)

const prebidsSubmited = computed(() => {
  const prebids = bids.value.filter((bid) => bid.type == 'prebid')
  return suppliersId.map((id) => prebids.find((bid) => bid.seller_id === id)).filter((bid) => bid)
})
// const allPrebidsSubmitted = computed(() => {
//   return suppliersId.every((id) => prebidsSubmited.value.includes(id))
// })

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const badgeColor = computed(() => {
  if (lowestBid.value.price > 0 && lowestBid.value.supplier?.email) {
    return colorsMap[lowestBid.value.supplier.email]?.secondary || '#F8F8F8'
  } else {
    return '#F8F8F8'
  }
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
  min-width: 200px;
}
@media screen and (max-width: 1080px) {
  .min-time-width {
    min-width: 350px;
  }
}
</style>
