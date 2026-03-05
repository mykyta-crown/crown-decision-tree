<template>
  <div v-if="rankedSuppliers.length > 0" class="ranking-container">
    <!-- Header row -->
    <div class="header-row">
      <div class="header-left">
        <span class="header-text">{{ t('endDialogBuyer.table.rank') }}</span>
        <span class="header-text">{{ t('endDialogBuyer.table.name') }}</span>
      </div>
      <span class="header-text header-right">{{ t('endDialogBuyer.table.bidPrice') }}</span>
    </div>

    <!-- Expansion panels for suppliers -->
    <v-expansion-panels variant="accordion" class="supplier-panels">
      <v-expansion-panel
        v-for="(supplier, index) in rankedSuppliers"
        :key="supplier.id"
        class="supplier-panel"
      >
        <v-expansion-panel-title class="supplier-title">
          <div class="supplier-header">
            <div class="supplier-info">
              <v-chip
                variant="text"
                class="rank-chip"
                :style="{
                  'background-color': getSupplierRankColor(index + 1),
                  height: '24px',
                  width: '24px',
                  'font-size': '14px',
                  'border-radius': '4px',
                  'font-weight': '600',
                  padding: '0'
                }"
              >
                {{ index + 1 }}
              </v-chip>
              <span class="supplier-name">{{ supplier.identifier }}</span>
            </div>
            <div class="supplier-price-wrapper">
              <span class="supplier-price">
                <span class="price-amount">{{ formatNumber(supplier.totalPrice) }}</span>
                <span class="price-currency">{{ auction.currency }}</span>
              </span>
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="panel-content">
          <div class="line-items-list">
            <div
              v-for="lineItem in supplier.lineItems"
              :key="lineItem.supplyId"
              class="line-item-row"
            >
              <div class="line-item-left">
                <v-chip
                  v-if="lineItem.rank"
                  variant="text"
                  class="line-rank-chip"
                  :style="{
                    'background-color': getSupplierRankColor(index + 1),
                    height: '20px',
                    width: '20px',
                    'font-size': '12px',
                    'border-radius': '4px',
                    'font-weight': '600',
                    padding: '0'
                  }"
                >
                  {{ lineItem.rank }}
                </v-chip>
                <span v-else class="line-rank-empty">-</span>
                <span class="line-item-name">{{ lineItem.name }}</span>
              </div>
              <span class="line-item-price">
                {{ formatNumber(lineItem.total, 'currency', auction.currency) }}
              </span>
            </div>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </div>
  <div v-else class="text-center text-body-1 my-8">
    {{ t('endDialogBuyer.noBid') }}
  </div>
</template>

<script setup>
const { t } = useTranslations()
const route = useRoute()
const supabase = useSupabaseClient()

// Fetch auction with supplies
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

// Get sellers
const { data: sellers } = await supabase
  .from('auctions_sellers')
  .select('*')
  .eq('auction_id', route.params.auctionId)

// Fetch bids with bid_supplies to get seller IDs and prices
const { data: bids } = await supabase
  .from('bids')
  .select('seller_id, created_at, bid_supplies(supply_id, price)')
  .eq('auction_id', route.params.auctionId)

// Get unique seller IDs from bids
const sellerIds = [...new Set(bids.map((b) => b.seller_id))].filter(
  (id) => id !== undefined && id !== null
)

// Get seller profiles
const { data: profiles } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in('id', sellerIds)

// Add identifiers to profiles
profiles.forEach((profile) => {
  profile.identifier = profile.companies?.name || profile.email
})

// Calculate total price and line items for each supplier
const rankedSuppliers = ref([])
const ranksMatrix = ref({})

// Helper function to get rank for a supply-supplier combination
const getRank = (supplyId, supplierId) => {
  return ranksMatrix.value[supplyId]?.[supplierId]
}

// Build supplier data with totals and line items
for (const profile of profiles) {
  const supplierBids = bids.filter((bid) => bid.seller_id === profile.id)

  if (supplierBids.length === 0) continue

  // Get latest bid for this supplier
  const latestBid = supplierBids.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]

  if (!latestBid || !latestBid.bid_supplies) continue

  let totalPrice = 0
  const lineItems = []

  // Process each supply in the auction
  for (const supply of auction.value.supplies) {
    const bidSupply = latestBid.bid_supplies.find((bs) => bs.supply_id === supply.id)

    if (bidSupply) {
      const pricePerUnit = bidSupply.price
      const total = pricePerUnit * supply.quantity
      totalPrice += total

      // Fetch rank for this supply-supplier combination
      let rank = null
      try {
        rank = await $fetch(
          `/api/v1/auctions/${route.params.auctionId}/supplies/${supply.id}/suppliers/${profile.id}/rank`
        )
        // Store rank in matrix for later use
        if (!ranksMatrix.value[supply.id]) {
          ranksMatrix.value[supply.id] = {}
        }
        ranksMatrix.value[supply.id][profile.id] = rank
      } catch (error) {
        console.error('Error fetching rank:', error)
      }

      lineItems.push({
        supplyId: supply.id,
        name: supply.name,
        quantity: supply.quantity,
        unit: supply.unit,
        pricePerUnit,
        total,
        rank
      })
    }
  }

  rankedSuppliers.value.push({
    id: profile.id,
    identifier: profile.identifier,
    totalPrice,
    lineItems
  })
}

// Sort suppliers by total price (ascending for reverse auction)
rankedSuppliers.value.sort((a, b) => a.totalPrice - b.totalPrice)

// Color function matching BidTableBuyer
function getSupplierRankColor(rank) {
  if (rank === 1) return '#EBFFF7' // Green
  if (rank === 2) return '#FDFFD2' // Yellow
  if (rank === 3) return '#DFF0FF' // Blue
  if (rank === 4) return '#FFF5EB' // Orange
  return '#F5F5F5' // Grey fallback
}
</script>

<style scoped>
.ranking-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 16px;
  margin-bottom: 20px;
}

/* Header row */
.header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 4px;
  padding-right: 28px;
  border-bottom: 1px solid #e9eaec;
}

.header-left {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  width: 86px;
}

.header-text {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: #787878;
  text-transform: uppercase;
}

.header-right {
  text-align: right;
}

/* Expansion panels */
.supplier-panels {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent !important;
  box-shadow: none !important;
}

.supplier-panels :deep(.v-expansion-panels) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.supplier-panels :deep(.v-expansion-panel) {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.supplier-panels :deep(.v-expansion-panel:before) {
  box-shadow: none !important;
  opacity: 0 !important;
}

.supplier-panels :deep(.v-expansion-panel:after) {
  border: none !important;
}

.supplier-panels :deep(.v-expansion-panel__shadow) {
  box-shadow: none !important;
}

.supplier-panel {
  background: transparent !important;
  box-shadow: none !important;
  border: none !important;
}

.supplier-panel:before {
  box-shadow: none !important;
  opacity: 0 !important;
}

.supplier-panel:after {
  border: none !important;
}

.supplier-title {
  padding: 0 !important;
  min-height: auto !important;
  border-radius: 8px;
  border: none !important;
  box-shadow: none !important;
}

.supplier-title:hover {
  background: transparent !important;
}

.supplier-title :deep(.v-expansion-panel-title__overlay) {
  display: none !important;
}

.supplier-panels :deep(.v-expansion-panel-title) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

.supplier-panels :deep(.v-expansion-panel-title:hover) {
  background: transparent !important;
}

.supplier-panels :deep(.v-expansion-panel-title__icon) {
  margin-left: 8px;
}

/* Remove all default Vuetify borders and shadows globally */
.supplier-panels :deep(*) {
  border-color: transparent !important;
}

.supplier-panels :deep(.v-expansion-panel--active),
.supplier-panels :deep(.v-expansion-panel--active:hover),
.supplier-panels :deep(.v-expansion-panel--active:focus) {
  box-shadow: none !important;
  border: none !important;
  background: transparent !important;
}

.supplier-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.supplier-info {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 250px;
}

.rank-chip {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;
  box-shadow: none !important;
  border: none !important;
}

.rank-chip :deep(.v-chip__content) {
  padding: 0 !important;
}

.rank-chip :deep(.v-chip__underlay) {
  display: none !important;
}

.supplier-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
}

.supplier-price-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.supplier-price {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  text-align: right;
  color: #1d1d1b;
}

.price-amount {
  font-weight: 600;
  line-height: normal;
}

.price-currency {
  font-weight: 400;
  line-height: 1.5;
}

/* Panel content */
.panel-content {
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

.panel-content :deep(.v-expansion-panel-text__wrapper) {
  padding: 12px 0 0 0 !important;
  border: none !important;
  box-shadow: none !important;
}

.supplier-panels :deep(.v-expansion-panel-text) {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* Line items */
.line-items-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: transparent;
  border: none;
}

.line-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  background: transparent;
  border: none;
}

.line-item-row:last-child {
  margin-bottom: 16px;
}

.line-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 194px;
}

.line-rank-chip {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  flex-shrink: 0;
  box-shadow: none !important;
  border: none !important;
}

.line-rank-chip :deep(.v-chip__content) {
  padding: 0 !important;
}

.line-rank-chip :deep(.v-chip__underlay) {
  display: none !important;
}

.line-rank-empty {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.line-item-name {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  color: #1d1d1b;
  flex: 1;
  min-width: 0;
  text-align: left;
}

.line-item-price {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: normal;
  color: #1d1d1b;
  text-align: right;
}
</style>
