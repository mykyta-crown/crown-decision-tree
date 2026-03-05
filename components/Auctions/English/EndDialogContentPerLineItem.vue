<template>
  <v-expansion-panels v-if="topSuppliers.length > 0" variant="accordion" class="my-4">
    <v-expansion-panel
      v-for="(supplier, index) in topSuppliers"
      :key="supplier.seller.id"
      :value="index"
    >
      <v-expansion-panel-title>
        <v-row no-gutters align="center">
          <v-col cols="auto">
            <v-chip
              size="small"
              class="font-weight-bold mr-3"
              variant="text"
              :style="{ 'background-color': colorsMap[supplier.seller.email]?.secondary }"
            >
              {{ sellerRanks[supplier.seller.id] || index + 1 }}
            </v-chip>
          </v-col>
          <v-col>
            <span class="text-subtitle-1 font-weight-bold">
              {{ supplier.seller.companies?.name || supplier.seller.email }}
            </span>
          </v-col>
          <v-col cols="auto" class="text-right">
            <span class="text-h6 font-weight-bold">
              {{
                formatNumber(
                  supplier.bidSupplies.reduce(
                    (sum, bs) =>
                      sum + bs.totalValue.basePrice * getSupplyQuantity(bs.sellerSupply.supply_id),
                    0
                  ),
                  'currency',
                  auction.currency
                )
              }}
            </span>
          </v-col>
        </v-row>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-table density="compact" class="line-items-table">
          <thead>
            <tr>
              <th class="text-left">
                {{ t('lineItemRanking.lineItems') }}
              </th>
              <th class="text-center">
                {{ t('dutch.suppliesBidsTable.quantity') }}
              </th>
              <th class="text-center">
                {{ t('dutch.suppliesBidsTable.pricePerUnit') }}
              </th>
              <th v-if="showRank" class="text-center">
                {{ t('dutch.suppliesBidsTable.rank') }}
              </th>
              <th class="text-right">
                {{ t('dutch.suppliesBidsTable.total') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bidSupply in supplier.bidSupplies" :key="bidSupply.sellerSupply.supply_id">
              <td class="text-left">
                {{ getSupplyName(bidSupply.sellerSupply.supply_id) }}
              </td>
              <td class="text-center">
                {{ getSupplyQuantity(bidSupply.sellerSupply.supply_id) }}
              </td>
              <td class="text-center">
                {{ formatNumber(bidSupply.totalValue.basePrice, 'currency', auction.currency) }}
              </td>
              <td v-if="showRank" class="text-center">
                <v-chip
                  v-if="supplyRanks[supplier.seller.id]?.[bidSupply.sellerSupply.supply_id]"
                  size="small"
                  class="font-weight-bold"
                  variant="text"
                  :style="{ 'background-color': colorsMap[supplier.seller.email]?.secondary }"
                >
                  {{ supplyRanks[supplier.seller.id][bidSupply.sellerSupply.supply_id] }}
                </v-chip>
                <span v-else>-</span>
              </td>
              <td class="text-right font-weight-bold">
                {{
                  formatNumber(
                    bidSupply.totalValue.basePrice *
                      getSupplyQuantity(bidSupply.sellerSupply.supply_id),
                    'currency',
                    auction.currency
                  )
                }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td :colspan="showRank ? 4 : 3" class="text-right font-weight-bold">
                {{ t('lineItemRanking.overallTotal') }}:
              </td>
              <td class="text-right font-weight-bold text-h6">
                {{
                  formatNumber(
                    supplier.bidSupplies.reduce(
                      (sum, bs) =>
                        sum +
                        bs.totalValue.basePrice * getSupplyQuantity(bs.sellerSupply.supply_id),
                      0
                    ),
                    'currency',
                    auction.currency
                  )
                }}
              </td>
            </tr>
          </tfoot>
        </v-table>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
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
const { fetchRank } = useRank()

const { getColors } = useColorSchema()
const colorsMap = await getColors()

// Show rank column only if rank display is enabled
const showRank = computed(() => auction.value?.max_rank_displayed > 0)

// Get top 3 suppliers
const topSuppliers = computed(() => {
  return bestBidsTotalValue.value.slice(0, 3)
})

// Fetch overall SQL rank and per-supply ranks for all top suppliers
const sellerRanks = ref({})
const supplyRanks = ref({})

onMounted(async () => {
  for (const supplier of topSuppliers.value) {
    const [rank, ranks] = await Promise.all([
      fetchRank(supplier.seller.id, auction.value.id),
      getSupplyRanks(supplier.seller.id)
    ])
    sellerRanks.value[supplier.seller.id] = rank
    supplyRanks.value[supplier.seller.id] = ranks
  }
})

// Helper function to get supply name
function getSupplyName(supplyId) {
  const supply = auction.value.supplies.find((s) => s.id === supplyId)
  return supply?.name || '-'
}

// Helper function to get supply quantity
function getSupplyQuantity(supplyId) {
  const supply = auction.value.supplies.find((s) => s.id === supplyId)
  return supply?.quantity || 0
}
</script>

<style scoped>
.line-items-table {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.line-items-table thead tr {
  background-color: rgba(0, 0, 0, 0.04);
}

.line-items-table tfoot tr {
  border-top: 2px solid rgba(0, 0, 0, 0.12);
  background-color: rgba(0, 0, 0, 0.02);
}
</style>
