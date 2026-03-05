<template>
  <div>
    <v-dialog v-model="dialog" scroll-strategy="none" persistent width="800">
      <v-card class="pb-10 text-center relative">
        <v-img
          v-if="rank === 1"
          src="/images/winner-pov.svg"
          cover
          class="absolute"
          width="100% "
        />
        <v-container style="max-width: 550px">
          <v-row align="center">
            <v-col cols="12" class="mt-10 text-h4 font-weight-bold d-flex flex-column align-center">
              <img
                v-if="auction.max_rank_displayed > 0"
                height="145"
                width="200"
                :src="rankImage"
              />
              <span> You left the competition for "{{ auction.lot_name }}". </span>
            </v-col>
          </v-row>
          <AuctionsJapaneseEarlyEndDialogContent />
        </v-container>
        <v-card-actions class="d-flex justify-center">
          <v-btn-primary size="x-large" color="primary" class="px-10" @click="dialog = false">
            Back to eAuction
          </v-btn-primary>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
const model = defineModel()
const route = useRoute()

const { auction, fetchAuction } = await useRealtimeAuction({ auctionId: route.params.auctionId })
await fetchAuction()

const { user } = useUser()
const { fetchRank } = useRank()

const rank = ref(2)

const dialog = ref(false)

// Récupérer le vrai rang quand le dialog s'ouvre
watch(model, async () => {
  dialog.value = model.value
  if (model.value && user.value?.id) {
    const fetchedRank = await fetchRank(user.value.id, route.params.auctionId)
    if (fetchedRank) {
      rank.value = fetchedRank
    }
  }
})

// Image basée sur le rang réel (1-10, sinon loser)
const rankImage = computed(() => {
  if (+rank.value >= 1 && +rank.value <= 10) {
    return `/images/ranks/Rank_${rank.value}.svg`
  }
  return '/images/auction-loser.svg'
})
</script>
<style scoped>
.medal {
  width: 100px;
  height: 100px;
  margin-bottom: -50px;
  z-index: 2;
  border-radius: 15px;
  font-size: 50px;
}
.absolute {
  position: absolute;
  top: 0px;
  height: 50%;
}
.relative {
  position: relative;
  z-index: 1;
}
</style>
