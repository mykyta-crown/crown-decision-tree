<template>
  <v-sheet class="custom-border bg-background">
    <v-container
      v-if="auction"
      id="prebid-approval-capture"
      class="bg-background ma-0 pa-0"
      fluid
      :data-auction-id="auction?.id || ''"
    >
      <TermsApprovalPanel :sellers="auction.auctions_sellers" :auction-id="auctionId" />
      <TermsPrebidPanel
        v-if="auction.dutch_prebid_enabled || auction.type === 'reverse'"
        :auction="auction"
        :suppliers="auction.auctions_sellers"
      />
      <TermsCeilingPanel
        v-if="auction.dutch_prebid_enabled || auction.type === 'reverse'"
        :auction="auction"
        :suppliers="auction.auctions_sellers"
      />
    </v-container>
  </v-sheet>
</template>

<script setup>
const { auctionId } = defineProps({
  auctionId: String
})

const { auction } = await useUserAuctionBids({ auctionId: auctionId })
</script>
<style>
/* All Column titles */
.cols-title {
  font-size: 14px;
  font-weight: 600;
}
</style>
