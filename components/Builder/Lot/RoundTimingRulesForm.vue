<template>
  <v-card class="mb-1">
    <v-card-title class="px-10 pt-8">
      <div class="text-h6 font-weight-semibold">
        {{ t('lots.preferredSuppliersTitle') }}
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
              hide-default-footer
            >
              <!-- Headers -->
              <template #[`header.label`]="{ column }">
                <span class="truncated-text">
                  {{ column.title }}
                </span>
              </template>
              <template
                v-for="supplier in sortedSuppliers"
                :key="`header_${supplier.email}`"
                #[`header.${supplier.email}`]
              >
                <div class="bg-yellow-lighten-2 font-weight-bold truncated-text">
                  {{ getCompanyName(supplier.email) }}
                </div>
              </template>

              <!-- Body cells - 3 columns to match CeilingPriceForm -->
              <template #item.label_col1>
                <div class="py-3 px-2 font-weight-regular">
                  {{ t('lots.preferredSuppliersTableRowTitle') }}
                </div>
              </template>
              <template #item.label_col2>
                <div />
              </template>
              <template #item.label_col3>
                <div />
              </template>

              <template
                v-for="supplier in sortedSuppliers"
                :key="`item_${supplier.email}`"
                #[`item.${supplier.email}`]
              >
                <div class="d-flex align-center justify-center">
                  <v-text-field
                    v-model="suppliersTimePerRound[supplier.email]"
                    type="number"
                    class="my-2 not-centered"
                    hide-details
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
import { computed, ref, watch } from 'vue'

const props = defineProps({
  suppliers: { type: Array, required: true }
})

// Use translations
const { t } = useTranslations()

const model = defineModel()

// console.log('model', model.value)
// Sort model.suppliers to match props.suppliers order for column alignment
const sortedSuppliers = computed(() => {
  if (!model.value.suppliers || !props.suppliers) return []
  const propsOrder = props.suppliers.map((s) => s.email)
  return [...model.value.suppliers].sort((a, b) => {
    return propsOrder.indexOf(a.email) - propsOrder.indexOf(b.email)
  })
})

const headers = computed(() => {
  // Use 3 columns to match CeilingPriceForm's structure for alignment
  const base = [
    {
      title: t('lots.preferredSuppliersTableTitle'),
      value: 'label_col1',
      align: 'start fixed',
      width: 217
    },
    {
      title: '',
      value: 'label_col2',
      align: 'start fixed',
      width: 127
    },
    {
      title: '',
      value: 'label_col3',
      align: 'start fixed',
      width: 110
    }
  ]

  const supplierHeaders =
    sortedSuppliers.value?.map((supplier) => ({
      title: getCompanyName(supplier.email),
      value: supplier.email,
      align: 'start fixed',
      width: 250
    })) || []

  return [...base, ...supplierHeaders, { title: '', value: 'spacer', align: 'start', width: 30 }]
})

const getCompanyName = (supplierEmail) => {
  return (
    props.suppliers?.find((supplier) => supplier.email === supplierEmail)?.company || supplierEmail
  )
}

const suppliersTimePerRound = ref({})

if (model.value?.suppliersTimePerRound) {
  model.value.suppliersTimePerRound?.forEach((supplier) => {
    suppliersTimePerRound.value[supplier.email] =
      supplier.time_per_round || model.value.overtime_range * 60
  })
}

watch(
  () => props.suppliers,
  () => {
    if (!props.suppliers) return
    props.suppliers.forEach((supplier) => {
      suppliersTimePerRound.value[supplier.email] =
        suppliersTimePerRound.value[supplier.email] || model.value.overtime_range * 60
    })
  },
  { deep: true, immediate: true }
)

watch(
  () => model.value.overtime_range,
  (newValue) => {
    if (!newValue) return
    const newTime = newValue * 60

    // Update all suppliers' time to match the new round duration
    if (model.value?.suppliers) {
      model.value.suppliers.forEach((supplier) => {
        suppliersTimePerRound.value[supplier.email] = newTime
      })
    }
  },
  { deep: true }
)

watch(
  suppliersTimePerRound,
  () => {
    if (!model.value?.suppliers) return
    model.value.suppliersTimePerRound = model.value.suppliers.map((supplier) => {
      return {
        email: supplier.email,
        time_per_round: suppliersTimePerRound.value[supplier.email]
      }
    })
  },
  { deep: true }
)
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
}

.datatable:deep(table > thead > tr > th) {
  border: none !important;
  height: 36px !important;
}

/* Yellow background for first 3 header columns */
.datatable:deep(table > thead > tr > th:nth-child(1)),
.datatable:deep(table > thead > tr > th:nth-child(2)),
.datatable:deep(table > thead > tr > th:nth-child(3)) {
  background-color: rgb(var(--v-theme-yellow-lighten-2)) !important;
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
  background-color: rgb(var(--v-theme-yellow-lighten-2)) !important;
  padding-inline: 8px;
  margin: 10px 0;
  font-weight: 600;
}

.datatable:deep(table > thead > tr > th:last-child) {
  border-radius: 0 4px 4px 0;
}

.datatable:deep(table > tbody > tr:nth-last-child(2) > td:nth-child(n + 4)) {
  border-bottom: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
}

/* Border-right gap on 3rd column (before suppliers) */
.datatable:deep(table > thead > tr > th:nth-child(3)),
.datatable:deep(table > tbody > tr > td:nth-child(3)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(3)) {
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
  word-wrap: break-word !important;
}

/* Column widths matching CeilingPriceForm: 217px, 127px, 110px */
.datatable:deep(table > tbody > tr > td:nth-child(1)),
.datatable:deep(table > thead > tr > th:nth-child(1)),
.datatable:deep(table > tbody > tr > td.fixed:nth-child(1)),
.datatable:deep(table > thead > tr > th.fixed:nth-child(1)) {
  min-width: 217px !important;
  max-width: 217px !important;
  width: 217px !important;
  padding-left: 0px;
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
  word-wrap: break-word !important;
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
  word-wrap: break-word !important;
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

.v-text-field:not(.not-centered):deep(input) {
  text-align: center !important;
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
