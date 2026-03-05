<template>
  <BigNumberBidCard :img="{ src: '/icons/baseline_icon.svg', width: 30 }" title="Starting Price">
    <template #content>
      <span class="text-h3">{{ formatNumber(startingPrice, 'currency', auction?.currency) }}</span>
    </template>
  </BigNumberBidCard>
</template>

<script setup>
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { startingPrice } = useDutchRounds(auction)
</script>
