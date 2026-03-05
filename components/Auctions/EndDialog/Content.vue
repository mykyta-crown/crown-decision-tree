<template>
  <!-- Buyer view avec détail par line-item -->
  <AuctionsEndDialogLineItemRankingTable v-if="isBuyer && shouldShowLineItemRanking" />

  <!-- Buyer view simple (sans détail par line-item) -->
  <AuctionsEndDialogSimpleView v-else-if="isBuyer" :is-buyer="true" />

  <!-- Seller view: English (reverse) avec line-items : expansion panels détaillés -->
  <AuctionsEndDialogLineItemRankingExpansion v-else-if="shouldShowLineItemRanking && isEnglish" />

  <!-- Seller view: Sealed-bid avec line-items : table simple -->
  <AuctionsEndDialogLineItemRankingTable v-else-if="shouldShowLineItemRanking && isSealedBid" />

  <!-- Seller view: Tous les autres cas : vue simple -->
  <AuctionsEndDialogSimpleView v-else />
</template>

<script setup>
const props = defineProps({
  isBuyer: {
    type: Boolean,
    default: false
  }
})

const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

// Should show line-item ranking if feature is enabled and auction has multiple supplies
const shouldShowLineItemRanking = computed(() => {
  return auction.value?.rank_per_line_item && auction.value?.supplies?.length > 1
})

// Auction type checks
// Note: "English" auctions use type='reverse' in the database
const isEnglish = computed(() => auction.value?.type === 'reverse')
const isSealedBid = computed(() => auction.value?.type === 'sealed-bid')
</script>
