<template>
  <div>
    <v-container v-if="auction" :fluid="width < 1440" class="mb-4 px-5">
      <v-tabs
        v-model="tabs"
        height="36"
        hide-slider
        class="d-flex align-center justify-space-between"
      >
        <v-tab
          :class="tabs === 0 ? 'bg-white' : 'bg-grey-ligthen-3'"
          class="custom-tab-border py-2 px-5 max-w-tab"
        >
          <span
            class="text-body-1 text-truncate"
            :class="tabs === 0 ? 'text-primary font-weight-semibold' : 'text-grey-darken-4'"
            >{{ auction.lot_name || auction.name }}</span
          >
          <v-tooltip v-if="auction.lot_name" activator="parent" content-class="bg-white border">
            <span>
              {{ auction.lot_name || auction.name }}
            </span>
          </v-tooltip>
        </v-tab>
        <v-spacer />

        <v-tab
          :class="
            tabs === 1 ? 'bg-white font-weight-semibold' : 'bg-grey-ligthen-3 text-grey-darken-4'
          "
          class="custom-tab-border py-2 px-5 mr-1"
        >
          {{ t('tabs.terms') }}
        </v-tab>
        <v-tab
          :class="
            tabs === 2 ? 'bg-white font-weight-semibold' : 'bg-grey-ligthen-3 text-grey-darken-4'
          "
          class="custom-tab-border py-2 px-5 mr-1"
        >
          {{ t('tabs.status') }}
        </v-tab>
        <v-tab
          v-if="isAdmin"
          :class="
            tabs === 3 ? 'bg-white font-weight-semibold' : 'bg-grey-ligthen-3 text-grey-darken-4'
          "
          class="custom-tab-border py-2 px-5 mr-1"
        >
          {{ t('tabs.admin') }}
        </v-tab>
        <v-tab
          v-if="isAdmin"
          :class="
            tabs === 4 ? 'bg-white font-weight-semibold' : 'bg-grey-ligthen-3 text-grey-darken-4'
          "
          class="custom-tab-border py-2 px-5"
        >
          <v-icon size="small" class="mr-1">mdi-stethoscope</v-icon>
          Health Check
        </v-tab>
      </v-tabs>

      <v-tabs-window v-model="tabs">
        <v-tabs-window-item>
          <AuctionsDutchBuyerView v-if="auction.type === 'dutch'" />
          <AuctionsEnglishBuyerView
            v-else-if="auction.type === 'reverse' || auction.type === 'sealed-bid'"
          />
          <AuctionsJapaneseBuyerView v-else-if="auction.type === 'japanese'" />
          <v-row>
            <v-spacer />
            <v-col
              v-if="isAdmin && (auction.usage === 'training' || auction.usage === 'test')"
              cols="auto"
            >
              <v-btn-primary
                :loading="trainingLoading"
                :disabled="status?.label === 'active' || trainingLoading"
                @click="handleTrainingAction"
              >
                {{
                  status?.label === 'upcoming'
                    ? t('actions.startTraining')
                    : status?.label === 'active'
                      ? t('actions.trainingInProgress')
                      : t('actions.resetTraining')
                }}
                <!-- Play icon for Start Training -->
                <svg
                  v-if="status?.label === 'upcoming'"
                  class="ml-2"
                  width="13"
                  height="14"
                  viewBox="0 0 13 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12.0755 7.45497C11.7809 8.57417 10.3889 9.36502 7.60479 10.9467C4.91337 12.4758 3.56767 13.2403 2.48319 12.933C2.03483 12.8059 1.62633 12.5646 1.29687 12.2322C0.5 11.4283 0.5 9.86883 0.5 6.75C0.5 3.63117 0.5 2.07175 1.29687 1.26777C1.62633 0.935372 2.03483 0.69407 2.48319 0.567017C3.56767 0.259707 4.91337 1.02423 7.60479 2.55327C10.3889 4.13497 11.7809 4.92583 12.0755 6.04502C12.1971 6.50699 12.1971 6.99301 12.0755 7.45497Z"
                    stroke="white"
                    stroke-linejoin="round"
                  />
                </svg>
                <!-- Restart icon for Reset Training -->
                <svg
                  v-if="status?.label === 'closed'"
                  class="ml-2"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.33301 4.50024V8.66691H7.49967"
                    stroke="white"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5.00679 11.9385C5.43908 13.1313 6.25843 14.1553 7.34139 14.856C9.54066 16.2792 12.5172 16.1189 14.5422 14.4531C17.7037 11.8524 17.1559 6.82241 13.5693 4.8949C12.4307 4.28303 11.1185 4.04745 9.83025 4.22365C7.2707 4.57373 5.54935 6.67877 3.75 8.33341"
                    stroke="white"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </v-btn-primary>
            </v-col>
            <v-col v-if="auction.usage !== 'real'" cols="auto">
              <v-btn-primary :disabled="status?.label === 'active'" @click="startAuction">
                {{ t('actions.startEAuction') }}
              </v-btn-primary>
            </v-col>
          </v-row>
        </v-tabs-window-item>

        <v-tabs-window-item>
          <TermsAllTerms :is-buyer="true" :auction-id="route.params.auctionId" />
          <v-row class="mt-2">
            <v-spacer />
            <v-col cols="auto" class="d-flex align-center justify-end ga-4">
              <v-btn
                v-if="allLotsClosed"
                color="black"
                size="large"
                class="px-8"
                prepend-icon="mdi-download"
                :loading="exportingPdf"
                @click="handleExportPdf"
              >
                {{ t('endDialogBuyer.downloadReport') }}
              </v-btn>
              <v-btn-primary
                v-if="isAdmin"
                size="large"
                class="px-8"
                @click="navigateTo(`/builder?auction_id=${route.params.auctionId}`)"
              >
                {{ t('actions.edit') }}
              </v-btn-primary>
            </v-col>
          </v-row>
        </v-tabs-window-item>

        <v-tabs-window-item>
          <TermsAllStatus :auction-id="route.params.auctionId" />
          <v-row class="mt-2">
            <v-spacer />
            <v-col cols="auto" class="d-flex align-center justify-end ga-4">
              <v-btn
                v-if="allLotsClosed"
                color="black"
                size="large"
                class="px-8"
                prepend-icon="mdi-download"
                :loading="exportingPdf"
                @click="handleExportPdf"
              >
                {{ t('endDialogBuyer.downloadReport') }}
              </v-btn>
              <v-btn-primary
                v-if="isAdmin"
                size="large"
                class="px-8"
                @click="navigateTo(`/builder?auction_id=${route.params.auctionId}`)"
              >
                {{ t('actions.edit') }}
              </v-btn-primary>
            </v-col>
          </v-row>
        </v-tabs-window-item>
        <v-tabs-window-item v-if="isAdmin">
          <AdminAuctionDashboard />
        </v-tabs-window-item>
        <v-tabs-window-item v-if="isAdmin">
          <AdminHealthCheck />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
    <AuctionsEndDialogBuyer ref="endDialogRef" />
    <AuctionsIdleDialog v-if="status?.label === 'active'" />

    <!-- PDF Export Progress Overlay -->
    <v-overlay v-model="isExporting" persistent class="align-center justify-center">
      <v-card class="pa-8 text-center">
        <v-progress-circular indeterminate size="64" color="primary" class="mb-4" />
        <div class="text-h6">
          {{ exportProgress }}
        </div>
      </v-card>
    </v-overlay>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { usePdfExport } from '~/composables/pdf/usePdfExport'
definePageMeta({
  middleware: ['user-role'],
  // Force page re-mount when auctionId changes (needed for multi-lot PDF export)
  // Also re-mount on training reset (t param) to clear all stale state
  key: (route) => `${route.params.auctionId}-${route.query.t || ''}`
})

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()
const route = useRoute()
const { width } = useDisplay()

const { isAdmin } = useUser()

const presences = ref([])
const tabs = useState('buyer-tabs', () => 0)
const endDialogRef = ref(null)
const trainingLoading = ref(false)

// PDF Export - use the new composable
const { exportPdf, exportingPdf, exportProgress, isExporting } = usePdfExport()

const { auction, updateAuction, forceRefresh } = await useUserAuctionBids({
  auctionId: route.params.auctionId
})
const { status } = useAuctionTimer(auction)

// Track if all lots in multi-lot auction are closed (for PDF export visibility)
const { getNextAuction } = useNextAuction()
const allLotsClosed = ref(false)

// Provide forceRefresh to child components for immediate updates after bid submission
provide('forceRefresh', forceRefresh)

// Allow child components (BidsLogsCard) to register their clearLocalLogs function
// so we can call it during training reset to clear stale activity log entries
const _clearLocalLogs = ref(null)
provide('registerClearLocalLogs', (fn) => {
  _clearLocalLogs.value = fn
})

// Check if all lots are closed when current lot closes (for PDF export button visibility)
watch(
  status,
  async () => {
    if (status.value?.label === 'closed') {
      const nextLot = await getNextAuction(auction)
      allLotsClosed.value = !nextLot
    } else {
      allLotsClosed.value = false
    }
  },
  { immediate: true }
)

async function startAuction() {
  const { data: auctionGroupSettings } = await supabase
    .from('auctions_group_settings')
    .select('*')
    .eq('id', route.params.auctionGroupId)
    .single()

  const { data: startingAuctions } = await supabase
    .from('auctions')
    .select('id, duration, start_at, end_at, usage')
    .eq('auctions_group_settings_id', route.params.auctionGroupId)
    .order('lot_number')

  if (['parallel', 'staggered'].includes(auctionGroupSettings.timing_rule)) {
    startingAuctions.forEach(async (startingAuction) => {
      const startDate = dayjs().set('millisecond', 0).add(15, 'second')
      const endDate = startDate.add(startingAuction.duration, 'minute').set('millisecond', 0)

      await supabase
        .from('auctions')
        .update({
          start_at: startDate,
          end_at: endDate
        })
        .eq('id', startingAuction.id)
    })
  } else {
    const currentAuction = startingAuctions.find((lot) => lot.id === route.params.auctionId)

    const removePreviousAuctions = startingAuctions.slice(
      startingAuctions.indexOf(currentAuction),
      startingAuctions.length
    )
    console.log('removePreviousAuctions', removePreviousAuctions)
    let cumulativeDuration = 0
    const startDate = dayjs().set('millisecond', 0).add(15, 'second')
    removePreviousAuctions.forEach(async (lot, i) => {
      if (i > 0) {
        cumulativeDuration = removePreviousAuctions.slice(0, i).reduce((total, prevLot) => {
          return total + +prevLot.duration
        }, 0)
      }
      const lotStart = startDate.add(cumulativeDuration, 'minute').set('millisecond', 0)
      const lotEnd = lotStart.add(lot.duration, 'minute').set('millisecond', 0)
      console.log('lotStart', lot.id, lotStart)
      await supabase
        .from('auctions')
        .update({
          start_at: lotStart.toISOString(),
          end_at: lotEnd.toISOString()
        })
        .eq('id', lot.id)
    })
  }

  updateAuction()
}

const { resetAuction } = useAuctionReset()

async function handleTrainingAction() {
  trainingLoading.value = true
  try {
    const isStart = status.value?.label === 'upcoming'

    await resetAuction(route.params.auctionId, route.params.auctionGroupId, {
      includeBots: true,
      includeStatus: true,
      ...(isStart ? { isRestart: false } : { useDefaultTiming: true }),
      forceRefresh,
      clearLocalLogs: _clearLocalLogs.value,
      onSuccess: (query) => navigateTo({ query }, { replace: true })
    })
  } catch (error) {
    console.error('Training action failed:', error)
  } finally {
    trainingLoading.value = false
  }
}

onMounted(() => {
  tabs.value = 0
})

watch(
  () => route.params.auctionId,
  (newAuctionId, previousAuctionId) => {
    if (newAuctionId !== previousAuctionId) {
      tabs.value = 0
    }
  }
)

// Track previous start_at to detect resets from other users
const previousStartAt = ref(auction.value?.start_at)

// Watch for auction reset (start_at changes to a future date)
// This handles when another buyer/admin triggers reset - redirect to lot 1
watch(
  () => auction.value?.start_at,
  async (newStartAt, oldStartAt) => {
    // Skip if no change or initial load
    if (!newStartAt || newStartAt === oldStartAt || !oldStartAt) {
      previousStartAt.value = newStartAt
      return
    }

    const newStart = dayjs(newStartAt)
    const oldStart = dayjs(oldStartAt)

    // Detect reset: new start time is in the future AND significantly different from old
    const isReset = newStart.isAfter(dayjs()) && Math.abs(newStart.diff(oldStart, 'second')) > 10

    if (isReset && route.params.auctionGroupId) {
      console.log('[Buyer Reset Detection] Auction was reset, checking for multi-lot redirect...')

      // Fetch all lots in the group to check if multi-lot
      const { data: groupAuctions } = await supabase
        .from('auctions')
        .select('id')
        .eq('auctions_group_settings_id', route.params.auctionGroupId)
        .order('lot_number')

      if (groupAuctions && groupAuctions.length > 1) {
        const lot1Id = groupAuctions[0].id
        const currentLotId = route.params.auctionId

        // Only redirect if not already on lot 1
        if (currentLotId !== lot1Id) {
          console.log('[Buyer Reset Detection] Redirecting to lot 1:', lot1Id)

          // Build query params
          const newQuery = {}
          if (route.query.multilot) newQuery.multilot = route.query.multilot
          if (route.query.type) newQuery.type = route.query.type
          if (route.query.bots) newQuery.bots = route.query.bots

          const targetPath = `/auctions/${route.params.auctionGroupId}/lots/${lot1Id}/buyer`

          // Use navigateTo for client-side navigation (avoids SSR/hydration issues with Vuetify transitions)
          await navigateTo(
            {
              path: targetPath,
              query: newQuery
            },
            { replace: true }
          )
        }
      }
    }

    previousStartAt.value = newStartAt
  }
)

watch(isExporting, async (newValue, oldValue) => {
  if (oldValue && !newValue) {
    if (!import.meta.client) {
      return
    }

    await nextTick()
    const storedIndex = tabs.value ?? 0
    const tabButtons = Array.from(document.querySelectorAll('.v-tabs .v-tab'))
    const activeIndex = tabButtons.findIndex(
      (btn) =>
        btn.classList.contains('v-tab--selected') || btn.getAttribute('aria-selected') === 'true'
    )
    if (activeIndex !== storedIndex && tabButtons[storedIndex]) {
      tabButtons[storedIndex].click()
    }
  }
})

/**
 * Wrapper function for PDF export that uses the composable
 * Called when user clicks export button or from query parameter trigger
 */
async function handleExportPdf(_event) {
  // Ignore event parameter if called from event listener
  // (event will be a DOM Event, not export options)
  await exportPdf()
}

// Watch for export trigger from query parameter
watch(
  () => route.query.trigger_export,
  async (triggerExport) => {
    if (triggerExport === 'true' && status.value?.label === 'closed') {
      // Remove the query param to prevent re-triggering on refresh
      await navigateTo(
        {
          query: { ...route.query, trigger_export: undefined }
        },
        { replace: true }
      )

      // Trigger the export
      await handleExportPdf()
    }
  },
  { immediate: true }
)

usePresences({
  channelName: `presences_${route.params.auctionId}`,
  callback: ({ newPresences, leftPresences }) => {
    if (newPresences) {
      presences.value = [...presences.value, ...newPresences]
    }

    if (leftPresences) {
      presences.value = presences.value.filter((currPresence) => {
        return !leftPresences.find((leftPresence) => leftPresence.user === currPresence.user)
      })
    }
  }
})

provide('presences', presences)
</script>

<style>
/* Force desktop layout during PDF export */
.pdf-export-layout-frozen {
  width: 1440px !important;
  max-width: 1440px !important;
  margin: 0 auto !important;
  overflow: hidden !important;
}

.pdf-export-layout-frozen body {
  width: 1440px !important;
  max-width: 1440px !important;
  margin: 0 auto !important;
  overflow: hidden !important;
}

/* Ensure all containers respect the fixed width during export */
.pdf-export-layout-frozen .v-container {
  max-width: 1440px !important;
}
</style>
<style>
.currency-suffix {
  font-size: 14px;
  margin-left: 5px;
}
</style>

<style scoped>
.custom-tab-border {
  border-radius: 4px 4px 0 0 !important;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-bottom: none !important;
}

.max-w-tab {
  max-width: 250px;
  display: inline-block;
}
.font-weight-500 {
  font-weight: 500;
}
</style>
