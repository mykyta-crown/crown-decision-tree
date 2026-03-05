<template>
  <!-- What if we handle the empty case when no bids here -->
  <v-row v-if="isBuyer || bids.length > 0" align="center" class="text-subtitle-1">
    <v-col cols="12">
      <div v-if="isBuyer">
        <div
          v-if="bids.length > 0"
          v-html="
            t('japaneseEndDialog.winnerFinished', {
              winner: bestSupply.seller.identifier,
              price: formatNumber(bestSupply.price),
              currency: auction.currency
            })
          "
        />
        <div v-else>
          {{ t('japaneseEndDialog.noBid') }}
        </div>
      </div>
      <!-- Else seller display something -->
      <div
        v-else-if="auction.max_rank_displayed > 0"
        v-html="
          t('japaneseEndDialog.youFinishedRank', {
            rank: rank,
            price: formatNumber(bestSupply.price),
            currency: auction.currency
          })
        "
      />
      <div
        v-else
        v-html="
          t('japaneseEndDialog.youFinishedBidding', {
            price: formatNumber(bestSupply.price),
            currency: auction.currency
          })
        "
      />
    </v-col>
  </v-row>
  <v-row v-if="bids.length > 0" align="center">
    <v-col cols="12">
      <AuctionsSuppliesBidsTable :lines-items-bids="[bestSupply]" />
    </v-col>
  </v-row>
</template>
<script setup>
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

const { isBuyer } = defineProps({
  isBuyer: { type: Boolean, default: false }
})

const { t } = useTranslations()

const supabase = useSupabaseClient()

dayjs.extend(isSameOrAfter)

const route = useRoute()
const { auction, rank } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { data: sellers } = await supabase
  .from('auctions_sellers')
  .select('*')
  .eq('auction_id', route.params.auctionId)

const { data: sellersProfiles } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in(
    'email',
    sellers.map((s) => s.seller_email)
  )

// Fetch auctions_supplies, possible de faire un single.
const { data: auctionSupply } = await supabase
  .from('supplies')
  .select('*')
  .match({
    auction_id: route.params.auctionId
  })
  .single()

sellersProfiles.forEach((p) => {
  p.identifier = p.companies?.name || p.email
})

const { data: bids } = await supabase
  .from('bids')
  .select('*')
  .match({
    auction_id: auction.value.id
  })
  .order('price')
  .order('created_at')

// Add a computed that format supply data with best bid price.
const bestSupply = computed(() => {
  const bestBid = bids[0]
  const seller = sellersProfiles.find((s) => s.id === bestBid.seller_id)

  return {
    ...auctionSupply,
    seller: { ...seller },
    price: bestBid.price
  }
})
</script>
