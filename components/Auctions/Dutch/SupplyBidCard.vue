<template>
  <v-card class="d-flex flex-column flex-grow-1 px-1">
    <v-card-title class="font-weight-black d-flex justify-space-between pb-2 pt-4">
      <div>
        {{ t('dutch.supplyBidCard.round') }} {{ nbPassedRounds + 1
        }}<span class="text-grey font-weight-regular"> /{{ rounds.length }}</span>
      </div>
    </v-card-title>
    <v-card-text class="pa-0 pb-3">
      <AuctionsSuppliesBidsTable
        :lines-items-bids="currentSupplies"
        :mode="props.mode"
        :can-select-rounds="props.mode === 'prebid-form' ? canSelectRounds : null"
        :show-rank="showRankColumn"
        :seller-id="user?.id"
        :highlight-input="isTrainingMode && !currentLotHasPrebid"
        @prebid-updated="emitUpdatePrebid"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: 'read'
  }
})
const emit = defineEmits(['prebid-updated'])
const { t } = useTranslations()
const route = useRoute()
const { user } = useUser()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

// Inject training state from parent (works for both single-lot and multi-lot)
const isTrainingMode = inject('isTrainingMode', ref(false))
const currentLotHasPrebid = inject('currentLotHasPrebid', ref(true))

const { nbPassedRounds, rounds, currentSupplies } = useDutchRounds(auction)

// Show rank column only if rank per line item is enabled AND max_rank_displayed > 0
const showRankColumn = computed(() => {
  return auction.value?.rank_per_line_item && auction.value?.max_rank_displayed > 0
})

const { ceilingPrice } = useCeilingPrice(route.params.auctionId)
const { lastPrebidFromUser } = await useBids({ auctionId: route.params.auctionId })

const canSelectRounds = computed(() => {
  if (!lastPrebidFromUser.value?.price) {
    return rounds.value.filter((e) => e && e.price <= ceilingPrice.value).reverse()
  } else {
    return rounds.value
      .filter(
        (e) => e && e.price <= lastPrebidFromUser.value?.price && e.price <= ceilingPrice.value
      )
      .reverse()
  }
})

function emitUpdatePrebid(suppliesPrebids) {
  emit('prebid-updated', suppliesPrebids)
}
</script>
