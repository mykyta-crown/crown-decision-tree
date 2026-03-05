<template>
  <v-card class="d-flex flex-column flex-grow-1 px-1">
    <v-card-title class="font-weight-black d-flex justify-space-between pb-2 pt-4">
      <div>
        Round: {{ displayedRound
        }}<span class="text-grey font-weight-regular"> /{{ rounds.length }}</span>
      </div>
    </v-card-title>
    <v-card-text class="pa-0 pb-3">
      <AuctionsSuppliesBidsTable
        :lines-items-bids="displayedSupplies"
        :mode="props.mode"
        :can-select-rounds="props.mode === 'prebid-form' ? canSelectRounds : null"
        :show-rank="showRankColumn"
        :seller-id="effectiveSellerId"
        :highlight-input="isTrainingMode && !currentLotHasPrebid"
        @prebid-updated="emitUpdatePrebid"
      />
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: 'read'
  },
  // Props pour l'admin panel - quand l'admin place des prebids pour un supplier
  sellerEmail: {
    type: String,
    default: null
  },
  sellerId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['prebid-updated'])
const displayedRound = ref(0)
const displayedSupplies = ref([])
const route = useRoute()
const { user } = useUser()

// Inject training state from parent (works for both single-lot and multi-lot)
const isTrainingMode = inject('isTrainingMode', ref(false))
const currentLotHasPrebid = inject('currentLotHasPrebid', ref(true))

// Utiliser l'auction injectée (admin panel) si disponible, sinon instance locale (supplier view)
const injectedAuction = inject('auction', null)
const { auction: localAuction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const auction = injectedAuction || localAuction

const { status } = useAuctionTimer(auction)
const { rounds, currentSupplies, nbPassedRounds } = useJapaneseRounds(auction)

// Show rank column only if rank per line item is enabled AND max_rank_displayed > 0
const showRankColumn = computed(() => {
  return auction.value?.rank_per_line_item && auction.value?.max_rank_displayed > 0
})

// Utiliser le seller email passé en prop (admin panel) ou null (user normal)
const {
  ceilingPrice,
  setSellerEmail,
  loaded: ceilingLoaded
} = useCeilingPrice(route.params.auctionId, props.sellerEmail)
const { lastPrebidFromUser } = await useBids({ auctionId: route.params.auctionId })

// Mettre à jour le ceiling price quand le seller change (admin panel)
watch(
  () => props.sellerEmail,
  (newEmail) => {
    setSellerEmail(newEmail)
  }
)

// Utiliser le sellerId passé en prop (admin panel) ou le user connecté (supplier)
const effectiveSellerId = computed(() => props.sellerId || user.value?.id)

const canSelectRounds = computed(() => {
  // Attendre que le ceiling soit chargé
  if (!ceilingLoaded.value) {
    return []
  }

  // Japanese auctions: price ascends over time (starts low, goes high)
  // Ceiling is the MAXIMUM price where a supplier can place their prebid/bid
  // Logique additive: on peut ajouter plusieurs prebids de plus en plus bas
  // Contraintes:
  // 1. price <= ceiling (pas au dessus du ceiling price du supplier)
  // 2. price < plus bas prebid existant (chaque nouveau prebid doit être plus bas que le précédent)
  // 3. pas de doublon (pas de prebid existant à ce prix)
  const existingPrebids = auction.value.bids.filter(
    (bid) => bid.seller_id === effectiveSellerId.value && bid.type === 'prebid'
  )
  const existingPrebidPrices = existingPrebids.map((bid) => bid.price)

  // Trouver le prix le plus bas des prebids existants (si aucun, on utilise le ceiling)
  const lowestPrebidPrice =
    existingPrebids.length > 0 ? Math.min(...existingPrebidPrices) : Infinity

  // Le prix max autorisé est le minimum entre le ceiling et le plus bas prebid existant
  // Si ceiling est 0 ou invalide, ne montrer aucune option
  if (!ceilingPrice.value || ceilingPrice.value <= 0) {
    return []
  }
  const maxAllowedPrice = Math.min(ceilingPrice.value, lowestPrebidPrice)

  return rounds.value.filter(
    (e) => e && e.price <= maxAllowedPrice && !existingPrebidPrices.includes(e.price)
  )
})

watch(
  [status, nbPassedRounds],
  async () => {
    if (status.value.label === 'closed') {
      const { data } = await $fetch('/api/v1/last_bid', {
        method: 'POST',
        body: {
          auctionId: route.params.auctionId
        }
      })
      if (data.lowestBid) {
        displayedSupplies.value = auction.value?.supplies?.map((supply) => {
          let price = -1
          price = rounds.value.find((r) => r.price === (data.lowestBid?.price || r.price))?.price
          return { ...supply, price }
        })
        displayedRound.value = rounds.value.findIndex((e) => e.price === data.lowestBid?.price) + 1
      } else {
        displayedRound.value = nbPassedRounds.value + 1
        displayedSupplies.value = currentSupplies.value
      }
    } else {
      displayedRound.value = nbPassedRounds.value + 1
      displayedSupplies.value = currentSupplies.value
    }
  },
  { immediate: true }
)

function emitUpdatePrebid(suppliesPrebids) {
  emit('prebid-updated', suppliesPrebids)
}
</script>
