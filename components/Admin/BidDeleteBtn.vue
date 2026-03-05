<template>
  <VBtnSecondary @click="dialog = true">
    {{ t('admin.bidDeleteBtn.deleteLastBid') }}
  </VBtnSecondary>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>{{ t('admin.bidDeleteBtn.deleteLastBid') }}</v-card-title>
      <v-card-text>
        {{ t('admin.bidDeleteBtn.confirmMessage') }}
        <span class="font-weight-bold">{{ supplierName }}</span
        >?
      </v-card-text>
      <v-card-actions>
        <v-btn-secondary @click="dialog = false">
          {{ t('admin.bidDeleteBtn.cancel') }}
        </v-btn-secondary>
        <v-btn-primary :loading="loading" @click="deleteLastBid">
          {{ t('admin.bidDeleteBtn.delete') }}
        </v-btn-primary>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
const props = defineProps({
  auctionId: {
    type: String,
    required: true
  },
  supplierId: {
    type: String,
    required: true
  },
  supplierName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['deleted'])

// Use translations
const { t } = useTranslations()

console.log(props.supplierName, props.supplierId)

const supabase = useSupabaseClient()
const dialog = ref(false)
const loading = ref(false)

async function deleteLastBid() {
  loading.value = true

  // Fetch all bids for this seller
  const { data: bids } = await supabase.from('bids').select('id, price, created_at').match({
    auction_id: props.auctionId,
    seller_id: props.supplierId
  })

  if (bids && bids.length > 0) {
    // Fetch handicaps for the auction
    const { data: auctionHandicaps } = await supabase
      .from('auctions_handicaps')
      .select('id, amount')
      .eq('auction_id', props.auctionId)

    // Fetch bids_handicaps for all bids
    const bidIds = bids.map((b) => b.id)
    const { data: bidsHandicaps } = await supabase
      .from('bids_handicaps')
      .select('bid_id, handicap_id')
      .in('bid_id', bidIds)

    // Calculate total (price + handicaps) for each bid
    const bidsWithTotal = bids.map((bid) => {
      const bidHandicapIds = (bidsHandicaps || [])
        .filter((bh) => bh.bid_id === bid.id)
        .map((bh) => bh.handicap_id)

      const handicapTotal = bidHandicapIds.reduce((sum, hId) => {
        const handicap = (auctionHandicaps || []).find((h) => h.id === hId)
        return sum + (handicap?.amount || 0)
      }, 0)

      return {
        ...bid,
        totalWithHandicaps: bid.price + handicapTotal
      }
    })

    // Sort by total (ascending), then by created_at (ascending) to find best bid
    bidsWithTotal.sort((a, b) => {
      if (a.totalWithHandicaps !== b.totalWithHandicaps) {
        return a.totalWithHandicaps - b.totalWithHandicaps
      }
      return new Date(a.created_at) - new Date(b.created_at)
    })

    const bidToDelete = bidsWithTotal[0]

    // Delete the best bid
    await supabase.from('bids').delete().eq('id', bidToDelete.id)

    // Update auction last_bid_time to trigger realtime refresh
    await supabase
      .from('auctions')
      .update({ last_bid_time: new Date().toISOString() })
      .eq('id', props.auctionId)
  }

  loading.value = false
  dialog.value = false
  emit('deleted')
}
</script>
