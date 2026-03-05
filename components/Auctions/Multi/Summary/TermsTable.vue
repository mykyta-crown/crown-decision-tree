<template>
  <v-table class="datatable">
    <thead>
      <tr>
        <th v-for="header in headers" :key="header.title" class="text-center">
          <span class="text-no-wrap text-body-2"> {{ header.title }}&nbsp; </span>
        </th>
      </tr>
    </thead>
    <!-- Use Suspense to wait for all rows to load before showing them (prevents jumpy loading) -->
    <Suspense>
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
            <AuctionsMultiSummaryTableItemTerms :auction-id="auction.id" />
          </template>
        </AuctionsMultiSummaryTableItemRow>
      </tbody>
      <template #fallback>
        <tbody>
          <tr v-for="n in sortedAuction.length" :key="`skeleton-${n}`" class="skeleton-row">
            <td v-for="header in headers" :key="header.value" class="text-center">
              <div class="skeleton-text" />
            </td>
          </tr>
        </tbody>
      </template>
    </Suspense>
  </v-table>
</template>
<script setup>
const props = defineProps(['groupId', 'currentLot'])
const supabase = useSupabaseClient()

const { t } = useTranslations()

const headers = [
  { title: t('termsTable.headers.lots'), value: 'lot_name', align: 'center' },
  { title: t('termsTable.headers.status'), value: 'status', align: 'center' },
  { title: t('termsTable.headers.startTime'), value: 'duration', align: 'center' },
  { title: t('termsTable.headers.acceptedTerms'), value: 'round', align: 'center' }
]

const { data: auctionsGroup } = await supabase
  .from('auctions')
  .select('id, lot_number')
  .eq('auctions_group_settings_id', props.groupId)

const sortedAuction = computed(() => {
  return [...auctionsGroup].sort((a, b) => a.lot_number - b.lot_number)
})
</script>
<style scoped>
.datatable {
  background-color: rgb(var(--v-theme-grey-lighten-2));
  width: 100%;
}
.datatable:deep(table > thead > tr > th) {
  font-size: 0.9rem;
  font-weight: 600;
  height: 26px;
}
.datatable:deep(table > tbody > tr > td) {
  height: 44px;
}

.datatable:deep(table > thead > tr > th:first-child) {
  border-radius: 8px 0 0 8px;
  text-align: start !important;
}
.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 8px 8px 0;
}

.datatable:deep(table > tbody > tr > td:first-child) {
  border-radius: 8px 0 0 8px;
}
.datatable:deep(table > tbody > tr > td:last-child) {
  border-radius: 0 8px 8px 0;
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
