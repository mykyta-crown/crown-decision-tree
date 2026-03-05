<template>
  <!-- Show per-line-item ranking view if feature is enabled and auction has multiple supplies -->
  <AuctionsEnglishEndDialogContentPerLineItem
    v-if="auction.rank_per_line_item && auction.supplies && auction.supplies.length > 1"
  />

  <!-- Otherwise show simple summary view -->
  <v-row v-else align="center" class="text-subtitle-1">
    <v-col cols="12">
      <template v-if="rank > 0">
        <div>
          <span v-html="t('englishEndDialog.finishedRank', { rank })" />
          <br />
          <span
            v-html="
              t('englishEndDialog.biddingPrice', {
                price: formatNumber(
                  bestBidsTotalValue[0].totalBidPriceWithHandicaps,
                  'currency',
                  auction.currency
                )
              })
            "
          />
        </div>
      </template>
      <div v-else>
        {{ t('englishEndDialog.noBid') }}
      </div>
    </v-col>
  </v-row>
</template>
<script setup>
const { t } = useTranslations()
const route = useRoute()
const { auction, rank } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { bestBidsTotalValue } = await useTotalValue({ auctionId: route.params.auctionId })
</script>
