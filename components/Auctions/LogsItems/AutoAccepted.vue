<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" color="primary" :time="time">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/alert-02.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span>
      <span class="text-primary">{{ t('activityLog.bidsAutoAccepted') }}</span>
    </span>
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary">{{ t('activityLog.bidsAutoAccepted') }}</span>
    </v-tooltip>
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
