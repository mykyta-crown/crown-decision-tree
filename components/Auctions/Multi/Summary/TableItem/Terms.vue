<template>
  <td>
    <div class="d-flex align-center justify-start ga-4">
      <span class="text-no-wrap">
        {{ auction.lot_name }}
      </span>
    </div>
  </td>
  <td>
    <div class="text-body-1">
      <v-chip
        label
        size="small"
        variant="flat"
        :color="status.color"
        class="text-capitalize chip-status"
      >
        {{ t(`status.${status.label}`) }}
      </v-chip>
    </div>
  </td>
  <td>
    <!-- Show start date when upcoming, progress bar when active/closed -->
    <div v-if="status.label === 'upcoming'" class="text-no-wrap">
      {{
        dayjs(auction.start_at).format('MMMM DD') +
        ' ' +
        t('termsTable.dateFormat.at') +
        ' ' +
        dayjs(auction.start_at).format('HH:mm')
      }}
    </div>
    <div v-else class="d-flex align-center justify-center ga-2">
      <span class="text-no-wrap">{{ currentDuration }} / {{ auction.duration }} min</span>
      <v-progress-linear
        rounded-bar
        rounded="pill"
        height="10"
        class="progress-linear"
        :model-value="remainingPercentage"
        bg-color="grey-ligthen-3"
        :color="timerColor"
      />
    </div>
  </td>
  <td>
    <v-chip
      v-if="auctionSellers"
      size="small"
      :color="auctionSellers.terms_accepted ? 'green-light' : 'grey-lighten-2'"
      variant="flat"
      label
      class="text-capitalize chip-status"
    >
      {{
        auctionSellers.terms_accepted
          ? t('termsTable.termStatus.approved')
          : t('termsTable.termStatus.pending')
      }}
    </v-chip>
  </td>
</template>
<script setup>
import dayjs from 'dayjs'

const props = defineProps(['auctionId'])

const { t } = useTranslations()

const supabase = useSupabaseClient()
const auctionSellers = ref(null)
const { auction, fetchAuction } = useRealtimeAuction({ auctionId: props.auctionId })
await fetchAuction()

const route = useRoute()

const { status, endInDuration, duration } = useAuctionTimer(auction)

const currentDuration = computed(() => {
  if (status.value.label === 'active') {
    return endInDuration.value.format('mm:ss')
  } else if (status.value.label === 'closed') {
    return duration.value.format('mm:ss')
  } else {
    return '00:00'
  }
})

const remainingPercentage = computed(() => {
  if (status.value.label === 'active') {
    return (endInDuration.value / duration.value) * 100
  } else if (status.value.label === 'closed') {
    return 0
  } else {
    return 100
  }
})

const isOvertime = computed(() => {
  return endInDuration.value / (1000 * 60) < auction.value.overtime_range
})

const is1MinRemaining = computed(() => {
  return endInDuration.value / (1000 * 60) < 1
})

const timerColor = computed(() => {
  if (status.value.label === 'closed') {
    return 'grey'
  }
  if (status.value.label === 'upcoming') {
    return 'green-pastel'
  }
  if (is1MinRemaining.value) {
    return 'error'
  } else if (isOvertime.value) {
    return 'warning'
  } else {
    return 'green'
  }
})

watch(
  route,
  async () => {
    const { data: updatedSeller } = await supabase
      .from('auctions_sellers')
      .select('*')
      .eq('auction_id', props.auctionId)
      .single()
    auctionSellers.value = updatedSeller
  },
  { immediate: true }
)
</script>
<style scoped>
.progress-linear :deep(.v-progress-linear__determinate) {
  border: 2px solid rgb(var(--v-theme-grey-ligthen-3));
}
.progress-linear {
  max-width: 100px;
}
.relative {
  position: relative;
}

.not-focused {
  z-index: auto !important;
  box-shadow: 0px 0px 0px 0px rgba(0, 0, 0, 0) !important;
  transition: all 0.3s ease-in-out;
  background-color: rgb(250, 250, 250) !important;
}

.focus {
  z-index: 10 !important;
  box-shadow: 5px 10px 15px v-bind(boxShadowPosition) rgba(0, 0, 0, 0.1) !important;
  font-weight: bold;
  transition: all 0.3s ease-in-out;
  background-color: white !important;
}
</style>
