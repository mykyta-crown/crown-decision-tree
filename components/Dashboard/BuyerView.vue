<template>
  <v-row>
    <v-col cols="9">
      <v-row>
        <v-col v-if="profile.role === 'super_buyer'" cols="4">
          <DashboardInfoCard
            icon-color="orange-light"
            :label="t('cards.superBuyers')"
            :custom-icon="true"
            :number="superBuyers.length"
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
        <v-col v-if="profile.role === 'super_buyer'" cols="4">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="purple"
            :label="t('cards.buyers')"
            :number="buyers.length"
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
        <v-col :cols="profile.role === 'super_buyer' ? 4 : 6">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="yellow"
            label="Suppliers"
            :number="suppliers.length"
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
        <v-col :cols="profile.role === 'super_buyer' ? 4 : 6">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="blue-light"
            :label="profile.companies.country"
            :number="profile.companies.name"
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
        <v-col :cols="profile.role === 'super_buyer' ? 4 : 6">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="green-light"
            :label="t('cards.plannedAuctions')"
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
        <v-col :cols="profile.role === 'super_buyer' ? 4 : 6">
          <DashboardInfoCard
            :custom-icon="true"
            icon-color="pink"
            :label="t('cards.doneAuctions')"
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
    <v-col cols="3">
      <DashboardAuctionsCountCard :company-id="profile.company_id" />
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" md="4">
      <DashboardCard :title="t('calendar.title')">
        <DashboardCalendar v-model="currentDisplayedDate" />
      </DashboardCard>
    </v-col>
    <v-col cols="12" md="4">
      <DashboardCard :title="t('savings.title')" class="fill-height">
        <template #title-content>
          <DashboardDateDropdownMenu v-model="savingsSelectedDate" />
        </template>
        <DashboardSavingsChart v-model="savingsSelectedDate" :company-id="profile.company_id" />
      </DashboardCard>
    </v-col>
    <v-col cols="12" md="4">
      <DashboardCard title="eAuction type" class="fill-height">
        <template #title-content>
          <DashboardDateDropdownMenu v-model="typesSelectedDate" />
        </template>
        <DashboardAuctionsTypesChart v-model="typesSelectedDate" :company-id="profile.company_id" />
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
import { uniq } from 'lodash'

// Use translations
const { t } = useTranslations()

const { profile } = useUser()

console.log(profile)

const currentDisplayedDate = ref(dayjs().toISOString())
const supabase = useSupabaseClient()

const { data: profiles } = await supabase
  .from('profiles')
  .select('*, companies(*)')
  .in('role', ['super_buyer', 'buyer', 'supplier'])
const superBuyers = profiles.filter((p) => p.role === 'super_buyer')
const buyers = profiles.filter((p) => p.role === 'buyer')
const suppliers = profiles.filter((p) => p.role === 'supplier')

const savingsSelectedDate = ref(null)
const typesSelectedDate = ref(null)

const nbPassedAuctions = ref(0)
const nbPlannedAuctions = ref(0)

const auctionsQuery = supabase
  .from('auctions')
  .select('auctions_group_settings_id, start_at, end_at')
  .eq('deleted', false)
  .eq('published', true)
  .eq('usage', 'real')

const { data: auctions } = await auctionsQuery

const passedAuctions = auctions.filter((a) => dayjs(a.end_at).isBefore(dayjs()))
const plannedAuctions = auctions.filter((a) => dayjs(a.start_at).isAfter(dayjs()))

nbPassedAuctions.value = uniq(passedAuctions.map((a) => a.auctions_group_settings_id)).length
nbPlannedAuctions.value = uniq(plannedAuctions.map((a) => a.auctions_group_settings_id)).length
</script>
