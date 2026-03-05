<template>
  <AuctionsLogsItemsTableRow :custom-icon="true" color="primary">
    <template #custom-icon>
      <v-img
        src="@/assets/icons/activity-log/information-square.svg"
        width="20"
        height="20"
        style="filter: brightness(0)"
      />
    </template>
    {{ t('activityLog.yourCeilingPriceIs') }}{{ ' ' }}
    <span class="text-primary">{{
      formatNumber(ownCeilingPrice, 'currency', auction.value.currency)
    }}</span>
    <v-tooltip
      activator="parent"
      location="top start"
      content-class="bg-white text-black border text-body-2"
    >
      {{ t('activityLog.yourCeilingPriceIs') }}{{ ' ' }}
      <span class="text-primary">{{
        formatNumber(ownCeilingPrice, 'currency', auction.value.currency)
      }}</span>
    </v-tooltip>
  </AuctionsLogsItemsTableRow>
</template>

<script setup>
const props = defineProps(['auction'])
const { t } = useTranslations()
const ownCeilingPrice = computed(() => {
  return props.auction.value.supplies.reduce((acc, supply) => {
    return acc + supply.quantity * supply.supplies_sellers[0].ceiling
  }, 0)
})
</script>
