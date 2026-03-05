<template>
  <!-- Seller view with line-item ranking if enabled -->
  <AuctionsEndDialogLineItemRankingTableSeller v-if="shouldShowLineItemRanking" />

  <!-- Simple view for auctions without line-item ranking -->
  <!-- (Dutch and Japanese have their own specific components in EndDialogSeller.vue) -->
</template>

<script setup>
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

// Should show line-item table if feature is enabled and auction has multiple supplies
const shouldShowLineItemRanking = computed(() => {
  return (
    auction.value?.rank_per_line_item &&
    auction.value?.supplies?.length > 1 &&
    ['english', 'reverse', 'sealed-bid'].includes(auction.value?.type)
  )
})
</script>
