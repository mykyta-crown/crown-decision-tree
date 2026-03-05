<template>
  <div class="text-center">
    <v-dialog v-model="model" max-width="700">
      <v-card class="text-center">
        <v-card-title>
          <div class="d-flex w-full justify-space-between align-center">
            <span class="text-h4 text-grey-lighten-1"> WARNING </span>
            <v-btn
              color="grey-lighten-1"
              variant="text"
              icon="mdi-close"
              @click="emit('update:modelValue', false)"
            />
          </div>
          <v-divider class="text-grey-lighten-3" />
        </v-card-title>
        <v-card-text class="mx-2 my-4">
          <div>
            <div class="mb-6">
              <span class="text-h4 font-weight-bold"
                >You will automatically exit the eAuction in
              </span>
              <br />
              <span class="mt-1 text-h3 text-error">{{ timer }} sec</span>
              <br />
              <div class="text-primary font-weight-regular text-h6">
                Accept the price to stay in the eAuction.
              </div>
            </div>
            <AuctionsSuppliesBidsTable :lines-items-bids="currentSupplies" />
          </div>
        </v-card-text>
        <v-card-actions class="justify-center mb-16 pb-8 ga-8">
          <v-btn-secondary class="px-16 w-33" size="x-large" @click="leaveAuction">
            <!-- #TODO BODIFIER CE EMIT POUR Quitter l'auction -->
            Leave eAuction
          </v-btn-secondary>
          <v-btn-primary class="rounded-lg px-16 w-33" size="x-large" @click="confirmBid">
            Accept offer
          </v-btn-primary>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const props = defineProps(['modelValue', 'bidPrice', 'timer'])

const emit = defineEmits(['update:modelValue', 'confirmed', 'redirect'])
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { currentSupplies } = useJapaneseRounds(auction)

const model = defineModel()

const bidPrice = toRef(() => props.bidPrice)

const totalBid = computed(() => {
  return bidPrice.value
})

// Auto-redirect removed - let the user decide or let server-side elimination handle it
// The warning dialog will close naturally when the round changes
// watch(
//   () => props.timer,
//   (val) => {
//     if (val <= 0) {
//       emit('redirect')
//     }
//   }
// )

function leaveAuction() {
  emit('redirect')
  emit('update:modelValue', false)
}

function confirmBid() {
  console.log('place a bid of:', totalBid.value)
  emit('update:modelValue', false)
  emit('confirmed', totalBid.value)
}
</script>

<style scoped>
.title {
  line-height: 3rem;
}
.head-text {
  font-size: 1.4rem;
}
</style>
