<template>
  <div>
    <v-container v-if="auction" :fluid="width < 1440" class="mb-4 pa-5">
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
            >{{ auction.lot_name }}</span
          >
          <v-tooltip v-if="auction.lot_name" activator="parent" content-class="bg-white border">
            <span>
              {{ auction.lot_name }}
            </span>
          </v-tooltip>
        </v-tab>
        <v-spacer />

        <v-tab
          :class="
            tabs === 1 ? 'bg-white font-weight-semibold' : 'bg-grey-ligthen-3 text-grey-darken-4'
          "
          class="custom-tab-border py-2 px-5"
        >
          {{ t('tabs.terms') }}
        </v-tab>
      </v-tabs>
      <v-tabs-window v-model="tabs">
        <v-tabs-window-item>
          <AuctionsDutchSellerView v-if="auction.type === 'dutch'" />
          <AuctionsEnglishSellerView
            v-else-if="auction.type === 'reverse' || auction.type === 'sealed-bid'"
          />
          <AuctionsJapaneseSellerView v-else-if="auction.type === 'japanese'" />
        </v-tabs-window-item>
        <v-tabs-window-item>
          <TermsAllTerms :auction-id="route.params.auctionId" />
        </v-tabs-window-item>
      </v-tabs-window>
    </v-container>
    <AuctionsEndDialogSeller />
    <AuctionsIdleDialog v-if="status?.label === 'active'" />
    <v-snackbar v-model="refreshError" location="middle center" :timeout="-1">
      <div class="d-flex align-center">
        <v-icon icon="mdi-alert-circle-outline" color="error" size="x-large" class="mr-2" />
        <span
          ><b>{{ t('messages.connectionError') }}</b></span
        >
      </div>
    </v-snackbar>
  </div>
</template>

<script setup>
import dayjs from 'dayjs'
import { startTour, getVisitorId } from '@intercom/messenger-js-sdk'

definePageMeta({
  middleware: ['terms'],
  // Force page re-mount when auctionId changes (needed for multi-lot navigation)
  // Also re-mount on training reset (t param) to clear all stale state
  key: (route) => `${route.params.auctionId}-${route.query.t || ''}`
})

// Use translations
const { t } = useTranslations()

const route = useRoute()
const { user, getSession } = useUser()
const { width } = useDisplay()

const { auction, lastAuctionUpdate, forceRefresh } = await useUserAuctionBids({
  auctionId: route.params.auctionId
})
const { status } = useAuctionTimer(auction)

// Provide forceRefresh to child components for immediate updates after bid submission
provide('forceRefresh', forceRefresh)

// Get training type info (including isMultilot based on auction count)
const { isMultilot } = await useTrainingType({ auctionId: route.params.auctionId })

// Training mode detection (both single-lot and multi-lot)
const isTrainingMode = computed(() => {
  return auction.value?.usage === 'training' || auction.value?.usage === 'test'
})

// Multi-lot training detection (based on actual auction count, not query param)
const isMultiLotTraining = computed(() => {
  return isMultilot.value && isTrainingMode.value
})

// Multi-lot prebid tracking
// IMPORTANT: Try to inject from parent ([auctionGroupId].vue) first to share the same reactive instance
// This ensures that when we call onPrebidSubmitted(), the parent's computed will react
const parentMultiLotPrebids = inject('parentMultiLotPrebids', null)
const multiLotPrebids =
  parentMultiLotPrebids ||
  (isMultilot.value
    ? await useMultiLotPrebids({ auctionGroupId: route.params.auctionGroupId })
    : null)

const nextLotNeedingPrebid = computed(() => {
  if (!multiLotPrebids) return null
  return multiLotPrebids.nextLotNeedingPrebid.value
})

const allPrebidsPlaced = computed(() => {
  if (!multiLotPrebids) return true
  return multiLotPrebids.allPrebidsPlaced.value
})

// For single-lot training: track prebid locally
const singleLotHasPrebid = computed(() => {
  if (!isTrainingMode.value || isMultilot.value) return true // Let multi-lot logic handle it
  // Sealed-bid has no pre-bid phase - bids are placed during the active auction
  if (auction.value?.type === 'sealed-bid') return true
  const currentUserId = user.value?.id
  // If user not loaded yet, assume no prebid (show guidance)
  if (!currentUserId) return false
  const currentUserPrebids =
    auction.value?.bids?.filter((b) => b.type === 'prebid' && b.seller_id === currentUserId) || []
  return currentUserPrebids.length > 0
})

// Check if current lot has a prebid (unified for single-lot and multi-lot)
const currentLotHasPrebid = computed(() => {
  // Sealed-bid has no pre-bid phase - always true
  if (auction.value?.type === 'sealed-bid') return true
  if (isMultilot.value) {
    if (!multiLotPrebids) return true
    return multiLotPrebids.currentLotHasPrebid(route.params.auctionId)
  }
  return singleLotHasPrebid.value
})

// Track when prebid was just placed for "switch to next lot" tooltip
const showNextLotTooltip = computed(() => {
  if (!multiLotPrebids) return false
  return (
    multiLotPrebids.justPlacedPrebid.value && !allPrebidsPlaced.value && nextLotNeedingPrebid.value
  )
})

function navigateToNextLotForPrebid() {
  if (!nextLotNeedingPrebid.value) return
  const query = { ...route.query }
  navigateTo({
    path: `/auctions/${route.params.auctionGroupId}/lots/${nextLotNeedingPrebid.value.id}/supplier`,
    query
  })
}

// Provide multi-lot prebids composable to child components (including Stepper)
if (multiLotPrebids) {
  provide('multiLotPrebids', multiLotPrebids)
  provide('refreshMultiLotPrebids', multiLotPrebids.refreshPrebidStatus)
}

// Provide training state to child components (works for both single-lot and multi-lot)
provide('isTrainingMode', isTrainingMode)
provide('isMultiLotTraining', isMultiLotTraining)
provide('currentLotHasPrebid', currentLotHasPrebid)
provide('showNextLotTooltip', showNextLotTooltip)
provide('nextLotNeedingPrebid', nextLotNeedingPrebid)

// Handler for when prebid is submitted from PreBidTableSeller
function onPrebidSubmitted() {
  if (multiLotPrebids) {
    multiLotPrebids.onPrebidSubmitted(route.params.auctionId)
  }
}

// Provide prebid submitted handler
provide('onPrebidSubmitted', onPrebidSubmitted)

// Watch for prebid changes via realtime subscription (more scalable than manual calls)
// This automatically detects when a prebid is placed for any auction type
watch(
  () => auction.value?.bids,
  (newBids, oldBids) => {
    if (!multiLotPrebids || !newBids) return

    // Check if a new prebid was added by the current user
    const currentUserId = user.value?.id
    if (!currentUserId) return

    const newPrebids = newBids.filter((b) => b.type === 'prebid' && b.seller_id === currentUserId)
    const oldPrebids = (oldBids || []).filter(
      (b) => b.type === 'prebid' && b.seller_id === currentUserId
    )

    // If we have more prebids now than before, mark this lot as having a prebid
    if (newPrebids.length > oldPrebids.length) {
      multiLotPrebids.onPrebidSubmitted(route.params.auctionId)
    }
  },
  { deep: true }
)

// Create a trigger for opening EndDialog from console
const openEndDialogTrigger = ref(false)
provide('openEndDialogTrigger', openEndDialogTrigger)

const refreshError = ref(false)
const tabs = ref(0)

const { track } = usePresences({ channelName: `presences_${route.params.auctionId}` })
getSession().then(() => {
  track()
})

const intervalId = setInterval(() => {
  const isStale = lastAuctionUpdate.value.add(45, 's').isBefore(dayjs())
  const secondsSinceUpdate = dayjs().diff(lastAuctionUpdate.value, 'second')

  if (isStale) {
    console.error(
      `[Auction Connection] FAILED - Last update was ${secondsSinceUpdate}s ago (threshold: 45s)`
    )
  } else {
    console.log(`[Auction Connection] OK - Last update was ${secondsSinceUpdate}s ago`)
  }

  refreshError.value = isStale
}, 10000)

onUnmounted(async () => {
  clearInterval(intervalId)
  // Cleanup global function
  delete window.testOpenEndDialogSupplier
})

// onMounted(async () => {
//   if ((auction.value.usage === 'training' || auction.value.usage === 'test')
//    && status.value.label === 'upcoming') {
//     const tours = {
//       'reverse': '632820',
//       'sealed-bid': '632820',
//       'dutch': '632834',
//       'japanese': '632835'
//     }

//     const visitorId = getVisitorId()

//     // console.log('startTour', tours[auction.value.type], visitorId)
//     startTour(tours[auction.value.type], {
//       visitorId
//     })
//   }
// })

// Expose EndDialog opener for console testing
window.testOpenEndDialogSupplier = () => {
  openEndDialogTrigger.value = true
}

const router = useRouter()

// Get next auction for auto-navigation
const { getNextAuction } = useNextAuction({ auction })

watch(
  status,
  async (newStatus, oldStatus) => {
    if (newStatus?.label) {
      const currentQuery = { ...route.query }
      currentQuery.status = status.value.label
      currentQuery.usage = auction.value.usage
      currentQuery.type = auction.value.type
      if (route.query.multilot) {
        currentQuery.multilot = route.query.multilot
      }

      // Update the URL without triggering a page reload
      router.replace({
        query: currentQuery
      })

      // Auto-navigate to next lot when current lot closes (for multi-lot training)
      if (
        isMultiLotTraining.value &&
        newStatus?.label === 'closed' &&
        oldStatus?.label === 'active'
      ) {
        const nextLot = await getNextAuction()
        if (nextLot) {
          // Navigate to next active lot after a short delay
          setTimeout(() => {
            navigateTo({
              path: `/auctions/${route.params.auctionGroupId}/lots/${nextLot.id}/supplier`,
              query: currentQuery
            })
          }, 1500) // Short delay to allow user to see lot closed state
        }
      }
    }
  },
  { immediate: true }
)
</script>
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
</style>
