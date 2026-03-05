<template>
  <v-card class="mb-1">
    <v-card-title class="px-10 pt-5">
      <div class="d-flex justify-space-between align-center">
        <div class="text-h6 font-weight-semibold">
          {{ t('lots.lotAndCeilingPrice') }}
        </div>
        <div class="d-flex align-center" style="gap: 16px">
          <!-- Display rank per line item toggle -->
          <div
            v-if="auctionType === 'reverse' || auctionType === 'sealed-bid'"
            class="d-flex align-center"
            style="gap: 12px"
          >
            <div class="text-body-2" style="color: #1d1d1b">
              {{ t('lotRules.rankPerLineItem') }}
              <v-tooltip
                :text="t('lotRules.rankPerLineItemTooltip')"
                content-class="bg-white text-black border text-body-2"
                location="top left"
                width="180"
              >
                <template #activator="{ props }">
                  <v-icon
                    inline
                    class="ml-1"
                    v-bind="props"
                    size="small"
                    color="grey"
                    icon="mdi-information-outline"
                  />
                </template>
              </v-tooltip>
            </div>
            <div class="d-flex align-center" style="gap: 8px">
              <span
                style="font-size: 14px; line-height: 1.5"
                :style="{ color: !model.rank_per_line_item ? '#1D1D1B' : '#8E8E8E' }"
              >
                {{ t('lotRules.no') }}
              </span>
              <v-switch
                v-model="model.rank_per_line_item"
                :disabled="!showRankPerLineItem"
                color="primary"
                hide-details
                inset
                density="compact"
              />
              <span
                style="font-size: 14px; line-height: 1.5"
                :style="{ color: model.rank_per_line_item ? '#1D1D1B' : '#8E8E8E' }"
              >
                {{ t('lotRules.yes') }}
              </span>
            </div>
          </div>

          <span class="px-0">
            <v-menu v-if="auctionType === 'reverse'" :location="'bottom'">
              <template #activator="{ props }">
                <v-btn prepend-icon="mdi-plus-circle-outline" v-bind="props" variant="text">
                  <template #prepend>
                    <v-icon color="success" />
                  </template>
                  {{ t('lots.addMoreValues') }}
                </v-btn>
              </template>
              <v-list class="py-0">
                <v-list-item>
                  <v-checkbox
                    v-model="model.got_fixed_handicap"
                    class="text-body-1"
                    density="compact"
                    hide-details
                    @click.stop
                  >
                    <template #label>
                      <span class="text-body-1">
                        {{ t('lots.fixedHandicap') }}
                      </span>
                    </template>
                  </v-checkbox>
                </v-list-item>
                <v-list-item>
                  <v-checkbox
                    v-model="model.got_dynamic_handicap"
                    class="text-body-1"
                    density="compact"
                    hide-details
                    @click.stop
                  >
                    <template #label>
                      <span class="text-body-1">
                        {{ t('lots.dynamicHandicap') }}
                      </span>
                    </template>
                  </v-checkbox>
                </v-list-item>
              </v-list>
            </v-menu>
          </span>
        </div>
      </div>
    </v-card-title>
    <v-card-text class="px-2">
      <v-container v-if="model.suppliers?.length === 0">
        <v-row>
          <v-col cols="12" class="px-5">
            <v-alert outlined icon="mdi-alert" class="d-flex justify-center">
              {{ t('lots.addSuppliersToLot') }}
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
      <v-container v-else class="pt-0">
        <v-row>
          <v-col cols="12" class="d-flex flex-column pt-1 pl-5">
            <v-data-table
              :items-per-page="-1"
              :items="model.items"
              :headers="headers"
              class="datatable px-1 mt-4"
            >
              <template
                v-for="(header, index) in headers"
                :key="header.value"
                #[`header.${header.value}`]
              >
                <v-tooltip
                  v-if="index >= 3"
                  location="top start"
                  content-class="bg-white text-body-2 border"
                >
                  <template #activator="{ props }">
                    <span v-bind="props" class="truncated-text" :title="header.title">
                      {{ header.title }}
                    </span>
                  </template>
                  <template #default>
                    {{ header.title }}
                  </template>
                </v-tooltip>
                <span v-else>
                  {{ header.title }}
                </span>
              </template>
              <template #item.line_item="{ item }">
                <v-text-field
                  v-model="item.line_item"
                  text-class="justify-start"
                  class="not-centered my-2"
                  hide-details
                />
              </template>
              <template #item.unit="{ item }">
                <div class="d-flex justify-center align-center">
                  <v-text-field
                    v-model="item.unit"
                    compact
                    variant="outlined"
                    class="my-2 not-centered"
                    hide-details
                  />
                </div>
              </template>
              <template #item.quantity="{ item }">
                <div class="d-flex justify-center">
                  <v-text-field
                    v-model="item.quantity"
                    variant="outlined"
                    compact
                    type="number"
                    onwheel="this.blur()"
                    class="prices not-centered my-2"
                    hide-details
                  />
                </div>
              </template>
              <template
                v-for="sup in sortedSuppliers"
                :key="`celing_${sup.email}`"
                #[`item.${sup.email}`]="{ item }"
              >
                <div class="d-flex align-center justify-center border-bottom">
                  <v-text-field
                    v-model="item[sup.email]"
                    type="number"
                    onwheel="this.blur()"
                    class="prices justify-center my-2 not-centered"
                    variant="outlined"
                    compact
                    hide-details
                  />
                </div>
              </template>
              <template
                v-for="sup in sortedSuppliers"
                :key="`mult_celing_${sup.email}`"
                #[`item.mult_${sup.email}`]="{ item }"
              >
                <div class="w-full d-flex align-center justify-center border-bottom">
                  <InputsEditableText
                    v-model="item[`mult_${sup.email}`]"
                    compact
                    class="prices not-centered"
                    text-class="text-center"
                  />
                </div>
              </template>
              <template #item.actions="{ item }">
                <div v-if="model.items.length > 1" class="d-flex justify-end align-center">
                  <v-btn
                    size="small"
                    variant="plain"
                    class="border-bottom"
                    icon
                    @click="deleteItem(item)"
                  >
                    <v-img src="@/assets/icons/basic/Bin.svg" width="20" height="20" />
                  </v-btn>
                </div>
              </template>

              <template #no-data>
                <div class="pa-6" />
              </template>
              <template #bottom />
              <template #body.append>
                <tr class="datatable-totals">
                  <td colspan="2" class="fixed">
                    <template
                      v-if="props.auctionType === 'reverse' || props.auctionType === 'sealed-bid'"
                    >
                      <v-btn size="large" width="204" class="" @click="addLineItem">
                        <v-icon class="mr-2" color="green"> mdi-plus-circle-outline </v-icon>
                        <span class="text-body-1 font-weight-semibold">
                          {{ t('lots.addNewLineItem') }}
                        </span>
                      </v-btn>
                    </template>
                  </td>
                  <td
                    class="pt-4 d-flex justify-end text-body-1 font-weight-semibold fixed pb-4 pr-0 right-border"
                  >
                    {{ t('lots.total') }}
                  </td>
                  <td v-for="(item, index) in totals" :key="index">
                    <span class="text-body-1 font-weight-semibold text-no-wrap">
                      {{ item.value }}
                    </span>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>
<script setup>
const props = defineProps(['suppliers', 'auctionType', 'currency'])
const model = defineModel()

// Use translations
const { t } = useTranslations()

// When suppliers are removed from the parent list, clean up model.suppliers
watchEffect(() => {
  if (!model.value.suppliers || !props.suppliers) return

  // Get the list of valid supplier emails
  const validEmails = new Set(props.suppliers.map((s) => s.email))

  // Filter out any suppliers that are no longer in the parent list
  const filteredSuppliers = model.value.suppliers.filter((s) => validEmails.has(s.email))

  // Only update if there's a change to avoid infinite loops
  if (filteredSuppliers.length !== model.value.suppliers.length) {
    model.value.suppliers = filteredSuppliers
  }
})

// Sort model.suppliers to match props.suppliers order for column alignment
const sortedSuppliers = computed(() => {
  if (!model.value.suppliers || !props.suppliers) return []
  const propsOrder = props.suppliers.map((s) => s.email)
  return [...model.value.suppliers].sort((a, b) => {
    return propsOrder.indexOf(a.email) - propsOrder.indexOf(b.email)
  })
})

const headers = computed(() => {
  const children = sortedSuppliers.value?.map((e) => {
    const title = props.suppliers?.find((s) => s.email === e.email)?.company ?? e.email
    return {
      title: title,
      value: e.email,
      align: 'start fixed',
      width: 250,
      tooltip: title
    }
  })

  const tab = [
    { title: t('lots.lineItems'), value: 'line_item', align: 'start fixed', width: 217 },
    { title: t('lots.unit'), value: 'unit', align: 'start fixed', width: 127 },
    { title: t('lots.quantity'), value: 'quantity', align: 'start fixed', width: 110 }
  ]

  children.forEach((child) => {
    tab.push(child)
  })

  return [...tab, { title: '', value: 'actions', align: 'start', width: 30 }]
})

const totals = computed(() => {
  // Use sortedSuppliers to match column order
  const array = sortedSuppliers.value?.map((seller) => {
    let total = 0
    model.value.items.forEach((item) => {
      total += (item[seller.email] || 0) * item.quantity
    })
    return { [seller.email]: formatNumber(total, 'currency', props.currency) }
  })
  return array.map((e) => {
    return {
      value: e[Object.keys(e)[0]]
    }
  })
})

onMounted(() => {
  const supplierEmails = model.value.suppliers.map((supplier) => supplier.email)
  model.value.items.forEach((item) => {
    supplierEmails.forEach((email) => {
      if (!(email in item)) {
        item[email] = 0
      }
    })
  })
})

// Auto-calculate selling prices only when prebid is toggled OFF (not on every model change)
watch(
  () => model.value.dutch_prebid_enabled,
  (newValue, oldValue) => {
    // Only auto-calculate when prebid is explicitly turned OFF (true -> false)
    if (oldValue === true && newValue === false) {
      const supplierEmails = model.value.suppliers?.map((supplier) => supplier.email) || []
      model.value.items.forEach((item) => {
        supplierEmails.forEach((email) => {
          // Set the ceiling price at the last round price,
          // dutch is max_bid_decr value, japanese is last calculated round price
          const totalMaxPrice =
            props.auctionType === 'japanese'
              ? +firstJapaneseRoundPrice.value
              : +model.value.max_bid_decr
          const maxUnitPrice = totalMaxPrice / +item.quantity
          item[email] = Math.round(maxUnitPrice * 100) / 100
        })
      })
    }
  }
)

const firstJapaneseRoundPrice = computed(() => {
  // #TODO: get the first round price
  return model.value.max_bid_decr
})

// Only show rank per line item toggle when lot has multiple items
const showRankPerLineItem = computed(() => {
  return model.value.items && model.value.items.length > 1
})

function addLineItem() {
  const lineItemBase = {
    line_item: `Item ${model.value.items.length + 1}`,
    unit: 'Ton',
    quantity: 1
  }
  const suppliersData = model.value.suppliers.map((seller) => {
    let mult = {}
    if (model.value.multiplier) {
      mult = { [`mult_${seller.email}`]: 1 }
    }
    return { [seller.email]: 0, ...mult }
  })

  const flatSuppliersData = suppliersData.reduce((r, c) => Object.assign(r, c), {})
  model.value.items.push({ ...lineItemBase, ...flatSuppliersData })
}

function deleteItem(item) {
  const deletedIndex = model.value.items.indexOf(item)
  model.value.items.splice(deletedIndex, 1)
}

if (model.value.items.length === 0) {
  addLineItem()
}

// Initialize rank_per_line_item if undefined
if (model.value.rank_per_line_item === undefined) {
  model.value.rank_per_line_item = false
}

// Clear fixed handicap values when the feature is disabled
watch(
  () => model.value.got_fixed_handicap,
  (newValue, oldValue) => {
    // Only clear when transitioning from true to false
    if (oldValue === true && newValue === false) {
      const supplierEmails = model.value.suppliers?.map((supplier) => supplier.email) || []
      model.value.items.forEach((item) => {
        supplierEmails.forEach((email) => {
          // Remove handicap type and value for each supplier
          delete item[`handi_type_${email}`]
          delete item[`handi_value_${email}`]
        })
      })
    }
  }
)

// Clear dynamic handicap values when the feature is disabled
watch(
  () => model.value.got_dynamic_handicap,
  (newValue, oldValue) => {
    // Only clear when transitioning from true to false
    if (oldValue === true && newValue === false) {
      model.value.handicaps = []
    }
  }
)
</script>
<style scoped>
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)),
.datatable-totals:deep(table > thead > tr > th) {
  position: sticky !important;
  position: -webkit-sticky !important;
  z-index: 999 !important;
  background: white;
  font-weight: 600;
  font-size: 14px;
  padding-inline: 8px;
}

.column-title:deep(span) {
  font-weight: 600;
  font-size: 14px;
}
.datatable-totals:deep(table > thead > tr > th) {
  background-color: rgb(var(--v-theme-grey-ligthen-3));
}
.datatable:deep(table > tbody > tr > td:nth-child(n)) {
  border: none !important;
}
.datatable {
  scrollbar-width: 0;
}

.datatable:deep(table) {
  table-layout: fixed;
}
.datatable:deep(table > thead > tr > th),
.datatable-totals:deep(table > thead > tr > th) {
  border: none !important;
  height: 36px !important;
  margin-bottom: 10px !important; /* not sure this does anything */
}
.datatable:deep(table > thead > tr > th:nth-child(1)),
.datatable:deep(table > thead > tr > th:nth-child(2)),
.datatable:deep(table > thead > tr > th:nth-child(3)) {
  background-color: rgb(var(--v-theme-grey-ligthen-3)) !important;
}
.datatable:deep(table > thead > tr > th:nth-child(1)) {
  padding-left: 8px !important;
  border-radius: 4px 0 0 4px;
}
.datatable:deep(table > thead > tr > th:nth-child(3)) {
  border-radius: 0 4px 4px 0;
}

.datatable:deep(table > thead > tr > th:nth-child(n + 4)) {
  background-color: rgb(var(--v-theme-green-light)) !important;
  padding-inline: 8px;
  margin: 10px 0;
  font-weight: 600;
}
/* .datatable:deep(table > thead > tr > th:nth-child(4)) {
  border-radius: 4px 0 0 4px;
} */
.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 4px 4px 0;
}
.datatable:deep(table > tbody > tr:nth-last-child(2) > td:nth-child(n + 4)) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.datatable:deep(table > thead > tr > th:nth-child(3)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > tbody > tr > td.right-border) {
  border-right: 24px solid white !important; /* adds pseudo-space between columns */
}

.v-text-field:deep(.v-field--no-label input),
.v-text-field .v-field--active:deep(input) {
  border-radius: 4px !important;
}
.prices {
  min-width: 90px;
}
.v-table .v-table__wrapper > table > tbody:deep(tr > td) {
  border: none !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
  min-width: 217px !important;
  width: 217px !important;
  padding-left: 0px;
}
.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)) {
  min-width: 127px !important;
  width: 127px !important;
}

.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
  min-width: 110px !important;
  width: 110px !important;
  padding-right: 0px;
}

.datatable:deep(table > tbody > tr > td:nth-child(n + 4):not(:last-child)) {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  padding-inline: 4px;
}
.datatable:deep(table > tbody > tr > td:nth-child(4)) {
  padding-left: 0 !important;
}
.datatable:deep(table > tbody > tr > td:nth-last-child(2)) {
  padding-right: 0 !important;
}
.datatable:deep(table > thead > tr > th:nth-child(n + 4):not(:last-child)) {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  padding-inline: 8px;
}

@media screen and (max-width: 1024px) {
  .datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
  .datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
    min-width: 260px !important;
  }
  .datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
  .datatable:deep(table > thead > tr > th.fixed:nth-child(2)) {
    min-width: 150px !important;
  }

  .datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
  .datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
    min-width: 100px !important;
  }

  .datatable-totals:deep(td:nth-child(2)) {
    background-color: rgb(var(--v-theme-header-bg-color));
    min-width: 100px !important;
  }
}

.datatable-totals:deep(td:nth-child(1)) {
  min-width: 350px !important;
}
.datatable-totals:deep(td:nth-child(1)) {
  min-width: 350px !important;
}
.datatable-totals:deep(td:nth-child(2)) {
  background-color: rgb(var(--v-theme-grey-ligthen-3));
  min-width: 100px !important;
}
.datatable-totals:deep(table > thead > tr > th.button-column) {
  max-width: 30px !important;
  min-width: 30px;
  width: 30px;
}

.datatable:deep(table > thead > tr > th:last-child),
.datatable:deep(table > tbody > tr > td:last-child) {
  width: 30px !important;
  min-width: 30px !important;
  max-width: 30px !important;
  padding: 0 !important;
}

.v-text-field:not(.not-centered):deep(input) {
  text-align: center !important;
}
.hide-dutch-no-prebid-column:deep(table > thead > tr > th:nth-child(n + 4)),
.hide-dutch-no-prebid-column:deep(table > tbody > tr > td:nth-child(n + 4)) {
  display: none !important;
}

:deep(input::-webkit-outer-spin-button),
:deep(input::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.datatable:deep(table > thead > tr > th:nth-child(n + 4)) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  position: relative;
}

.truncated-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
}
</style>
