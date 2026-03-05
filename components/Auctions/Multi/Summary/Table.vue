<template>
  <v-table class="datatable">
    <thead>
      <tr>
        <th
          v-for="header in props.headers"
          :key="header.title"
          :class="header.value === 'lot_name' ? 'text-left' : 'text-center'"
        >
          <span class="text-no-wrap"> {{ header.title }}&nbsp; </span>
        </th>
      </tr>
    </thead>
    <!-- Use Suspense to wait for all rows to load before showing them (prevents jumpy loading) -->
    <Suspense @resolve="onSuspenseResolve">
      <tbody>
        <AuctionsMultiSummaryTableItemRow
          v-for="auction in sortedAuction"
          :key="`MultiSummaryTabItem-${auction.id}`"
          :auction-id="auction.id"
          :group-id="props.groupId"
          :current-lot="props.currentLot"
          :is-last="auction.id === sortedAuction[sortedAuction.length - 1].id"
        >
          <template #default>
            <component :is="itemName" :auction-id="auction.id" />
          </template>
        </AuctionsMultiSummaryTableItemRow>
      </tbody>
      <template #fallback>
        <tbody>
          <tr v-for="n in sortedAuction.length" :key="`skeleton-${n}`" class="skeleton-row">
            <td v-for="header in props.headers" :key="header.value" class="text-center">
              <div class="skeleton-text" />
            </td>
          </tr>
        </tbody>
      </template>
    </Suspense>
  </v-table>
</template>
<script setup>
const props = defineProps(['groupId', 'type', 'headers', 'userType', 'currentLot'])
const supabase = useSupabaseClient()

const AuctionsMultiSummaryTableItemDutchSupplier = resolveComponent(
  'AuctionsMultiSummaryTableItemDutchSupplier'
)
const AuctionsMultiSummaryTableItemDutchBuyer = resolveComponent(
  'AuctionsMultiSummaryTableItemDutchBuyer'
)

const AuctionsMultiSummaryTableItemEnglishSupplier = resolveComponent(
  'AuctionsMultiSummaryTableItemEnglishSupplier'
)
const AuctionsMultiSummaryTableItemEnglishBuyer = resolveComponent(
  'AuctionsMultiSummaryTableItemEnglishBuyer'
)

const AuctionsMultiSummaryTableItemJapaneseSupplier = resolveComponent(
  'AuctionsMultiSummaryTableItemJapaneseSupplier'
)
const AuctionsMultiSummaryTableItemJapaneseBuyer = resolveComponent(
  'AuctionsMultiSummaryTableItemJapaneseBuyer'
)

const itemName = computed(() => {
  if (props.type === 'dutch') {
    return props.userType === 'supplier'
      ? AuctionsMultiSummaryTableItemDutchSupplier
      : AuctionsMultiSummaryTableItemDutchBuyer
  } else if (props.type === 'reverse' || props.type === 'sealed-bid') {
    return props.userType === 'supplier'
      ? AuctionsMultiSummaryTableItemEnglishSupplier
      : AuctionsMultiSummaryTableItemEnglishBuyer
  } else if (props.type === 'japanese') {
    return props.userType === 'supplier'
      ? AuctionsMultiSummaryTableItemJapaneseSupplier
      : AuctionsMultiSummaryTableItemJapaneseBuyer
  }
  return null
})
// Query auctions in group
const { data: auctionsGroup } = await supabase
  .from('auctions')
  .select('id, lot_number')
  .eq('auctions_group_settings_id', props.groupId)

const sortedAuction = computed(() => {
  return [...auctionsGroup].sort((a, b) => a.lot_number - b.lot_number)
})

// Inject the summaryTableLoaded state from parent and update it when Suspense resolves
const summaryTableLoaded = inject('summaryTableLoaded', ref(false))

function onSuspenseResolve() {
  // Small delay to ensure DOM has settled after Suspense resolves
  nextTick(() => {
    summaryTableLoaded.value = true
  })
}

const tableFixed = props.userType === 'supplier' ? 'auto' : 'fixed'
</script>
<style scoped>
.datatable {
  background-color: rgb(var(--v-theme-grey-lighten-2));
  width: 100%;
}
.datatable:deep(table > thead > tr > th:nth-child(2)) {
  max-width: 300px !important;
  min-width: 10px !important;
}
.datatable:deep(table > thead > tr > th:nth-child(4)) {
  max-width: 200px !important;
  width: 200px !important;
}
.datatable:deep(table > thead > tr > th:nth-child(1)) {
  width: 40px !important;
}
@media screen and (max-width: 1080px) {
  .datatable:deep(table) {
    table-layout: auto !important;
  }
}
.datatable:deep(table) {
  table-layout: v-bind(tableFixed);
}
.datatable:deep(table > thead > tr > th) {
  font-size: 12px;
  font-weight: 400;
  height: 26px;
}
.datatable:deep(table > thead > tr > th:first-child) {
  border-radius: 4px 0 0 4px;
}
.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 4px 4px 0;
}

.datatable:deep(table > tbody > tr > td:first-child) {
  border-radius: 4px 0 0 4px;
}
.datatable:deep(table > tbody > tr > td:last-child) {
  border-radius: 0 4px 4px 0;
}
.datatable:deep(table > tbody > tr > td) {
  height: 44px !important;
}
.skeleton-row {
  background-color: white;
}
.skeleton-row td {
  height: 44px !important;
  padding: 8px 16px;
}
.skeleton-text {
  height: 16px;
  width: 60%;
  margin: 0 auto;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
  border-radius: 4px;
}
@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>
