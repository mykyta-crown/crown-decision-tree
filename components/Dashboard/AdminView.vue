<template>
  <v-row>
    <v-col cols="12" md="9">
      <v-row>
        <v-col cols="6" md="4">
          <DashboardInfoCard
            icon-color="orange-light"
            :label="t('common.superBuyers')"
            :custom-icon="true"
            :number="currentCompanySuperBuyers.length"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/super-buyer.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>
        <v-col cols="6" md="4">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="purple"
            :label="t('common.buyers')"
            :number="currentCompanyBuyers.length"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/Buyer.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>
        <v-col cols="6" md="4">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="yellow"
            :label="t('common.suppliers')"
            :number="currentSuppliers.length"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/Supplier.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>
        <v-col cols="6" md="4">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="blue-light"
            :label="!selectedCompany ? t('common.companies') : `${selectedCompany.country}`"
            :number="!selectedCompany ? buyersCompanies.length : selectedCompany?.name"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/companies.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>
        <v-col cols="6" md="4">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="green-light"
            :label="t('common.plannedAuctions')"
            :number="nbPlannedAuctions"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/Planned eAuction.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>
        <v-col cols="6" md="4">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="pink"
            :label="t('common.finishedAuctions')"
            :number="nbPassedAuctions"
          >
            <template #custom-icon>
              <v-img
                src="@/assets/icons/dashboard/Done eAuction.svg"
                width="20"
                height="20"
                style="filter: brightness(0)"
              />
            </template>
          </DashboardInfoCard>
        </v-col>
      </v-row>
    </v-col>

    <v-col cols="12" md="3">
      <DashboardAuctionsCountCard :company-id="route.query.company" />
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="4">
      <DashboardCard :title="t('calendar.title')">
        <DashboardCalendar v-model="currentDisplayedDate" />
      </DashboardCard>
    </v-col>
    <v-col cols="12" md="4">
      <DashboardCard :title="t('savings.title')">
        <template #title-content>
          <DashboardDateDropdownMenu v-model="savingsSelectedDate" />
        </template>
        <DashboardSavingsChart
          v-model="savingsSelectedDate"
          :company-id="route.query.company"
          :companies="buyersCompanies"
          :buyers="currentCompanyBuyers"
        />
      </DashboardCard>
    </v-col>
    <v-col cols="12" md="4">
      <DashboardCard :title="t('auctionTypes.title')" class="fill-height">
        <template #title-content>
          <DashboardDateDropdownMenu v-model="typesSelectedDate" />
        </template>
        <DashboardAuctionsTypesChart
          v-model="typesSelectedDate"
          :company-id="route.query.company"
        />
      </DashboardCard>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12">
      <DashboardDataTabs />
    </v-col>
  </v-row>
</template>
<script setup>
import dayjs from 'dayjs'
import { uniq, uniqBy } from 'lodash'
const supabase = useSupabaseClient()
const route = useRoute()
const { t } = useTranslations()

const { data: profiles } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in('role', ['super_buyer', 'buyer', 'supplier'])
const superBuyers = profiles.filter((p) => p.role === 'super_buyer')
const buyers = profiles.filter((p) => p.role === 'buyer')
const allBuyers = [...superBuyers, ...buyers]

// Dédupliquer par nom (case-insensitive) pour éviter les doublons visuels
const buyersCompanies = ref(
  uniqBy(
    allBuyers.map((b) => b.companies),
    (c) => c?.name?.toLowerCase()
  )
)

const suppliers = profiles.filter((p) => p.role === 'supplier')

const { data: buyersSuppliers } = await supabase
  .from('user_suppliers_view')
  .select('*')
  .in(
    'user_id',
    allBuyers.map((b) => b.id)
  )

const currentDisplayedDate = ref(dayjs().toISOString())

const savingsSelectedDate = ref(null)
const typesSelectedDate = ref(null)

const selectedCompany = computed(() => {
  if (route.query.company) {
    return buyersCompanies.value.find((c) => c.id === route.query.company)
  } else {
    return null
  }
})

const currentCompanySuperBuyers = computed(() => {
  return superBuyers.filter((b) =>
    route.query.company ? b.companies.id === route.query.company : true
  )
})

const currentCompanyBuyers = computed(() => {
  return buyers.filter((b) => (route.query.company ? b.companies.id === route.query.company : true))
})

const currentSuppliers = computed(() => {
  const suppliersProfiles = []

  buyersSuppliers.forEach(({ user_id, supplier_email }) => {
    const buyer = currentCompanyBuyers.value.find((b) => b.id === user_id)
    if (buyer) {
      const supplierProfile = suppliers.find((s) => s.email === supplier_email)
      if (supplierProfile) {
        suppliersProfiles.push(supplierProfile)
      }
    }
  })

  return suppliersProfiles
})

const nbPassedAuctions = ref(0)
const nbPlannedAuctions = ref(0)

watch(
  () => route.query.company,
  async (newCompany) => {
    const auctionsQuery = supabase
      .from('auctions')
      .select('auctions_group_settings_id, start_at, end_at')
      .eq('deleted', false)
      .eq('published', true)
      .eq('usage', 'real')

    if (newCompany) {
      auctionsQuery.eq('company_id', newCompany)
    }

    const { data: auctions } = await auctionsQuery

    const passedAuctions = auctions.filter((a) => dayjs(a.end_at).isBefore(dayjs()))
    const plannedAuctions = auctions.filter((a) => dayjs(a.start_at).isAfter(dayjs()))

    nbPassedAuctions.value = uniq(passedAuctions.map((a) => a.auctions_group_settings_id)).length
    nbPlannedAuctions.value = uniq(plannedAuctions.map((a) => a.auctions_group_settings_id)).length
  },
  { immediate: true }
)
</script>
