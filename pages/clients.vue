<template>
  <v-container class="px-5 pt-2 pb-10" :fluid="width < 1440">
    <v-row align="center" class="my-1">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div class="text-h4">
          {{ t('title') }}
          <v-chip
            tile
            variant="text"
            class="ml-2 bg-purple rounded justify-center text-h6 font-weight-bold text-black"
            label
          >
            {{ filteredCompanies.length }}
          </v-chip>
        </div>
        <v-text-field
          v-model="search"
          :placeholder="t('forms.placeholders.enterClientName')"
          variant="outlined"
          hide-details
          style="width: 285px; max-width: 285px; flex-shrink: 0"
        >
          <template #prepend-inner>
            <v-img src="@/assets/icons/basic/Search.svg" width="20" height="20" />
          </template>
        </v-text-field>
        <v-btn-primary class="px-10" height="40" @click="onCreateCompany">
          {{ t('buttons.createClient') }}
        </v-btn-primary>
      </v-col>
    </v-row>

    <!-- Table Header -->
    <ClientRowLayout />

    <!-- Table Rows -->
    <ClientRow v-for="company in filteredCompanies" :key="company.id" :company="company" />
    <CompanyEditDialog v-model="showCompanyDialog" />
  </v-container>
</template>

<script setup>
import ClientRowLayout from '@/components/Clients/ClientRowLayout.vue'
import ClientRow from '@/components/Clients/ClientRow.vue'
import CompanyEditDialog from '@/components/Companies/CompanyEditDialog.vue'

// Use translations
const { t } = useTranslations()

const supabase = useSupabaseClient()
const { width } = useDisplay()
const search = ref('')
const showCompanyDialog = ref(false)

const { subscribedData: companies, fetchData: fetchCompanies } = useRealtime({
  table: 'companies'
})

const { data: buyers } = await supabase
  .from('profiles')
  .select('id, company_id, role')
  .in('role', ['buyer', 'super_buyer'])

onMounted(fetchCompanies)

const filteredCompanies = computed(() => {
  let clients = []

  companies.value.forEach((company) => {
    clients.push({
      ...company,
      buyers: buyers.filter((b) => b.company_id === company.id)
    })
  })

  clients = clients.filter((c) => c.buyers.length > 0)

  if (!search.value) {
    return clients.slice().sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
  }

  const searchValue = search.value.toLowerCase()
  return clients
    .filter((c) => c.name.toLowerCase().includes(searchValue))
    .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()))
})

function onCreateCompany() {
  showCompanyDialog.value = true
}
</script>
