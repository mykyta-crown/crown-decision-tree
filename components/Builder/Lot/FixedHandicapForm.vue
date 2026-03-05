<template>
  <v-card class="mb-1">
    <v-card-title class="px-10 pt-8">
      <div class="text-h6 font-weight-semibold">
        <span class="mr-2">Fixed Handicap</span>
        <v-icon
          icon="mdi-close"
          size="20"
          :color="hoveredDelete ? 'black' : 'grey'"
          :class="hoveredDelete ? 'bg-grey-lighten-3 rounded-circle' : ''"
          @click.stop="deleteHandicap()"
          @mouseover="ishovered()"
          @mouseleave="hoveredDelete = false"
        />
      </div>
      <v-spacer />
    </v-card-title>
    <v-card-text class="px-2">
      <v-container v-if="model.suppliers?.length === 0">
        <v-row>
          <v-col cols="12" class="px-5">
            <v-alert outlined icon="mdi-alert" class="d-flex justify-center">
              Add suppliers to the lot
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
              class="datatable mt-4"
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
                <span class="mt-4 not-centered justify-start font-weight-regular">{{
                  item.line_item
                }}</span>
              </template>
              <template #item.unit="{ item }">
                <div class="d-flex align-center">
                  <span class="w-66 font-weight-regular">
                    {{ item.unit }}
                  </span>
                </div>
              </template>
              <template #item.quantity="{ item }">
                <div class="d-flex font-weight-regular">
                  {{ item.quantity }}
                </div>
              </template>
              <template
                v-for="sup in sortedSuppliers"
                :key="`celing_${sup.email}`"
                #[`item.${sup.email}`]="{ item }"
              >
                <div class="w-100 d-flex flex-column justify-center my-2 border-bottom">
                  <div class="d-flex pb-2">
                    <v-select
                      v-model="item[`handi_type_${sup.email}`]"
                      class="tf-unit"
                      density="compact"
                      variant="solo"
                      flat
                      :items="['+', '-', '*']"
                      :menu-icon="null"
                      @update:model-value="handleOperatorChange($event, item, sup.email)"
                    >
                      <template #append-inner>
                        <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
                      </template>
                    </v-select>
                    <v-text-field
                      v-model="item[`handi_value_${sup.email}`]"
                      type="number"
                      class="tf-price"
                      flat
                      step="any"
                      min="0"
                      density="compact"
                      style="width: 97px"
                      variant="solo"
                      @change="validateValue($event, item, sup.email)"
                    />
                  </div>
                </div>
              </template>
              <template
                v-for="sup in sortedSuppliers"
                :key="`mult_celing_${sup.email}`"
                #[`item.mult_${sup.email}`]="{ item }"
              >
                <div class="w-full d-flex align-center mt-4 border-bottom">
                  <InputsEditableText
                    v-model="item[`mult_${sup.email}`]"
                    compact
                    class="prices"
                    text-class="text-center"
                  />
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
    </v-card-text>
  </v-card>
</template>
<script setup>
const props = defineProps({
  suppliers: {
    type: Array,
    default: () => []
  }
})

const model = defineModel()

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

const hoveredDelete = ref(false)

const ishovered = () => {
  hoveredDelete.value = true
}

const deleteHandicap = () => {
  model.value.got_fixed_handicap = false
}

// Sort model.suppliers to match props.suppliers order for column alignment
const sortedSuppliers = computed(() => {
  if (!model.value.suppliers || !props.suppliers) return []
  const propsOrder = props.suppliers.map((s) => s.email)
  return [...model.value.suppliers].sort((a, b) => {
    return propsOrder.indexOf(a.email) - propsOrder.indexOf(b.email)
  })
})

const headers = computed(() => {
  let children = sortedSuppliers.value?.map((e) => {
    const title = props.suppliers?.find((s) => s.email === e.email)?.company ?? e.email
    return {
      title: title,
      value: e.email,
      align: 'start fixed',
      width: 161
    }
  })

  if (model.value.multiplier) {
    const temp = []
    children.forEach((seller) => {
      temp.push({ ...seller, align: 'start fixed' })
    })

    children = temp
  }

  const tab = [
    { title: 'Line  items', value: 'line_item', align: 'start fixed', width: 217 },
    { title: 'Unit', value: 'unit', align: 'start fixed', width: 127 },
    { title: 'Quantity', value: 'quantity', align: 'start fixed', width: 110 }
  ]

  children.forEach((child) => {
    tab.push(child)
  })

  const supplierEmails = model.value.suppliers.map((supplier) => supplier.email)
  model.value.items.forEach((item) => {
    supplierEmails.forEach((email) => {
      if (!(email in item)) {
        item[email] = 0
        item[`handi_type_${email}`] = '+'
        item[`handi_value_${email}`] = 0
      }
    })
  })

  return [...tab, { title: '', value: 'spacer', align: 'start', width: 30 }]
})

// onMounted(async () => {
//   await nextTick()
//   const supplierEmails = model.value.suppliers.map((supplier) => supplier.email);
//   model.value.items.forEach((item) => {
//     supplierEmails.forEach((email) => {
//       if (!(email in item)) {
//         item[email] = 0
//         item[`handi_type_${email}`] = '+'
//         item[`handi_value_${email}`] = 0
//       }
//     });
//   });
// })

watch(
  model.value,
  () => {
    const supplierEmails = model.value.suppliers.map((supplier) => supplier.email)
    model.value.items.forEach((item) => {
      supplierEmails.forEach((email) => {
        // Check if the supplier email property exists
        if (!(email in item)) {
          item[email] = 0
        }
        // Check if handicap type exists, if not set to '+'
        if (!(`handi_type_${email}` in item)) {
          item[`handi_type_${email}`] = '+'
        }
        // Check if handicap value exists, if not set to 0
        if (!(`handi_value_${email}` in item)) {
          item[`handi_value_${email}`] = 0
        }
      })
    })
  },
  { immediate: true, deep: true }
)

const handleOperatorChange = (newOperator, item, email) => {
  if (newOperator === '*' && Number(item[`handi_value_${email}`]) === 0) {
    item[`handi_value_${email}`] = 1
  }
}

const validateValue = (event, item, email) => {
  let value = parseFloat(event.target.value)

  if (isNaN(value) || value < 0) {
    value = 0
  }

  if ((item[`handi_type_${email}`] === '/' || item[`handi_type_${email}`] === '*') && value === 0) {
    value = 1
  }

  item[`handi_value_${email}`] = value
}
</script>
<style scoped>
.datatable:deep(table) {
  table-layout: fixed;
}

/* First 3 columns styling - matching CeilingPriceForm structure */
.datatable:deep(table > tbody > tr > td:nth-child(1)),
.datatable:deep(table > tbody > tr > td:nth-child(2)),
.datatable:deep(table > tbody > tr > td:nth-child(3)),
.datatable:deep(table > thead > tr > th:nth-child(1)),
.datatable:deep(table > thead > tr > th:nth-child(2)),
.datatable:deep(table > thead > tr > th:nth-child(3)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
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

.datatable:deep(table > tbody > tr > td:nth-child(n)) {
  border: none !important;
  padding-inline: 7.5px;
}
.datatable {
  scrollbar-width: 0;
}

.datatable:deep(.v-table__wrapper) {
  overflow-y: hidden !important;
}

.datatable:deep(.v-table__wrapper::-webkit-scrollbar:vertical) {
  display: none !important;
}

.datatable:deep(table > thead > tr > th) {
  border: none !important;
  height: 36px !important;
  padding: 7.5px 8px !important;
  margin-bottom: 10px !important;
}

/* Yellow background for first 3 header columns */
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

/* Supplier columns (4+) styling */
.datatable:deep(table > thead > tr > th:nth-child(n + 4)) {
  background-color: rgb(var(--v-theme-yellow));
  margin: 10px 0;
  font-weight: 600;
}

.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 4px 4px 0;
}

/* Border-right gap on 3rd column (before suppliers) */
.datatable:deep(table > thead > tr > th:nth-child(3)),
.datatable:deep(table > tbody > tr > td:nth-child(3)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > tbody > tr > td.right-border) {
  border-right: 24px solid white !important;
}

.v-text-field:deep(.v-field--no-label input),
.v-text-field .v-field--active:deep(input) {
  border-radius: 0 4px 4px 0 !important;
}
.prices {
  min-width: 90px;
}
.v-table .v-table__wrapper > table > tbody:deep(tr > td) {
  border: none !important;
}

/* Column widths matching CeilingPriceForm: 217px, 127px, 110px */
.datatable:deep(table > tbody > tr > td:nth-child(1)),
.datatable:deep(table > thead > tr > th:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
  min-width: 217px !important;
  max-width: 217px !important;
  width: 217px !important;
  padding-left: 8px;
}

.datatable:deep(table > tbody > tr > td:nth-child(2)),
.datatable:deep(table > thead > tr > th:nth-child(2)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(2)) {
  min-width: 127px !important;
  max-width: 127px !important;
  width: 127px !important;
}

.datatable:deep(table > tbody > tr > td:nth-child(3)),
.datatable:deep(table > thead > tr > th:nth-child(3)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
  min-width: 110px !important;
  max-width: 110px !important;
  width: 110px !important;
  padding-right: 0px;
}

/* Supplier columns (4+), excluding last (spacer) */
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

/* Spacer column (last) - matches CeilingPriceForm actions column */
.datatable:deep(table > thead > tr > th:last-child),
.datatable:deep(table > tbody > tr > td:last-child) {
  width: 30px !important;
  min-width: 30px !important;
  max-width: 30px !important;
  padding: 0 !important;
}

@media screen and (max-width: 1024px) {
  .datatable:deep(table > tbody > tr > td:nth-child(1)),
  .datatable:deep(table > thead > tr > th:nth-child(1)),
  .datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
  .datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
    min-width: 260px !important;
  }
  .datatable:deep(table > tbody > tr > td:nth-child(2)),
  .datatable:deep(table > thead > tr > th:nth-child(2)),
  .datatable:deep(table > tbody > tr > td.fixed:nth-child(2)),
  .datatable:deep(table > thead > tr > th.fixed:nth-child(2)) {
    min-width: 150px !important;
  }
  .datatable:deep(table > tbody > tr > td:nth-child(3)),
  .datatable:deep(table > thead > tr > th:nth-child(3)),
  .datatable:deep(table > tbody > tr > td.fixed:nth-child(3)),
  .datatable:deep(table > thead > tr > th.fixed:nth-child(3)) {
    min-width: 100px !important;
  }
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

/* Test classes for input */

.tf-unit {
  height: 42px;
  min-width: 60px;
}

.tf-price {
  height: 40px;
  min-width: 98px;
}

/* Common height styling for both tf-unit and tf-price */
.tf-unit:deep(.v-field__input),
.tf-price:deep(.v-field__input) {
  padding-block: 0px !important;
  min-height: 41px !important;
}

.tf-unit:deep(.v-field),
.tf-price:deep(.v-field) {
  height: 40px !important;
  min-height: 40px !important;
}

.tf-unit:deep(.v-input__control),
.tf-price:deep(.v-input__control) {
  height: 40px !important;
  min-height: 40px !important;
}

.tf-price:deep(.v-field__overlay) {
  border-radius: 0px 4px 4px 0px;
}

.tf-unit:deep(.v-input__control) {
  background-color: rgb(var(--v-theme-grey-ligthen-3));
  border-radius: 4px 0 0 4px;
  border: solid 1px rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.tf-unit:deep(.v-field__overlay) {
  border-radius: 4px 0 0 4px;
  border-bottom: solid 1px rgb(var(--v-theme-grey-ligthen-2)) !important;
}
.v-text-field:deep(.v-field--no-label input),
.v-text-field .v-field--active:deep(input) {
  border-radius: 0 0 0 0px;
  text-align: center !important;
  font-weight: bold;
  border-right: solid 1px rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-top: solid 1px rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-bottom: solid 1px rgb(var(--v-theme-grey-ligthen-2)) !important;
  field-sizing: content;
}

.datatable:deep(.v-field__input) {
  padding-inline: 8px !important;
  padding-block: 0px !important;
}

/* Supplier column truncation */
.datatable:deep(table > thead > tr > th:nth-child(n + 4)) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 160px;
}

.truncated-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
  width: 100%;
  max-width: 160px;
}
</style>
