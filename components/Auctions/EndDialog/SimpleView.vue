<template>
  <!-- Buyer view: table des suppliers (same as old inline implementation) -->
  <template v-if="isBuyer">
    <v-table
      v-if="sellersProfiles && sellersProfiles.length > 0"
      fixed-header
      class="overflow-auto w-100 my-4"
    >
      <thead>
        <tr class="text-grey">
          <th class="text-left" style="width: 50px">
            {{ t('endDialogBuyer.table.rank') }}
          </th>
          <th class="text-center">
            {{ t('endDialogBuyer.table.name') }}
          </th>
          <th class="text-right">
            {{ t('endDialogBuyer.table.bidPrice') }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(supplier, i) in sellersProfiles" :key="supplier.identifier" class="no-border">
          <td class="text-left">
            <v-chip
              tile
              variant="text"
              class="rounded-lg justify-center font-weight-bold"
              :style="{
                width: '32px',
                height: '32px',
                'background-color': colorsMap[supplier.email]?.secondary || '#E0E0E0'
              }"
            >
              <span>{{ i + 1 }}</span>
            </v-chip>
          </td>
          <td class="text-center">
            {{ supplier.identifier }}
          </td>
          <td class="font-weight-bold text-right">
            {{
              supplier.type === 'ceiling' || !supplier.bestBid
                ? '-'
                : formatNumber(supplier.bestBid.price, 'currency', buyerAuction?.currency)
            }}
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-else class="text-center text-body-1 my-8">
      {{ t('endDialogBuyer.noBid') }}
    </div>
  </template>

  <!-- Seller view -->
  <v-row v-else align="center" class="text-subtitle-1">
    <v-col cols="12">
      <!-- English auction simple view (type='reverse' in database) -->
      <template v-if="auction.type === 'reverse' && rank > 0">
        <div>
          <span v-html="t('englishEndDialog.finishedRank', { rank })" />
          <br />
          <span
            v-html="
              t('englishEndDialog.biddingPrice', {
                price: formatNumber(
                  bestBidsTotalValue[0]?.totalBidPriceWithHandicaps,
                  'currency',
                  auction.currency
                )
              })
            "
          />
        </div>
      </template>

      <!-- English auction no bid -->
      <div v-else-if="auction.type === 'reverse' && rank === 0">
        {{ t('englishEndDialog.noBid') }}
      </div>

      <!-- Other auction types can be added here -->
      <div v-else>
        {{ t('endDialog.completed') }}
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps({
  isBuyer: {
    type: Boolean,
    default: false
  }
})

const { t } = useTranslations()
const route = useRoute()

// Inject data from EndDialogBuyer (for buyer view)
const sellersProfiles = inject('sellersProfiles', null)
const colorsMap = inject('colorsMap', null)
const buyerAuction = inject('buyerAuction', null)

// Seller view data (only fetch if not buyer)
const { auction, rank } = props.isBuyer
  ? { auction: ref(null), rank: ref(0) }
  : await useUserAuctionBids({ auctionId: route.params.auctionId })

const { bestBidsTotalValue } = props.isBuyer
  ? { bestBidsTotalValue: ref([]) }
  : await useTotalValue({ auctionId: route.params.auctionId })
</script>

<style scoped>
td {
  border: none !important;
}
</style>
