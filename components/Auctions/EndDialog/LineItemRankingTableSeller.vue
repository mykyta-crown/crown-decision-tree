<template>
  <!-- Line-item table for seller (shows only their own line items) -->
  <div
    v-if="auction?.supplies && auction.supplies.length > 0 && lineItems.length > 0"
    class="ranking-container"
  >
    <!-- Header row -->
    <div class="header-row">
      <div class="header-left">
        <span v-if="showRank" class="header-text header-rank">{{
          t('endDialogSeller.table.rank')
        }}</span>
        <span class="header-text header-line-item">{{ t('endDialogSeller.table.lineItem') }}</span>
      </div>
      <span class="header-text header-right">{{ t('endDialogSeller.table.bidPrice') }}</span>
    </div>

    <!-- Line items list -->
    <div class="line-items-list">
      <div v-for="lineItem in lineItems" :key="lineItem.supplyId" class="line-item-row">
        <div class="line-item-left">
          <v-chip
            v-if="showRank && lineItem.rank"
            variant="text"
            class="rank-chip"
            :style="{
              'background-color': colorsMap[user.email]?.secondary,
              height: '28px',
              width: '28px',
              'font-size': '15px',
              'border-radius': '4px',
              'font-weight': '600',
              padding: '0'
            }"
          >
            {{ lineItem.rank }}
          </v-chip>
          <span v-else-if="showRank" class="rank-empty">-</span>
          <span class="line-item-name">{{ lineItem.name }}</span>
        </div>
        <span class="line-item-price">
          {{ formatNumber(lineItem.price, 'currency', auction.currency) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
const { t } = useTranslations()
const route = useRoute()
const { user } = useUser()

const { getColors } = useColorSchema()
const colorsMap = await getColors()

// Fetch auction and rank data
const { auction, rank } = await useUserAuctionBids({ auctionId: route.params.auctionId })

// Show rank column only if rank display is enabled
const showRank = computed(() => auction.value?.max_rank_displayed > 0)

// Use bestBidsTotalValue to get the user's bid info
const { bestBidsTotalValue, getSupplyRanks } = await useTotalValue({
  auctionId: route.params.auctionId
})

// Find current user's bid data
const userBid = bestBidsTotalValue.value.find((bid) => bid.seller.id === user.value.id)

// Build line items with ranks and prices
const lineItems = ref([])

// Fetch supply ranks for current user
let supplyRanks = {}
if (user.value?.id) {
  supplyRanks = await getSupplyRanks(user.value.id)
}

if (auction.value && auction.value.supplies && userBid && userBid.bidSupplies) {
  for (const bidSupply of userBid.bidSupplies) {
    const supply = auction.value.supplies.find((s) => s.id === bidSupply.sellerSupply.supply_id)

    if (supply) {
      const supplyRank = supplyRanks[bidSupply.sellerSupply.supply_id]

      lineItems.value.push({
        supplyId: supply.id,
        name: supply.name,
        price: bidSupply.totalValue.totalPrice,
        rank: supplyRank > 0 ? supplyRank : null
      })
    }
  }
}
</script>

<style scoped>
.ranking-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 16px;
}

/* Header row */
.header-row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 4px;
  border-bottom: 1px solid #e9eaec;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.header-text {
  font-family: 'Poppins', sans-serif;
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  color: #787878;
  text-transform: uppercase;
}

.header-rank {
  min-width: 60px;
  flex-shrink: 0;
  text-align: center;
}

.header-line-item {
  flex: 1;
  text-align: left;
}

.header-right {
  text-align: right;
}

/* Line items */
.line-items-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: transparent;
  border: none;
  margin-top: 8px;
}

.line-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: transparent;
  border: none;
  padding: 4px 0;
}

.line-item-row:last-child {
  margin-bottom: 16px;
}

.line-item-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.line-item-left > .rank-chip {
  width: 28px !important;
  min-width: 28px !important;
  max-width: 28px !important;
  margin: 0 16px;
}

.line-item-left > .rank-empty {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  margin: 0 16px;
}

.rank-chip {
  flex-shrink: 0;
  box-shadow: none !important;
  border: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.rank-chip :deep(.v-chip__content) {
  padding: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  width: 100% !important;
  height: 100% !important;
}

.rank-chip :deep(.v-chip__underlay) {
  display: none !important;
}

.line-item-name {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: normal;
  color: #1d1d1b;
  flex: 1;
  min-width: 0;
  text-align: left;
}

.line-item-price {
  font-family: 'Poppins', sans-serif;
  font-size: 14px;
  font-weight: 600;
  line-height: normal;
  color: #1d1d1b;
  text-align: right;
}
</style>
