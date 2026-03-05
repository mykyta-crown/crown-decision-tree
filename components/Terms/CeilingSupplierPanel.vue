<template>
  <v-container class="bg-white border rounded-lg mb-2 px-10 py-8">
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('ceilingSupplierPanel.title') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pt-2">
        <v-data-table
          :headers="headers"
          :items-per-page="-1"
          class="datatable supplier-datatable"
          :items="dataTableItems"
          :style="{ '--header-bg-color': headerBackgroundColor }"
        >
          <template #header.handicap>
            <div>
              {{ t('ceilingSupplierPanel.headers.fixedHandicap') }}
              <v-tooltip
                :text="t('ceilingSupplierPanel.tooltips.fixedHandicap')"
                content-class="bg-white text-black border"
                location="top left"
              >
                <template #activator="{ props }">
                  <v-icon
                    inline
                    v-bind="props"
                    color="grey"
                    size="small"
                    icon="mdi-information-outline"
                  />
                </template>
              </v-tooltip>
            </div>
          </template>

          <template #item.line_item="{ item }">
            <div class="text-body-1">
              {{ item.line_item }}
            </div>
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

          <template #item.baseline="{ item }">
            <div class="text-body-1 d-flex flex-column">
              <span class="font-weight-bold text-start">
                {{ formatNumber(item[`${user.email}`]) }}
              </span>
              <span class="text-grey text-start">
                {{ t('ceilingSupplierPanel.total') }}
                {{ formatNumber(item[`${user.email}`] * item.quantity) }}
              </span>
            </div>
          </template>

          <template v-if="hasFixedHandicap" #item.handicap="{ item }">
            <div class="text-body-1 text-center w-full">
              <span class="font-weight-bold text-center text-green-darken-2">
                {{ item[`${user.email}_fixed_handicap`] }}
              </span>
            </div>
          </template>

          <template #no-data>
            <div class="pa-6" />
          </template>

          <template #bottom />

          <template #body.append>
            <tr class="top-border">
              <td colspan="2" class="fixed" />
              <td class="pt-6 d-flex justify-start text-body-1 font-weight-bold fixed">
                {{ t('ceilingSupplierPanel.total') }}
              </td>
              <td v-for="(item, index) in totals" :key="index">
                <div class="d-flex justify-start align-end text-body-1">
                  <span class="font-weight-bold">
                    {{ formatNumber(item.value) }}
                  </span>
                  <span>&nbsp;{{ auction.currency }}</span>
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
const props = defineProps(['auction', 'suppliers', 'title'])

const { t } = useTranslations()

const { user } = useUser()

const hasFixedHandicap = computed(() => {
  return props.auction.supplies.some((supply) =>
    supply.supplies_sellers.some((seller) => {
      if (seller.additive || seller.multiplicative) {
        return seller.additive !== 0 || seller.multiplicative !== 1
      }
    })
  )
})

const headers = computed(() => {
  const baseHeaders = [
    {
      title: t('ceilingSupplierPanel.headers.lineItems'),
      value: 'name',
      align: 'start buyer',
      width: 150
    },
    {
      title: t('ceilingSupplierPanel.headers.unit'),
      value: 'unit',
      align: 'start buyer',
      width: 150
    },
    {
      title: t('ceilingSupplierPanel.headers.quantity'),
      value: 'quantity',
      align: 'start buyer',
      width: 150
    },
    {
      title: t('ceilingSupplierPanel.headers.ceilingPrice'),
      value: 'baseline',
      align: 'start buyer',
      width: 150
    }
  ]

  return baseHeaders

  // return hasFixedHandicap.value
  //   ? [...baseHeaders, { title: t('ceilingSupplierPanel.headers.fixedHandicap'), value: 'handicap', align: 'center buyer', width: 150 }]
  //   : baseHeaders
})

const formatHandicap = (additive, multiplicative) => {
  if (additive !== 0) {
    return additive > 0 ? `+${additive}` : `${additive}`
  }
  if (multiplicative !== 1) {
    return multiplicative > 1 ? `*${multiplicative}` : `/ ${1 / multiplicative}`
  }
  return '-'
}

const dataTableItems = computed(() =>
  props.auction.supplies
    .map((supply) => {
      const suppliersData = props.auction.auctions_sellers.map((seller) => {
        const findSuppliySeller = supply.supplies_sellers.find(
          (e) => e.seller_email === seller.seller_email
        )
        const sellerData = { [seller.seller_email]: findSuppliySeller.ceiling }

        return hasFixedHandicap.value
          ? {
              ...sellerData,
              [`${seller.seller_email}_fixed_handicap`]: formatHandicap(
                findSuppliySeller.additive,
                findSuppliySeller.multiplicative
              )
            }
          : sellerData
      })

      return {
        ...Object.assign({}, ...suppliersData),
        id: supply.id,
        name: supply.name,
        unit: supply.unit,
        quantity: supply.quantity,
        index: supply.index
      }
    })
    .toSorted((a, b) => a.index - b.index)
)

const totals = computed(() =>
  props.suppliers.map((seller) => {
    const total = props.auction.supplies.reduce((sum, item) => {
      const supplierItem = item.supplies_sellers.find((e) => e.seller_email === seller.seller_email)
      return sum + (supplierItem.ceiling || 0) * item.quantity
    }, 0)

    return { value: total }
  })
)

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
.datatable:deep(table > thead > tr > th.buyer) {
  font-size: 14px;
  font-weight: 600 !important;
}

.datatable:deep(table > thead > tr > th.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)) {
  min-width: 300px !important;
}
.datatable:deep(table > tbody > tr > td) {
  border: none !important;
  padding: 7px 8px !important;
}

.datatable:deep(table > thead > tr > th),
.datatable-totals:deep(table > thead > tr > th) {
  border: none !important;
  padding: 7.5px 8px !important;
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
.supplier-datatable:deep(table > tbody > tr:not(:last-child) > td:nth-child(n)) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
  left: 0;
  min-width: 200px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)) {
  left: 200px;
  min-width: 75px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
  left: 275px;
  min-width: 100px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(4)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(4)),
.datatable:deep(table > tbody > .datatable-totals > td:nth-child(3)) {
  padding-left: 38px !important;
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
.datatable-totals:deep(td:nth-child(2)) {
  background-color: var(--header-bg-color);
  left: 275px !important;
}
.datatable-totals {
  position: sticky !important;
  position: -webkit-sticky !important;
}
.v-text-field:deep(input) {
  text-align: center !important;
}
</style>
