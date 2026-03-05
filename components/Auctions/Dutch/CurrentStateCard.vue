<template>
  <v-card class="flex-grow-1 d-flex flex-column max-card-height">
    <v-card-title class="font-weight-black pt-4 pb-0">
      {{ title }}
      <PricingDisplayToggle
        v-if="props.status !== 'closed'"
        :model-value="props.displayPricePerUnit"
        class="my-3 mt-2"
        @update:model-value="emit('update:displayPricePerUnit', $event)"
      />
    </v-card-title>
    <v-card-text class="pt-0">
      <v-sheet
        :color="props.status !== 'closed' ? 'grey-ligthen-3' : 'white'"
        class="fill-height d-flex align-center justify-center rounded-lg ga-3"
      >
        <!-- Upcoming/Active state: show price -->
        <template v-if="props.status !== 'closed'">
          <img src="/icons/price_icon.svg" width="44" />
          <div class="text-h4 font-weight-bold">
            <span v-if="amount > 0"> {{ formatNumber(amount) }} {{ auction?.currency }} </span>
            <span v-else class="text-body-1"
              >{{ t('dutch.currentStateCard.noPrebidMessage') }}
            </span>
          </div>
        </template>
        <!-- Closed state: show rank or hidden rank illustration -->
        <template v-else>
          <div v-if="isRankHidden" class="d-flex flex-column align-center justify-center">
            <img src="/images/ranks/No_rank_dutch.svg" height="150" class="mb-2" />
            <div class="text-grey text-center text-body-1">
              {{ t('rankCard.hiddenMessage') }}
            </div>
          </div>
          <img v-else-if="rank === 1" height="170" width="170" src="/images/ranks/Rank_1.svg" />
          <img v-else height="175" width="200" src="/images/ranks/Rank_2.svg" />
        </template>
      </v-sheet>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps(['status', 'displayPricePerUnit'])
const emit = defineEmits(['update:displayPricePerUnit'])

// Use translations
const { t } = useTranslations()

const route = useRoute()
const { user } = useUser()

const { auction, rank } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { activeRound } = useDutchRounds(auction)

// Check if the CURRENT user placed any bid (prebid or live bid)
const userHasBid = computed(() => {
  const bids = auction.value?.bids || []
  const currentUserId = user.value?.id
  if (!currentUserId) return false
  return bids.some(
    (bid) => bid.seller_id === currentUserId && (bid.type === 'bid' || bid.type === 'prebid')
  )
})

// Check if rank should be hidden based on max_rank_displayed setting
// OR if the user didn't place any bid
// OR if the rank exceeds max_rank_displayed (when max_rank_displayed > 0)
const isRankHidden = computed(() => {
  const maxRank = auction.value?.max_rank_displayed
  // Hidden when: max_rank is 0 (hide all), or rank is 0 (already hidden by SQL),
  // or user didn't bid, or rank exceeds the max displayable rank
  if (maxRank === 0 || rank.value === 0 || !userHasBid.value) return true
  if (maxRank > 0 && rank.value > maxRank) return true
  return false
})

const title = computed(() => {
  if (props.status === 'upcoming' && auction.value.dutch_prebid_enabled)
    return t('dutch.currentStateCard.yourPrebid')
  if (props.status === 'upcoming' && !auction.value.dutch_prebid_enabled)
    return t('dutch.currentStateCard.startingPrice')
  if (props.status === 'closed') return t('dutch.currentStateCard.yourRank')
  if (props.status === 'active') return t('dutch.currentStateCard.currentOffer')

  return ''
})

const prebid = computed(() => {
  const prebids = auction.value.bids.filter((e) => e.type === 'prebid')
  const lowestPriceBid =
    prebids.length > 0
      ? prebids.reduce((lowest, current) => {
          return current.price < lowest.price ? current : lowest
        }, prebids[0])
      : null
  return lowestPriceBid?.price ?? 0
})

const amount = computed(() => {
  if (props.status === 'upcoming' && auction.value.dutch_prebid_enabled)
    return props.displayPricePerUnit
      ? prebid.value / auction.value.supplies[0].quantity
      : prebid.value
  if (props.status === 'upcoming' && !auction.value.dutch_prebid_enabled)
    return props.displayPricePerUnit
      ? activeRound.value.price / auction.value.supplies[0].quantity
      : activeRound.value.price

  if (props.status === 'active')
    return props.displayPricePerUnit
      ? activeRound.value.price / auction.value.supplies[0].quantity
      : activeRound.value.price

  return 0
})
</script>

<style scoped>
.max-card-height {
  max-height: 242px !important;
  height: 242px !important;
}
</style>
