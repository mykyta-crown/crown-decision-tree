<template>
  <v-container class="bg-white border rounded-lg mb-2 px-10 py-8">
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2"> Fixed Handicap </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-data-table
          :items-per-page="-1"
          :items="dataTableItems"
          :headers="headers"
          class="datatable"
          :style="{ '--header-bg-color': headerBackgroundColor }"
        >
          <template #[`item.name`]="{ item }">
            <div class="text-body-1 text-truncate">
              {{ item.name }}
            </div>
          </template>
          <template #[`item.unit`]="{ item }">
            <div class="text-body-1">
              {{ item.unit }}
            </div>
          </template>
          <template #[`item.quantity`]="{ item }">
            <div class="text-body-1">
              {{ formatNumber(item.quantity) }}
            </div>
          </template>
          <template
            v-for="sup in auction?.auctions_sellers"
            :key="`mult_celing_${sup.seller_email}`"
            #[`item.${sup.seller_email}`]="{ item }"
          >
            <div class="text-body-1 d-flex flex-column">
              <span class="font-weight-bold text-green-darken-2"
                >{{ item[sup.seller_email] }}
              </span>
            </div>
          </template>
          <template #no-data>
            <div class="pa-6" />
          </template>
          <template #bottom />
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
const props = defineProps(['auction', 'suppliers'])

const headers = computed(() => {
  const tab = [
    { title: 'Line items', value: 'name', align: 'start fixed', width: 150 },
    { title: 'Unit', value: 'unit', align: 'start fixed', width: 200 },
    { title: 'Quantity', value: 'quantity', align: 'start fixed', width: 150 }
  ]

  const children = props.auction.auctions_sellers?.map((e) => {
    const title =
      props.suppliers?.find((s) => s.seller_email === e.seller_email)?.seller_profile?.companies
        ?.name ?? e.seller_email
    return {
      title,
      value: e.seller_email,
      align: 'fixed buyer',
      width: 250
    }
  })

  children.forEach((child) => {
    tab.push(child)
  })

  return [...tab, { title: '', value: 'actions' }]
})

const formatHandicap = (additive, multiplicative) => {
  if (additive !== 0) {
    return additive > 0 ? `+${additive}` : `${additive}`
  }
  if (multiplicative !== 1) {
    return `*${multiplicative.toFixed(2)}`
  }
  return '-'
}

// Formatting the items for the table
const dataTableItems = computed(() => {
  return props.auction.supplies
    .map((supply) => {
      const suppliersData = props.auction.auctions_sellers.map((seller) => {
        const findSuppliySeller = supply.supplies_sellers.find(
          (e) => e.seller_email === seller.seller_email
        )

        return {
          [seller.seller_email]: formatHandicap(
            findSuppliySeller.additive,
            findSuppliySeller.multiplicative
          )
        }
      })
      const flatSuppliersData = suppliersData.reduce((r, c) => Object.assign(r, c), {})
      return {
        ...flatSuppliersData,
        id: supply.id,
        name: supply.name,
        unit: supply.unit,
        quantity: supply.quantity,
        index: supply.index
      }
    })
    .toSorted((a, b) => a.index - b.index)
})

const headerBackgroundColor = '#FDFFD2'
</script>
<style scoped>
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
  position: sticky !important;
  position: -webkit-sticky !important;
  font-size: 14px;
  font-weight: 600 !important;
}
.datatable:deep(table > thead > tr > th.fixed) {
  font-weight: 600 !important;
}

.datatable:deep(table > thead > tr > th.buyer) {
  font-size: 14px;
  font-weight: 600 !important;
}

.datatable:deep(table > thead > tr > th.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)) {
  min-width: 300px !important;
}

.datatable:deep(table > thead > tr > th) {
  padding: 8px 8px !important;
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2));
  margin-bottom: 10px !important;
}
.datatable:deep(table > thead > tr > th) {
  background-color: var(--header-bg-color);
}

.datatable:deep(table > thead > tr > th:nth-child(1)) {
  border-radius: 8px 0 0 8px;
}

.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 8px 8px 0;
}
.datatable:deep(table > tbody > tr:last-child > td) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2));
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
  left: 0;
  min-width: 191px !important;
  width: 191px !important;
  max-width: 191px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)) {
  left: 191px;
  width: 85px !important;
  max-width: 85px !important;
  min-width: 85px !important;
  padding-left: 8px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
  left: 276px;
  width: 106px !important;
  padding-left: 8px !important;
}
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)) {
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2));
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)) {
  background-color: white;
}
.datatable:deep(table > tbody > tr > td) {
  padding: 7.5px 8px !important;
}

.v-table .v-table__wrapper > table > tbody:deep(tr > td) {
  border: none !important;
}
</style>
