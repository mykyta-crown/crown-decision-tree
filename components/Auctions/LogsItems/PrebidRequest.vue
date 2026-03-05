<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" :time="time">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/alert-02.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    {{ t('activityLog.placePrebidToParticipate') }}
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
