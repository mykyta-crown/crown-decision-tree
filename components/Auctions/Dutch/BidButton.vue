<template>
  <v-row justify="center">
    <v-col cols="12" class="text-center">
      <v-btn-primary
        height="44"
        class="px-16 mt-4"
        :loading="loading"
        :disabled="status.label === 'closed' || disablePrebidButton"
        @click="showModal"
      >
        {{ label }}
        <template #loader>
          <v-progress-circular
            :model-value="(1 - elapsedTime / waitingTime) * 100"
            bg-color="primary"
            color="white"
          />
        </template>
      </v-btn-primary>
    </v-col>
    <ConfirmBidDialog
      v-model="showConfirmModal"
      :bid-price="clickedPrice"
      :is-prebid="status.label === 'upcoming'"
      :auction-type="auction.type"
      @confirmed="addBid"
    />
  </v-row>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps({
  sellerId: {
    type: String,
    default: null
  },
  sellerEmail: {
    type: String,
    default: null
  }
})

const { t } = useTranslations()

const supabase = useSupabaseClient()
const { user } = useUser()
const route = useRoute()
const { auction, updateAuction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { start, now, status } = useAuctionTimer(auction)
const { activeRound } = useDutchRounds(auction)
const { lastPrebidFromUser } = await useBids({ auctionId: route.params.auctionId })

const showConfirmModal = ref(false)
const clickedPrice = ref(0)

const fullRoundTime = computed(() => {
  return dayjs.duration(auction.value.overtime_range * 1000 * 60).asSeconds()
})

const timePerRound = computed(() => {
  const seller = auction.value.auctions_sellers.find((s) =>
    props.sellerEmail ? s.seller_email === props.sellerEmail : true
  )

  return seller.time_per_round || fullRoundTime.value
})

const waitingTime = computed(() => {
  return fullRoundTime.value - timePerRound.value
})

const currentRoundTimeLeft = computed(() => {
  return dayjs
    .duration(
      auction.value.overtime_range * 1000 * 60 -
        ((now.value - start.value) % (auction.value.overtime_range * 1000 * 60))
    )
    .seconds()
})

const elapsedTime = computed(() => {
  return fullRoundTime.value - currentRoundTimeLeft.value
})

const loading = computed(() => {
  return status.value.label === 'active' && currentRoundTimeLeft.value > timePerRound.value
})

watch(activeRound, () => {
  if (activeRound.value.price !== clickedPrice.value) {
    showConfirmModal.value = false
  }
})
const prebid = inject('prebid')

function showModal() {
  if (status.value.label === 'upcoming' && prebid?.price) {
    clickedPrice.value = prebid.value.price
  } else {
    clickedPrice.value = activeRound.value.price
  }
  showConfirmModal.value = true
}

const disablePrebidButton = computed(() => {
  if (status.value.label === 'upcoming' && lastPrebidFromUser.value?.price) {
    // Chelou que prebid.value peut être un Number ou un Array....
    // console.log('prebid========', prebid)
    return prebid?.value === 0 ? true : prebid?.value[0]?.price >= lastPrebidFromUser.value.price
  }

  return false
})

const label = computed(() => {
  if (status.value.label === 'active' || status.value.label === 'closed')
    return t('bidButton.bidAtCurrentPrice')
  if (status.value.label === 'upcoming') return t('bidButton.submitPrebid')
  //TODO: Ajouter Mettre a jour dans la cas ou il y a un pre bid deja present pour ce user

  return ''
})

async function addBid(bidPrice) {
  await supabase
    .from('bids')
    .insert([
      {
        price: bidPrice,
        seller_id: props.sellerId || user.value.id,
        seller_email: props.sellerEmail,
        auction_id: route.params.auctionId,
        type: status.value.label === 'upcoming' ? 'prebid' : 'bid'
      }
    ])
    .select()

  updateAuction()
}
</script>
