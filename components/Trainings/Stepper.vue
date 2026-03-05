<template>
  <v-sheet
    class="text-primary w-100 rounded-lg pa-6 pb-8 border"
    :class="auctionColors?.wrapperColor"
  >
    <div v-if="translationsReady">
      <div class="d-flex align-center justify-space-between custom-marign">
        <div class="text-h4">
          {{
            t(`auctionDescriptions.${auctionType}.title`) +
            (isDutchPrebid ? '  ' + t('auctionDescriptions.demoItemSharedText.prebid') : '')
          }}
        </div>
      </div>

      <div v-if="auctionType" class="stepper-container d-flex align-center">
        <div class="d-flex flex-column ga-3 min-step-width">
          <div
            class="d-flex align-center relative cursor-pointer"
            @click="router.push(`/trainings/${auctionGroupId}?auctionId=${auctionId}`)"
          >
            <div
              class="text-center text-body-2 custom-chip-step"
              :class="validatedSteps >= 1 ? 'bg-primary text-white' : ''"
            >
              1
            </div>
            <div class="dashed-line" />
            <div class="text-body-1 absolute-description-text">
              {{ t(`stepper.firstStep`) }}
            </div>
          </div>
        </div>

        <div class="d-flex flex-column ga-3 min-step-width">
          <div
            class="d-flex align-center relative cursor-pointer"
            @click="router.push(`/auctions/${auctionGroupId}/lots/${auctionId}/terms`)"
          >
            <div
              class="text-center text-body-2 custom-chip-step"
              :class="validatedSteps >= 2 ? 'bg-primary text-white' : ''"
            >
              2
            </div>
            <div class="dashed-line" />
            <div class="text-body-1 absolute-description-text">
              {{ t(`stepper.secondStep`) }}
            </div>
          </div>
        </div>

        <div class="d-flex flex-column ga-3 min-step-width">
          <div
            class="d-flex align-center relative cursor-pointer"
            @click="router.push(`/auctions/${auctionGroupId}/lots/${auctionId}/supplier`)"
          >
            <div
              class="text-center text-body-2 custom-chip-step"
              :class="validatedSteps >= 3 ? 'bg-primary text-white' : ''"
            >
              3
            </div>
            <div class="dashed-line" />
            <div class="text-body-1 absolute-description-text">
              {{ t(`stepper.thirdStep`) }}
            </div>
          </div>
        </div>

        <!-- Step 4: Show button when ready, otherwise show step chip -->
        <div v-if="validatedSteps >= 4" class="d-flex align-center training-btn-wrapper">
          <!-- "You're all set!" tooltip - shows when prebids are placed (single-lot or multi-lot) -->
          <TrainingsGuidanceTooltip
            v-if="showPrebidProgressTooltip"
            tooltip-id="training-all-set"
            :title="t('guidance.prebid.allSet')"
            :message="allSetTooltipMessage"
            location="bottom"
            :condition="validatedSteps >= 4 && isUpcoming"
          >
            <template #default="{ props: tooltipProps }">
              <v-btn
                v-bind="tooltipProps"
                height="40"
                variant="flat"
                class="text-body-2 font-weight-semibold training-btn"
                :loading="loading"
                :disabled="isButtonDisabled"
                @click="handleReset"
              >
                {{ fourthStepText }}
              </v-btn>
            </template>
          </TrainingsGuidanceTooltip>
          <v-btn
            v-else
            height="40"
            variant="flat"
            class="text-body-2 font-weight-semibold training-btn"
            :loading="loading"
            :disabled="isButtonDisabled"
            @click="handleReset"
          >
            {{ fourthStepText }}
            <!-- Play icon for Start Training -->
            <svg
              v-if="showPlayIcon"
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
              v-if="showResetIcon"
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
          </v-btn>
          <div class="dashed-line-btn" />
        </div>

        <div v-else class="d-flex flex-column ga-3 min-step-width">
          <div class="d-flex align-center relative">
            <div class="text-center text-body-2 custom-chip-step">4</div>
            <div class="dashed-line" />
            <div class="text-body-1 absolute-description-text">
              {{ t('stepper.fourthStepPlay') }}
            </div>
          </div>
        </div>

        <div class="d-flex align-center h-100">
          <div
            v-if="auctionConditions > 1"
            class="vertical-line"
            :style="auctionConditions !== 4 ? 'height: 100%;' : 'height: 120%;'"
          />
        </div>

        <div
          class="d-flex flex-column justify-center"
          :class="auctionConditions > 2 ? (auctionConditions !== 4 ? 'ga-2' : 'ga-1') : 'ga-9'"
        >
          <div
            v-for="scenario in scenarios"
            :key="scenario"
            class="d-flex ga-3 min-separated-chip-width"
          >
            <div class="d-flex align-center">
              <div class="dashed-line-2" />
              <div
                class="text-center text-body-2 custom-chip mr-3"
                :class="isScenarioValidated(scenario) ? 'bg-primary text-white' : ''"
              >
                <v-icon v-if="isScenarioValidated(scenario)" color="white"> mdi-check </v-icon>
              </div>
              <div class="text-body-1">
                {{ scenario }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-sheet>
</template>

<script setup>
import { watch, computed, ref, onMounted, onUnmounted, inject } from 'vue'
import dayjs from 'dayjs'
import { clearAuctionMemoizeCache } from '~/composables/useUserAuctionBids'

// Inject forceRefresh provided by supplier/buyer page to refresh data in-place (no page remount)
const forceRefresh = inject('forceRefresh', null)

const route = useRoute()
const { t, pending } = useTranslations('trainings')
const translationsReady = computed(() => !pending.value)
const auctionId = ref(null)
const { auctionGroupId } = route.params
auctionId.value = route.params.auctionId
if (route.params.auctionId) {
  auctionId.value = route.params.auctionId
} else if (route.query.auctionId) {
  auctionId.value = route.query.auctionId
}
const { auctionType, isHandicaps, isMultilot, isPrebid } = await useTrainingType({
  auctionId: auctionId.value
})

// Multi-lot training detection (based on actual auction count, with query param fallback)
const isMultiLotTraining = computed(() => {
  return isMultilot.value || route.query.multilot === 'true'
})

// Multi-lot prebid tracking - uses singleton pattern so Stepper and supplier.vue share the same instance
const multiLotPrebids =
  isMultilot.value || route.query.multilot === 'true'
    ? await useMultiLotPrebids({ auctionGroupId })
    : null

const allMultiLotPrebidsPlaced = computed(() => {
  // Access prebidVersion FIRST to ensure reactivity tracking
  const _version = multiLotPrebids?.prebidVersion?.value ?? 0

  if (!isMultiLotTraining.value || !multiLotPrebids) {
    return true
  }
  return multiLotPrebids.allPrebidsPlaced.value
})

// Check if ANY lot in the multi-lot group requires prebid
// Used instead of isPrebid (which only checks the current lot)
const anyLotRequiresPrebid = computed(() => {
  if (!isMultiLotTraining.value || !multiLotPrebids) return false
  return multiLotPrebids.lotsRequiringPrebid.value.length > 0
})

const prebidProgress = computed(() => {
  if (!isMultiLotTraining.value || !multiLotPrebids) {
    return { completed: 0, total: 0 }
  }
  return multiLotPrebids.prebidProgress.value
})

// Track if user dismissed the "All set" tooltip (e.g., by clicking Start Training)
const allSetTooltipDismissed = ref(false)

// Tooltip message adapts for sealed-bid (no mention of pre-bids)
const allSetTooltipMessage = computed(() => {
  if (auctionType.value === 'sealed-bid') {
    return t('guidance.training.startTrainingMessage')
  }
  return `${t('guidance.prebid.allSetMessage')}\n\n${t('guidance.prebid.allSetSubMessage')}`
})

// For single-lot: check if prebid has been placed
const singleLotHasPrebid = computed(() => {
  if (isMultiLotTraining.value) return false // Let multi-lot logic handle it
  return bids.value?.some((bid) => bid.type === 'prebid') ?? false
})

const showPrebidProgressTooltip = computed(() => {
  // Access prebidVersion FIRST to ensure reactivity tracking
  const _version = multiLotPrebids?.prebidVersion?.value ?? 0

  // Don't show if user dismissed it
  if (allSetTooltipDismissed.value) {
    return false
  }

  // Don't show if training is starting or in progress
  if (startingTraining.value) {
    return false
  }

  // For multi-lot: don't show if any lot has started
  if (isMultiLotTraining.value) {
    if (hasAnyLotStarted.value || isTrainingInProgressForGroup.value) {
      return false
    }
    // Sealed-bid has no pre-bid phase - show tooltip immediately for multi-lot
    if (auctionType.value === 'sealed-bid') {
      return true
    }
    if (!allMultiLotPrebidsPlaced.value) {
      return false
    }
    return anyLotRequiresPrebid.value
  }

  // For single-lot: check realtime status, not just route query
  const realtimeStatus = currentAuctionStatus.value?.label
  if (realtimeStatus === 'active' || realtimeStatus === 'closed') {
    return false
  }

  // Sealed-bid has no pre-bid phase - show tooltip immediately when upcoming
  if (auctionType.value === 'sealed-bid') {
    return true
  }

  // For single-lot: show when prebid has been placed and auction is upcoming
  if (!singleLotHasPrebid.value) {
    return false
  }
  return isPrebid.value
})

// Get auction data to check remaining time for sealed-bid
const { auction: realtimeAuction, fetchAuction: fetchRealtimeAuction } = useRealtimeAuction({
  auctionId: auctionId.value
})
await fetchRealtimeAuction()

// For multi-lot: track the first lot's status using useAuctionTimer (reactive, updates every second)
const firstLotId = multiLotPrebids?.lots?.value?.[0]?.id
const { auction: firstLotAuction, fetchAuction: fetchFirstLotAuction } =
  firstLotId && firstLotId !== auctionId.value
    ? useRealtimeAuction({ auctionId: firstLotId })
    : { auction: realtimeAuction, fetchAuction: fetchRealtimeAuction }

if (firstLotId && firstLotId !== auctionId.value) {
  await fetchFirstLotAuction()
}

// useAuctionTimer provides reactive status that updates every second
const { status: firstLotStatus } = useAuctionTimer(firstLotAuction)

// For single-lot: use timer status directly (not route status)
const { status: currentAuctionStatus } = useAuctionTimer(realtimeAuction)

// For multi-lot: we need to check ALL lots' status, not just the first one
// Because lots may have different durations and end at different times
// Use a reactive now that updates every second to check all lots
const now = ref(dayjs())
let nowIntervalId = null

onMounted(() => {
  nowIntervalId = setInterval(() => {
    now.value = dayjs()
  }, 1000)
})

onUnmounted(() => {
  if (nowIntervalId) {
    clearInterval(nowIntervalId)
  }
})

// Check if ANY lot in the group is still active
const isAnyLotActive = computed(() => {
  if (!isMultiLotTraining.value || !multiLotPrebids?.lots?.value?.length) return false

  return multiLotPrebids.lots.value.some((lot) => {
    if (!lot.start_at || !lot.end_at) return false
    const startAt = dayjs(lot.start_at)
    const endAt = dayjs(lot.end_at)
    return now.value.isAfter(startAt) && now.value.isBefore(endAt)
  })
})

// Check if ANY lot has started (training is no longer upcoming)
const hasAnyLotStarted = computed(() => {
  if (!isMultiLotTraining.value || !multiLotPrebids?.lots?.value?.length) return false

  return multiLotPrebids.lots.value.some((lot) => {
    if (!lot.start_at) return false
    return now.value.isAfter(dayjs(lot.start_at))
  })
})

// Check if ALL lots in the group have ended
const areAllLotsEnded = computed(() => {
  if (!isMultiLotTraining.value || !multiLotPrebids?.lots?.value?.length) return false

  // At least one lot must have started (not all upcoming)
  if (!hasAnyLotStarted.value) return false

  // All lots must have ended
  return multiLotPrebids.lots.value.every((lot) => {
    if (!lot.end_at) return false
    return now.value.isAfter(dayjs(lot.end_at))
  })
})

// Use the useTrainings composable
const {
  validatedScenarios,
  getAuctionsAndScenarios,
  updateScenariosForAllClosedLots,
  clearProcessedLots
} = await useTrainings({ auctionGroupId })

// Use realtime bids to track if prebid has been placed
const { bids, fetchBids } = useRealtimeBids({ auctionId: auctionId.value })
const isDutchPrebid = computed(() => {
  return auctionType.value?.includes('dutch') && isPrebid.value
})

// Optimistic state: true immediately when clicking "Start Training" (before API response)
const startingTraining = ref(false)

// Watch for route changes to update scenarios when auction ends
watch(
  () => route.query.status,
  async () => {
    await getAuctionsAndScenarios()
  },
  { deep: true }
)

// Reset startingTraining when auction becomes 'active' (based on realtime timer, not route)
watch(
  () =>
    isMultiLotTraining.value ? firstLotStatus.value?.label : currentAuctionStatus.value?.label,
  (statusLabel) => {
    if (statusLabel === 'active' || statusLabel === 'closed') {
      startingTraining.value = false
    }
  }
)

// For multi-lot: watch first lot status to update scenarios when training ends
watch(
  () => firstLotStatus.value?.label,
  async (statusLabel) => {
    if (isMultiLotTraining.value && statusLabel === 'closed') {
      // Update scenarios for all closed lots in the group
      await updateScenariosForAllClosedLots()
      await getAuctionsAndScenarios()
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await getAuctionsAndScenarios()
  await fetchBids()

  // For multi-lot: update scenarios if already closed
  if (isMultiLotTraining.value && route.query.status === 'closed') {
    await updateScenariosForAllClosedLots()
    await getAuctionsAndScenarios()
  }
})

const auctionConditions = computed(() => {
  const scenarioObj = t(`scenarios.${auctionType.value}`)
  return scenarioObj && typeof scenarioObj === 'object' ? Object.keys(scenarioObj).length : 0
})

const scenarios = computed(() => {
  const scenarioObj = t(`scenarios.${auctionType.value}`)
  return scenarioObj && typeof scenarioObj === 'object' ? Object.values(scenarioObj) : [] // Convert to array of values
})

// Map scenario names to database field names
const scenarioDbFieldsMapping = computed(() => {
  const type = auctionType.value
  const returnObj = {}
  if (type === 'sealed-bid') {
    Object.assign(returnObj, {
      [t(`scenarios.${type}.first`)]: 'trainings_live_win',
      [t(`scenarios.${type}.second`)]: 'trainings_losing'
    })
  }
  if (type === 'english') {
    return {
      [t(`scenarios.${type}.first`)]: 'trainings_live_win',
      [t(`scenarios.${type}.second`)]: 'trainings_losing'
    }
  } else if (type === 'dutch') {
    if (isPrebid.value) {
      Object.assign(returnObj, {
        [t(`scenarios.${type}.first`)]: 'trainings_prebid_win',
        [t(`scenarios.${type}.second`)]: 'trainings_live_win',
        [t(`scenarios.${type}.third`)]: 'trainings_losing'
      })
    } else {
      Object.assign(returnObj, {
        [t(`scenarios.${type}.second`)]: 'trainings_live_win',
        [t(`scenarios.${type}.third`)]: 'trainings_losing'
      })
    }
  } else if (type === 'dutch-preferred') {
    if (isPrebid.value) {
      Object.assign(returnObj, {
        [t(`scenarios.${type}.first`)]: 'trainings_prebid_win',
        [t(`scenarios.${type}.second`)]: 'trainings_live_win',
        [t(`scenarios.${type}.third`)]: 'trainings_losing' // lose during restricted access
      })
    } else {
      Object.assign(returnObj, {
        [t(`scenarios.${type}.second`)]: 'trainings_live_win',
        [t(`scenarios.${type}.third`)]: 'trainings_losing' // lose during restricted access
      })
    }
  } else if (type === 'japanese') {
    if (isPrebid.value) {
      Object.assign(returnObj, {
        [t(`scenarios.${type}.first`)]: 'trainings_live_win',
        [t(`scenarios.${type}.second`)]: 'trainings_losing'
      })
    } else {
      Object.assign(returnObj, {
        [t(`scenarios.${type}.first`)]: 'trainings_live_win',
        [t(`scenarios.${type}.third`)]: 'trainings_losing'
      })
    }
  } else if (type === 'japanese-no-rank') {
    // Japanese no-rank only has one scenario (complete the training)
    Object.assign(returnObj, {
      [t(`scenarios.${type}.first`)]: 'trainings_live_win'
    })
  }
  return returnObj
})

// Check if a scenario is validated (has a date)
const isScenarioValidated = (scenarioName) => {
  const fieldName = scenarioDbFieldsMapping.value[scenarioName]
  return (
    fieldName &&
    validatedScenarios.value[fieldName] !== null &&
    validatedScenarios.value[fieldName] !== undefined
  )
}

const auctionColors = computed(() => {
  if (!auctionType.value) {
    return { wrapperColor: '', runBtnBorder: '', runBtnColor: '' }
  }
  if (auctionType.value?.includes('english')) {
    return {
      wrapperColor: 'bg-blue-light',
      runBtnBorder: 'pale-aero',
      runBtnColor: 'rgb(var(--v-theme-pale-aero))'
    }
  } else if (auctionType.value?.includes('dutch')) {
    return {
      wrapperColor: 'bg-purple',
      runBtnBorder: 'purple-3',
      runBtnColor: 'rgb(var(--v-theme-purple-3))'
    }
  } else if (auctionType.value?.includes('japanese')) {
    return {
      wrapperColor: 'custom-yellow',
      runBtnBorder: 'yellow-2',
      runBtnColor: 'rgb(var(--v-theme-yellow-2))'
    }
  } else {
    return {
      wrapperColor: 'custom-orange',
      runBtnBorder: 'orange-2',
      runBtnColor: 'rgb(var(--v-theme-orange-2))'
    }
  }
})

const validatedSteps = computed(() => {
  // Check if route is for supplier or buyer auction page
  const isAuctionPage =
    route.name?.includes('auctions-auctionGroupId-lots-auctionId') &&
    (route.name?.endsWith('-supplier') || route.name?.endsWith('-buyer'))

  if (route.name === 'trainings-auctionGroupId') {
    return 1
  } else if (route.name === 'auctions-auctionGroupId-lots-auctionId-terms') {
    return 2
  } else if (isAuctionPage) {
    // Return 5 if auction is closed, 4 otherwise
    return route.query.status === 'closed' ? 5 : 4
  }
  return 0
})

// Check if auction is waiting to start (15-second countdown period after clicking Start Training)
const isWaitingToStart = computed(() => {
  if (!realtimeAuction.value?.start_at) return false
  const startAt = dayjs(realtimeAuction.value.start_at)
  return dayjs().isBefore(startAt)
})

// For multi-lot: training is in progress if ANY lot is still active
// This handles cases where lots have different durations
const isTrainingInProgressForGroup = computed(() => {
  if (!isMultiLotTraining.value) return false
  // Check if any lot is still running (between start_at and end_at)
  return isAnyLotActive.value
})

// For multi-lot: all lots are closed only when ALL lots have ended
const areAllLotsClosedInGroup = computed(() => {
  if (!isMultiLotTraining.value) return false
  return areAllLotsEnded.value
})

// Check if sealed-bid auction is in an active 2-minute training session
const isInActiveTrainingSession = computed(() => {
  if (auctionType.value !== 'sealed-bid') return false
  if (!realtimeAuction.value?.end_at) return false

  const endAt = dayjs(realtimeAuction.value.end_at)
  const now = dayjs()
  const remainingMinutes = endAt.diff(now, 'minute', true)

  // If remaining time is <= 3 minutes, it's an active 2-minute training session
  // (using 3 min threshold to account for slight timing variations)
  return remainingMinutes > 0 && remainingMinutes <= 3
})

// For sealed-bid: watch auction end time and update status when training ends
const router = useRouter()
let sealedBidTimer = null

watch(
  () => realtimeAuction.value?.end_at,
  (endAt) => {
    if (auctionType.value !== 'sealed-bid' || !endAt) return

    // Clear any existing timer
    if (sealedBidTimer) {
      clearTimeout(sealedBidTimer)
      sealedBidTimer = null
    }

    const endTime = dayjs(endAt)
    const now = dayjs()
    const msUntilEnd = endTime.diff(now)

    // If auction already ended, update status to closed
    if (msUntilEnd <= 0) {
      if (route.query.status === 'active') {
        router.replace({ query: { ...route.query, status: 'closed' } })
      }
    } else if (msUntilEnd <= 180000) {
      // If ending within 3 minutes, set a timer to update status when it ends
      sealedBidTimer = setTimeout(() => {
        if (route.query.status === 'active') {
          router.replace({ query: { ...route.query, status: 'closed' } })
        }
      }, msUntilEnd + 500) // Add small buffer
    }
  },
  { immediate: true }
)

// Cleanup timer on unmount
onUnmounted(() => {
  if (sealedBidTimer) {
    clearTimeout(sealedBidTimer)
  }
})

const fourthStepText = computed(() => {
  const status = route.query.status

  // For multi-lot: check group-level status
  if (isMultiLotTraining.value) {
    // If ANY lot is still active, show "Training in Progress"
    if (startingTraining.value || isTrainingInProgressForGroup.value) {
      return t('stepper.trainingInProgress')
    }
    // If training has started but not all lots ended, show "Training in Progress"
    // (handles edge cases like brief gaps between lots or viewing a closed lot)
    if (hasAnyLotStarted.value && !areAllLotsClosedInGroup.value) {
      return t('stepper.trainingInProgress')
    }
    // If ALL lots are closed, show "Reset Training"
    if (areAllLotsClosedInGroup.value) {
      return t('stepper.fourthStepReset')
    }
    // Otherwise (upcoming), show "Start Training"
    return t('stepper.fourthStepStart')
  }

  // Single-lot logic
  if (status === 'closed') {
    return t('stepper.fourthStepReset')
  }
  // Optimistic update: show "Training in Progress" immediately when starting
  if (startingTraining.value || status === 'active') {
    // Sealed-bid: show "Start Training" unless in active 2-minute session
    if (auctionType.value === 'sealed-bid' && !startingTraining.value) {
      // Show "Training in Progress" during countdown or active 2-minute session
      return isWaitingToStart.value || isInActiveTrainingSession.value
        ? t('stepper.trainingInProgress')
        : t('stepper.fourthStepStart')
    }
    return t('stepper.trainingInProgress')
  }
  return t('stepper.fourthStepStart')
})

// Show play icon (when not closed and not in active training)
const showPlayIcon = computed(() => {
  const status = route.query.status

  // For multi-lot: check group-level status
  if (isMultiLotTraining.value) {
    // Hide if closed (realtime or route fallback)
    if (areAllLotsClosedInGroup.value || status === 'closed') return false
    if (startingTraining.value || isTrainingInProgressForGroup.value) return false
    // Also hide if training has started (even between lot gaps)
    if (hasAnyLotStarted.value) return false
    return true
  }

  // Single-lot logic
  if (status === 'closed') return false
  // Hide play icon when starting training (optimistic) or active
  if (startingTraining.value || status === 'active') {
    // Sealed-bid exception: show play icon if not waiting to start AND not in active 2-minute session
    if (
      auctionType.value === 'sealed-bid' &&
      !startingTraining.value &&
      !isWaitingToStart.value &&
      !isInActiveTrainingSession.value
    ) {
      return true
    }
    return false
  }
  return true
})

// Show reset icon (when all closed)
const showResetIcon = computed(() => {
  const status = route.query.status
  // For multi-lot: show reset only when ALL lots are closed
  if (isMultiLotTraining.value) {
    return areAllLotsClosedInGroup.value
  }
  return status === 'closed'
})

// Helper computed for upcoming status
const isUpcoming = computed(() => {
  const status = route.query.status
  return status === 'upcoming' || !status
})

// Disable button when training is in progress, or when prebid is required but not placed
const isButtonDisabled = computed(() => {
  const status = route.query.status
  const isSealedBid = auctionType.value === 'sealed-bid'

  // Check if prebid has been placed (for current lot)
  const hasPrebid = bids.value?.some((bid) => bid.type === 'prebid')

  // For multi-lot: check group-level status
  if (isMultiLotTraining.value) {
    // If starting training, always disable
    if (startingTraining.value) return true
    // If ANY lot is still active, disable (training in progress)
    if (isTrainingInProgressForGroup.value) return true
    // If training has started but not all lots ended, disable
    // (handles viewing a closed lot while other lots are still running)
    if (hasAnyLotStarted.value && !areAllLotsClosedInGroup.value) return true
    // If ALL lots are closed, enable reset button
    if (areAllLotsClosedInGroup.value) return loading.value
    // Otherwise (upcoming): require ALL lots that need prebid to have prebids
    if (anyLotRequiresPrebid.value) {
      return loading.value || !allMultiLotPrebidsPlaced.value
    }
    return loading.value
  }

  // Single-lot logic below

  // When starting training (optimistic) or training in progress (active status)
  if (startingTraining.value || status === 'active') {
    if (isSealedBid && !startingTraining.value) {
      // Disable during countdown period (waiting to start) or active 2-minute training session
      return loading.value || isWaitingToStart.value || isInActiveTrainingSession.value
    }
    return true
  }

  // When closed: enable reset button (no prebid check - reset deletes all bids anyway)
  if (status === 'closed') {
    return loading.value
  }

  // When upcoming: check prebid requirements
  if (isPrebid.value) {
    // For single-lot: require current lot to have prebid
    return loading.value || !hasPrebid
  }

  return loading.value
})

const loading = ref(false)
const { resetAuction } = useAuctionReset()

async function handleReset() {
  if (validatedSteps.value >= 4) {
    // Close the "All set" tooltip when clicking Start Training
    allSetTooltipDismissed.value = true
    loading.value = true

    try {
      const currentStatus = route.query.status
      const isReset = currentStatus === 'closed'

      // Optimistic update: show "Training in Progress" immediately when starting (not resetting)
      if (!isReset) {
        startingTraining.value = true
      }

      // For multi-lot RESET: clear caches so state is fresh after reset
      if (isReset && isMultiLotTraining.value) {
        // Clear processed lots so scenarios can be tracked again
        clearProcessedLots()
      }

      if (isReset) {
        // RESET: use J+1 default timing, status becomes 'upcoming'
        // User will need to place prebid then click "Start Training"
        // Reset the "All set" tooltip so it shows again after placing all prebids
        allSetTooltipDismissed.value = false
        await resetAuction(auctionId.value, auctionGroupId, {
          includeBots: true,
          includeStatus: true,
          useDefaultTiming: true, // Uses backend J+1 default
          forceRefresh,
          onSuccess: async (query) => {
            // Clear memoize cache so fresh auction data (without old bids) is fetched on remount
            clearAuctionMemoizeCache()

            // Add timestamp to force page remount (supplier page key uses query.t)
            const resetQuery = { ...query, t: Date.now() }

            // For multi-lot: reset state and navigate to first lot supplier page
            if (isMultiLotTraining.value) {
              // Reset the prebid tracking state (clears all prebid status)
              // Note: resetState() already fetches fresh lots and clears prebid status
              if (multiLotPrebids) {
                await multiLotPrebids.resetState()
              }

              const firstLotId = multiLotPrebids?.lots?.value?.[0]?.id || auctionId.value
              await navigateTo({
                path: `/auctions/${auctionGroupId}/lots/${firstLotId}/supplier`,
                query: { ...resetQuery, type: auctionType.value, multilot: 'true' }
              })
              return
            }
            // Single-lot: update query params with timestamp to force remount
            await navigateTo(
              {
                path: `/auctions/${auctionGroupId}/lots/${auctionId.value}/supplier`,
                query: { ...resetQuery, type: auctionType.value }
              },
              { replace: true }
            )
          }
        })
      } else {
        // START: use immediate timing (15s delay), status becomes 'active'
        // Bots are triggered on backend
        await resetAuction(auctionId.value, auctionGroupId, {
          includeBots: true,
          includeStatus: true,
          isRestart: false, // 15s delay
          forceRefresh,
          onSuccess: async (query) => {
            // Clear memoize cache so fresh auction data (without old bids) is fetched on remount
            clearAuctionMemoizeCache()

            // Add timestamp to force page remount (supplier page key uses query.t)
            const startQuery = { ...query, t: Date.now() }

            // For multi-lot: refresh lot data to get updated start_at/end_at
            if (isMultiLotTraining.value && multiLotPrebids) {
              await multiLotPrebids.fetchLots()
              const firstLotId = multiLotPrebids.lots.value?.[0]?.id || auctionId.value
              await navigateTo({
                path: `/auctions/${auctionGroupId}/lots/${firstLotId}/supplier`,
                query: startQuery
              })
            } else {
              // Single-lot: update query params with timestamp to force remount
              await navigateTo({ query: startQuery }, { replace: true })
            }
          }
        })
      }
    } catch (error) {
      console.error('Error handling auction action:', error)
      // Reset optimistic state on error
      startingTraining.value = false
    } finally {
      loading.value = false
    }
  }
}
</script>
<style scoped>
:deep(.v-selection-control) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}
:deep(.v-label) {
  font-size: 14px !important;
  margin-left: 10px !important;
}
.stepper-container {
  height: 59px;
}
.dashed-line {
  width: 100%;
  border-top: 1px dashed #c5c7c9;
  height: 0px;
  border-width: 1px;
}
.dashed-line-2 {
  width: 56px;
  border-top: 1px dashed #c5c7c9;
  height: 0px;
  border-width: 1px;
}
.custom-chip {
  margin: 0 auto;
  min-width: 20px;
  min-height: 20px;
  max-height: 20px;
  max-width: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(29, 29, 27, 1) !important;
  justify-content: center;
}
.custom-chip-step {
  margin: 0 auto;
  min-width: 24px;
  min-height: 24px;
  max-height: 24px;
  max-width: 24px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(29, 29, 27, 1) !important;
  justify-content: center;
}
.min-step-width {
  width: 250px;
  min-width: 170px;
}
.min-last-step-width {
  width: 250px;
  min-width: 100px;
}
.min-separated-chip-width {
  min-width: 150px;
  text-wrap: nowrap;
}
.vertical-line {
  width: 100%;
  border-left: 1px dashed #c5c7c9;
  border-width: 1px;
}
.relative {
  position: relative;
}
.absolute-description-text {
  position: absolute;
  top: 30px;
  left: 0;
  width: 100%;
  height: 100%;
}
.custom-marign {
  margin-bottom: -7px;
}
.custom-orange {
  background-color: #fff5eb !important;
}
.custom-yellow {
  background-color: #feffea !important;
}
.dashed-line-btn {
  width: 68px;
  min-width: 68px;
  border-top: 1px dashed #c5c7c9;
  height: 0px;
}
.training-btn {
  background-color: #1d1d1b !important;
  color: white !important;
  border-radius: 4px !important;
  gap: 8px !important;
  padding: 8px 24px !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}
.training-btn:disabled {
  background-color: #c5c7c9 !important;
  color: white !important;
}
</style>
