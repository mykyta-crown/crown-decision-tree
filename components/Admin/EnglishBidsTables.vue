<template>
  <!-- Matrix view for rank per line item - Hidden for now -->
  <v-card
    v-if="false && auction.rank_per_line_item"
    :key="`matrix-${refreshTrigger}-${auction.bids?.length || 0}`"
    color="surface"
    class="pa-5 mb-4"
  >
    <v-card-title
      class="text-primary font-weight-black pb-2 px-0 d-flex justify-space-between align-center"
    >
      <span>{{ t('bidding.title') }}</span>
      <v-chip v-if="loadingRanks" size="small" color="primary"> Updating... </v-chip>
    </v-card-title>
    <v-card-text class="px-0">
      <v-table class="matrix-table">
        <thead>
          <tr>
            <th class="text-uppercase text-grey text-body-2 line-items-header">
              {{ t('bidding.headers.lineItems') }}
            </th>
            <th class="text-uppercase text-grey text-body-2 quantity-header">
              {{ t('bidding.headers.quantity') }}
            </th>
            <th
              v-for="supplier in sortedSuppliers"
              :key="supplier.seller_email"
              class="supplier-header text-primary"
              :style="{ 'background-color': colorsMap[supplier.seller_email]?.secondary }"
            >
              <div class="d-flex align-center" style="gap: 4px">
                <span
                  class="font-weight-bold"
                  style="min-width: 15px; text-align: center; font-size: 14px"
                >
                  {{ supplier.overallRank }}
                </span>
                <span class="font-weight-semibold text-truncate" style="font-size: 14px">
                  {{ supplier.identifier }}
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(supply, i) in auction.supplies"
            :key="supply.id"
            :class="i === auction.supplies.length - 1 ? '' : 'border-bottom'"
          >
            <td class="line-items-cell">
              <div class="text-left font-weight-regular">
                {{ supply.name }}
              </div>
            </td>
            <td class="quantity-cell">
              <div class="font-weight-semibold">
                {{ formatNumber(supply.quantity) }}
              </div>
              <div class="text-grey text-caption">
                {{ supply.unit }}
              </div>
            </td>
            <td
              v-for="supplier in sortedSuppliers"
              :key="`${supply.id}-${supplier.seller_email}`"
              class="supplier-data-cell"
            >
              <div class="d-flex align-start justify-space-between" style="gap: 8px">
                <div v-if="getSupplierBid(supply.id, supplier.seller_email)" class="flex-grow-1">
                  <div class="font-weight-semibold">
                    {{ formatNumber(getSupplierBid(supply.id, supplier.seller_email).price) }}
                  </div>
                  <div class="text-grey" style="font-size: 14px; line-height: 1.5">
                    Total
                    {{
                      formatNumber(
                        getSupplierBid(supply.id, supplier.seller_email).price * supply.quantity
                      )
                    }}
                  </div>
                </div>
                <div v-else class="text-grey flex-grow-1">-</div>
                <v-chip
                  v-if="getSupplyRank(supply.id, supplier.seller_id)"
                  variant="text"
                  class="font-weight-semibold d-flex align-center justify-center flex-shrink-0"
                  :style="{
                    'background-color': colorsMap[supplier.seller_email]?.secondary,
                    height: '20px',
                    width: '20px',
                    'font-size': '12px',
                    'border-radius': '4px',
                    'line-height': '20px'
                  }"
                >
                  {{ getSupplyRank(supply.id, supplier.seller_id) }}
                </v-chip>
              </div>
            </td>
          </tr>
          <tr class="total-row">
            <td />
            <td class="font-weight-bold text-left">
              {{ t('bidding.total') }}
            </td>
            <td
              v-for="supplier in sortedSuppliers"
              :key="`total-${supplier.seller_email}`"
              class="text-left"
            >
              <span class="font-weight-bold">{{
                formatNumber(getSupplierTotal(supplier.seller_email))
              }}</span>
              {{ auction?.currency }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>

  <!-- Individual supplier view - ALWAYS show for admin to place bids -->
  <template v-if="selectedSupplier">
    <PreBidTableSeller
      v-if="auctionStatus === 'upcoming' || auction.type === 'sealed-bid' || !supplierHasBids"
      :key="`prebid-${selectedSupplier.id}`"
      :supplier-id="selectedSupplier.id"
      :supplier-email="selectedSupplier.email"
      @bid-placed="onBidPlaced"
    />
    <BidTableSeller
      v-else
      :key="`bid-${selectedSupplier.id}`"
      :supplier-id="selectedSupplier.id"
      :supplier-email="selectedSupplier.email"
    />
  </template>
</template>

<script setup>
const props = defineProps({
  auctionStatus: {
    type: String,
    required: true
  },
  selectedSupplier: {
    type: Object,
    required: true
  }
})

const { t } = useTranslations()

const { getColors } = useColorSchema()
const colorsMap = await getColors()

// Inject auction and sellers from parent
const auction = inject('auction')
const sellers = inject('sellers')

// Get local auction data for checking if supplier has bids (needed for reactivity after bid placement)
const route = useRoute()
const { auction: localAuction, forceRefresh: refreshAuction } = await useUserAuctionBids({
  auctionId: route.params.auctionId
})

// Check if selected supplier has any bids (use localAuction for reactivity after bid placement)
const supplierHasBids = computed(() => {
  const supplierId = props.selectedSupplier?.id
  const bids = localAuction.value?.bids

  // DEBUG: Log the values to understand why PreBidTableSeller might not show
  console.log('[EnglishBidsTables] supplierHasBids check:', {
    supplierId,
    hasBids: !!bids,
    bidsCount: bids?.length ?? 0,
    auctionStatus: props.auctionStatus,
    auctionType: auction.value?.type,
    selectedSupplierEmail: props.selectedSupplier?.email
  })

  if (!supplierId || !bids) {
    console.log('[EnglishBidsTables] Returning false: missing supplierId or bids')
    return false
  }

  const hasBids = bids.some((bid) => bid.seller_id === supplierId)
  console.log('[EnglishBidsTables] Supplier has bids:', hasBids)
  return hasBids
})

// DEBUG: Watch localAuction.bids for changes
watch(
  () => localAuction.value?.bids,
  (newBids, oldBids) => {
    console.log('[EnglishBidsTables] localAuction.bids changed:', {
      oldCount: oldBids?.length ?? 0,
      newCount: newBids?.length ?? 0,
      newBids: newBids?.map((b) => ({ id: b.id, seller_id: b.seller_id })) ?? []
    })
  },
  { deep: true }
)

// Handler for when a bid is placed - refresh auction data to switch to BidTableSeller
async function onBidPlaced() {
  if (refreshAuction) {
    await refreshAuction()
  }
}

// Get rank data
const { getSupplyRank: fetchSupplyRank, clearSupplyRankCache } = await useTotalValue({
  auctionId: route.params.auctionId
})

// Store ranks for each supplier per supply
const supplyRanks = ref({})

// Force refresh trigger for reactivity
const refreshTrigger = ref(0)

// Calculate overall ranks and get supply ranks
const sortedSuppliers = computed(() => {
  // Force reactivity by reading refreshTrigger
  void refreshTrigger.value

  if (!auction.value.rank_per_line_item) return []

  // Force read all bids to ensure reactivity
  const currentBids = auction.value.bids || []

  // Get all supplier bids with their totals
  const suppliersWithRanks = auction.value.auctions_sellers.map((seller) => {
    const sellerProfile = sellers.value?.find((s) => s.email === seller.seller_email)
    const sellerId = seller.seller_profile?.id

    // Get latest bid for this seller
    const sellerBids = currentBids.filter((bid) => bid.seller_id === sellerId)
    const latestBid = sellerBids.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

    return {
      ...seller,
      seller_id: sellerId,
      identifier: seller.identifier || sellerProfile?.companies?.name || seller.seller_email,
      latestBid,
      total: latestBid?.price || 0
    }
  })

  // Sort by total (ascending for reverse auction)
  const sorted = suppliersWithRanks.sort((a, b) => {
    if (a.total === 0 && b.total === 0) return 0
    if (a.total === 0) return 1
    if (b.total === 0) return -1
    return a.total - b.total
  })

  // Assign overall ranks
  sorted.forEach((supplier, index) => {
    supplier.overallRank = supplier.total > 0 ? index + 1 : null
  })

  return sorted
})

// Loading state for ranks
const loadingRanks = ref(false)

// Load supply ranks for all suppliers
async function loadSupplyRanks() {
  if (!auction.value.rank_per_line_item) return

  loadingRanks.value = true

  const ranks = {}

  for (const supplier of sortedSuppliers.value) {
    if (supplier.seller_id && auction.value.supplies) {
      for (const supply of auction.value.supplies) {
        const rank = await fetchSupplyRank(supplier.seller_id, supply.id)
        const key = `${supply.id}-${supplier.seller_id}`
        ranks[key] = rank > 0 ? rank : null
      }
    }
  }

  supplyRanks.value = ranks
  loadingRanks.value = false
}

// Debounced refresh function
let refreshTimeout = null
async function debouncedRefresh() {
  if (refreshTimeout) clearTimeout(refreshTimeout)

  refreshTimeout = setTimeout(async () => {
    // Clear the rank cache first to force fresh data
    clearSupplyRankCache()
    await loadSupplyRanks()
    // Force refresh of computed properties AFTER ranks are loaded
    refreshTrigger.value++
  }, 300) // 300ms debounce
}

// Watch for bid changes
watch(
  () => auction.value?.bids?.length,
  (newLength, oldLength) => {
    if (newLength !== oldLength) {
      debouncedRefresh()
    }
  }
)

// Also watch for any deep changes in the auction
watch(
  auction,
  () => {
    debouncedRefresh()
  },
  { deep: true }
)

onMounted(() => {
  // DEBUG: Log initial state when component mounts
  console.log('[EnglishBidsTables] Component mounted:', {
    auctionStatus: props.auctionStatus,
    auctionType: auction.value?.type,
    selectedSupplierId: props.selectedSupplier?.id,
    selectedSupplierEmail: props.selectedSupplier?.email,
    localAuctionBidsCount: localAuction.value?.bids?.length ?? 'undefined',
    localAuctionBids:
      localAuction.value?.bids?.map((b) => ({ id: b.id, seller_id: b.seller_id })) ?? [],
    supplierHasBids: supplierHasBids.value,
    shouldShowPreBid:
      props.auctionStatus === 'upcoming' ||
      auction.value?.type === 'sealed-bid' ||
      !supplierHasBids.value
  })
  loadSupplyRanks()
})

function getSupplierBid(supplyId, sellerEmail) {
  // Force reactivity by reading refreshTrigger
  void refreshTrigger.value

  const seller = auction.value.auctions_sellers.find((s) => s.seller_email === sellerEmail)
  if (!seller || !seller.seller_profile) return null

  const sellerId = seller.seller_profile.id
  // Force re-read of bids array
  const currentBids = auction.value.bids || []
  const sellerBids = currentBids.filter((bid) => bid.seller_id === sellerId)

  if (sellerBids.length === 0) return null

  const latestBid = sellerBids.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
  const bidSupply = latestBid?.bid_supplies?.find((bs) => bs.supplies?.id === supplyId)

  return bidSupply ? { price: bidSupply.price } : null
}

function getSupplyRank(supplyId, sellerId) {
  if (!sellerId) return null
  const key = `${supplyId}-${sellerId}`
  return supplyRanks.value[key] || null
}

function getSupplierTotal(sellerEmail) {
  // Force reactivity by reading refreshTrigger
  void refreshTrigger.value

  const seller = sortedSuppliers.value.find((s) => s.seller_email === sellerEmail)
  return seller?.total || 0
}
</script>

<style scoped>
.matrix-table {
  border-collapse: separate;
  border-spacing: 0;
}

.matrix-table thead th {
  border: none !important;
  padding: 8px !important;
  height: 36px !important;
  vertical-align: middle;
}

.line-items-header {
  min-width: 264px;
  text-align: left;
}

.quantity-header {
  width: 160px;
  text-align: left;
}

.supplier-header {
  border-radius: 4px;
  min-width: 180px;
  padding: 8px !important;
}

.matrix-table tbody td {
  padding: 12px 8px !important;
  vertical-align: top;
  border-bottom: none !important;
}

.line-items-cell {
  min-width: 264px;
}

.quantity-cell {
  width: 160px;
}

.supplier-data-cell {
  min-width: 180px;
}

.border-bottom td {
  border-bottom: 1px solid #e9eaec !important;
}

.total-row td {
  border: none !important;
  padding-top: 8px !important;
  padding-bottom: 0 !important;
}
</style>
