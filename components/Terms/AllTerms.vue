<template>
  <v-sheet class="custom-border bg-background">
    <v-container class="bg-background ma-0 pa-0" fluid :data-auction-id="auction?.id || ''">
      <div v-if="auction">
        <TermsDescriptionPanel :auction="auction" :is-buyer="isBuyer" />

        <TermsRulesPanel id="terms-rules-panel" :auction="auction" />
        <TermsCeilingPanel
          v-if="isBuyer"
          id="terms-ceiling-panel"
          :auction="auction"
          :suppliers="auction.auctions_sellers"
        />
        <TermsCeilingSupplierPanel
          v-else-if="auction.dutch_prebid_enabled"
          id="terms-ceiling-supplier-panel"
          :auction="auction"
          :suppliers="auction.auctions_sellers"
        />
        <TermsFixedHandicapPanel
          v-if="isBuyer && gotFixedHandicap"
          id="terms-fixed-handicap-panel"
          :auction="auction"
          :suppliers="auction.auctions_sellers"
        />
        <TermsDynamicHandicapPanel
          v-if="isBuyer && gotDynamicHandicap"
          :auction="auction"
          :suppliers="auction.auctions_sellers"
        />
        <TermsDynamicHandicapSupplierPanel
          v-if="!isBuyer && gotDynamicHandicap"
          id="terms-dynamic-handicap-panel"
          :auction="auction"
          :suppliers="auction.auctions_sellers"
        />
        <TermsAwardingPanel id="terms-awarding-panel" :auction="auction" />
        <TermsCommercialPanel id="terms-commercial-panel" :auction="auction" />
        <TermsGeneralPanel id="terms-general-panel" :auction="auction" />
      </div>

      <v-skeleton-loader v-else type="article" />
    </v-container>
  </v-sheet>
</template>

<script setup>
const { isBuyer, auctionId } = defineProps({
  isBuyer: Boolean,
  auctionId: String
})

const { auction } = await useUserAuctionBids({ auctionId })

const gotFixedHandicap = computed(() => {
  if (!auction.value?.supplies) return false
  return auction.value.supplies.some((supply) =>
    supply.supplies_sellers.some((seller) => seller.additive !== 0 || seller.multiplicative !== 1)
  )
})

const supabase = useSupabaseClient()

const gotDynamicHandicap = ref(false)

// Fetch handicaps once auction is loaded
watch(
  () => auction.value?.id,
  async (auctionId) => {
    if (!auctionId) return
    const { data: handicaps } = await supabase
      .from('auctions_handicaps')
      .select('id')
      .eq('auction_id', auctionId)
    gotDynamicHandicap.value = (handicaps?.length || 0) > 0
  },
  { immediate: true }
)
</script>
<style>
.cols-title {
  font-size: 14px;
  font-weight: 600;
}
</style>
