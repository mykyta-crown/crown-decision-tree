<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" color="primary" :time="time">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/Trainings.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span class="text-primary">
      {{ t('activityLog.priceWasAccepted') }}
      {{ ' ' }}
      <span class="font-weight-bold">{{ formattedPrice }}</span>
      {{ ' ' }}
      {{ t('activityLog.wasAccepted') }}
    </span>
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary">
        {{ t('activityLog.priceWasAccepted') }}
        {{ ' ' }}
        <span class="font-weight-bold">{{ formattedPrice }}</span>
        {{ ' ' }}
        {{ t('activityLog.wasAccepted') }}
      </span>
    </v-tooltip>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps(['timestamp', 'price', 'auction'])
const { t } = useTranslations()

const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})

const formattedPrice = computed(() => {
  const auctionData = props.auction?.value || props.auction
  return formatNumber(props.price, 'currency', auctionData?.currency)
})
</script>
