<template>
  <v-card class="mx-auto fill-height px-1">
    <v-card-title class="font-weight-black pb-0 pt-4">
      {{ t('bidsTable.title') }}
    </v-card-title>
    <v-card-text class="pt-0 pb-0">
      <v-table class="scrollbar-custom">
        <thead>
          <tr>
            <th style="min-width: 264px" class="text-left text-uppercase text-grey text-body-2">
              {{ t('bidsTable.lineItems') }}
            </th>
            <th class="text-uppercase text-grey text-body-2" style="min-width: 160px">
              {{ t('bidsTable.quantity') }}
            </th>
            <th
              v-for="(seller, index) in rankedSellers"
              :key="seller.email"
              class="supplier-header"
              :style="{
                'background-color': colorsMap[seller.email]?.secondary
              }"
            >
              <div class="d-flex align-center" style="gap: 4px">
                <span
                  class="font-weight-bold"
                  style="min-width: 15px; text-align: center; font-size: 14px"
                >
                  {{ index + 1 }}
                </span>
                <span class="font-weight-semibold text-truncate" style="font-size: 14px">
                  {{ seller.companies?.name || seller.email }}
                </span>
                <v-tooltip
                  v-if="seller.companies?.name"
                  activator="parent"
                  location="top"
                  content-class="bg-white text-black border text-body-2"
                >
                  <span>
                    {{ seller.companies.name }}
                  </span>
                </v-tooltip>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="supply in supplies" :key="supply.id" class="border-bottom">
            <td>
              <div class="text-truncate" style="max-width: 264px">
                {{ supply.name }}
                <v-tooltip
                  activator="parent"
                  location="top start"
                  content-class="bg-white text-black border text-body-2"
                >
                  <span>
                    {{ supply.name }}
                  </span>
                </v-tooltip>
              </div>
            </td>
            <td>
              <div>
                {{ formatNumber(supply.quantity) }}
              </div>
              <div class="text-grey">
                {{ supply.unit }}
              </div>
            </td>
            <td
              v-for="(seller, index) in rankedSellers"
              :key="`line_item_${seller.email}`"
              class="py-2 supplier-data-cell"
            >
              <div class="d-flex align-start justify-space-between" style="gap: 8px">
                <div class="flex-grow-1">
                  <div class="mb-1 font-weight-semibold">
                    {{
                      findSellerSupplyPrice(seller.email, supply.id)
                        ? formatNumber(
                            findSellerSupplyPrice(seller.email, supply.id).totalValue.basePrice
                          )
                        : '-'
                    }}
                    <span
                      v-if="
                        findSellerSupplyPrice(seller.email, supply.id) &&
                        findSellerSupplyPrice(seller.email, supply.id).totalValue.text
                      "
                      class="font-weight-semibold"
                    >
                      <span class="text-green-darken-2">{{
                        findSellerSupplyPrice(seller.email, supply.id).totalValue.text
                      }}</span>
                      =
                      {{
                        formatNumber(
                          findSellerSupplyPrice(seller.email, supply.id).totalValue.unitPrice
                        )
                      }}
                    </span>
                  </div>
                  <div class="text-grey" style="font-size: 14px">
                    <span v-if="findSellerSupplyPrice(seller.email, supply.id)">
                      {{ t('bidsTable.total') }}
                      {{
                        formatNumber(
                          findSellerSupplyPrice(seller.email, supply.id).totalValue.totalPrice
                        )
                      }}
                    </span>
                    <span v-else> {{ t('bidsTable.total') }} 0 </span>
                  </div>
                </div>

                <!-- Rank Badge -->
                <v-chip
                  v-if="auction.rank_per_line_item && ranks[seller.email]?.[supply.id]"
                  variant="text"
                  class="font-weight-semibold d-flex align-center justify-center flex-shrink-0"
                  :style="{
                    'background-color': colorsMap[seller.email]?.secondary,
                    height: '20px',
                    width: '20px',
                    'font-size': '12px',
                    'border-radius': '4px',
                    'line-height': '20px'
                  }"
                >
                  {{ ranks[seller.email][supply.id] }}
                </v-chip>
              </div>
            </td>
          </tr>
          <tr>
            <td />
            <td class="font-weight-bold">
              {{ t('bidsTable.totalPrice') }}
            </td>
            <td v-for="seller in rankedSellers" :key="seller.email">
              <span class="font-weight-bold">
                {{
                  findSupplierBestBidsTotalValue(seller.email)
                    ? formatNumber(findSupplierBestBidsTotalValue(seller.email).totalBidPrice)
                    : '0'
                }}
              </span>
              {{ auction.currency }}
            </td>
          </tr>
          <tr
            v-for="(handicapGroupName, index) in handicapsGroups"
            :key="handicapGroupName"
            :class="index === Object.keys(handicapsGroups).length - 1 ? '' : 'border-bottom'"
          >
            <td />
            <td>{{ handicapGroupName }}</td>
            <td v-for="seller in rankedSellers" :key="seller.email" class="py-2">
              <div class="mb-1">
                {{ findHandicap(seller.email, handicapGroupName)?.option_name || '-' }}
              </div>
              <div class="text-grey">
                {{ findHandicap(seller.email, handicapGroupName)?.amount || '-' }}
              </div>
            </td>
          </tr>
          <tr v-if="Object.keys(handicapsGroups).length > 0" class="bg-green-light-2">
            <td />
            <td class="font-weight-bold">
              {{ t('bidsTable.totalValue') }}
            </td>
            <td v-for="seller in rankedSellers" :key="seller.email" class="py-2">
              <span class="font-weight-bold">
                {{
                  findSupplierBestBidsTotalValue(seller.email)
                    ? formatNumber(
                        findSupplierBestBidsTotalValue(seller.email).totalBidPriceWithHandicaps
                      )
                    : '0'
                }}
              </span>
              {{ auction.currency }}
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
<script setup>
import { groupBy } from 'lodash'

// Use translations
const { t } = useTranslations()

const route = useRoute()

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const auctionId = route.params.auctionId
const supabase = useSupabaseClient()

const auction = inject('auction')
const { data: supplies } = await supabase
  .from('supplies')
  .select('*')
  .eq('auction_id', auctionId)
  .order('index', { ascending: true })

const { data: handicaps } = await supabase
  .from('auctions_handicaps')
  .select('*')
  .eq('auction_id', auctionId)

const handicapsByGroup = groupBy(handicaps, 'group_name')

const handicapsGroups = computed(() => {
  return Object.keys(handicapsByGroup)
})

const {
  bestBidsTotalValue,
  findSellerSupplyPrice,
  rankedSellers,
  getSupplyRank,
  clearSupplyRankCache
} = await useTotalValue({ auctionId })

function findHandicap(email, handicapGroupName) {
  const handicapGroup = handicapsByGroup[handicapGroupName]
  const sellerBestBid = bestBidsTotalValue.value.find(({ seller }) => {
    return seller.email === email
  })

  return handicapGroup.find(({ id }) => {
    return sellerBestBid?.bidHandicaps
      .map(({ handicap_id }) => {
        return handicap_id
      })
      .includes(id)
  })
}

function findSupplierBestBidsTotalValue(email) {
  return bestBidsTotalValue.value.find(({ seller }) => {
    return seller.email === email
  })
}

// Rank per line item logic
const ranks = ref({})

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
  if (!auction.rank_per_line_item) return

  // Clear cache to get fresh ranks
  clearSupplyRankCache()

  // Don't reset ranks.value - keep old values visible during update
  const newRanks = {}

  // Collect all rank fetch promises
  const rankPromises = []

  for (const seller of rankedSellers.value) {
    if (!seller || !seller.email) {
      console.warn('[BidTableBuyer] Seller without email found:', seller)
      continue
    }

    newRanks[seller.email] = {}

    for (const supply of supplies) {
      // Create promise for each rank fetch
      rankPromises.push(
        getSupplyRank(seller.id, supply.id).then((rank) => ({
          sellerEmail: seller.email,
          supplyId: supply.id,
          rank
        }))
      )
    }
  }

  // Parallelize all API calls
  const results = await Promise.all(rankPromises)

  // Update ranks atomically
  for (const { sellerEmail, supplyId, rank } of results) {
    if (rank > 0) {
      if (!newRanks[sellerEmail]) newRanks[sellerEmail] = {}
      newRanks[sellerEmail][supplyId] = rank
    }
  }

  ranks.value = newRanks
}

// Watch bestBidsTotalValue to update ranks when bids change
watch(
  bestBidsTotalValue,
  () => {
    debouncedUpdateRanks()
  },
  { deep: true }
)

onMounted(() => debouncedUpdateRanks(true))
</script>

<style scoped>
th {
  border: none !important;
  padding: 8px !important;
  height: 36px !important;
  vertical-align: middle;
}

.supplier-header {
  border-radius: 4px;
  min-width: 180px;
  border-right: 10px solid white !important;
}

.border-bottom td {
  border: none !important;
  border-bottom: 1px solid #e9eaec !important;
}

td {
  padding: 12px 8px !important;
  vertical-align: top;
}

.supplier-data-cell {
  min-width: 180px;
}

/* Scrollbar container */
.scrollbar-custom {
  max-height: calc(100vh - 280px);
  overflow: auto;
}

.scrollbar-custom:deep(.v-table__wrapper) {
  padding: 0 1rem 1rem 0;
}

/* Scrollbar styles */
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar {
  width: 3px;
  height: 3px;
}

.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-track {
  border: 7px solid #f8f8f8;
  background: #f8f8f8;
  border-radius: 20px;
}

.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-thumb {
  border: 6px solid #c5c7c9;
  border-radius: 9px;
  background-clip: content-box;
}

.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: #c5c7c9;
  border: 5px solid #d4d5d5;
  border-radius: 9px;
  background-clip: content-box;
}
</style>
