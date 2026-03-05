<template>
  <v-card class="d-flex flex-column flex-grow-1 px-1" color="surface">
    <v-card-title class="text-primary font-weight-black pb-0 pt-4">
      {{ t('bidding.title') }}
    </v-card-title>
    <v-card-text class="pt-2">
      <v-form ref="formRef" v-model="isBidValid" @submit.prevent="submitBid">
        <v-table class="fill-height">
          <thead class="text-uppercase text-grey text-body-2 text-header-height">
            <tr>
              <th style="min-width: 120px">
                {{ t('bidding.headers.lineItems') }}
              </th>
              <th>
                {{ t('bidding.headers.quantity') }}
              </th>
              <th class="w-20 text-no-wrap">
                {{ t('bidding.headers.previousBid') }}
              </th>
              <th class="text-no-wrap w-20">
                {{ t('bidding.headers.calculations') }}
                <br />
              </th>
              <th class="w-20 text-no-wrap">
                {{ t('bidding.headers.newBid') }}
              </th>
              <th v-if="showRankColumn" class="text-no-wrap">
                {{ t('activityLog.rank') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <BidTableSellerItem
              v-for="(item, i) in suppliesBids"
              :key="item.supplyId"
              v-model="suppliesBids[i].new"
              v-model:calc-unit="calcUnit"
              :supply-bid="item"
              :currency="auction.currency"
              :max-bid-decr="previousPrice"
              :class="i === suppliesBids.length - 1 ? '' : 'no-border'"
              :disabled="isAdmin ? false : status.label !== 'active'"
              :rank="ranks[item.supplyId]"
              :rank-color="colorsMap[user.email]?.secondary"
              :rank-loading="ranksLoading"
              :show-rank="showRankColumn"
            />

            <HandicapSelect
              v-for="(handicapGroup, groupName, i) in handicapsGroups"
              :key="groupName"
              v-model="selectedHandicaps[groupName]"
              :saved-handicaps="savedHandicaps"
              :group-name="groupName"
              :handicap-group="handicapGroup"
              :currency="auction.currency"
              :max-allowed-amount="getMaxAllowedAmount(groupName)"
              :class="i === Object.keys(handicapsGroups).length - 1 ? '' : 'no-border'"
            />

            <tr class="no-border-total">
              <td />
              <td class="text-left font-weight-bold">
                {{ t('bidding.total') }}
              </td>
              <td class="text-left">
                <span class="font-weight-bold">{{ formatNumber(previousPriceWithHandicaps) }}</span>
                {{ auction?.currency }}
              </td>
              <td class="text-center d-flex" style="min-width: 244px">
                <v-btn-primary
                  style="min-width: 244px; max-width: 262px"
                  block
                  size="large"
                  :disabled="
                    (isAdmin ? false : status.label !== 'active') ||
                    error !== true ||
                    !!handicapError
                  "
                  class="submit-btn px-10"
                  @click="submitBid"
                >
                  {{ t('bidding.submitNewBid') }}
                </v-btn-primary>
              </td>
              <td class="text-left">
                <div class="text-no-wrap">
                  <span class="font-weight-bold text-no-wrap">{{
                    formatNumber(currentPriceWithHandicaps)
                  }}</span
                  >&nbsp;{{ auction?.currency }}
                  <div v-if="handicapError" class="text-error text-caption text-no-wrap">
                    <span>{{ handicapError }}</span>
                  </div>
                  <div v-else-if="error === true" class="text-grey text-caption text-no-wrap">
                    <span
                      >{{ t('bidding.bidReducedBy') }}
                      {{ formatNumber(previousPriceWithHandicaps - currentPriceWithHandicaps) }}
                      {{ auction?.currency }}</span
                    >
                  </div>
                  <div v-else class="text-error text-caption text-no-wrap">
                    <span>{{ error }}</span>
                  </div>
                </div>
              </td>
            </tr>
            <tr />
          </tbody>
        </v-table>
      </v-form>
      <ConfirmBidDialog
        v-model="showConfirmModal"
        :bid-price="currentPriceWithHandicaps"
        :auction-type="auction.type"
        @confirmed="addBid"
      />
    </v-card-text>
  </v-card>
</template>
<script setup>
import { forEach, groupBy } from 'lodash'
import { watch } from 'vue'
import { z } from 'zod'

const props = defineProps({
  supplierId: {
    type: String,
    default: null
  },
  supplierEmail: {
    type: String,
    default: null
  }
})

const { isAdmin, user } = useUser()
// Use translations
const { t } = useTranslations()

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const showConfirmModal = ref(false)
const suppliesBids = ref(null)
const formRef = ref(null)

const route = useRoute()
const { auction, forceRefresh } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { status } = useAuctionTimer(auction)

const { insertBid } = await useBids({ auctionId: route.params.auctionId })

const {
  handicaps,
  selectedHandicaps: auctionSelectedHandicaps,
  fetchHandicaps
} = useSupplierDynamicHandicap({ auctionId: route.params.auctionId })

await fetchHandicaps()

const savedHandicaps = computed(() => {
  if (props.supplierEmail) {
    return auctionSelectedHandicaps.value.filter((handicap) => {
      return handicap.seller_email === props.supplierEmail
    })
  }

  return auctionSelectedHandicaps.value
})

const handicapsGroups = computed(() => {
  const filteredHandicaps = handicaps.value.filter((handicap) => {
    if (props.supplierEmail) {
      return handicap.seller_email === props.supplierEmail
    }

    return true
  })

  return groupBy(filteredHandicaps, 'group_name')
})

const selectedHandicaps = ref({})

function setHandicaps() {
  forEach(handicapsGroups.value, (group, groupName) => {
    selectedHandicaps.value[groupName] = group.find((h) => h.selected) || group[0]
  })
}

watch(
  handicapsGroups,
  () => {
    setHandicaps()
  },
  { immediate: true }
)

const calcUnit = ref(auction?.value.currency)
const schemaToRule = useZodSchema()

const currentPrice = computed(() => {
  return suppliesBids.value?.reduce((acc, curr) => acc + curr.new * curr.quantity, 0) || 0
})

const selectedHandicapsAmount = computed(() => {
  return Object.values(selectedHandicaps.value).reduce(
    (total, handicap) => total + handicap.amount,
    0
  )
})

const currentPriceWithHandicaps = computed(() => {
  return currentPrice.value + selectedHandicapsAmount.value
})

const previousPrice = computed(() => {
  return suppliesBids.value?.reduce((acc, curr) => acc + curr.previous * curr.quantity, 0) || 0
})

const savedHandicapsAmount = computed(() => {
  return savedHandicaps.value.reduce((total, handicap) => total + handicap.amount, 0)
})

const previousPriceWithHandicaps = computed(() => {
  return previousPrice.value + savedHandicapsAmount.value
})

// Calculate max allowed amount for a specific handicap group
// Formula: previousTotal - currentPrice - otherHandicapsAmount
function getMaxAllowedAmount(groupName) {
  // No restriction if no saved handicaps
  if (savedHandicaps.value.length === 0) return Infinity

  // Calculate sum of other selected handicaps (excluding this group)
  const otherHandicapsAmount = Object.entries(selectedHandicaps.value)
    .filter(([name]) => name !== groupName)
    .reduce((sum, [, h]) => sum + h.amount, 0)

  // Max allowed = previous total - current price - other handicaps
  return previousPriceWithHandicaps.value - currentPrice.value - otherHandicapsAmount
}

const minTest = computed(() => {
  return z.number().min(auction.value.min_bid_decr, {
    message: `${t('bidding.validation.minBidDecrement')}: >${auction.value.min_bid_decr} ${auction.value.currency}`
  })
})

const maxTest = computed(() => {
  return z.number().max(auction.value.max_bid_decr, {
    message: `${t('bidding.validation.maxBidDecrement')}: ${auction.value.max_bid_decr} ${auction.value.currency}`
  })
})

const error = computed(() => {
  const priceDecrement = previousPrice.value - currentPrice.value

  // Allow bid if only handicap changes (price stays same) but total decreases
  const handicapDecrement = savedHandicapsAmount.value - selectedHandicapsAmount.value
  const totalDecrement = previousPriceWithHandicaps.value - currentPriceWithHandicaps.value

  // If price doesn't change but handicap decreases, allow the bid
  if (priceDecrement === 0 && handicapDecrement > 0 && totalDecrement > 0) {
    return true
  }

  const minCheck = schemaToRule(minTest.value)(priceDecrement)
  const maxCheck = schemaToRule(maxTest.value)(priceDecrement)

  if (typeof minCheck === 'string') {
    return minCheck
  }

  if (typeof maxCheck === 'string') {
    return maxCheck
  }
  return true
})

const supplierBids = computed(() => {
  if (props.supplierId) {
    return auction.value.bids.filter((bid) => bid.seller_id === props.supplierId)
  }

  return auction.value.bids
})

const bestSupplierBid = computed(() => {
  // Create a copy before sorting to avoid mutating the original array
  return [...supplierBids.value].sort((a, b) => a.price - b.price)[0]
})

// Check if the total bid (price + handicaps) would increase compared to previous
const handicapError = computed(() => {
  // No saved handicaps = no restriction
  if (savedHandicaps.value.length === 0) return null

  // Allow higher handicap as long as total (price + handicaps) is lower
  // Only show error if handicap increases AND total doesn't decrease
  const totalDecrement = previousPriceWithHandicaps.value - currentPriceWithHandicaps.value

  // If total is decreasing, allow any handicap selection
  if (totalDecrement > 0) return null

  // If total is not decreasing, check if handicap is trying to increase
  for (const [groupName, selectedHandicap] of Object.entries(selectedHandicaps.value)) {
    const saved = savedHandicaps.value.find((h) => h.group_name === groupName)
    if (saved && selectedHandicap.amount > saved.amount) {
      return t('bidding.validation.handicapCannotIncrease')
    }
  }
  return null
})

watch(
  bestSupplierBid,
  () => {
    function sortSupplies(a, b) {
      const supplyA = auction.value.supplies.find((s) => s.id === a.supplyId)
      const supplyB = auction.value.supplies.find((s) => s.id === b.supplyId)

      return supplyA.index - supplyB.index
    }

    if (!suppliesBids.value) {
      // If there's an existing bid, use bid_supplies
      if (bestSupplierBid.value?.bid_supplies) {
        suppliesBids.value = bestSupplierBid.value.bid_supplies
          .map((e) => ({
            bidId: e.bids.id,
            supplyId: e.supplies.id,
            name: e.supplies.name,
            quantity: e.supplies.quantity,
            previous: e.price,
            new: 0,
            unit: e.supplies.unit
          }))
          .toSorted(sortSupplies)
      } else {
        // No existing bid - initialize from auction supplies (like PreBidTableSeller)
        suppliesBids.value = auction.value.supplies
          .map((supply) => ({
            bidId: null,
            supplyId: supply.id,
            name: supply.name,
            quantity: supply.quantity,
            previous: 0,
            new: 0,
            unit: supply.unit
          }))
          .toSorted(sortSupplies)
      }
    } else {
      suppliesBids.value = suppliesBids.value
        .map((supplyBid) => {
          const newBid = bestSupplierBid.value?.bid_supplies?.find(
            (e) => e.supplies.id === supplyBid.supplyId
          )
          return Object.assign({ ...supplyBid }, { previous: newBid?.price || supplyBid.previous })
        })
        .toSorted(sortSupplies)
    }
  },
  { immediate: true }
)

const isBidValid = ref(false)

function submitBid() {
  if (isBidValid.value) {
    showConfirmModal.value = true
  }
}

async function addBid() {
  // action.value = 'addBid'
  const suppliesToInsert = suppliesBids.value?.map((supply) => {
    return {
      supply_id: supply.supplyId,
      price: supply.new,
      quantity: supply.quantity
    }
  })

  await insertBid(
    suppliesToInsert,
    {
      type: 'bid',
      sellerId: props.supplierId
    },
    selectedHandicaps.value
  )

  // Force immediate refresh of auction data to update all components
  if (forceRefresh) {
    await forceRefresh()
  }

  await fetchHandicaps()
  debouncedUpdateRanks(true) // immediate update after bid submission
}

// Rank per line item logic
const ranks = ref({})
const ranksLoading = ref(false)
const { getSupplyRank, clearSupplyRankCache } = await useTotalValue({
  auctionId: route.params.auctionId
})

// Show rank column only if rank per line item is enabled AND max_rank_displayed > 0
const showRankColumn = computed(() => {
  return auction.value?.rank_per_line_item && auction.value?.max_rank_displayed > 0
})

// Debounced rank update to prevent rapid flickering
let rankUpdateTimeout = null
function debouncedUpdateRanks(immediate = false) {
  if (rankUpdateTimeout) clearTimeout(rankUpdateTimeout)

  const delay = immediate ? 0 : 300
  rankUpdateTimeout = setTimeout(() => {
    updateRanksInternal()
  }, delay)
}

async function updateRanksInternal() {
  if (!showRankColumn.value) return

  // Don't show loading spinner - keep old values visible during update
  // ranksLoading only used for initial load when ranks is empty
  const isInitialLoad = Object.keys(ranks.value).length === 0
  if (isInitialLoad) {
    ranksLoading.value = true
  }

  // Clear cache to get fresh ranks
  clearSupplyRankCache()

  const sellerId = props.supplierId || useUser().user.value.id

  if (suppliesBids.value) {
    // Parallelize API calls for faster updates
    const rankPromises = suppliesBids.value.map(async (supply) => {
      const rank = await getSupplyRank(sellerId, supply.supplyId)
      return { supplyId: supply.supplyId, rank }
    })

    const results = await Promise.all(rankPromises)

    // Update ranks atomically
    const newRanks = {}
    for (const { supplyId, rank } of results) {
      if (rank > 0) {
        newRanks[supplyId] = rank
      }
    }
    ranks.value = newRanks
  }

  ranksLoading.value = false
}

// Watch all bids (not just current supplier's) to update ranks when any supplier places a bid
watch(
  () => auction.value?.bids,
  () => {
    debouncedUpdateRanks()
  },
  { deep: true }
)

// Watch supplierId to update ranks and reset form when admin selects a different supplier
watch(
  () => props.supplierId,
  () => {
    // Reset form data to trigger fresh initialization from new supplier's bids
    suppliesBids.value = null
    debouncedUpdateRanks(true) // immediate update on supplier change
  }
)

onMounted(() => debouncedUpdateRanks(true))

// Used to display total error message
const currentDecrementRef = ref(0)
watch(
  currentPrice,
  () => {
    currentDecrementRef.value = previousPrice.value - currentPrice.value
  },
  { immediate: true }
)
</script>

<style scoped>
th {
  border: none !important;
  height: 30px !important;
}

.no-border td {
  border: none !important;
  border-bottom: 1px solid #e0e0e0 !important;
}
:deep(.no-border-total td) {
  border: none !important;
  padding-top: 8px !important;
}
td,
th {
  padding-left: 8px !important;
}
:deep(.v-input_details) {
  padding-top: 0;
}

.w-20 {
  width: 20%;
}

.w-10 {
  width: 15%;
}

.caption {
  font-size: 0.7rem;
  margin-bottom: 0.2rem;
}

.textfield-style:deep(input) {
  cursor: default !important;
  display: none;
}

.textfield-style:deep(.v-messages__message) {
  text-align: start;
}

/* Scrollbar styles */
:deep(.v-table__wrapper)::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

:deep(.v-table__wrapper)::-webkit-scrollbar-track {
  border: 7px solid #f8f8f8;
  background: #f8f8f8;
  border-radius: 20px;
}

:deep(.v-table__wrapper)::-webkit-scrollbar-thumb {
  border: 6px solid #c5c7c9;
  border-radius: 9px;
  background-clip: content-box;
}

:deep(.v-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: #c5c7c9;
  border: 5px solid #d4d5d5;
  border-radius: 9px;
  background-clip: content-box;
}
</style>
