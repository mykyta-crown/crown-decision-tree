<template>
  <v-progress-circular
    v-model="roundTimer"
    rounded
    :color="timerColor"
    rotate="360"
    size="185"
    width="34"
    class="progress-circular"
  >
    <template #default>
      <div class="d-flex flex-column">
        <span class="text-h2 font-weight-bold text-center text-primary">
          {{ formatNumber(currentRoundTimeLeft) }}
        </span>
        <span class="text-center text-grey text-body-1"> {{ roundDuration }} sec </span>
      </div>
    </template>
  </v-progress-circular>
</template>

<script setup>
import dayjs from 'dayjs'
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { start, now } = useAuctionTimer(auction)

const fullRoundTime = computed(() => {
  return dayjs.duration(auction.value.overtime_range * 1000 * 60).seconds()
})

const roundTimer = computed(() => {
  return (currentRoundTimeLeft.value * 100) / (+fullRoundTime.value > 0 ? +fullRoundTime.value : 60)
})

const currentRoundTimeLeft = computed(() => {
  return dayjs
    .duration(
      auction.value.overtime_range * 1000 * 60 -
        ((now.value - start.value) % (auction.value.overtime_range * 1000 * 60))
    )
    .seconds()
})

const roundDuration = computed(() => {
  return auction.value.overtime_range * 60
})

const timerColor = computed(() => {
  if (currentRoundTimeLeft.value > 10) {
    return 'green'
  } else if (currentRoundTimeLeft.value > 5) {
    return 'warning'
  } else {
    return 'error'
  }
})
</script>

<style scoped>
.progress-circular :deep(.v-progress-circular__overlay) {
  stroke-linecap: round;
  stroke-width: 2.5 !important;
}
.progress-circular :deep(.v-progress-circular__underlay) {
  stroke-linecap: round;
  stroke-width: 5.2 !important;
  color: rgb(var(--v-theme-grey-ligthen-3));
}
</style>
