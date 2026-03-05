<template>
  <v-container class="bg-white border rounded-lg mb-2 px-10 py-8">
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('prebid.title') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pt-2">
        <v-data-table
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
            <div v-if="item.quantity" class="text-body-1">
              {{ formatNumber(item.quantity) }}
            </div>
          </template>
          <template
            v-for="sup in auction?.auctions_sellers"
            :key="`mult_celing_${sup.seller_email}`"
            #[`item.${sup.seller_email}`]="{ item }"
          >
            <div
              v-if="+item[sup.seller_email].basePrice === 0"
              class="text-body-1 d-flex flex-column"
            >
              <span class="font-weight-semibold text-start"> - </span>
            </div>
            <div v-else class="text-body-1 d-flex flex-column">
              <span class="font-weight-semibold text-start"
                >{{ formatNumber(item[sup.seller_email].basePrice)
                }}<span class="text-green-darken-2">{{ item[sup.seller_email].text }}</span></span
              >
              <span v-if="item[sup.seller_email].handicapName" class="text-grey text-start">{{
                item[sup.seller_email].handicapName
              }}</span>
              <span v-else class="text-grey text-start"
                >{{ t('prebid.total') }}
                {{ formatNumber(item[sup.seller_email].unitPrice * item.quantity) }}</span
              >
            </div>
          </template>
          <template #no-data>
            <div class="pa-6" />
          </template>
          <template #bottom />
          <template #body.append>
            <tr class="datatable-totals">
              <td colspan="2" class="fixed" />
              <td
                class="pt-6 d-flex justify-center align-center text-body-1 font-weight-bold right-border"
              >
                {{ t('prebid.total') }}
              </td>
              <td v-for="(item, index) in totals" :key="index" class="pt-6">
                <div v-if="item > 0" class="d-flex justify-start align-end text-body-1">
                  <span class="font-weight-bold">
                    {{ formatNumber(item) }}
                  </span>
                  <span> &nbsp;{{ auction.currency }} </span>
                </div>
                <div v-else class="font-weight-bold">-</div>
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { groupBy } from 'lodash'

const props = defineProps(['auction', 'suppliers'])

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()

const [suppliesResult, handicapsResult] = await Promise.all([
  supabase.from('supplies').select('*').eq('auction_id', props.auction.id),
  supabase.from('auctions_handicaps').select('*').eq('auction_id', props.auction.id)
])

const { data: supplies } = suppliesResult
const { data: handicaps } = handicapsResult

const [bidsHandicapsResult, suppliesSellerResult] = await Promise.all([
  supabase
    .from('bids_handicaps')
    .select('*')
    .in(
      'handicap_id',
      handicaps.map((h) => h.id)
    ),
  supabase
    .from('supplies_sellers')
    .select('*')
    .in(
      'supply_id',
      supplies.map((s) => s.id)
    )
])

const { data: bidsHandicaps } = bidsHandicapsResult
const { data: suppliesSeller } = suppliesSellerResult

const suppliesBySeller = groupBy(suppliesSeller, (s) => s.seller_email)

const headers = computed(() => {
  const tab = [
    { title: t('prebid.lineItems'), value: 'name', align: 'start fixed', width: 150 },
    { title: t('prebid.unit'), value: 'unit', align: 'center fixed', width: 200 },
    { title: t('prebid.quantity'), value: 'quantity', align: 'center fixed', width: 150 }
  ]

  const children = props.auction.auctions_sellers?.map((e) => {
    const title =
      props.suppliers?.find((s) => s.seller_email === e.seller_email)?.seller_profile?.companies
        ?.name ?? e.seller_email
    return {
      title,
      value: e.seller_email,
      align: 'fixed text-no-wrap',
      width: 250
    }
  })

  children.forEach((child) => {
    tab.push(child)
  })

  return [...tab, { title: '', value: 'actions', align: 'center' }]
})

function findBestPrebid(sellerEmail) {
  const preBids = props.auction.bids.filter((bid) => bid.type === 'prebid')
  const findSellerPrebids = preBids
    .filter((e) => e.profiles?.email === sellerEmail)
    .sort((a, b) => a.price - b.price)

  return findSellerPrebids[0] || null
}

// Formatting the items for the table
const dataTableItems = computed(() => {
  const items = []

  const suppliesItems = supplies
    .map((supply) => {
      const suppliersData = {}

      props.auction.auctions_sellers.forEach((seller) => {
        const email = seller.seller_email
        const supplyData = suppliesBySeller[email].find((s) => s.supply_id === supply.id)

        const bestPrebid = findBestPrebid(email)

        const bidSupply = bestPrebid?.bid_supplies.find((s) => s.supplies.id === supply.id)

        const basePrice = bidSupply?.price || (bestPrebid?.price || 0) / supply.quantity

        const totalValue = formatTotalValue(supplyData, supply.quantity, basePrice)

        suppliersData[email] = totalValue
      })

      return {
        ...suppliersData,
        id: supply.id,
        name: supply.name,
        unit: supply.unit,
        quantity: supply.quantity,
        index: supply.index
      }
    })
    .toSorted((a, b) => a.index - b.index)

  items.push(...suppliesItems)

  const handicapsByGroup = groupBy(handicaps, (h) => h.group_name)

  const handicapItems = Object.keys(handicapsByGroup).map((groupName) => {
    const handicapGroup = handicapsByGroup[groupName]
    const supplierData = {}

    props.auction.auctions_sellers.forEach((seller) => {
      const email = seller.seller_email

      const bestPrebid = findBestPrebid(email)

      const bidHandicaps = bidsHandicaps.filter((b) => b.bid_id === bestPrebid?.id)
      const bidHandicapsIds = bidHandicaps.map((b) => b.handicap_id)
      const selectedHandicap = handicapGroup.find((h) => {
        return bidHandicapsIds.includes(h.id)
      })

      supplierData[email] = {
        handicapName: selectedHandicap?.option_name || '-',
        basePrice: selectedHandicap?.amount || 0,
        totalPrice: selectedHandicap?.amount || 0
      }
    })

    return {
      ...supplierData,
      id: groupName,
      name: groupName,
      unit: t('prebid.handicap')
    }
  })

  items.push(...handicapItems)

  return items
})

const totals = computed(() => {
  return props.suppliers.map((seller) => {
    return dataTableItems.value.reduce((total, formatedSupply) => {
      return (
        total +
        (formatedSupply[seller.seller_email].basePrice
          ? formatedSupply[seller.seller_email].totalPrice
          : 0)
      )
    }, 0)
  })
})

const headerBackgroundColor = 'rgb(var(--v-theme-yellow-lighten-1))'
</script>
<style scoped>
.datatable:deep(table > thead > tr > th),
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
.datatable-totals {
  position: sticky !important;
  position: -webkit-sticky !important;
}

.datatable-totals:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable-totals:deep(table > thead > tr > th.fixed:nth-child(2)) {
  width: 90px !important;
  max-width: 90px !important;
  min-width: 90px !important;
  padding-left: 8px !important;
}

.v-text-field:deep(input) {
  text-align: center !important;
}
</style>
