<template>
  <v-table fixed-header class="leaders-table px-4" density="compact">
    <thead class="text-body-2">
      <tr class="text-grey">
        <th class="text-left text-no-wrap">
          {{ t('dutch.suppliesBidsTable.lineItem') }}
        </th>
        <th v-if="props.showRank" class="text-center" style="width: 70px">
          {{ t('dutch.suppliesBidsTable.rank') }}
        </th>
        <th class="text-left">
          {{ t('dutch.suppliesBidsTable.unit') }}
        </th>
        <th class="text-left" style="width: 58px">
          {{ t('dutch.suppliesBidsTable.quantity') }}
        </th>
        <th class="text-left text-no-wrap" style="width: 58px">
          {{ t('dutch.suppliesBidsTable.pricePerUnit') }}
        </th>
        <th class="text-right" style="width: 110px">
          {{ t('dutch.suppliesBidsTable.total') }}
        </th>
      </tr>
    </thead>
    <tbody v-if="linesItemsBids">
      <AuctionsSuppliesBidsTableRow
        v-for="lineItemBid in linesItemsBids"
        :key="lineItemBid.id"
        :line-item-bid="lineItemBid"
        :mode="props.mode"
        :can-select-rounds="canSelectRounds"
        :show-rank="props.showRank"
        :seller-id="props.sellerId"
        :highlight-input="props.highlightInput"
        @prebid-updated="handlePrebidUpdated"
      />
    </tbody>
  </v-table>
</template>
<script setup>
const props = defineProps({
  linesItemsBids: {
    type: Array,
    default: () => []
  },
  mode: {
    type: String,
    default: 'read'
  },
  canSelectRounds: {
    type: Array,
    default: () => []
  },
  showRank: {
    type: Boolean,
    default: false
  },
  sellerId: {
    type: String,
    default: null
  },
  highlightInput: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['prebidUpdated'])
const { t } = useTranslations()
const lineItemsPrebids = ref([])

const handlePrebidUpdated = (newVal) => {
  const index = lineItemsPrebids.value.findIndex((item) => item.id === newVal.id)
  if (index !== -1) {
    lineItemsPrebids.value[index] = newVal
  } else {
    lineItemsPrebids.value.push(newVal)
  }
  emit('prebidUpdated', lineItemsPrebids.value)
}

// const handlePrebidUpdated = (newVal) => {
//   console.log('newVal handlePrebidUpdated: ', newVal)
//   emit('prebidUpdated', newVal)
// }
</script>

<style scoped>
/* Force table to use fixed layout for consistent column widths */
.leaders-table {
  table-layout: fixed !important;
  width: 100%;
  overflow: hidden;
}

th {
  box-shadow: none !important;
  padding-left: 0px !important;
  padding-right: 12px !important;
}

.leaders-table th:last-child {
  padding-right: 0px !important;
}

.leaders-table th,
.leaders-table td {
  white-space: nowrap; /* Prevent text from wrapping */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Remove horizontal scrollbar styling since we don't want scrolling */
.max-tr-height:deep(th) {
  height: 20px !important;
}
</style>
