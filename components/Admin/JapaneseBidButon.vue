<template>
  <v-row class="mt-2">
    <v-spacer />
    <v-col cols="auto">
      <v-btn-primary
        :disabled="status.label === 'active' && alreadyPlacedBidAtCurrentPrice"
        :prepend-icon="alreadyPlacedBidAtCurrentPrice ? 'mdi-checkbox-marked-outline' : ''"
        @click="showModal"
      >
        {{ label }}
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

const route = useRoute()
const supabase = useSupabaseClient()

const auction = inject('auction')
const forceRefresh = inject('forceRefresh')
const { activeRound, rounds } = useJapaneseRounds(auction)
const { status } = useAuctionTimer(auction)

const { lastJapanesePrebid } = await useBids({ auctionId: route.params.auctionId })

const lastPrebidFromUser = computed(() => {
  return lastJapanesePrebid.value[props.sellerId]
})

// Vérifie si le vendeur a déjà placé un bid au prix du round actuel
const alreadyPlacedBidAtCurrentPrice = computed(() => {
  if (!activeRound.value?.price) return false
  return auction.value.bids.some(
    (bid) => bid.seller_id === props.sellerId && bid.price <= activeRound.value.price
  )
})

const clickedPrice = ref(0)
const prebid = inject('prebid')

const showConfirmModal = ref(false)

function showModal() {
  if (status.value.label === 'upcoming' && prebid?.price) {
    clickedPrice.value = prebid.value.price
  } else if (activeRound.value?.price) {
    clickedPrice.value = activeRound.value.price
  } else {
    console.error('[AdminJapaneseBidButon] No active round found')
    return
  }

  showConfirmModal.value = true
}

async function addBid(bidPrice) {
  if (status.value.label === 'upcoming') {
    // Pour les prebids japonais: logique additive
    // Chaque prebid s'ajoute aux précédents (pas de suppression)
    // Vérifier qu'un prebid à ce prix n'existe pas déjà pour éviter les doublons
    const existingPrebidAtPrice = auction.value.bids.find(
      (bid) => bid.seller_id === props.sellerId && bid.type === 'prebid' && bid.price === bidPrice
    )

    if (!existingPrebidAtPrice) {
      await supabase.from('bids').insert({
        price: bidPrice,
        seller_id: props.sellerId,
        auction_id: route.params.auctionId,
        type: 'prebid',
        seller_email: props.sellerEmail
      })
    }
  } else {
    // Bid live pendant l'enchère active
    console.log('[AdminJapaneseBidButon] Inserting live bid:', {
      price: bidPrice,
      seller_id: props.sellerId,
      auction_id: route.params.auctionId,
      seller_email: props.sellerEmail
    })

    const { error } = await supabase.from('bids').insert({
      price: bidPrice,
      seller_id: props.sellerId,
      auction_id: route.params.auctionId,
      type: 'bid',
      seller_email: props.sellerEmail
    })

    if (error) {
      console.error('[AdminJapaneseBidButon] Error inserting bid:', error)
    }
  }

  forceRefresh()
}

const label = computed(() => {
  if (status.value.label === 'active' || status.value.label === 'closed') {
    return alreadyPlacedBidAtCurrentPrice.value ? 'Offer Accepted' : 'Bid at current price'
  }

  if (status.value.label === 'upcoming') {
    return lastPrebidFromUser.value ? 'Change Pre-bid' : 'Submit Pre-bid'
  }

  return ''
})

watch(
  activeRound,
  async () => {
    //Set the clickedPrice to bid at the current price
    if (activeRound.value.price !== clickedPrice.value) {
      showConfirmModal.value = false
      clickedPrice.value = activeRound.value.price
    }
  },
  { immediate: true }
)
</script>
