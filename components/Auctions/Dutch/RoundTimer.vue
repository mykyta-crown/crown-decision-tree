<template>
  <v-card class="dutch-round-timer d-flex flex-column flex-grow-1 px-1">
    <v-card-title class="font-weight-black d-flex justify-space-between align-center pb-0 pt-4">
      {{ t('dutch.roundTimer.nextPriceIn') }}
      <div class="font-weight-regular round-text">
        <span class="text-grey">{{ t('dutch.roundTimer.roundTime') }}</span> {{ roundDuration }}
        <span>{{ t('dutch.roundTimer.sec') }}</span>
      </div>
    </v-card-title>
    <v-card-text class="mt-2 mb-1">
      <v-row>
        <v-col>
          <v-progress-linear
            v-model="roundTimer"
            rounded
            :color="timerColor"
            height="18"
            bg-color="grey-ligthen-3"
            class="d-flex align-center"
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
const { t } = useTranslations()
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { status, start, now } = useAuctionTimer(auction)

const roundTimer = computed(() => {
  if (status.value.label === 'closed') {
    return 0
  } else if (status.value.label === 'upcoming') {
    return 98
  } else {
    const roundTime = (now.value - start.value) % (auction.value.overtime_range * 1000 * 60)
    const timerValue = (roundTime / (auction.value.overtime_range * 1000 * 60)) * 100
    const regressingTimerValue = 100 - timerValue
    if (regressingTimerValue < 5) {
      return 0
    } else if (regressingTimerValue > 95) {
      return 98
    } else {
      return regressingTimerValue
    }
  }
})

const roundDuration = computed(() => {
  return auction.value.overtime_range * 60
})
const timerColor = computed(() => {
  // console.log('status', status.value.label)
  if (status.value.label === 'upcoming') {
    return 'green-light'
  } else if (status.value.label === 'closed') {
    return 'grey-ligthen-3'
  } else {
    return 'green'
  }
})
</script>

<style>
.dutch-round-timer .v-progress-linear__determinate {
  background-color: transparent;
  border-radius: 9999px;
  height: 10px;
  margin: 0px 4px;
}
</style>

<style scoped>
.round-text {
  font-size: 14px;
}

.round-price {
  font-size: 40px;
}
</style>
