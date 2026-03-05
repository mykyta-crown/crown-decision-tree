<template>
  <v-card class="d-flex flex-column flex-grow-1 px-1 border py-1">
    <v-card-title class="d-flex justify-space-between align-center pb-0 pt-4">
      <div
        v-if="
          status.label === 'active' ||
          (auction.type === 'sealed-bid' &&
            status.label !== 'closed' &&
            status.label !== 'upcoming')
        "
        class="text-h6 font-weight-black"
      >
        {{
          auction.type === 'reverse' || auction.type === 'sealed-bid' || isBuyer
            ? t('timer.finishIn')
            : t('timer.nextRoundIn')
        }}
      </div>
      <div v-if="status.label === 'upcoming'" class="text-h6 font-weight-black">
        {{ t('timer.startIn') }}
      </div>
      <div v-if="status.label === 'closed'" class="text-h6 font-weight-black">
        {{ t('timer.timer') }}
      </div>
      <div class="text-body-1">
        <v-chip
          label
          size="small"
          variant="flat"
          :color="status.color"
          class="text-capitalize custom-padding"
        >
          {{ t(`status.${status.label}`) }}
        </v-chip>
      </div>
    </v-card-title>
    <v-card-text class="d-flex align-start justify-center ma-0 pa-0">
      <AuctionsDutchSellerRoundTimer
        v-if="
          (auction.type === 'dutch' || auction.type === 'japanese') &&
          status.label === 'active' &&
          !isBuyer
        "
      />
      <v-progress-circular
        v-else
        :model-value="remainingPercentage"
        :color="timerColor"
        rotate="360"
        size="185"
        width="34"
        class="progress-circular"
      >
        <template #default>
          <div class="text-center">
            <div
              v-if="
                (status.label === 'active' || status.label === 'closed') &&
                auction.type === 'reverse'
              "
              class="text-body-2"
              :class="status.label === 'active' ? 'text-primary' : 'text-grey'"
            >
              <span v-show="fullOvertimeDuration.minutes()" class="me-1">
                +{{ fullOvertimeDuration.format('m:ss') }} {{ t('timer.min') }}
              </span>
              <span v-show="fullOvertimeDuration.seconds() && !fullOvertimeDuration.minutes()">
                +{{ fullOvertimeDuration.format('s') }} {{ t('timer.s') }}
              </span>
            </div>
            <div class="text-h3">
              <span v-if="status.label === 'upcoming'">
                <span v-if="isInLestThan10Min" class="d-flex flex-column">
                  <div class="text-primary font-weight-black">
                    {{ startInDuration.format('mm:ss') }}
                  </div>
                  <span class="text-grey-lighten-1 text-body-1">{{ t('timer.minutes') }}</span>
                </span>
                <span v-else-if="isInLessThan24h" class="d-flex flex-column">
                  <div class="text-primary font-weight-black">
                    {{ startInDuration.format('HH:mm') }}
                  </div>
                  <span class="text-grey-lighten-1 text-body-1">{{ t('timer.hours') }}</span>
                </span>
                <span v-else class="d-flex flex-column">
                  <div class="text-primary font-weight-black">{{ formatTimeValue(start) }}</div>
                  <div class="text-grey-lighten-1 text-body-1">
                    {{ formatTimeUnit(start) }}
                  </div>
                </span>
              </span>
              <span v-else-if="status.label === 'closed'" class="d-flex flex-column">
                <div class="text-grey-lighten-1 font-weight-black">
                  {{
                    duration.hours() > 0 ? duration.format('HH:mm:ss') : duration.format('mm:ss')
                  }}
                </div>
                <div class="text-grey-darken-1 text-body-1">
                  {{ t('timer.eAuctionTime') }}
                </div>
              </span>
              <span v-else>
                <div class="text-primary font-weight-black">
                  <span v-if="is1MinRemaining">
                    {{ formattedTimer }}
                  </span>
                  <span v-else>
                    {{ formattedTimer }}
                  </span>
                </div>
              </span>
            </div>
            <div v-if="endInDuration.asDays() > 1 && status.label === 'active'">
              <span class="text-grey-2 text-body-1 d-inline-flex ga-1">
                <span>{{ t('timer.days') }}</span>
                <span>{{ t('timer.hours') }}</span>
                <span>{{ t('timer.min') }}</span>
              </span>
            </div>
            <div
              v-if="
                status.label !== 'upcoming' &&
                status.label !== 'closed' &&
                auction.type !== 'sealed-bid'
              "
              class="text-grey-darken-1 text-body-1"
            >
              <span v-if="duration.hours()" class="me-1">
                {{ duration.hours() }} {{ t('timer.h') }}
              </span>
              <span v-if="duration.minutes()" class="me-1">
                {{ duration.minutes() }} {{ t('timer.min') }}
              </span>
              <span v-if="duration.seconds()">{{ duration.seconds() }} {{ t('timer.s') }}</span>
            </div>
          </div>
        </template>
      </v-progress-circular>
    </v-card-text>
  </v-card>
</template>

<script setup>
import dayjs from 'dayjs'
import isTomorrow from 'dayjs/plugin/isTomorrow'
dayjs.extend(isTomorrow)

// Use translations
const { t } = useTranslations()

const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { diff } = useNow()
const isBuyer = computed(() => {
  return route.name === 'auctions-auctionGroupId-lots-auctionId-buyer'
})

const { status, start, startInDuration, endInDuration, duration } = useAuctionTimer(auction)

const now = ref(dayjs().add(diff.value, 'ms'))

const intervalId = setInterval(() => {
  now.value = dayjs().add(diff.value, 'ms')
}, 10)

onUnmounted(() => {
  clearInterval(intervalId)
})

const isInLessThan24h = computed(() => {
  return startInDuration.value / (1000 * 60) < 1440
})
const isInLestThan10Min = computed(() => {
  return startInDuration.value / (1000 * 60) < 10
})

const fullOvertimeDuration = computed(() => {
  const initialEndTime = dayjs(auction.value.start_at).add(auction.value.duration, 'minutes')
  const overTimeValue = dayjs.duration(Math.abs(initialEndTime.diff(auction.value.end_at)))
  return overTimeValue
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
    return 'green-light'
  }
  if (is1MinRemaining.value) {
    return 'error'
  } else if (isOvertime.value) {
    return 'warning'
  } else {
    return 'btn-accent'
  }
})

const remainingPercentage = computed(() => {
  if (status.value.label === 'active') {
    if (auction.value.type === 'sealed-bid') {
      return (endInDuration.value / duration.value.asMilliseconds()) * 100
    } else {
      return (
        (endInDuration.value /
          dayjs.duration({ minutes: auction.value.duration }).asMilliseconds()) *
        100
      )
    }
  } else if (status.value.label === 'closed') {
    return 0
  } else {
    return 100
  }
})

const formattedTimer = computed(() => {
  const d = status.value.label === 'active' ? endInDuration.value : duration.value
  // d is a dayjs duration
  if (d.asDays() >= 1) {
    // Show DD:HH
    const days = Math.floor(d.asDays())
    const hours = d.hours()
    const minutes = d.minutes()
    return `${days.toString()}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
  } else if (d.asHours() >= 1) {
    // Show HH:mm
    return d.format('HH:mm')
  } else {
    // Show mm:ss
    return d.format('mm:ss')
  }
})

function formatTimeValue(startTime) {
  const now = dayjs()
  const diff = startTime.diff(now)
  const duration = dayjs.duration(diff)

  if (duration.asDays() >= 1) {
    return Math.floor(duration.asDays())
  } else {
    return Math.floor(duration.asMonths())
  }
}

function formatTimeUnit(startTime) {
  const now = dayjs()
  const diff = startTime.diff(now)
  const duration = dayjs.duration(diff)

  if (duration.asDays() >= 1) {
    return t('timer.days')
  } else {
    return t('timer.months')
  }
}
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
.border {
  border-top-left-radius: 0 !important;
}
.custom-padding {
  padding: 0 19px;
}
</style>
