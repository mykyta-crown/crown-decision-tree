<template>
  <!-- Debug button to force open dialog (only in test mode) -->
  <v-btn
    v-if="auction?.test && !dialog"
    color="primary"
    position="fixed"
    location="bottom right"
    icon="mdi-bug"
    size="large"
    class="ma-4"
    style="z-index: 9999"
    @click="openDialog"
  >
    <v-icon>mdi-bug</v-icon>
    <v-tooltip activator="parent" location="left"> Force open EndDialog (test mode) </v-tooltip>
  </v-btn>

  <v-dialog v-model="dialog" scroll-strategy="none" persistent width="800">
    <v-card class="py-10 text-center relative">
      <v-img v-show="winner" src="/images/winner-pov.svg" cover class="absolute" width="100%" />
      <v-container style="max-width: 550px" class="d-flex flex-column justify-center align-center">
        <v-row align="center">
          <v-col cols="12" class="text-h4 font-weight-bold d-flex flex-column align-center">
            <img v-if="winner" height="160" src="/images/ranks/Without_rank.svg" />
            <img v-else height="160" src="/images/auction-loser.svg" />
            <span>
              {{ t('endDialogBuyer.competitionEnded', { lotName: auction.lot_name }) }}
            </span>
          </v-col>
        </v-row>

        <!-- Generic EndDialog content for English/Reverse/Sealed-bid auctions -->
        <AuctionsEndDialogContent
          v-if="['reverse', 'sealed-bid'].includes(auction.type) && winner"
          :is-buyer="true"
        />

        <AuctionsDutchEndDialogContent v-else-if="auction.type === 'dutch'" :is-buyer="true" />
        <AuctionsJapaneseEndDialogContent
          v-else-if="auction.type === 'japanese'"
          :is-buyer="true"
        />
        <div v-else class="my-4 text-h6">
          {{ t('endDialogBuyer.noBid') }}
        </div>
        <div v-if="winner" class="text-grey text-body-1">
          {{ t('endDialogBuyer.contactWinner') }}
        </div>
        <div v-else class="text-grey text-body-1">
          {{ t('endDialogBuyer.contactParticipants') }}
        </div>
      </v-container>

      <v-card-actions class="d-flex justify-center gap-3">
        <v-btn
          v-if="!nextAuction"
          variant="outlined"
          size="x-large"
          color="black"
          class="px-10"
          prepend-icon="mdi-download"
          :loading="exportingPdf"
          @click="handleExport"
        >
          {{ t('endDialogBuyer.downloadReport') }}
        </v-btn>
        <v-btn-primary
          v-if="!nextAuction"
          size="x-large"
          color="primary"
          class="px-10"
          @click="dialog = false"
        >
          {{ t('endDialogBuyer.backToAuction') }}
        </v-btn-primary>
        <v-btn-primary
          v-else
          size="x-large"
          color="primary"
          class="px-10"
          :to="`/auctions/${auction.auctions_group_settings_id}/lots/${nextAuction.id}/buyer`"
        >
          {{ t('endDialogBuyer.nextLot') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { usePdfExport } from '~/composables/pdf/usePdfExport'

const { t } = useTranslations()
const supabase = useSupabaseClient()
const route = useRoute()
const { fetchRank } = useRank()
const { getNextAuction } = useNextAuction()

const { auction, fetchAuction } = useRealtimeAuction(
  { auctionId: route.params.auctionId },
  'EndDialog'
)

// Function to open the dialog (must be defined before await)
async function openDialog() {
  // Fetch auction data
  await fetchAuction()

  // Wait for DOM update to ensure auction data is available
  await nextTick()

  // Fetch bids for all sellers
  const { data: bids } = await supabase
    .from('bids')
    .select('*')
    .eq('auction_id', route.params.auctionId)
    .order('price')

  if (!bids || bids.length === 0) {
    dialog.value = true
    return
  }

  // Calculate bestBid and rank for each seller (like old implementation)
  for (let index = 0; index < sellersProfiles.length; index++) {
    const sellerProfile = sellersProfiles[index]

    // Find best bid from bestBidsTotalValue or from bids table
    const findSupplierBestBidsTotalValue = bestBidsTotalValue.value.find(({ seller }) => {
      return seller.email === sellerProfile.email
    })

    if (!findSupplierBestBidsTotalValue) {
      sellerProfile.bestBid = bids.find((b) => b.seller_id === sellerProfile.id)
    } else {
      sellerProfile.bestBid = findSupplierBestBidsTotalValue
      sellerProfile.bestBid.price = findSupplierBestBidsTotalValue.bid.price
    }

    // Fetch rank if seller has a bid
    if (sellerProfile.bestBid) {
      try {
        sellerProfile.rank = await fetchRank(sellerProfile.id, auction.value.id)
      } catch {
        sellerProfile.rank = 99 + index
      }
    } else {
      sellerProfile.rank = 99 + index
    }
  }

  // Sort by rank
  sellersProfiles.sort((a, b) => a.rank - b.rank)

  winner.value = sellersProfiles.find((sellerProfile) => {
    return sellerProfile.rank === 1
  })

  // Find next auction using current status
  nextAuction.value = await getNextAuction(auction)

  // Open modal
  dialog.value = true
}

// Expose method for parent component (must be before first await)
defineExpose({
  openDialog
})

await fetchAuction()

const { status } = useAuctionTimer(auction)
const dialog = ref(false)

// Import export composable for PDF download
const { exportingPdf } = usePdfExport()

// Handle export - navigate to buyer page to trigger export
async function handleExport() {
  // Close dialog first
  dialog.value = false

  // Wait for dialog to close
  await nextTick()

  // Navigate to buyer page with query parameter to trigger export
  const targetRoute = `/auctions/${auction.value.auctions_group_settings_id}/lots/${auction.value.id}/buyer?trigger_export=true`

  await navigateTo(targetRoute)
}

const { data: sellers } = await supabase
  .from('auctions_sellers')
  .select('*')
  .eq('auction_id', route.params.auctionId)

const { data: sellersProfiles } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in(
    'email',
    (sellers || []).map((s) => s.seller_email)
  )

;(sellersProfiles || []).forEach((p) => {
  p.identifier = p.companies?.name || p.email
})

const { bestBidsTotalValue, auction: auctionWithSupplies } = await useTotalValue({
  auctionId: route.params.auctionId
})

const { getColors } = useColorSchema()
const colorsMap = await getColors()

// Provide data to child components (Content.vue, SimpleView.vue)
provide('sellersProfiles', sellersProfiles)
provide('colorsMap', colorsMap)
provide('buyerAuction', auction)

const winner = ref(null)

const nextAuction = ref(null)

watch(status, async () => {
  if (status.value.label === 'closed') {
    // check status again to be sure it's closed
    const currentStatus = getAuctionStatus(
      auction.value.start_at,
      auction.value.end_at,
      auction.value.type
    )

    if (currentStatus.label === 'closed') {
      await openDialog()
    }
  }
})
</script>

<style scoped>
.medal {
  width: 100px;
  height: 100px;
  margin-bottom: -50px;
  z-index: 2;
  border-radius: 15px;
  font-size: 50px;
}

.title {
  line-height: 3rem;
}
td {
  border: none !important;
}
.absolute {
  position: absolute;
  top: 0px;
  height: 50%;
}
.relative {
  position: relative;
  z-index: 1;
}
</style>
