<template>
  <v-container class="bg-white border pt-0" fluid>
    <v-row class="my-1 align-center">
      <v-col cols="6">
        <h2 class="text-h4">
          Companies
          <v-chip
            tile
            variant="text"
            class="ml-2 bg-purple rounded justify-center text-h6 font-weight-bold text-black"
            label
          >
            {{ filteredCompanies.length }}
          </v-chip>
        </h2>
      </v-col>
      <v-col cols="6" class="d-flex justify-end align-center">
        <!--
          <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Enter company name"
          variant="outlined"
          hide-details
          class="mr-4"
          style="max-width: 300px;"
          />
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

const props = defineProps({
  search: {
    type: String,
    default: ''
  }
})

const showCompanyDialog = ref(false)

const { subscribedData: companies, fetchData: fetchCompanies } = useRealtime({
  table: 'companies'
})

onMounted(fetchCompanies)

// Convert prop to ref for better reactivity
const searchValue = toRef(props, 'search')

const filteredCompanies = computed(() => {
  if (!searchValue.value) {
    return companies.value
      .slice()
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }

  const search = searchValue.value.toLowerCase()
  return companies.value
    .filter((c) => c.name.toLowerCase().includes(search))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
})

function onCreateCompany() {
  showCompanyDialog.value = true
}
</script>
