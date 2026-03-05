<template>
  <PricingRow :title="t('pricing.currentPrice')" :img="{ src: '/icons/bid_icon.svg', width: 40 }">
    <template #content>
      <span class="text-h6 font-weight-bold">{{
        formatNumber(
          (activeRound?.price || ceilingPrice) /
            (displayPricePerUnit ? auction?.supplies[0].quantity : 1)
        )
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

const { activeRound } = useDutchRounds(auction)

const { ceilingPrice } = useCeilingPrice(route.params.auctionId)
</script>
