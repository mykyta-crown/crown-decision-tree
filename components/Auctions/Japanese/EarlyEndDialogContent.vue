<template>
  <v-row align="center" class="text-subtitle-1">
    <v-col cols="12">
      <div>
        <div>
          <template v-if="winner || loser?.bestBid">
            You finished
            <span v-if="frozenAuction.max_rank_displayed > 0" class="font-weight-bold"
              >rank {{ winner ? frozenRank : loser?.rank }}</span
            >
            bidding
            <br />
            at the price of
            <span class="font-weight-bold">{{
              formatNumber(winner ? winner.bestBid.price : loser.bestBid.price)
            }}</span>
            {{ frozenAuction.currency }}
          </template>
        </div>
      </div>
    </v-col>
  </v-row>
  <v-row align="center">
    <v-col cols="12">
      <AuctionsSuppliesBidsTable :lines-items-bids="suppliesWithExitPrice" />
    </v-col>
  </v-row>
</template>
<script setup>
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

const supabase = useSupabaseClient()

dayjs.extend(isSameOrAfter)

const route = useRoute()
const { auction, rank } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { fetchRank } = useRank()
const winner = ref(null)
const loser = ref(null)
const { currentSupplies } = useJapaneseRounds(auction)

// Figer les données au moment du setup (quand le composant est monté)
const frozenAuction = JSON.parse(JSON.stringify(auction.value))
const frozenRank = rank.value
const frozenSupplies = JSON.parse(JSON.stringify(currentSupplies.value))

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

for (let index = 0; index < sellersProfiles.length; index++) {
  const sellerProfile = sellersProfiles[index]
  sellerProfile.bestBid = bids.find((b) => b.seller_id === sellerProfile.id)
  if (sellerProfile.bestBid) {
    // @Fabien: FetchRank renvoi rank 1 si le seller n'a pas mis de bid...
    sellerProfile.rank = await fetchRank(sellerProfile.id, auction.value.id)
  } else {
    sellerProfile.rank = 99 + index
    sellerProfile.bestBid = { price: frozenSupplies[0]?.price }
  }
}
sellersProfiles.sort((a, b) => {
  return a.rank - b.rank
})

loser.value = sellersProfiles.find((sellerProfile) => {
  return sellerProfile.rank !== 1
})

// Créer les supplies avec le prix de sortie du supplier (pas le prix du round actuel)
const exitPrice = loser.value?.bestBid?.price || frozenSupplies[0]?.price
const suppliesWithExitPrice = frozenSupplies.map((supply) => ({
  ...supply,
  price: exitPrice
}))
</script>
