<template>
  <v-row>
    <v-col cols="3">
      <ProgressCircularTimer />
    </v-col>
    <v-col cols="9">
      <BidsLogsCard :auction-id="route.params.auctionId" />
    </v-col>
  </v-row>
  <v-row>
    <template v-if="auction.type === 'reverse' || auction.type === 'sealed-bid'">
      <v-col cols="5">
        <LeaderboardCard />
      </v-col>
      <v-col cols="7">
        <BidsLinesChart
          :start-date="auction.type !== 'sealed-bid' ? auction.start_at : auction.created_at"
          :end-date="auction.end_at"
          :bids-total-value="bidsTotalValue"
          :suppliers="sellers"
          :time-unit="auction.type === 'sealed-bid' ? 'day' : 'minute'"
          :aggregate-prebids="auction.type !== 'sealed-bid'"
        />
      </v-col>
    </template>
    <template v-if="auction.type === 'dutch'">
      <v-col
        :cols="auction.auctions_sellers.length === 1 || roundDisplay === '#blocks' ? '6' : '5'"
      >
        <AuctionsDutchSupplyBidCard class="mb-4" />
        <AuctionsDutchRoundTimer class="mb-4" />
        <AuctionsDutchParticipantsCard />
      </v-col>
      <v-col
        :cols="auction.auctions_sellers.length === 1 || roundDisplay === '#blocks' ? '6' : '7'"
      >
        <v-tabs-window v-model="roundDisplay">
          <v-tabs-window-item value="#blocks">
            <AuctionsDutchRoundsCard v-model="roundDisplay" />
          </v-tabs-window-item>
          <v-tabs-window-item value="#graph">
            <ChartsDutchRounds v-model="roundDisplay" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </template>
    <template v-if="auction.type === 'japanese'">
      <v-col
        :cols="auction.auctions_sellers.length === 1 || roundDisplay === '#blocks' ? '6' : '5'"
      >
        <AuctionsJapaneseSupplyBidCard class="mb-4" />
        <AuctionsJapaneseRoundTimer class="mb-4" />
        <AuctionsJapaneseParticipantsCard />
      </v-col>
      <v-col
        :cols="auction.auctions_sellers.length === 1 || roundDisplay === '#blocks' ? '6' : '7'"
      >
        <v-tabs-window v-model="roundDisplay">
          <v-tabs-window-item value="#blocks">
            <AuctionsJapaneseRoundsCard v-model="roundDisplay" :is-buyer="true" />
          </v-tabs-window-item>
          <v-tabs-window-item value="#graph">
            <ChartsJapaneseRounds v-model="roundDisplay" :is-buyer="true" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </template>
  </v-row>
  <v-row>
    <v-col>
      <v-select
        v-model="selectedSupplier"
        :items="suppliers"
        item-title="name"
        label="Supplier"
        hide-details
        return-object
      />
    </v-col>
    <v-col v-if="selectedSupplier" cols="auto">
      <AdminBidDeleteBtn
        :auction-id="route.params.auctionId"
        :supplier-id="selectedSupplier.id"
        :supplier-name="selectedSupplier.name"
        @deleted="forceRefresh"
      />
    </v-col>
    <v-col v-if="selectedSupplier" cols="auto">
      <VBtnSecondary @click="removeDialog = true"> Remove supplier </VBtnSecondary>
    </v-col>
  </v-row>
  <v-row>
    <v-col v-if="auction.type === 'reverse' || auction.type === 'sealed-bid'" cols="12">
      <AdminEnglishBidsTables
        :auction-status="status.label"
        :selected-supplier="selectedSupplier"
      />
    </v-col>
    <v-col v-if="auction.type === 'dutch' && selectedSupplier" cols="6">
      <AuctionsDutchSupplyBidCard
        :mode="status.label === 'upcoming' && isPrebidEnabled ? 'prebid-form' : 'read'"
        @prebid-updated="prebidUpdated"
      />
      <AuctionsDutchBidButton
        v-if="status.label === 'active' || (status.label === 'upcoming' && isPrebidEnabled)"
        :seller-id="selectedSupplier.id"
        :seller-email="selectedSupplier.email"
      />
    </v-col>
    <v-col v-if="auction.type === 'japanese' && selectedSupplier" cols="6">
      <AuctionsJapaneseSupplyBidCard
        :key="selectedSupplier.id"
        :mode="status.label === 'upcoming' && isPrebidEnabled ? 'prebid-form' : 'read'"
        :seller-email="selectedSupplier.email"
        :seller-id="selectedSupplier.id"
        @prebid-updated="prebidUpdated"
      />
      <AdminJapaneseBidButon
        v-if="status.label === 'active' || (status.label === 'upcoming' && isPrebidEnabled)"
        :seller-id="selectedSupplier.id"
        :seller-email="selectedSupplier.email"
      />
    </v-col>
  </v-row>
  <AdminSupplierDeleteDialog
    v-if="selectedSupplier"
    v-model="removeDialog"
    :auction="auction"
    :selected-supplier="selectedSupplier"
  />
</template>

<script setup>
const supabase = useSupabaseClient()
const route = useRoute()
const { auction, forceRefresh } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { status } = useAuctionTimer(auction)

const { data: sellersData } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in(
    'email',
    (auction.value?.auctions_sellers || []).map((s) => s.seller_email)
  )

const sellers = ref(sellersData)

const removeDialog = ref(false)

const roundDisplay = ref('#graph')

const { bidsTotalValue } = await useTotalValue({ auctionId: route.params.auctionId })

provide('auction', auction)
provide('sellers', sellers)
provide('forceRefresh', forceRefresh)

const suppliers = computed(() => {
  return (auction.value?.auctions_sellers || []).map((seller) => {
    return {
      name: `${seller.seller_profile?.companies?.name ?? ''}${seller.seller_profile?.companies?.name ? ' - ' : ''}${seller.seller_email}`,
      value: seller.seller_profile?.id,
      id: seller.seller_profile?.id,
      email: seller.seller_email
    }
  })
})

const selectedSupplier = ref(suppliers.value[0])

const isPrebidEnabled = computed(() => {
  return auction.value?.dutch_prebid_enabled
})

const prebid = ref(0)
provide('prebid', prebid)

function prebidUpdated(newPrebid) {
  prebid.value = newPrebid
}
</script>
<style scoped>
.custom-border-admin {
  border-radius: 0 0 4px 4px !important;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
</style>
