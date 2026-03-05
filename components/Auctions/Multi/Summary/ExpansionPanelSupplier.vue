<template>
  <v-expansion-panels v-model="panel">
    <v-expansion-panel class="bg-grey-lighten-3" elevation="0">
      <v-expansion-panel-title
        class="text-body-1 font-weight-bold pa-0 d-flex align-center ga-4"
        hide-actions
      >
        <template #default="{ expanded }">
          <span>
            {{ t('expansionPanel.summary') }}
          </span>

          <v-btn variant="text" icon="" @click.stop="showTimingRulesDialog = true">
            <v-tooltip
              activator="parent"
              location="top"
              content-class="bg-white elevation-4 text-body-1"
              location-strategy="connected"
              offset="0"
            >
              <span class="text-capitalize">
                {{ timingRule.timing_rule }}
              </span>
            </v-tooltip>
            <img :src="`/builder/${timingRule.timing_rule}-icon.svg`" height="25px" />
          </v-btn>
          <AuctionsMultiSummaryTimingRulesDialogContent
            v-model="showTimingRulesDialog"
            :timing-rule="timingRule.timing_rule"
          />
          <v-spacer />
          <img
            :src="expanded ? '/icons/chevron-up.svg' : '/icons/chevron-down.svg'"
            width="20"
            height="20"
          />
        </template>
      </v-expansion-panel-title>
      <v-expansion-panel-text class="panel-padding">
        <AuctionsMultiSummaryTermsTable
          v-if="!showSummaryTable"
          class="TERMS-TABLE"
          :group-id="props.groupId"
          :current-lot="props.currentLot"
        />
        <AuctionsMultiSummaryTable
          v-else-if="showSummaryTable"
          class="SUMMARY-TABLE"
          :type="auctionsGroup[0].type"
          :headers="headers[auctionsGroup[0].type]"
          :group-id="props.groupId"
          :current-lot="props.currentLot"
          :user-type="'supplier'"
        />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
<script setup>
const props = defineProps(['groupId', 'profile', 'currentLot'])
const { t } = useTranslations()

const supabase = useSupabaseClient()

const showTimingRulesDialog = ref(false)
// Start with panel closed, open after mount to avoid Vuetify transition errors
const panel = ref(undefined)

const { data: auctionsGroup } = await supabase
  .from('auctions')
  .select('id, type, lot_number')
  .eq('auctions_group_settings_id', props.groupId)
auctionsGroup.sort((a, b) => a.lot_number - b.lot_number)

const { data: timingRule } = await supabase
  .from('auctions_group_settings')
  .select('timing_rule')
  .eq('id', props.groupId)
  .single()

// Make auctionsSellers reactive so it can be refreshed
const auctionsSellers = ref([])

async function fetchAuctionsSellers() {
  const { data } = await supabase
    .from('auctions_sellers')
    .select('auction_id, terms_accepted')
    .eq('seller_email', props.profile.email)
    .in(
      'auction_id',
      auctionsGroup.map((auction) => auction.id)
    )
  auctionsSellers.value = data || []
}

// Fetch initially
await fetchAuctionsSellers()

// Subscribe to realtime changes on auctions_sellers (terms acceptance)
const auctionIds = auctionsGroup.map((auction) => auction.id)
const sellersChannel = supabase
  .channel(`sellers-terms-${props.groupId}`)
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'auctions_sellers',
      filter: `auction_id=in.(${auctionIds.join(',')})`
    },
    () => {
      fetchAuctionsSellers()
    }
  )
  .subscribe()

// Child components (English/Supplier.vue, etc.) handle their own realtime updates
// via useRealtimeBids, so we don't need to subscribe to bids here

onUnmounted(() => {
  sellersChannel.unsubscribe()
})

// Track the first auction status reactively to switch between tables
const firstAuctionId = auctionsGroup[0]?.id
const { auction: firstAuction, fetchAuction } = useRealtimeAuction({ auctionId: firstAuctionId })
await fetchAuction()

const { status: firstAuctionStatus } = useAuctionTimer(firstAuction)

// Show terms table until all terms for each lot are accepted
// Once all terms are accepted, show the summary table (with rank and last bid columns)
const showSummaryTable = computed(() => {
  const allTermsAccepted = auctionsSellers.value.every(
    (auctionSeller) => auctionSeller.terms_accepted
  )
  const auctionStarted =
    firstAuctionStatus.value?.label === 'active' || firstAuctionStatus.value?.label === 'closed'
  return allTermsAccepted || auctionStarted
})

// Open panel after mount to ensure DOM is ready for Vuetify transitions
onMounted(() => {
  nextTick(() => {
    panel.value = 0
  })
})

const headers = {
  reverse: [
    { title: 'Lots', value: 'lot_name', align: 'center' },
    { title: 'Status  ', value: 'status', align: 'center' },
    { title: 'eAuction Time', value: 'duration', align: 'center' },
    { title: 'Your current rank', value: 'rank', align: 'center' },
    { title: 'Your last bid', value: 'prebid', align: 'center' }
  ],
  'sealed-bid': [
    { title: 'Lots', value: 'lot_name', align: 'center' },
    { title: 'Status  ', value: 'status', align: 'center' },
    { title: 'eAuction Time', value: 'duration', align: 'center' },
    { title: 'Your current rank', value: 'rank', align: 'center' },
    { title: 'Your last bid', value: 'prebid', align: 'center' }
  ],
  dutch: [
    { title: 'Lots', value: 'lot_name', align: 'center' },
    { title: 'Status  ', value: 'status', align: 'center' },
    { title: 'eAuction Time', value: 'duration', align: 'center' },
    { title: 'Round', value: 'round', align: 'center' },
    { title: 'Current price', value: 'current', align: 'center' }
  ],
  japanese: [
    { title: 'Lots', value: 'lot_name', align: 'center' },
    { title: 'Status  ', value: 'status', align: 'center' },
    { title: 'eAuction Time', value: 'duration', align: 'center' },
    { title: 'Round', value: 'round', align: 'center' },
    { title: 'Current price', value: 'current', align: 'center' }
  ]
}
</script>
<style scoped>
.panel-padding:deep(.v-expansion-panel-text__wrapper) {
  padding: 0px !important;
}
.v-expansion-panel .v-expansion-panel-title {
  height: 30px !important;
  min-height: 30px !important;
}
</style>
