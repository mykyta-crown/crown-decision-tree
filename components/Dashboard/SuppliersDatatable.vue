<template>
  <v-data-table
    :headers="headers"
    :items-per-page="-1"
    :items="suppliers"
    :hover="true"
    hide-default-footer
    class="datatable bg-none"
  >
    <template #item.phone="{ item }">
      <div class="text-body-1">
        {{ item.phone ?? '-' }}
      </div>
    </template>
    <template #item.email="{ item }">
      <div class="text-body-1">
        {{ item.email }}
      </div>
    </template>
    <template #item.company="{ item }">
      <div v-if="item.companies" class="text-body-1">
        {{ item.companies?.name ?? '' }}
      </div>
      <div v-else>-</div>
    </template>
    <template #item.contact="{ item }">
      <div v-if="item && item.first_name" class="text-body-1">
        {{ item.first_name + ' ' + item.last_name }}
      </div>
      <div v-else>-</div>
    </template>
    <template #item.position="{ item }">
      <div v-if="item && item.position" class="text-body-1">
        {{ item?.position }}
      </div>
      <div v-else>-</div>
    </template>
    <template #item.trainings>
      <div class="d-flex align-center text-no-wrap ga-2">
        <span> {{ `${1} / ${5}` }}</span>
        <v-progress-linear
          model-value="50"
          rounded
          color="green"
          height="8"
          bg-color="grey-ligthen-2"
          class="d-flex align-center"
        />
      </div>
    </template>
    <template #item.status="{ item }">
      <v-chip
        class="w-100 d-flex justify-center"
        :color="item.terms_accepted ? 'green-light' : 'grey-lighten-2'"
        variant="flat"
        label
      >
        <!-- #TODO par status (emailing) -->
        {{ item.terms_accepted ? 'Approved' : 'Pending' }}
      </v-chip>
    </template>
    <template #bottom />
  </v-data-table>
</template>
<script setup>
import { _ } from 'lodash'
const route = useRoute()
const supabase = useSupabaseClient()

const suppliers = ref([])
const PAGE_SIZE = 16

const headers = [
  { title: 'Supplier', value: 'contact', align: 'start' },
  { title: 'Position', value: 'position', align: 'center' },
  { title: 'Email', value: 'email', align: 'center' },
  { title: 'Phone', value: 'phone', align: 'center' },
  { title: 'Supplier company', value: 'company', align: 'center' },
  { title: 'Trainings', value: 'trainings', align: 'center' },
  { title: 'Status', value: 'status', align: 'center' }
]

const addPagination = (query, page) => {
  const start = (page - 1) * PAGE_SIZE
  const end = start + PAGE_SIZE
  return query.range(start, end)
}

let query = supabase
  .from('auctions')
  .select(
    `
         auctions_sellers(*)
      `
  )
  .eq('deleted', false)

const fetchSuppliers = async () => {
  if (route.query.company) {
    query = query.eq('company_id', route.query.company)
  }
  query = addPagination(query, 1)
  const { data: auctionsWithSellers, error: err } = await query
  if (err) {
    console.log('error', err)
    return
  }
  if (auctionsWithSellers.length === 0) {
    return
  }
  const suppliersByAuctions = auctionsWithSellers.flatMap((auction) => auction.auctions_sellers)

  const uniqSuppliers = _.uniqBy(suppliersByAuctions, 'seller_email')

  // Fetch profiles for sellers
  const emailsProfilesQuery = uniqSuppliers
    .reduce((acc, curr) => (acc += `email.eq.${curr.seller_email},`), '')
    .slice(0, -1)

  const { data: existingParticipantsProfiles, error: errorProfiles } = await supabase
    .from('profiles')
    .select('*, companies(*)')
    .or(emailsProfilesQuery)
  suppliers.value = existingParticipantsProfiles
  console.log('existingParticipantsProfiles', existingParticipantsProfiles, errorProfiles)
}

watch(
  route,
  () => {
    fetchSuppliers()
  },
  { immediate: true }
)
</script>

<style scoped>
.bg-none {
  background-color: transparent;
}
.datatable:deep(th) {
  font-size: 14px !important;
  height: 54px !important;
  color: rgb(var(--v-theme-grey));
  background-color: white;
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  white-space: nowrap;
}

.datatable:deep(hr) {
  display: none;
}

.datatable:deep(td) {
  color: rgb(var(--v-theme-primary));
  font-size: 14px !important;
  background-color: white;
}
.datatable:deep(td:first-child),
.datatable:deep(th:first-child) {
  border-top-left-radius: 10px !important;
  border-bottom-left-radius: 10px !important;
  border-left: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.datatable:deep(th:first-child) {
  border-top-left-radius: 0px !important;
}

.datatable:deep(td:last-child),
.datatable:deep(th:last-child) {
  border-top-right-radius: 10px !important;
  border-bottom-right-radius: 10px !important;
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.datatable:deep(tbody tr:hover) {
  cursor: pointer !important;
}
</style>
