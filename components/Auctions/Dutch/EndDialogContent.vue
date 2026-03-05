<template>
  <v-row align="center" class="text-subtitle-1">
    <v-col cols="12">
      <div v-if="isBuyer">
        <div
          v-if="winner"
          v-html="
            t('dutchEndDialog.winnerFinished', {
              winner,
              price: formatNumber(activeRound.price),
              currency: auction.currency
            })
          "
        />
        <div v-else>
          {{ t('dutchEndDialog.noBid') }}
        </div>
      </div>
      <div v-else-if="rank">
        <div
          v-if="rank === 1"
          v-html="
            t('dutchEndDialog.youFinishedRank1', {
              rank,
              price: formatNumber(activeRound.price),
              currency: auction.currency
            })
          "
        />
        <div v-else>
          <template v-if="noBidPlaced">
            <div>
              {{ t('dutchEndDialog.noBid') }}
            </div>
            <div class="text-body-1 text-grey mt-6">
              {{ t('dutchEndDialog.contactParticipants') }}
            </div>
          </template>
          <template v-else>
            <div v-html="t('dutchEndDialog.youFinishedRank', { rank: displayedRank })" />
            <div>
              {{ t('dutchEndDialog.anotherSupplierBid') }}
            </div>
          </template>
        </div>
      </div>
    </v-col>
  </v-row>
  <v-row align="center" class="mb-4">
    <v-col cols="12">
      <AuctionsSuppliesBidsTable v-if="winner" :lines-items-bids="currentSupplies" />
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

dayjs.extend(isSameOrAfter)

const route = useRoute()
const { auction, rank, lowerBidsByComp } = await useUserAuctionBids({
  auctionId: route.params.auctionId
})

const { currentSupplies, activeRound } = useDutchRounds(auction)

const noBidPlaced = computed(() => {
  // Check if there are any live bids (type='bid') in the auction
  // Prebids don't count as "bids placed" for the end dialog
  const allBids = auction.value?.bids || []
  const liveBids = allBids.filter((bid) => bid.type === 'bid')
  console.log('[EndDialogContent] noBidPlaced check:', {
    totalBids: allBids.length,
    liveBids: liveBids.length,
    bidTypes: allBids.map((b) => b.type)
  })
  return liveBids.length === 0
})
const displayedRank = computed(() => {
  if (rank.value === 1) {
    return rank.value
  } else {
    return 2
  }
})

const winner = computed(() => {
  // First check lowerBidsByComp (grouped by company)
  if (lowerBidsByComp.value && lowerBidsByComp.value.length > 0) {
    const rank1 = lowerBidsByComp.value.find((s) => s.rank === 1)
    if (rank1?.company?.name) {
      return rank1.company.name
    }
  }

  // Fallback: check for any live bid winner (handles bots without companies)
  const liveBids = auction.value?.bids?.filter((bid) => bid.type === 'bid') || []
  if (liveBids.length > 0) {
    // Sort by price ascending, then by created_at ascending (lowest price, earliest wins)
    const sortedBids = [...liveBids].sort((a, b) => {
      if (a.price !== b.price) return a.price - b.price
      return new Date(a.created_at) - new Date(b.created_at)
    })
    const winningBid = sortedBids[0]
    // Return company name, or email, or "A participant"
    return (
      winningBid?.profiles?.companies?.name ||
      winningBid?.profiles?.email ||
      t('dutchEndDialog.aParticipant')
    )
  }

  console.warn('[EndDialogContent] No winner found - no live bids')
  return null
})
</script>
