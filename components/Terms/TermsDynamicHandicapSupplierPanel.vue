<template>
  <v-container class="bg-white border rounded-lg mb-2 px-10 py-8">
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-4">
        {{ t('dynamicHandicapPanel.title') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col
        v-for="(handicapGroup, groupName, index) in handicapsGroups"
        :key="groupName"
        cols="4"
        class="supplier-column"
      >
        <div :class="index === 0 ? 'mr-10' : 'ml-10'">
          <v-sheet
            :color="colorClasses[index % colorClasses.length]"
            class="text-body-1 text-black font-weight-bold mb-4 text-center pa-2"
            rounded="lg"
          >
            {{ groupName }}
          </v-sheet>

          <v-table density="compact">
            <thead class="text-grey">
              <tr>
                <th class="name-field pl-0">Option</th>
                <th class="text-right handicap-field pr-0">Handicap</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="handicap in handicapGroup" :key="handicap.id">
                <td class="pl-0">
                  <span class="name-field">{{ handicap.option_name }}</span>
                </td>
                <td class="text-right pr-0">
                  <span class="handicap-field">{{ formatNumber(handicap.amount) }}</span>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>
        <v-divider
          v-if="index !== Object.keys(handicapsGroups).length - 1"
          color="grey-lighten-2"
          class="supplier-divider"
          vertical
        />
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

const handicapsGroups = computed(() => {
  return groupBy(handicaps, 'group_name')
})

const colorClasses = ['orange-light', 'blue', 'green-light', 'purple']
</script>
<style>
.supplier-column {
  position: relative;
  padding: 0 16px;
}

.supplier-divider {
  position: absolute;
  right: 0;
  top: 0;
  height: 100%;
}
</style>
