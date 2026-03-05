<template>
  <v-table fixed-header class="overflow-auto leaders-table">
    <thead>
      <tr class="text-grey">
        <th class="text-left">
          {{ t('dutch.suppliesBidsTable.lineItem') }}
        </th>
        <th class="text-left">
          {{ t('dutch.suppliesBidsTable.unit') }}
        </th>
        <th class="text-center">
          {{ t('dutch.suppliesBidsTable.quantity') }}
        </th>
        <th class="text-center">
          {{ t('dutch.suppliesBidsTable.pricePerUnit') }}
        </th>
        <th class="text-right">
          {{ t('dutch.suppliesBidsTable.total') }}
        </th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="text-left">
          {{ auction.supplies[0].name }}
        </td>
        <td class="text-left">
          {{ auction.supplies[0].unit }}
        </td>
        <td class="text-center">
          {{ auction.supplies[0].quantity }}
        </td>
        <td class="text-center">
          <template v-if="props.mode === 'prebid-form'">
            <v-select
              bg-color="grey-ligthen-3"
              density="compact"
              hide-details
              :items="canSelectRounds"
            />
          </template>
          <template v-else>
            {{ unitPrice }}
          </template>
        </td>
        <td class="text-right">
          <span class="font-weight-bold">{{ totalFormating.value }} </span>
          {{ totalFormating.currency }}
          <span />
        </td>
      </tr>
    </tbody>
  </v-table>
</template>

<script setup>
const props = defineProps({
  mode: {
    type: String,
    default: 'read'
  }
})
const { t } = useTranslations()
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { ceilingPrice } = useCeilingPrice(route.params.auctionId)

const { activeRound, rounds, endingPrice } = useDutchRounds(auction)

const unitPrice = computed(() => {
  return (activeRound.value?.price || ceilingPrice.value) / auction.value.supplies[0].quantity
})

const canSelectRounds = computed(() => {
  return rounds.value.filter((e) => e).map((e) => e.priceByUnit)
})

const totalFormating = computed(() => {
  // console.log('activeRound: ', activeRound.value)
  return formatNumber(endingPrice?.value, 'currency', auction?.value.currency, 1, 2, true)
})
</script>

<style scoped>
th {
  box-shadow: none !important;
}
</style>
