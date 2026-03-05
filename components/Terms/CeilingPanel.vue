<template>
  <v-container
    class="bg-white border rounded-lg mb-2 px-10 py-8"
    :data-auction-id="auction?.id || ''"
  >
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('ceilingPrice.title') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pt-2">
        <v-data-table
          v-if="isBuyer"
          :items-per-page="-1"
          :items="dataTableItems"
          :headers="headers"
          class="datatable"
          :style="{ '--header-bg-color': headerBackgroundColor }"
        >
          <template
            v-for="sup in auction?.auctions_sellers"
            :key="`header_${sup.seller_email}`"
            #[`header.${sup.seller_email}`]="{ column }"
          >
            <div class="text-truncate" style="max-width: 250px">
              {{ column.title }}
              <v-tooltip
                activator="parent"
                location="top start"
                content-class="bg-white text-black border text-body-2"
              >
                <span>
                  {{ column.title }}
                </span>
              </v-tooltip>
            </div>
          </template>
          <template #item.name="{ item }">
            <div class="text-body-1 text-truncate">
              {{ item.name }}
            </div>
            <v-tooltip
              activator="parent"
              location="top start"
              content-class="bg-white text-black border text-body-2"
            >
              <span>
                {{ item.name }}
              </span>
            </v-tooltip>
          </template>
          <template #item.unit="{ item }">
            <div class="text-body-1">
              {{ item.unit }}
            </div>
          </template>
          <template #item.quantity="{ item }">
            <div class="text-body-1">
              {{ formatNumber(item.quantity) }}
            </div>
          </template>
          <template
            v-for="sup in auction?.auctions_sellers"
            :key="`mult_celing_${sup.seller_email}`"
            #[`item.${sup.seller_email}`]="{ item }"
          >
            <div
              v-if="+item[sup.seller_email] === 0"
              class="text-body-1 font-weight-semibold d-flex flex-column"
            >
              <span class="font-weight-semibold text-start"> - </span>
            </div>
            <div v-else class="text-body-1 d-flex flex-column">
              <span class="font-weight-semibold text-start">{{
                formatNumber(item[sup.seller_email])
              }}</span>
              <span class="text-grey text-start text-no-wrap"
                >{{ t('ceilingPrice.total') }}
                {{ formatNumber(item[sup.seller_email] * item.quantity) }}</span
              >
            </div>
          </template>
          <template #no-data>
            <div class="pa-6" />
          </template>
          <template #bottom />
          <template #body.append>
            <tr class="datatable-totals">
              <td colspan="1" class="fixed" />
              <td colspan="1" class="fixed" />
              <td
                class="pt-6 d-flex justify-center align-center text-body-1 font-weight-bold right-border fixed"
              >
                {{ t('ceilingPrice.total') }}
              </td>
              <td v-for="(item, index) in totals" :key="index" class="pt-6">
                <div class="d-flex justify-start align-end text-body-1">
                  <span class="font-weight-bold">
                    {{ formatNumber(item.value) }}
                  </span>
                  <span> &nbsp;{{ auction.currency }} </span>
                </div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
const props = defineProps(['auction', 'suppliers'])

// Use translations
const { t } = useTranslations()

const { isBuyer } = useUser()

const suppliersListRef = ref(props.suppliers?.map((e) => e) ?? [])
const suppliersList = toValue(suppliersListRef)

const headers = computed(() => {
  const tab = [
    { title: t('ceilingPrice.lineItems'), value: 'name', align: 'start fixed', width: 150 },
    { title: t('ceilingPrice.unit'), value: 'unit', align: 'center fixed', width: 200 },
    { title: t('ceilingPrice.quantity'), value: 'quantity', align: 'center fixed', width: 150 }
  ]

  if (!isBuyer.value) {
    return [
      { title: t('ceilingPrice.lineItems'), value: 'name', align: 'center buyer', width: 150 },
      { title: t('ceilingPrice.unit'), value: 'unit', align: 'center buyer', width: 200 },
      { title: t('ceilingPrice.quantity'), value: 'quantity', align: 'center buyer', width: 150 },
      { title: t('ceilingPrice.title'), value: 'baseline', align: 'center buyer', width: 150 }
    ]
  }
  const children = props.auction.auctions_sellers?.map((e) => {
    const title =
      props.suppliers?.find((s) => s.seller_email === e.seller_email)?.seller_profile?.companies
        ?.name ?? e.seller_email
    return {
      title,
      value: e.seller_email,
      align: ' fixed',
      width: 250
    }
  })

  children.forEach((child) => {
    tab.push(child)
  })

  return [...tab, { title: '', value: 'actions', align: 'center' }]
})

// Formatting the items for the table
const dataTableItems = computed(() => {
  return props.auction.supplies
    .map((supply) => {
      const suppliersData = props.auction.auctions_sellers.map((seller) => {
        const findSuppliySeller = supply.supplies_sellers.find(
          (e) => e.seller_email === seller.seller_email
        )

        return { [seller.seller_email]: findSuppliySeller.ceiling }
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

const totals = computed(() => {
  const array = suppliersList.map((seller) => {
    let total = 0
    props.auction.supplies.forEach((item) => {
      total +=
        (item.supplies_sellers.find((e) => e.seller_email === seller.seller_email).ceiling || 0) *
        item.quantity
    })
    return { [seller.email]: total }
  })
  return array.map((e) => {
    return {
      value: e[Object.keys(e)[0]]
    }
  })
})

const headerBackgroundColor = 'rgb(var(--v-theme-purple))'
</script>
<style scoped>
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)),
.datatable-totals:deep(table > tbody > tr > td) {
  position: sticky !important;
  position: -webkit-sticky !important;
  font-size: 14px;
  font-weight: 600 !important;
}
.datatable:deep(table > thead > tr > th.fixed) {
  font-weight: 600 !important;
}
.datatable-totals:deep(table > thead > tr > th) {
  background-color: var(--header-bg-color);
}
.datatable:deep(table > thead > tr > th.buyer) {
  font-weight: 600;
  font-size: 14px;
}
.datatable:deep(table > tbody > tr > td) {
  padding: 7px 8px !important;
}

.datatable:deep(table > thead > tr > th.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)) {
  min-width: 300px !important;
}

.datatable:deep(table > thead > tr > th),
.datatable-totals:deep(table > thead > tr > th) {
  border: none !important;
  padding: 7.5px 8px !important;
  margin-bottom: 10px !important;
}
.datatable:deep(table > thead > tr > th) {
  background-color: var(--header-bg-color);
}

.datatable:deep(table > thead > tr > th:nth-child(1)) {
  border-radius: 4px 0 0 4px;
}

.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 4px 4px 0;
}
.datatable:deep(table > tbody > tr:nth-last-child(2) > td:nth-child(n + 4)) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.supplier-datatable:deep(table > tbody > tr:nth-last-child(2) > td:nth-child(n)) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
  min-width: 191px !important;
  width: 191px !important;
  max-width: 191px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)) {
  width: 90px !important;
  max-width: 90px !important;
  min-width: 90px !important;
  padding-left: 8px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
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
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > tbody > tr > td.right-border) {
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.datatable:deep(table > tbody > tr:last-child) {
  border-top: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.v-table .v-table__wrapper > table > tbody:deep(tr > td) {
  border: none !important;
}
.datatable-totals:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable-totals:deep(table > thead > tr > th.fixed:nth-child(1)) {
  left: 0;
  min-width: 191px !important;
  width: 191px !important;
  max-width: 191px !important;
}

.datatable-totals:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable-totals:deep(table > thead > tr > th.fixed:nth-child(2)) {
  left: 191px;
  width: 90px !important;
  max-width: 90px !important;
  min-width: 90px !important;
  padding-left: 8px !important;
}
.datatable-totals {
  position: sticky !important;
  position: -webkit-sticky !important;
}
.v-text-field:deep(input) {
  text-align: center !important;
}
</style>
