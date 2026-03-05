<template>
  <AuctionsLogsItemsTableRow
    :custom-icon="true"
    color="primary"
    :time="time"
    :rank="showRank ? displayedBadge : null"
    :rank-color="rankColor"
  >
    <template #custom-icon>
      <v-img
        v-if="auctionType === 'dutch'"
        src="@/assets/icons/activity-log/Trainings.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
      <v-img
        v-else
        src="@/assets/icons/activity-log/auction.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span class="text-primary">{{ bidderLabel }}</span>
    {{ ' ' }}{{ !isEnglish ? t('activityLog.acceptedPriceOf') : t('activityLog.placedBidOf')
    }}{{ ' ' }}
    <span class="text-primary">{{ price }}</span>
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary">{{ bidderLabel }}</span>
      {{ ' ' }}{{ !isEnglish ? t('activityLog.acceptedPriceOf') : t('activityLog.placedBidOf')
      }}{{ ' ' }}
      <span class="text-primary">{{ price }}</span>
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
  'isEnglish',
  'currentRound',
  'auctionType'
])

// Use translations
const { t } = useTranslations()

const { user, isAdmin } = useUser()

// Check if we should show rank (injected from BidsLogsCard)
const showRank = inject('showRankInLogs', ref(true))

const displayedBadge = computed(() => {
  return props.isEnglish ? props.rank : props.currentRound + 1
})

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

const price = computed(() => {
  const bidPrice = props.totalValue.totalBidPriceWithHandicaps

  // Handle race condition: when bid_supplies hasn't loaded yet, the price may be 0
  // In this case, show loading indicator or fallback to bid.price if available
  if (bidPrice === 0 && props.bid?.price > 0) {
    // Fallback to raw bid price (for non-multi-item auctions)
    return formatNumber(
      props.bid.price,
      'currency',
      props.auction.currency || props.auction.value.currency
    )
  }

  return formatNumber(bidPrice, 'currency', props.auction.currency || props.auction.value.currency)
})
</script>
