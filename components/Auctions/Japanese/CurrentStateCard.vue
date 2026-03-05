<template>
  <v-card class="flex-grow-1 d-flex flex-column max-card-height">
    <v-card-title class="pt-4 pb-0">
      <span class="text-h6 font-weight-black">
        {{ title }}
      </span>
      <PricingDisplayToggle
        v-if="props.status !== 'closed' || auction.max_rank_displayed === 0"
        :model-value="props.displayPricePerUnit"
        class="my-3 mt-2"
        @update:model-value="emit('update:displayPricePerUnit', $event)"
      />
    </v-card-title>
    <v-card-text class="pt-0">
      <v-sheet
        :color="
          props.status !== 'closed' || auction.max_rank_displayed === 0 ? 'grey-ligthen-3' : 'white'
        "
        class="fill-height d-flex align-center justify-center flex-column rounded-lg"
      >
        <img
          v-if="props.status === 'closed' && auction.max_rank_displayed > 0"
          height="175"
          width="200"
          :src="rankImgDisplayed.image"
        />
        <template v-else>
          <div class="d-flex align-center justify-center ga-1 px-4">
            <img src="/icons/price_icon.svg" width="60" />
            <div class="text-h4 font-weight-bold line-height-1">
              <span v-if="displayedAmout > 0">
                {{ formatNumber(displayedAmout) }} {{ auction?.currency }}
              </span>
              <span v-else class="text-body-1 line-height-1"> You did not place a pre-bid </span>
            </div>
          </div>
        </template>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>
<script setup>
const props = defineProps(['status', 'displayPricePerUnit'])
const emit = defineEmits(['update:displayPricePerUnit'])
const route = useRoute()

const { auction, rank, lowerBidsByComp } = await useUserAuctionBids({
  auctionId: route.params.auctionId
})
const { activeRound } = useJapaneseRounds(auction)
const title = computed(() => {
  if (props.status === 'upcoming') {
    return auction.value.dutch_prebid_enabled ? 'Your Pre-bid' : 'Starting price'
  }
  return props.status === 'closed' && auction.value.max_rank_displayed > 0
    ? 'Your rank'
    : 'Current offer'
})
const prebid = computed(() => {
  const prebids = auction.value.bids.filter((e) => e.type === 'prebid')
  return prebids.length ? Math.min(...prebids.map((bid) => bid.price)) : 0
})

const displayedAmout = computed(() => {
  if (props.status === 'upcoming' && auction.value.dutch_prebid_enabled)
    return props.displayPricePerUnit
      ? prebid.value / auction.value.supplies[0].quantity
      : prebid.value
  if (
    (props.status === 'upcoming' && !auction.value.dutch_prebid_enabled) ||
    props.status === 'active'
  ) {
    const price = activeRound.value?.price ?? 0
    return props.displayPricePerUnit ? price / auction.value.supplies[0].quantity : price
  }
  if (props.status === 'closed') {
    const price = lowerBidsByComp.value?.[0]?.price ?? 0
    return props.displayPricePerUnit ? price / auction.value.supplies[0].quantity : price
  }
  return 0
})

const rankImgDisplayed = computed(() => {
  if (rank.value >= 1) {
    if (rank.value > 10) {
      return { image: '/images/auction-loser.svg' }
    } else {
      return { image: `/images/ranks/Rank_${rank.value}.svg` }
    }
  } else {
    return { image: '/images/auction-loser.svg' }
  }
})
</script>
<style scoped>
.text-rank {
  font-size: 48px;
}
.max-card-height {
  max-height: 242px !important;
  height: 242px !important;
}
.line-height-1 {
  line-height: 0.9 !important;
}
</style>
