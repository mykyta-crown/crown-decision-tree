<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" color="primary" :time="time">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/flag.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span>
      {{ t('activityLog.auctionEnded') }}
    </span>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps(['timestamp'])
const { t } = useTranslations()
const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})
</script>
