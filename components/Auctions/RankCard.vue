<template>
  <div class="rank-card-wrapper" :class="glowClass">
    <v-card class="d-flex flex-column flex-grow-1 max-card-height">
      <v-card-title class="font-weight-black pb-0 pt-4">
        {{ t('rankCard.title') }}
      </v-card-title>
      <v-card-text class="pt-0 d-flex flex-column align-center justify-center">
        <v-sheet
          v-if="auction.type === 'sealed-bid'"
          :color="props.status === 'active' ? 'grey-ligthen-3' : ''"
          class="fill-height d-flex align-center justify-center flex-column rounded-lg"
        >
          <div
            v-if="props.status === 'upcoming'"
            class="d-flex flex-column align-center justify-space-around"
            style="height: 100%; padding: 10px 0"
          >
            <AuctionsNoRankIllustration class="mb-4" />
            <div class="text-grey text-center text-body-1">
              {{ t('rankCard.upcomingMessage') }}
            </div>
          </div>
          <div v-else-if="props.status === 'active'" class="text-grey text-center text-body-1">
            {{ t('rankCard.sealedBidMessage') }}
          </div>
          <div v-else class="text-h4 font-weight-bold d-flex flex-column align-center">
            <img height="170" width="170" :src="podium.image" />
          </div>
        </v-sheet>

        <v-sheet
          v-else
          :color="
            props.status === 'upcoming' || auction.max_rank_displayed === 0 || isRankHidden
              ? ''
              : ''
          "
          :class="[
            'd-flex align-center justify-center flex-column rounded-lg',
            props.status === 'upcoming' || auction.max_rank_displayed === 0 || isRankHidden
              ? 'full-width-sheet'
              : 'custom-sheet-height px-2'
          ]"
        >
          <div
            v-if="props.status === 'upcoming' || auction.max_rank_displayed === 0 || isRankHidden"
            class="d-flex flex-column align-center justify-space-around"
            style="height: 100%; padding: 10px 0"
          >
            <AuctionsNoRankIllustration class="mb-4" />
            <div class="text-grey text-center text-body-1">
              {{
                auction.max_rank_displayed === 0 || isRankHidden
                  ? t('rankCard.hiddenMessage')
                  : t('rankCard.noRankDisplayed')
              }}
            </div>
          </div>
          <div
            v-else-if="props.status === 'active' && (!rank || rank <= 0)"
            class="d-flex flex-column align-center justify-space-around"
            style="height: 100%; padding: 10px 0"
          >
            <AuctionsNoRankIllustration class="mb-4" />
            <div class="text-grey text-center text-body-1">
              {{ t('rankCard.noBidYet') }}
            </div>
          </div>
          <div v-else class="text-h4 font-weight-bold d-flex flex-column align-center">
            <img height="170" width="170" :src="podium.image" />
          </div>
        </v-sheet>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup>
const props = defineProps(['status'])
// Use translations
const { t } = useTranslations()
const route = useRoute()
const { user, isAdmin } = useUser()
const { auction, rank, setRank } = await useUserAuctionBids({ auctionId: route.params.auctionId })

// Check if user is a seller (not admin and not buyer)
const isSeller = computed(() => {
  return !isAdmin.value && auction.value?.buyer_id !== user.value?.id
})

// Track previous rank for glow effect
const previousRank = ref(null)
const glowClass = ref('')

// Check if rank should be hidden based on max_rank_displayed setting
// The RPC get_seller_rank returns 0 when rank exceeds max_rank_displayed
const isRankHidden = computed(() => {
  return rank.value === 0
})

const podium = computed(() => {
  if (rank.value >= 1) {
    if (rank.value > 10) {
      return { image: '/images/auction-loser.svg' }
    } else {
      return { image: `/images/ranks/Rank_${rank.value}.svg` }
    }
  } else {
    return { image: '/images/auction-loser.svg' }
  }
})

// Watch for rank changes and apply glow effect (not for sealed-bid sellers)
watch(rank, (newRank, oldRank) => {
  // Skip glow effect for sealed-bid auctions (sellers only, buyers/admins still see it)
  if (auction.value.type === 'sealed-bid' && isSeller.value) return

  // Only apply glow if we have valid ranks and they changed
  if (previousRank.value !== null && newRank > 0 && newRank !== previousRank.value) {
    if (newRank < previousRank.value) {
      // Rank improved (number decreased) - green glow
      glowClass.value = 'rank-glow-up'
    } else {
      // Rank worsened (number increased) - red glow
      glowClass.value = 'rank-glow-down'
    }

    // Remove glow class after animation completes
    setTimeout(() => {
      glowClass.value = ''
    }, 2000)
  }

  // Update previous rank
  if (newRank > 0) {
    previousRank.value = newRank
  }
})

watch(
  () => props.status,
  () => {
    setRank()
  },
  { immediate: true }
)
</script>

<style scoped>
.text-rank {
  font-size: 48px;
}
.max-card-height {
  max-height: 242px !important;
  height: 242px !important;
}
.custom-sheet-height {
  margin-top: auto !important;
  height: 170px !important;
}
.full-width-sheet {
  width: calc(100% - 40px);
  width: 100%;
  margin-top: 10px;
  flex-grow: 1;
}

/* Wrapper for glow effect */
.rank-card-wrapper {
  position: relative;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.rank-card-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 4px;
  pointer-events: none;
  z-index: 1;
}

/* Glow animations for rank changes */
.rank-glow-down::before {
  animation: glowRed 2s ease-in-out;
}

.rank-glow-up::before {
  animation: glowGreen 2s ease-in-out;
}

@keyframes glowRed {
  0%,
  100% {
    box-shadow: inset 0 0 0 0 rgba(255, 116, 116, 0);
  }
  25% {
    box-shadow: inset 0 0 20px 0 rgba(255, 116, 116, 0.3);
  }
  50% {
    box-shadow: inset 0 0 30px 0 rgba(255, 116, 116, 0.4);
  }
  75% {
    box-shadow: inset 0 0 20px 0 rgba(255, 116, 116, 0.3);
  }
}

@keyframes glowGreen {
  0%,
  100% {
    box-shadow: inset 0 0 0 0 rgba(0, 206, 124, 0);
  }
  25% {
    box-shadow: inset 0 0 20px 0 rgba(0, 206, 124, 0.3);
  }
  50% {
    box-shadow: inset 0 0 30px 0 rgba(0, 206, 124, 0.4);
  }
  75% {
    box-shadow: inset 0 0 20px 0 rgba(0, 206, 124, 0.3);
  }
}
</style>
