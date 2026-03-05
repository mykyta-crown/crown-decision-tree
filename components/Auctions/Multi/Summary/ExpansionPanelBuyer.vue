<template>
  <v-expansion-panels id="lots-summary-capture" :data-group-id="props.groupId" v-model="panel">
    <v-expansion-panel class="bg-grey-lighten-3" elevation="0">
      <v-expansion-panel-title
        class="text-h6 font-weight-bold pa-0 d-flex align-center ga-2"
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
        <AuctionsMultiSummaryTable
          :type="auctionsGroup[0].type"
          :headers="headers[auctionsGroup[0].type]"
          :group-id="props.groupId"
          :current-lot="props.currentLot"
          :user-type="'buyer'"
        />
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>
<script setup>
const props = defineProps(['groupId', 'currentLot'])

const { t } = useTranslations()

const supabase = useSupabaseClient()

const showTimingRulesDialog = ref(false)
// Start with panel closed, open after mount to avoid Vuetify transition errors
const panel = ref(undefined)

const { data: auctionsGroup } = await supabase
  .from('auctions')
  .select('id, type')
  .eq('auctions_group_settings_id', props.groupId)

const { data: timingRule } = await supabase
  .from('auctions_group_settings')
  .select('timing_rule')
  .eq('id', props.groupId)
  .single()

// Open panel after mount to ensure DOM is ready for Vuetify transitions
onMounted(() => {
  nextTick(() => {
    panel.value = 0
  })
})

const headers = computed(() => ({
  reverse: [
    { title: '', value: 'notification' },
    { title: t('expansionPanel.headers.lots'), value: 'lot_name' },
    { title: t('expansionPanel.headers.status'), value: 'status' },
    { title: t('expansionPanel.headers.eAuctionTime'), value: 'duration' },
    { title: t('expansionPanel.headers.leader'), value: 'leader' },
    { title: t('expansionPanel.headers.lowestBid'), value: 'bid' },
    { title: t('expansionPanel.headers.savings'), value: 'savings' }
  ],
  'sealed-bid': [
    { title: '', value: 'notification' },
    { title: t('expansionPanel.headers.lots'), value: 'lot_name' },
    { title: t('expansionPanel.headers.status'), value: 'status' },
    { title: t('expansionPanel.headers.eAuctionTime'), value: 'duration' },
    { title: t('expansionPanel.headers.leader'), value: 'leader' },
    { title: t('expansionPanel.headers.lowestBid'), value: 'bid' },
    { title: t('expansionPanel.headers.savings'), value: 'savings' }
  ],
  dutch: [
    { title: '', value: 'notification' },
    { title: t('expansionPanel.headers.lots'), value: 'lot_name' },
    { title: t('expansionPanel.headers.status'), value: 'status' },
    { title: t('expansionPanel.headers.eAuctionTime'), value: 'duration' },
    { title: t('expansionPanel.headers.round'), value: 'round' },
    { title: t('expansionPanel.headers.leader'), value: 'leader' },
    { title: t('expansionPanel.headers.currentPrice'), value: 'current' },
    { title: t('expansionPanel.headers.savings'), value: 'savings' }
  ],
  japanese: [
    { title: '', value: 'notification' },
    { title: t('expansionPanel.headers.lots'), value: 'lot_name' },
    { title: t('expansionPanel.headers.status'), value: 'status' },
    { title: t('expansionPanel.headers.eAuctionTime'), value: 'duration' },
    { title: t('expansionPanel.headers.round'), value: 'round' },
    { title: t('expansionPanel.headers.leader'), value: 'leader' },
    { title: t('expansionPanel.headers.currentPrice'), value: 'current' },
    { title: t('expansionPanel.headers.savings'), value: 'savings' }
  ]
}))
</script>
<style scoped>
.panel-padding:deep(.v-expansion-panel-text__wrapper) {
  padding: 0px !important;
}
.v-expansion-panel--active > .v-expansion-panel-title:not(.v-expansion-panel-title--static) {
  min-height: 30px !important;
}
</style>
