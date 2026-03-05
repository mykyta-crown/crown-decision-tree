<template>
  <v-container class="bg-white border rounded-lg mb-2 px-10 py-8">
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('dynamicHandicapPanel.title') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-tabs v-model="tabs" hide-slider class="w-100 mt-4">
          <div
            v-for="(handicapGroup, groupName, i) in handicapsGroups"
            :key="groupName"
            class="d-flex align-center"
          >
            <v-tab
              :value="i"
              class="text-primary rounded-tab d-flex align-center justify-space-between mr-2"
              rounded="0"
              :class="{
                'bg-orange-light': i % 4 === 0,
                'bg-blue': i % 4 === 1,
                'bg-green-light': i % 4 === 2,
                'bg-purple': i % 4 === 3,
                'font-weight-bold': i === tabs
              }"
            >
              <span>
                {{ groupName }}
              </span>
            </v-tab>
          </div>
          <div class="w-100 bg-white">
            <v-spacer />
          </div>
        </v-tabs>
        <v-tabs-window v-model="tabs" class="w-100">
          <v-tabs-window-item
            v-for="(handicapGroup, groupName, i) in handicapsGroups"
            :key="groupName"
            :value="i"
          >
            <TermsSingleHandicap :handicaps="handicapGroup" :suppliers="enrichedSuppliers" />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-col>
    </v-row>
  </v-container>
</template>
<script setup>
import { groupBy } from 'lodash'
const props = defineProps(['suppliers', 'auction'])

const { t } = useTranslations()
const supabase = useSupabaseClient()

const { data: handicaps } = await supabase
  .from('auctions_handicaps')
  .select('*')
  .eq('auction_id', props.auction.id)

const enrichedSuppliers = computed(() => {
  return props.suppliers.map((supplier) => {
    // const sellerProfile = props.auction.auction_sellers.find((auction) => auction.seller_email === supplier.seller_email)
    return {
      ...supplier,
      name: supplier.identifier,
      id: supplier.seller_profile.id
    }
  })
})

const handicapsGroups = computed(() => {
  return groupBy(handicaps, 'group_name')
})

const tabs = ref(0)
</script>
<style>
.rounded-tab {
  border-radius: 4px 4px 0 0 !important;
}
</style>
