<template>
  <!-- Handle multiple line items for English and sealed-bid auctions -->
  <template v-if="isMultipleLineItems">
    <tr
      v-for="(supply, index) in multiSupply"
      :key="index"
      :class="`${index !== multiSupply.length - 1 ? 'border-bottom-light' : ''}`"
    >
      <td>
        <!-- Only show lot name on first row -->
        <span v-if="index === 0">{{ auctionData?.lot_name }}</span>
      </td>
      <td>
        <div class="text-truncate">
          <span>{{ supply?.name }}</span>
          <v-tooltip
            v-if="supply?.name?.length > 18"
            activator="parent"
            location="top start"
            content-class="bg-white text-black border text-body-2"
          >
            <span>{{ supply?.name }}</span>
          </v-tooltip>
        </div>
      </td>
      <td>
        <div class="text-truncate">
          <span>{{ supply?.quantity }} {{ supply?.unit }}</span>
          <v-tooltip
            v-if="`${supply?.quantity} ${supply?.unit}`?.length > 18"
            activator="parent"
            location="top start"
            content-class="bg-white text-black border text-body-2"
          >
            <span>{{ supply?.quantity }} {{ supply?.unit }}</span>
          </v-tooltip>
        </div>
      </td>
      <td>
        <div class="text-truncate">
          <span>{{
            formatNumber(supply?.supplies_sellers[0]?.ceiling, 'currency', auctionData?.currency)
          }}</span>
          <v-tooltip
            v-if="
              formatNumber(supply?.supplies_sellers[0]?.ceiling, 'currency', auctionData?.currency)
                ?.length > 18
            "
            activator="parent"
            location="top start"
            content-class="bg-white text-black border text-body-2"
          >
            <span>{{
              formatNumber(supply?.supplies_sellers[0]?.ceiling, 'currency', auctionData?.currency)
            }}</span>
          </v-tooltip>
        </div>
      </td>
      <td>
        <!-- Only show eAuction time on first row -->
        <span v-if="index === 0">{{ duration.humanize() }}+ overtime</span>
      </td>
    </tr>
  </template>

  <!-- Handle single line items for Dutch and Japanese auctions -->
  <tr v-else>
    <td v-for="(column, index) in columnText" :key="index">
      <div class="text-truncate">
        <span v-html="column.value" />
        <v-tooltip
          v-if="column.value?.length > 18"
          activator="parent"
          location="top start"
          content-class="bg-white text-black border text-body-2"
        >
          <span>
            {{ column.value }}
          </span>
        </v-tooltip>
      </div>
    </td>
  </tr>
</template>

<script setup>
const { auctionId, auctionType } = defineProps(['auctionId', 'auctionType'])

const { auction: auctionData } = await useUserAuctionBids({ auctionId })

const { t } = useTranslations()

// Get all supplies for this auction
const multiSupply = computed(() => {
  return auctionData.value?.supplies || []
})

const decrementType = computed(() => {
  if (auctionData.value?.min_bid_decr_type === '%') {
    return '%'
  } else {
    return auctionData.value?.currency
  }
})

const { startingPrice, endingPrice, maxNbRounds } = useDutchRounds(auctionData)
const { duration } = useAuctionTimer(auctionData)

// Check if this auction type has multiple line items
const isMultipleLineItems = computed(() => {
  return auctionType === 'english' || auctionType === 'sealed-bid'
})

// For Dutch and Japanese auctions, we still need the columnText computed property
const columnText = computed(() => {
  if (auctionType === 'dutch') {
    const supply = auctionData.value?.supplies[0] || {
      name: '',
      quantity: '',
      unit: '',
      supplies_sellers: []
    }
    return [
      {
        value: auctionData.value?.lot_name
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.startingPrice`),
        value: formatNumber(startingPrice.value, 'currency', auctionData.value?.currency)
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.roundNumber`),
        value: maxNbRounds.value
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.quantity`),
        value: supply?.quantity + ' ' + supply?.unit
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.roundIncrement`),
        value: formatNumber(auctionData.value?.min_bid_decr) + ' ' + decrementType.value
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.eAuctionTime`),
        value: duration.value.humanize()
      }
    ]
  } else if (auctionType === 'japanese') {
    const supply = auctionData.value?.supplies[0] || {
      name: '',
      quantity: '',
      unit: '',
      supplies_sellers: []
    }
    return [
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.lot`),
        value: supply.name
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.startingPrice`),
        value: formatNumber(endingPrice.value, 'currency', auctionData.value?.currency)
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.roundNumber`),
        value: maxNbRounds.value
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.quantity`),
        value: supply.quantity + ' ' + supply.unit
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.roundIncrement`),
        value: formatNumber(auctionData.value?.min_bid_decr) + ' ' + decrementType.value
      },
      {
        text: t(`auctionDescriptions.${auctionType}.examplePanel.eAuctionTime`),
        value: duration.value.humanize()
      }
    ]
  } else {
    return []
  }
})
</script>
<style scoped>
.border-bottom-light > td {
  border-bottom: 1px solid rgba(233, 234, 236, 1) !important;
}
td {
  padding: 10px 0px !important;
}
</style>
