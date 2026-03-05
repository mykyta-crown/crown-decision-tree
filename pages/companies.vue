<template>
  <v-container class="px-lg-15" fluid>
    <v-row class="my-6 align-center">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div class="text-h4">
          Companies
          <v-chip
            tile
            variant="text"
            class="ml-2 bg-purple rounded justify-center text-h6 font-weight-bold text-black"
            label
          >
            {{ filteredCompanies.length }}
          </v-chip>
        </div>
        <!--
        <v-text-field
          v-model="search"
          placeholder="Enter company name"
          variant="outlined"
          hide-details
          style="width: 285px; max-width: 285px; flex-shrink: 0"
        >
          <template #prepend-inner>
            <v-img src="@/assets/icons/basic/Search.svg" width="20" height="20" />
          </template>
        </v-text-field>
        -->
        <v-btn color="primary" class="text-white" @click="onCreateCompany"> Create Company </v-btn>
      </v-col>
    </v-row>

    <!-- Table Header -->
    <CompanyRowLayout />

    <!-- Table Rows -->
    <CompanyRow v-for="company in filteredCompanies" :key="company.id" :company="company" />
    <CompanyEditDialog v-model="showCompanyDialog" />
  </v-container>
</template>

<script setup>
import CompanyRowLayout from '@/components/Companies/CompanyRowLayout.vue'
import CompanyRow from '@/components/Companies/CompanyRow.vue'
import CompanyEditDialog from '@/components/Companies/CompanyEditDialog.vue'

const search = ref('')
const showCompanyDialog = ref(false)

const { subscribedData: companies, fetchData: fetchCompanies } = useRealtime({
  table: 'companies'
})

onMounted(fetchCompanies)

const filteredCompanies = computed(() => {
  if (!search.value) {
    return companies.value
      .slice()
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }

  const searchValue = search.value.toLowerCase()
  return companies.value
    .filter((c) => c.name.toLowerCase().includes(searchValue))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
})

function onCreateCompany() {
  showCompanyDialog.value = true
}
</script>
