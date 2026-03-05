<template>
  <v-card class="mb-1">
    <v-card-title class="px-10 pt-8">
      <div class="text-h6 font-weight-semibold">
        {{ t('lots.lotSuppliers') }}
      </div>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row v-if="suppliers?.length > 0">
          <v-col
            v-for="(supplier, i) in suppliers"
            :key="supplier.email"
            cols="6"
            md="4"
            class="my-0 py-0"
          >
            <v-checkbox
              v-model="model.suppliers"
              :value="suppliersEmail[i]"
              density="compact"
              hide-details
              class="text-body-1 text"
            >
              <template #label>
                <div class="text-body-1 pl-1">
                  {{ supplier.company || supplier.email }}
                </div>
              </template>
            </v-checkbox>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col cols="12">
            <v-alert outlined icon="mdi-alert" class="d-flex justify-center">
              {{ t('lots.addSuppliersToLot') }}
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup>
const props = defineProps(['suppliers'])
const model = defineModel()

// Use translations
const { t } = useTranslations()

const suppliersEmail = computed(() =>
  props.suppliers.map((supplier) => {
    return { email: supplier.email }
  })
)

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
</script>
<style scoped>
.text:deep(input) {
  color: red !important;
}
</style>
