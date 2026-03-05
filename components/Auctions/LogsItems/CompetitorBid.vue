<template>
  <AuctionsLogsItemsTableRow
    :custom-icon="true"
    color="primary"
    :time="time"
    :rank="rank"
    :rank-color="rankColor"
  >
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/auction.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    {{ t('activityLog.competitorBidChangedRank') }}
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps(['timestamp', 'rank', 'rankColor'])
const { t } = useTranslations()
const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})
</script>
