<template>
  <v-card class="mx-auto fill-height px-1 card-height pr-0">
    <v-card-title class="font-weight-black pb-0 pt-4">
      {{ t('leaderboard.title') }}
    </v-card-title>

    <v-card-text class="pr-0">
      <v-table
        fixed-header
        density="default"
        class="overflow-auto leaders-table-max-height scrollbar-custom"
      >
        <thead>
          <tr class="text-grey text-body-2">
            <th class="text-left pt-2">
              <span>
                {{ t('leaderboard.rank') }}
              </span>
            </th>
            <th class="text-left pt-2">
              <span class="text-center pl-4 w-30">
                {{ t('leaderboard.name') }}
              </span>
            </th>
            <th class="text-left pt-2">
              <span>
                {{ t('leaderboard.status') }}
              </span>
            </th>
            <th class="text-center pt-2">
              <span>
                {{ t('leaderboard.bidPrice') }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(seller, i) in rankedSellers" :key="seller.email">
            <td>
              <v-chip
                tile
                variant="text"
                class="font-weight-bold rounded-lg d-flex align-center justify-center"
                :style="{
                  width: '28px',
                  height: '28px',
                  'background-color': colorsMap[seller.email]?.secondary || '#E0E0E0'
                }"
              >
                <span class="custom-padding-rank">
                  {{ i + 1 }}
                </span>
              </v-chip>
            </td>
            <td class="company-cell text-truncate text-left w-30">
              <v-tooltip :text="seller.companies?.name || seller.email">
                <template #activator="{ props }">
                  <span v-bind="props">{{ seller.companies?.name || seller.email }}</span>
                </template>
              </v-tooltip>
            </td>
            <td
              class="text-capitalize"
              :class="status[seller.email] === 'online' ? 'text-success' : 'text-error'"
            >
              {{ t(`leaderboard.${status[seller.email] || 'offline'}`) }}
            </td>
            <!-- Lowest Bid -->
            <td v-if="findSellerBestBid(seller.email)">
              <div class="d-flex justify-end align-center">
                <span class="semi-bold">{{
                  formatNumber(findSellerBestBid(seller.email).totalBidPriceWithHandicaps)
                }}</span
                >&nbsp;{{ auction.currency }}
              </div>

              <!-- <span class="semi-bold">{{ formatNumber(findSellerBestBid(seller.email).totalBidPriceWithHandicaps) }}</span> {{ auction.currency }} -->
            </td>
            <td v-else class="text-center">-</td>
          </tr>
        </tbody>
      </v-table>
    </v-card-text>
  </v-card>
</template>
<script setup>
// Use translations
const { t } = useTranslations()

const route = useRoute()

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const auctionId = route.params.auctionId

const auction = inject('auction')
const sellers = inject('sellers')

const { findSellerBestBid, rankedSellers } = await useTotalValue({ auctionId })

const presences = inject('presences')

// Debug: Check if any sellers are missing colors
watchEffect(() => {
  const sellersWithoutColors = rankedSellers.value.filter((seller) => !colorsMap[seller.email])
  if (sellersWithoutColors.length > 0) {
    console.warn('[LeaderboardCard] Sellers missing colors:', {
      sellersWithoutColors: sellersWithoutColors.map((s) => s.email),
      availableColors: Object.keys(colorsMap),
      auctionId
    })
  }
})

const status = computed(() => {
  const statusMap = {}

  sellers.value?.forEach((seller) => {
    const presence = presences.value.find((p) => p.user === seller.id)
    statusMap[seller.email] = presence ? 'online' : 'offline'
  })

  return statusMap
})
</script>

<style scoped>
.card-height {
  max-height: 300px !important;
}
.leaders-table-max-height {
  max-height: 230px;
}
td,
th {
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.leaders-table-max-height:deep(th) {
  max-height: 16px !important;
  height: 16px !important;
  padding-bottom: 4px !important;
}

.company-cell {
  max-width: 140px;
}
.v-table .v-table__wrapper > table > tbody > tr > td {
  border: none !important;
  height: 25px;
  padding-top: 20px;
}
.max-width-rank-column {
  max-width: 24px;
  padding: 0 !important;
}

.v-table .v-table__wrapper > table > tbody > tr > td:nth-child(2) {
  max-width: 220px;
  width: 220px;
  min-width: 220px;
}
.v-table .v-table__wrapper > table > tbody > tr > td:nth-child(4) {
  max-width: 110px;
  width: 110px;
  min-width: 110px;
}
.custom-padding-rank {
  padding-top: 1px;
}

.scrollbar-custom {
  max-height: 220px;
  overflow-y: auto;
}
.scrollbar-custom:deep(.v-table__wrapper) {
  padding-right: 1rem;
}
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar {
  width: 3px;
}
/* Track */
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-track {
  border: 7px solid #f8f8f8;
  background: #f8f8f8;
  border-radius: 20px;
  height: 50px;
}

/* Handle */
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-thumb {
  border: 6px solid #c5c7c9;
  border-radius: 9px;
  background-clip: content-box;
}

/* Handle on hover */
.scrollbar-custom:deep(.v-table__wrapper)::-webkit-scrollbar-thumb:hover {
  background: #c5c7c9;
  border: 5px solid #d4d5d5;
  height: 2px;
  border-radius: 9px;
  background-clip: content-box;
}
</style>
