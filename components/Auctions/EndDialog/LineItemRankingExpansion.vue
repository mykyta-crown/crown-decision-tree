<template>
  <div v-if="topSuppliers.length > 0" class="ranking-container">
    <!-- Header row -->
    <div class="header-row">
      <div class="header-left">
        <span class="header-text header-rank">{{ t('leaderboard.rank') }}</span>
        <span class="header-text header-name">{{ t('leaderboard.name') }}</span>
      </div>
      <span class="header-text header-right">{{ t('leaderboard.bidPrice') }}</span>
    </div>

    <!-- Suppliers list -->
    <div class="suppliers-list">
      <div
        v-for="(supplier, index) in topSuppliers"
        :key="supplier.seller.id"
        class="supplier-block"
      >
        <!-- Supplier row (clickable to expand) -->
        <div class="supplier-row" @click="toggleExpand(supplier.seller.id)">
          <div class="supplier-left">
            <div class="rank-badge" :style="{ backgroundColor: getRankBgColor(index + 1) }">
              {{ index + 1 }}
            </div>
            <span class="supplier-name">
              {{ supplier.seller.companies?.name || supplier.seller.email }}
            </span>
          </div>
          <div class="supplier-right">
            <span class="supplier-price">
              <span class="price-value">{{
                formatNumber(supplier.totalBidPriceWithHandicaps)
              }}</span>
              <span class="price-currency"> {{ auction.currency }}</span>
            </span>
            <v-icon
              :class="[
                'chevron-icon',
                { 'chevron-expanded': expandedSuppliers[supplier.seller.id] }
              ]"
              size="20"
            >
              mdi-chevron-down
            </v-icon>
          </div>
        </div>

        <!-- Expanded line items -->
        <div v-show="expandedSuppliers[supplier.seller.id]" class="line-items-container">
          <div
            v-for="bidSupply in supplier.bidSupplies"
            :key="bidSupply.sellerSupply.supply_id"
            class="line-item-row"
          >
            <div class="line-item-left">
              <div
                v-if="supplyRanks[supplier.seller.id]?.[bidSupply.sellerSupply.supply_id]"
                class="rank-badge-small"
                :style="{
                  backgroundColor: getRankBgColor(
                    supplyRanks[supplier.seller.id][bidSupply.sellerSupply.supply_id]
                  )
                }"
              >
                {{ supplyRanks[supplier.seller.id][bidSupply.sellerSupply.supply_id] }}
              </div>
              <div v-else class="rank-badge-small rank-badge-empty">-</div>
              <span class="line-item-name">
                {{ getSupplyName(bidSupply.sellerSupply.supply_id) }}
              </span>
            </div>
            <span class="line-item-price">
              {{ formatNumber(bidSupply.totalValue.totalPrice) }} {{ auction.currency }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="text-center text-body-1 my-8">
    {{ t('englishEndDialog.noBid') }}
  </div>
</template>

<script setup>
const { t } = useTranslations()
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { bestBidsTotalValue, getSupplyRanks } = await useTotalValue({
  auctionId: route.params.auctionId
})

// Get top suppliers (up to 4 as per Figma design)
const topSuppliers = computed(() => {
  return bestBidsTotalValue.value.slice(0, 4)
})

// Track expanded state for each supplier
const expandedSuppliers = ref({})

// Toggle expand/collapse for a supplier
function toggleExpand(sellerId) {
  expandedSuppliers.value[sellerId] = !expandedSuppliers.value[sellerId]
}

// Fetch supply ranks for all top suppliers
const supplyRanks = ref({})

onMounted(async () => {
  // Expand first supplier by default
  if (topSuppliers.value.length > 0) {
    expandedSuppliers.value[topSuppliers.value[0].seller.id] = true
  }

  for (const supplier of topSuppliers.value) {
    supplyRanks.value[supplier.seller.id] = await getSupplyRanks(supplier.seller.id)
  }
})

// Rank background colors matching Figma design
function getRankBgColor(rank) {
  if (rank === 1) return '#DDFBEE' // Green
  if (rank === 2) return '#FDFFD2' // Yellow
  if (rank === 3) return '#DFF0FF' // Blue
  if (rank === 4) return '#FFF5EB' // Orange
  return '#F5F5F5' // Grey fallback
}

// Helper function to get supply name
function getSupplyName(supplyId) {
  const supply = auction.value.supplies.find((s) => s.id === supplyId)
  return supply?.name || '-'
}
</script>

<style scoped>
.ranking-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 12px;
  margin-bottom: 24px;
}

/* Header row */
.header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 8px;
  padding-right: 28px;
  border-bottom: 1px solid #e9eaec;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-rank {
  min-width: 44px;
}

.header-name {
  margin-left: 20px;
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

/* Suppliers list */
.suppliers-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.supplier-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Supplier row */
.supplier-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  border-radius: 8px;
  padding: 4px 0;
  transition: background-color 0.2s;
}

.supplier-row:hover {
  background-color: rgba(0, 0, 0, 0.02);
}

.supplier-left {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.rank-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1b;
  flex-shrink: 0;
}

.supplier-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  color: #1d1d1b;
}

.supplier-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.supplier-price {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  color: #1d1d1b;
  text-align: right;
}

.price-value {
  font-weight: 600;
}

.price-currency {
  font-weight: 400;
}

.chevron-icon {
  color: #1d1d1b;
  transition: transform 0.2s ease;
}

.chevron-expanded {
  transform: rotate(180deg);
}

/* Line items (expanded content) */
.line-items-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 44px;
}

.line-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 28px;
}

.line-item-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rank-badge-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #1d1d1b;
  flex-shrink: 0;
}

.rank-badge-empty {
  background-color: #f5f5f5;
}

.line-item-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #1d1d1b;
  flex: 1;
  min-width: 0;
  text-align: left;
}

.line-item-price {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #1d1d1b;
  text-align: right;
}
</style>
