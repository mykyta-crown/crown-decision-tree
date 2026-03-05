<template>
  <AuctionsLogsItemsTableRow
    :custom-icon="true"
    color="primary"
    :time="time"
    :rank="displayedBadge"
    :rank-color="rankColor"
  >
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/log-out.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    <span class="text-primary">{{ hideSubject ? t('activityLog.you') : supplier }}</span>
    {{ ' ' }}{{ t('activityLog.leftCompetitionAtPrice') }}{{ ' ' }}
    <span class="text-primary">{{ formatNumber(price, 'currency', auctionData.currency) }}</span>
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      <span class="text-primary">{{ hideSubject ? t('activityLog.you') : supplier }}</span>
      {{ ' ' }}{{ t('activityLog.leftCompetitionAtPrice') }}{{ ' ' }}
      <span class="text-primary">{{ formatNumber(price, 'currency', auctionData.currency) }}</span>
    </v-tooltip>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps([
  'auction',
  'price',
  'supplier',
  'timestamp',
  'rank',
  'rankColor',
  'currentRound'
])
const { t } = useTranslations()
const { user, isAdmin } = useUser()
const auctionData = computed(() => props.auction?.value || props.auction)

const displayedBadge = computed(() => {
  return props.currentRound + 1
})
const hideSubject = computed(() => {
  return !(auctionData.value.buyer_id === user.value?.id || isAdmin.value)
})

const time = computed(() => {
  return dayjs(props.timestamp).format('HH:mm:ss')
})
</script>
