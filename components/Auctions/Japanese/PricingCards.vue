<template>
  <PricingRow
    :title="status.label !== 'closed' ? t('pricing.currentPrice') : t('pricing.winningPrice')"
    :img="{ src: '/icons/bid_icon.svg', width: 40 }"
  >
    <template #content>
      <span class="text-h6 font-weight-bold">{{
        formatNumber(displayedPrice / (displayPricePerUnit ? auction?.supplies[0].quantity : 1))
      }}</span>
      <span class="round-text font-weight-regular">{{ auction.currency }}</span>
    </template>
  </PricingRow>
</template>

<script setup>
defineProps(['displayPricePerUnit'])
const { t } = useTranslations()
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { activeRound } = useJapaneseRounds(auction)

const { status } = useAuctionTimer(auction)
const { ceilingPrice } = useCeilingPrice(route.params.auctionId)

const displayedPrice = computed(() => {
  if (status.value.label === 'closed') {
    const sortedBidsbyPrice = [...auction.value.bids].sort((a, b) => a.price - b.price)

    return sortedBidsbyPrice[0]?.price || 0
  } else {
    return activeRound?.value.price || ceilingPrice.value
  }
})
</script>
