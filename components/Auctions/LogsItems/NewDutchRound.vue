<template>
  <AuctionsLogsItemsTableRow
    :custom-icon="true"
    color="primary"
    :time="time"
    :rank="displayedBadge"
    :rank-color="rankColor"
  >
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/Trending_Up.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span class="text-primary">{{ t('activityLog.newRoundStarted') }}</span>
    {{ ' '
    }}<span class="text-primary">{{
      formatNumber(bid.price, 'currency', auctionData.currency)
    }}</span
    >{{ ' ' }}
    {{ t('activityLog.hasStarted') }}
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary">{{ t('activityLog.newRoundStarted') }}</span>
      {{ ' '
      }}<span class="text-primary">{{
        formatNumber(bid.price, 'currency', auctionData.currency)
      }}</span
      >{{ ' ' }}
      {{ t('activityLog.hasStarted') }}
    </v-tooltip>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps(['auction', 'bid', 'timestamp', 'currentRound', 'rankColor'])
const { t } = useTranslations()
const auctionData = computed(() => props.auction?.value || props.auction)
const displayedBadge = computed(() => {
  return props.currentRound + 1
})

const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})
</script>
