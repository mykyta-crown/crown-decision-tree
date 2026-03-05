<template>
  <v-card class="d-flex flex-column flex-grow-1 px-1" color="surface">
    <v-card-title class="text-primary font-weight-black pb-0 pt-4">
      {{ t('prebidTableSeller.title') }} {{ bidLabelCapitalized }}
    </v-card-title>
    <v-card-text class="pt-2">
      <v-form ref="formRef" v-model="isBidValid">
        <v-table class="fill-height">
          <thead class="text-uppercase text-grey text-body-2 text-header-height">
            <tr>
              <th style="min-width: 120px">
                {{ t('ceilingSupplierPanel.headers.lineItems') }}
              </th>
              <th>
                {{ t('prebid.quantity') }}
              </th>
              <th class="text-no-wrap w-20">
                {{
                  auction.bids.length === 0
                    ? t('prebidTableSeller.ceilingPrice')
                    : `${t('prebidTableSeller.currentBid')} ${bidLabel}`
                }}
              </th>
              <th class="text-no-wrap w-20">
                {{ t('prebidTableSeller.unitPrice') }}
              </th>
              <th class="text-no-wrap w-20">
                {{ bidLabelCapitalized }}
              </th>
              <th v-if="showRankColumn" class="text-no-wrap">
                {{ t('activityLog.rank') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <PreBidTableSellerItem
              v-for="(item, i) in supplies"
              :key="item.supplyId"
              v-model="supplies[i].new"
              v-model:calc-unit="calcUnit"
              :supply="item"
              :currency="auction.currency"
              :disabled="status.label === 'closed'"
              :class="i === supplies.length - 1 ? '' : 'no-border'"
              :supplier-id="supplierId"
              :rank="showRankColumn ? ranks[item.id] : undefined"
              :rank-color="showRankColumn ? colorsMap[user.email]?.secondary : undefined"
              :show-rank="showRankColumn"
              :highlight-input="props.isTrainingMode && !props.currentLotHasPrebid"
              :show-guidance-tooltip="i === 0"
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
                {{ t('prebid.total') }}
              </td>
              <td class="text-left">
                <span class="font-weight-bold">{{
                  existingPrebid
                    ? formatNumber(previousPriceWithHandicaps, 'currency', auction.currency)
                    : '-'
                }}</span>
              </td>
              <td class="text-center d-flex" style="min-width: 244px">
                <v-btn-primary
                  style="min-width: 244px; max-width: 245px"
                  block
                  size="large"
                  :disabled="!validBid || status.label === 'closed' || !!handicapError"
                  class="submit-btn"
                  @click="submitBid"
                >
                  {{
                    existingPrebid
                      ? `${t('prebidTableSeller.changeBid')} ${bidLabel}`
                      : `${t('prebidTableSeller.submitBid')} ${bidLabel}`
                  }}
                </v-btn-primary>
              </td>
              <td class="text-left text-primary font-weight-bold cursor-default pt-2">
                <div class="text-no-wrap">
                  <span class="font-weight-bold text-no-wrap">{{
                    currentPrice
                      ? formatNumber(currentPriceWithHandicaps, 'currency', auction.currency)
                      : '-'
                  }}</span>
                </div>
                <div v-if="handicapError" class="text-error text-caption text-no-wrap">
                  <span>{{ handicapError }}</span>
                </div>
                <div
                  v-else-if="
                    validBid &&
                    existingPrebid &&
                    previousPriceWithHandicaps > currentPriceWithHandicaps
                  "
                  class="text-grey text-caption text-no-wrap"
                >
                  <span
                    >{{ t('prebidTableSeller.bidReducedBy') }}
                    {{ formatNumber(previousPriceWithHandicaps - currentPriceWithHandicaps) }}
                    {{ auction?.currency }}</span
                  >
                </div>
                <div v-else-if="noZeroBid && !validBid" class="text-error text-caption">
                  <span v-if="!overMaxDecrement"
                    >{{ t('prebidTableSeller.bidMustBeLower') }}
                    {{ formatNumber(previousPriceWithHandicaps) }} {{ auction?.currency }}</span
                  >
                  <span v-else
                    >{{ t('prebidTableSeller.bidReducedBy') }}
                    {{ formatNumber(previousPriceWithHandicaps - currentPriceWithHandicaps) }}
                    {{ auction?.currency }}, {{ t('prebidTableSeller.maxDecrementError') }}
                    {{ formatNumber(auction.max_bid_decr) }} {{ auction?.currency }}</span
                  >
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
        :is-prebid="auction.type !== 'sealed-bid'"
        :auction-type="auction.type"
        @confirmed="addBid"
      />
    </v-card-text>
  </v-card>
</template>
<script setup>
import { forEach, groupBy } from 'lodash'

const props = defineProps({
  supplierId: {
    type: String,
    default: null
  },
  supplierEmail: {
    type: String,
    default: null
  },
  isTrainingMode: {
    type: Boolean,
    default: false
  },
  isMultiLotTraining: {
    type: Boolean,
    default: false
  },
  currentLotHasPrebid: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['bid-placed', 'prebid-submitted'])

// Use translations
const { t } = useTranslations()

const { user } = useUser()
const { getColors } = useColorSchema()
const colorsMap = await getColors()

const showConfirmModal = ref(false)
const route = useRoute()

const { auction, forceRefresh } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const calcUnit = ref(auction.value?.currency)
const { status } = useAuctionTimer(auction)

// Check if auction has started (not in pre-bid phase anymore)
const auctionHasStarted = computed(() => {
  return status.value.label === 'active' || status.value.label === 'closed'
})

// Show rank column only if auction has started AND rank per line item is enabled AND max_rank_displayed > 0
// Sealed-bid: ranks are hidden until the auction ends
const showRankColumn = computed(() => {
  if (auction.value?.type === 'sealed-bid') {
    return (
      status.value.label === 'closed' &&
      auction.value?.rank_per_line_item &&
      auction.value?.max_rank_displayed > 0
    )
  }
  return (
    auctionHasStarted.value &&
    auction.value?.rank_per_line_item &&
    auction.value?.max_rank_displayed > 0
  )
})

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
  // Handle null/undefined handicaps.value
  if (!handicaps.value) {
    return {}
  }

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

const supplies = ref([])
const isBidValid = ref(false)
const currentPriceRef = ref(0)
const formRef = ref(null)

function sortSupplies(a, b) {
  const supplyA = auction.value.supplies.find((s) => s.id === a.supplies_sellers[0].supply_id)
  const supplyB = auction.value.supplies.find((s) => s.id === b.supplies_sellers[0].supply_id)

  return supplyA.index - supplyB.index
}

supplies.value = auction.value.supplies
  .map((supply) => {
    return Object.assign({ new: null, ...supply })
  })
  .toSorted(sortSupplies)

const supplierBids = computed(() => {
  if (props.supplierId) {
    return auction.value.bids.filter((bid) => bid.seller_id === props.supplierId)
  }

  return auction.value.bids
})

const existingPrebid = computed(() => {
  return supplierBids.value.length > 0
})

const currentPrice = computed(() => {
  const priceSum = supplies.value?.reduce((acc, curr) => acc + curr.new * curr.quantity, 0)
  return priceSum
})

const savedHandicapsAmount = computed(() => {
  return savedHandicaps.value.reduce((total, handicap) => {
    return total + handicap.amount
  }, 0)
})

const selectedHandicapsAmount = computed(() => {
  return Object.values(selectedHandicaps.value).reduce((total, handicap) => {
    return total + handicap.amount
  }, 0)
})

const currentPriceWithHandicaps = computed(() => {
  return currentPrice.value + selectedHandicapsAmount.value
})

const totalCeilingPrice = computed(() => {
  return supplies.value?.reduce(
    (acc, curr) =>
      acc + curr.supplies_sellers.reduce((acc2, curr2) => acc2 + curr2.ceiling * curr.quantity, 0),
    0
  )
})

const lastExistingPrebidPrice = computed(() => {
  return existingPrebid.value ? supplierBids.value[0]?.price : totalCeilingPrice.value
})

const previousPriceWithHandicaps = computed(() => {
  return lastExistingPrebidPrice.value + savedHandicapsAmount.value
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

const atLeastOneDecrement = computed(() => {
  const lastPrebidPrice = supplierBids.value[0]?.price || totalCeilingPrice.value + 1

  return (
    currentPrice.value < lastPrebidPrice ||
    savedHandicapsAmount.value > selectedHandicapsAmount.value
  )
})

const noZeroBid = computed(() => {
  return supplies.value.every((item) => item.new > 0)
})

const overMaxDecrement = computed(() => {
  return (
    existingPrebid.value &&
    lastExistingPrebidPrice.value - currentPrice.value > auction.value.max_bid_decr
  )
})

const validBid = computed(() => {
  return noZeroBid.value && atLeastOneDecrement.value && !overMaxDecrement.value
})

// Check if any selected handicap would make the price go up compared to saved handicap
const handicapError = computed(() => {
  // No saved handicaps = no restriction
  if (savedHandicaps.value.length === 0) return null

  for (const [groupName, selectedHandicap] of Object.entries(selectedHandicaps.value)) {
    const saved = savedHandicaps.value.find((h) => h.group_name === groupName)
    if (saved && selectedHandicap.amount > saved.amount) {
      return t('bidding.validation.handicapCannotIncrease')
    }
  }
  return null
})

// Computed property for bid/pre-bid label based on auction type
const bidLabel = computed(() => {
  // console.log('auction', auction.value.type === 'sealed-bid' ? 'bid' : 'pre-bid')
  return auction.value.type === 'sealed-bid' ? 'bid' : 'pre-bid'
})
const bidLabelCapitalized = computed(
  () => bidLabel.value.charAt(0).toUpperCase() + bidLabel.value.slice(1)
)

function submitBid() {
  if (isBidValid.value) {
    showConfirmModal.value = true
  }
}

function cleanInputs() {
  const previousCalcUnit = calcUnit.value

  supplies.value.forEach((supply) => {
    supply.new = null
  })

  calcUnit.value = previousCalcUnit
}

async function addBid() {
  isBidValid.value = false

  const suppliesToInsert = supplies.value.map((supplie) => {
    return {
      supply_id: supplie.id,
      quantity: supplie.quantity,
      price: supplie.new
    }
  })

  await insertBid(
    suppliesToInsert,
    {
      type: auction.value.type === 'sealed-bid' ? 'bid' : 'prebid',
      sellerId: props.supplierId
    },
    selectedHandicaps.value
  )

  showConfirmModal.value = false

  // Force immediate refresh of auction data to update all components
  if (forceRefresh) {
    await forceRefresh()
  }

  await fetchHandicaps()
  cleanInputs()
  await updateRanks()

  // Emit event to notify parent that a bid was placed
  emit('bid-placed')

  // For training mode (single-lot or multi-lot), emit prebid-submitted to trigger guidance flow
  if (props.isTrainingMode && auction.value.type !== 'sealed-bid') {
    emit('prebid-submitted')
  }
}

// Rank per line item logic
const ranks = ref({})
const { getSupplyRank, clearSupplyRankCache } = await useTotalValue({
  auctionId: route.params.auctionId
})

async function updateRanks() {
  // Don't fetch ranks if rank display is disabled
  if (!showRankColumn.value) return

  // Clear cache to get fresh ranks
  clearSupplyRankCache()

  const currentRanks = {}
  const sellerId = props.supplierId || useUser().user.value.id

  if (supplies.value) {
    for (const supply of supplies.value) {
      const rank = await getSupplyRank(sellerId, supply.id)
      if (rank > 0) {
        currentRanks[supply.id] = rank
      }
    }
  }
  ranks.value = currentRanks
}

watch(
  supplierBids,
  () => {
    updateRanks()
  },
  { deep: true }
)

// Watch supplierId to reset form when admin selects a different supplier
watch(
  () => props.supplierId,
  () => {
    cleanInputs()
    updateRanks()
  }
)

onMounted(updateRanks)
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
