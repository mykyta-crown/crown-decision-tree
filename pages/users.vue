<template>
  <v-container class="px-5 pb-10" :fluid="width < 1440">
    <v-row align="center">
      <v-col cols="12" class="d-flex align-center justify-space-between">
        <div class="text-h4">
          {{ tabs !== 6 ? t('title') : 'Companies' }}
          <v-chip
            label
            tile
            variant="text"
            class="ml-2 rounded-lg justify-center text-h6 font-weight-bold text-black"
            :class="`bg-${tabsColors[tabs]}`"
          >
            {{ nbUsers }}
          </v-chip>
        </div>
        <v-text-field
          v-model="search"
          :placeholder="tabs !== 6 ? t('userManagement.search') : 'Enter company name'"
          variant="outlined"
          hide-details
          style="width: 285px; max-width: 285px; flex-shrink: 0"
        >
          <template #prepend-inner>
            <v-img src="@/assets/icons/basic/Search.svg" width="20" height="20" />
          </template>
        </v-text-field>
        <div class="d-flex ga-2">
          <v-btn-primary v-if="tabs !== 6" disabled class="px-8" width="183" height="40">
            Invite User
          </v-btn-primary>
          <v-btn-primary v-else class="text-white" width="183" height="40" @click="onCreateCompany">
            Create Company
          </v-btn-primary>
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12" class="pb-0">
        <v-tabs
          v-model="tabs"
          density="compact"
          hide-slider
          :selected-class="`bg-${tabsColors[tabs]} font-weight-bold`"
        >
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            :value="1"
          >
            {{ t('userManagement.tabs.newUsers') }}
          </v-tab>
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            :value="2"
          >
            {{ t('userManagement.tabs.admins') }}
          </v-tab>
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            :value="3"
          >
            {{ t('userManagement.tabs.buyers') }}
          </v-tab>
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            :value="4"
          >
            {{ t('userManagement.tabs.superBuyers') }}
          </v-tab>
          <v-tab
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            :value="5"
          >
            {{ t('userManagement.tabs.suppliers') }}
          </v-tab>
          <v-tab
            v-if="isAdmin"
            class="custom-tab-border text-black font-weight-regular mr-1"
            style="background-color: #ffffff00"
            :value="6"
          >
            {{ t('userManagement.tabs.companies') }}
          </v-tab>
        </v-tabs>
      </v-col>
      <v-col cols="12" class="pt-0">
        <v-tabs-window v-model="tabs">
          <v-tabs-window-item :value="1">
            <v-row>
              <v-col cols="12">
                <UserManagementProfilesDataTable :profiles="newUsers" />
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="2">
            <v-row>
              <v-col cols="12">
                <UserManagementProfilesDataTable :profiles="admins" />
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="3">
            <v-row>
              <v-col cols="12">
                <UserManagementProfilesDataTable :profiles="buyers" />
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="4">
            <v-row>
              <v-col cols="12">
                <UserManagementProfilesDataTable :profiles="superBuyers" />
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="5">
            <v-row>
              <v-col cols="12">
                <UserManagementProfilesDataTable :profiles="sellers" />
              </v-col>
            </v-row>
          </v-tabs-window-item>
          <v-tabs-window-item :value="6">
            <v-row>
              <v-col cols="12">
                <UserManagementCompaniesDataTable
                  :search="search"
                  :companies="processedCompanies"
                  @refetch-data="refresh"
                  @open-edit-dialog="handleOpenEditModal"
                />
              </v-col>
            </v-row>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>

    <CompanyEditDialog v-model="showCompanyDialog" :company="selectedCompany" />
  </v-container>
</template>

<script setup>
import CompanyEditDialog from '@/components/Companies/CompanyEditDialog.vue'
import { useAsyncData } from 'nuxt/app'
// Use translations
const { t } = useTranslations()

const { isAdmin } = useUser()
const { width } = useDisplay()

const supabase = useSupabaseClient()
// This uses the policies as a filter. It's not a good practice.
// But I don't see an other way to improve it for now.
const route = useRoute()
const { subscribedData: profiles, fetchData: fetchProfiles } = useRealtime({
  table: 'profiles'
})

const { data: companies, refresh } = await useAsyncData('companies-list', async () => {
  const { data } = await supabase
    .from('companies')
    .select('*,profiles(role, is_active, company_id)')
    .order('name', { ascending: true })
  return data
})

const enrichedProfiles = computed(() => {
  return profiles.value
    .filter((profile) => !profile.is_deleted)
    .map((profile) => {
      return {
        ...profile,
        companies: companies.value.find((company) => company.id === profile.company_id)
      }
    })
})

onMounted(fetchProfiles)

const tabByUserType = {
  buyer: 3,
  super_buyer: 4,
  supplier: 5
}

const tabs = ref(1)

watch(
  () => [route.query.type, route.query.company],
  () => {
    tabs.value = tabByUserType[route.query.type] ?? 1
  },
  { immediate: true }
)

const search = ref('')

const searchedProfiles = computed(() => {
  let filteredProfiles = enrichedProfiles.value.map((p) => {
    return { ...p }
  })

  if (route.query.company) {
    filteredProfiles = filteredProfiles.filter((profile) => {
      return profile.company_id === route.query.company
    })
  }

  if (search.value === '') {
    return filteredProfiles
  }

  return filteredProfiles.filter((profile) => {
    const searchString = [
      profile.first_name,
      profile.last_name,
      profile.email,
      profile.companies?.name
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    return searchString.includes(search.value.toLowerCase())
  })
})

const newUsers = computed(() => {
  return searchedProfiles.value.filter((profile) => {
    return !profile.role && profile.admin === false
  })
})

const admins = computed(() => {
  return searchedProfiles.value.filter((profile) => {
    return profile.admin === true
  })
})

const buyers = computed(() => {
  return searchedProfiles.value.filter((profile) => {
    return profile.role === 'buyer'
  })
})

const superBuyers = computed(() => {
  return searchedProfiles.value.filter((profile) => {
    return profile.role === 'super_buyer'
  })
})

const sellers = computed(() => {
  return searchedProfiles.value.filter((profile) => {
    return profile.role === 'supplier'
  })
})

const tabsColors = {
  1: 'purple',
  2: 'yellow-lighten-1',
  3: 'sky',
  4: 'sky',
  5: 'orange-light-2',
  6: 'green-light'
}

const nbUsers = computed(() => {
  const countByType = {
    1: newUsers.value.length,
    2: admins.value.length,
    3: buyers.value.length,
    4: superBuyers.value.length,
    5: sellers.value.length,
    6: companies.value.length
  }

  return countByType[tabs.value]
})

const processedCompanies = computed(() => {
  if (!companies.value) return []
  return companies.value.map((company) => {
    let buyerCount = 0
    let superBuyerCount = 0
    let supplierCount = 0
    let isActive = false

    if (company.profiles && company.profiles.length > 0) {
      company.profiles.forEach((profile) => {
        switch (profile.role) {
          case 'buyer':
            buyerCount++
            break
          case 'super_buyer':
            superBuyerCount++
            break
          case 'supplier':
            supplierCount++
            break
        }

        if (profile.role && profile.role !== 'admin' && profile.is_active) {
          isActive = true
        }
      })
    }

    return {
      ...company,
      buyers: buyerCount,
      superBuyers: superBuyerCount,
      suppliers: supplierCount,
      isActive
    }
  })
})

const showCompanyDialog = ref(false)
const selectedCompany = ref(null)

function onCreateCompany() {
  selectedCompany.value = null
  showCompanyDialog.value = true
}

function handleOpenEditModal(company) {
  selectedCompany.value = company
  showCompanyDialog.value = true
}
</script>

<style scoped>
.custom-tab-border {
  border-radius: 4px 4px 0 0 !important;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2)) !important;
  border-bottom: none !important;
  background: white;
}
</style>
