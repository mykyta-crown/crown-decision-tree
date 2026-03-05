<template>
  <div>
    <div v-if="isTraining && !isBuyer">
      <v-container :fluid="width < 1440" class="px-5 pt-5 pb-0" :class="{ 'mb-4': nbAuctions > 1 }">
        <v-row class="">
          <v-col cols="12">
            <TrainingsStepper />
          </v-col>
        </v-row>
      </v-container>
    </div>
    <div v-if="nbAuctions > 1" class="bg-grey-lighten-3">
      <v-container :fluid="width < 1440" class="px-5 pt-4 pb-4">
        <v-row>
          <v-col cols="12">
            <AuctionsMultiSummaryExpansionPanelBuyer
              v-if="isBuyer"
              :group-id="route.params.auctionGroupId"
              :current-lot="route.params.auctionId"
            />
            <AuctionsMultiSummaryExpansionPanelSupplier
              v-else
              :group-id="route.params.auctionGroupId"
              :profile="profile"
              :current-lot="route.params.auctionId"
            />
            <!-- Multi-lot training: Accept terms tooltip (shown below the summary table) -->
            <TrainingsGuidanceTooltip
              v-if="showTermsTooltip"
              tooltip-id="terms-acceptance"
              :title="t('guidance.terms.acceptAllTerms')"
              :message="t('guidance.terms.acceptAllTermsMessage')"
              location="bottom"
              :show-dismiss="true"
            >
              <template #default>
                <div class="guidance-tooltip-anchor" />
              </template>
            </TrainingsGuidanceTooltip>
            <!-- Multi-lot training: Switch to next lot tooltip (shown after placing a prebid) -->
            <TrainingsGuidanceTooltip
              v-if="showSwitchToNextLotTooltip"
              tooltip-id="switch-to-next-lot"
              :title="t('guidance.prebid.switchToNextLot')"
              :message="t('guidance.prebid.switchToNextLotMessage')"
              location="bottom"
              :show-dismiss="true"
              @dismiss="onSwitchTooltipDismiss"
            >
              <template #default>
                <div class="guidance-tooltip-anchor" />
              </template>
            </TrainingsGuidanceTooltip>
          </v-col>
        </v-row>
      </v-container>
    </div>
    <NuxtPage />
  </div>
</template>

<script setup>
const route = useRoute()
const { width } = useDisplay()
const { getSession, isBuyer } = useUser()
const { profile } = await getSession()
const { t } = useTranslations()

const supabase = useSupabaseClient()

const { count, data: auctionsData } = await supabase
  .from('auctions')
  .select('buyer_id, usage', { count: 'exact' })
  .eq('auctions_group_settings_id', route.params.auctionGroupId)

const nbAuctions = ref(count || 0)
const isTraining = ref(auctionsData?.[0]?.usage === 'training')

// Check if we should show the "Accept all Terms" tooltip
// Only on terms page, multi-lot training, and when NOT all terms are accepted
const isTermsPage = computed(() => route.name?.includes('-terms'))
const isMultiLot = computed(() => nbAuctions.value > 1)
const isMultiLotTraining = computed(() => isMultiLot.value && isTraining.value)

// Fetch ALL lots' terms acceptance status
const allTermsAccepted = ref(true)

async function fetchTermsAcceptanceStatus() {
  if (!isTermsPage.value || !profile.value?.email || !route.params.auctionGroupId) {
    allTermsAccepted.value = true
    return
  }

  // Get all auctions in this group
  const { data: auctions } = await supabase
    .from('auctions')
    .select('id')
    .eq('auctions_group_settings_id', route.params.auctionGroupId)

  if (!auctions || auctions.length === 0) {
    allTermsAccepted.value = true
    return
  }

  // Check terms acceptance for all lots
  const { data: sellers } = await supabase
    .from('auctions_sellers')
    .select('terms_accepted')
    .in(
      'auction_id',
      auctions.map((a) => a.id)
    )
    .eq('seller_email', profile.value.email)

  allTermsAccepted.value = sellers?.every((s) => s.terms_accepted) ?? true
}

// Watch for route changes to re-fetch terms acceptance status
// This ensures the tooltip shows correctly after training reset
watch(
  () => [route.fullPath, isTermsPage.value],
  () => {
    fetchTermsAcceptanceStatus()
  },
  { immediate: true }
)

const showTermsTooltip = computed(() => {
  return isTermsPage.value && isMultiLotTraining.value && !isBuyer.value && !allTermsAccepted.value
})

// Get multi-lot prebids state (for multi-lot training)
// This is provided to child components (supplier.vue and Row.vue) to share the same reactive instance
const multiLotPrebids =
  isMultiLotTraining.value && !isBuyer.value
    ? await useMultiLotPrebids({ auctionGroupId: route.params.auctionGroupId })
    : null

// Provide the multiLotPrebids instance to child pages (supplier.vue) and Row.vue
// This ensures parent and child share the SAME reactive instance
if (multiLotPrebids) {
  provide('parentMultiLotPrebids', multiLotPrebids)
}

// Track when summary table has finished loading (set by Table.vue when Suspense resolves)
// This prevents the tooltip from showing before the table is fully rendered
const summaryTableLoaded = ref(false)
provide('summaryTableLoaded', summaryTableLoaded)

// Check if we should show the "Switch to next lot" tooltip
// Only on supplier page, multi-lot training, after placing a prebid
const isSupplierPage = computed(() => route.name?.includes('-supplier'))

const showSwitchToNextLotTooltip = computed(() => {
  // Access prebidVersion FIRST to ensure dependency tracking regardless of early returns
  // (Map mutations aren't always detected by Vue, so we use a version counter)
  const _version = multiLotPrebids?.prebidVersion?.value ?? 0

  if (!isSupplierPage.value) return false
  if (!isMultiLotTraining.value) return false
  if (isBuyer.value) return false
  if (!multiLotPrebids) return false

  // Wait for summary table to finish loading before showing tooltip
  // This prevents the tooltip from being mispositioned during table load
  if (!summaryTableLoaded.value) return false

  const prebidsByLot = multiLotPrebids.prebidsByLot.value
  const allPlaced = multiLotPrebids.allPrebidsPlaced.value
  const nextLot = multiLotPrebids.nextLotNeedingPrebid.value
  const currentLotId = route.params.auctionId
  const currentLotHasPrebid = prebidsByLot.get(currentLotId) === true

  // Don't show if all prebids are placed
  if (allPlaced) return false
  // Don't show if there's no next lot needing prebid
  if (!nextLot) return false

  return currentLotHasPrebid && nextLot.id !== currentLotId
})

// Handler for when the "Switch to next lot" tooltip is dismissed
function onSwitchTooltipDismiss() {
  if (multiLotPrebids) {
    multiLotPrebids.clearJustPlacedPrebid()
  }
}
</script>

<style scoped>
.guidance-tooltip-anchor {
  width: 100%;
  height: 4px;
}
</style>
