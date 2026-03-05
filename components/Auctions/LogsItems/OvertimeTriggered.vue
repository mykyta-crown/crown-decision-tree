<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" :time="time">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/hourglass.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    Overtime applied, time{{ ' ' }}<span class="text-primary">reset to {{ overtime }}</span>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'
const props = defineProps(['auction', 'timestamp'])

const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})
const overtime = computed(() => {
  const seconds = +props.auction.overtime_range * 60
  if (seconds >= 60) {
    return `${seconds / 60} min`
  } else {
    return `${seconds} sec`
  }
})
</script>
