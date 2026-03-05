<template>
  <BigNumberBidCard :img="{ src: '/icons/lowest_curr_icon.svg', width: 30 }" title="Ceiling Price">
    <template #content>
      <span class="text-h3">{{ formatNumber(endingPrice, 'currency', auction?.currency) }}</span>
    </template>
  </BigNumberBidCard>
</template>

<script setup>
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { endingPrice } = useDutchRounds(auction)
</script>
