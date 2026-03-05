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
        src="@/assets/icons/activity-log/check-square-one.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span class="text-primary">{{ bidderLabel }}</span>
    {{ ' ' }}{{ isFirstPrebid ? t('activityLog.placedPrebidOf') : t('activityLog.updatedPrebidTo')
    }}{{ ' ' }}
    <span class="text-primary">{{
      formatNumber(displayPrice, 'currency', auction.value.currency)
    }}</span>
    {{ ' ' }}{{ t('activityLog.on') }} {{ date }}
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary">{{ bidderLabel }}</span>
      {{ ' '
      }}{{ isFirstPrebid ? t('activityLog.placedPrebidOf') : t('activityLog.updatedPrebidTo')
      }}{{ ' ' }}
      <span class="text-primary">{{
        formatNumber(displayPrice, 'currency', auction.value.currency)
      }}</span>
      {{ ' ' }}{{ t('activityLog.on') }} {{ date }}
    </v-tooltip>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'
const props = defineProps([
  'auction',
  'bid',
  'totalValue',
  'timestamp',
  'rank',
  'rankColor',
  'isFirstPrebid'
])

const { user, isAdmin } = useUser()
const { t, locale } = useTranslations()

const hideSubject = computed(() => {
  return !(props.auction.value.buyer_id === user.value?.id || isAdmin.value)
})

const bidderLabel = computed(() => {
  if (hideSubject.value) {
    return t('activityLog.you')
  }

  const profile = props.bid?.profiles

  return (
    profile?.companies?.name ||
    profile?.full_name ||
    profile?.email ||
    props.bid?.seller_email ||
    t('activityLog.you')
  )
})

const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})

const date = computed(() => {
  return dayjs(props.timestamp).locale(locale.value).format('MMM DD')
})

// Handle race condition: when bid_supplies hasn't loaded yet, the price may be 0
// Fallback to raw bid.price if available
const displayPrice = computed(() => {
  const bidPrice = props.totalValue?.totalBidPriceWithHandicaps || 0
  if (bidPrice === 0 && props.bid?.price > 0) {
    return props.bid.price
  }
  return bidPrice
})
</script>
