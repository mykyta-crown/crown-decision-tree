<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" color="primary" :time="time">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/pepicons-pencil_crown.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span class="text-primary">
      <template v-if="sellerName">
        <span class="font-weight-bold">{{ sellerName }}</span>
        {{ ' ' }}{{ t('activityLog.sellerFinishedWithRank') }}
      </template>
      <template v-else>
        {{ t('activityLog.finishedWithRank') }}
      </template>
      {{ ' ' }}
      <span class="font-weight-bold">{{ currentRank }}</span>
    </span>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps(['timestamp', 'rank', 'isDutch', 'sellerName'])
const { t } = useTranslations()
const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})

const currentRank = computed(() => {
  if (props.isDutch) {
    return props.rank === 1 ? props.rank : 2
  } else {
    return props.rank
  }
})
</script>
