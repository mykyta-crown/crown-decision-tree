<template>
  <tr>
    <td class="text-left text-truncate">
      {{ lineItemBid.name }}
      <v-tooltip activator="parent" location="end">
        {{ lineItemBid.name }}
      </v-tooltip>
    </td>
    <td v-if="props.showRank" class="text-center">
      <v-chip
        v-if="supplyRank > 0"
        size="small"
        class="font-weight-bold"
        variant="text"
        :style="{ 'background-color': colorsMap[user.email]?.secondary }"
      >
        {{ supplyRank }}
      </v-chip>
      <span v-else-if="supplyRank === 0"> - </span>
    </td>
    <td class="text-left text-truncate">
      {{ lineItemBid.unit }}
      <v-tooltip activator="parent" location="end">
        {{ lineItemBid.unit }}
      </v-tooltip>
    </td>
    <td class="text-center text-truncate">
      {{ lineItemBid.quantity }}
    </td>
    <td class="text-center text-truncate">
      {{ formatNumber(unitPrice) }}
    </td>
    <template v-if="mode === 'prebid-form'">
      <td class="text-right">
        <TrainingsGuidanceTooltip
          tooltip-id="prebid-round-select"
          :title="t('guidance.prebid.submitPrebid')"
          :message="t('guidance.prebid.submitPrebidMessage')"
          location="end"
          :show-dismiss="true"
          :condition="shouldHighlightInput"
        >
          <template #default>
            <div class="d-flex justify-end">
              <v-responsive
                :width="canSelectRounds[0]?.price > 100000 ? '150px' : '9rem'"
                :class="{ 'select-wrapper--highlight': shouldHighlightInput }"
              >
                <v-select
                  v-model="selectedPrebidComputed"
                  bg-color="grey-ligthen-3"
                  density="compact"
                  class="min-width-select"
                  hide-details
                  :menu-props="{ contentClass: 'thin-scrollbar-menu' }"
                  :items="canSelectRounds"
                  :item-title="(item) => formatNumber(item.price)"
                  return-object
                  no-data-text="You already have bidden the lowest price"
                  :menu-icon="null"
                  @click="isOpen = !isOpen"
                  @blur="isOpen = false"
                >
                  <template #append-inner>
                    <v-img
                      src="@/assets/icons/basic/Chevron_down.svg"
                      width="20"
                      height="20"
                      style="filter: brightness(0)"
                      :style="{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s'
                      }"
                    />
                  </template>
                </v-select>
              </v-responsive>
            </div>
          </template>
        </TrainingsGuidanceTooltip>
      </td>
    </template>
    <template v-else>
      <td class="text-right">
        <span class="font-weight-bold">{{ totalFormating?.value }}</span
        >&nbsp;<span>{{ totalFormating?.currency }}</span>
      </td>
    </template>
  </tr>
</template>

<script setup>
const props = defineProps({
  lineItemBid: {
    type: Object,
    required: true
  },
  mode: {
    type: String,
    default: ''
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

const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { user } = useUser()
const { getColors } = useColorSchema()
const colorsMap = await getColors()

const isOpen = ref(false)
const hasSelected = ref(false)
const selectedPrebid = ref(null)
const supplyRank = ref(0)

// Fetch supply rank if feature is enabled
if (props.showRank && props.sellerId && props.lineItemBid?.id) {
  const { getSupplyRank } = await useTotalValue({ auctionId: route.params.auctionId })
  supplyRank.value = await getSupplyRank(props.sellerId, props.lineItemBid.id)
}

const totalFormating = computed(() => {
  const currency = auction.value?.currency || 'EUR'
  if (props.mode === 'prebid-form') {
    return formatNumber(selectedPrebid.value?.price, 'currency', currency, 1, 2, true)
  }
  return formatNumber(props.lineItemBid?.price, 'currency', currency, 1, 2, true)
})

const unitPrice = computed(() => {
  if (props.mode === 'prebid-form') {
    return (
      selectedPrebid.value?.priceByUnit || selectedPrebid.value?.price / props.lineItemBid?.quantity
    )
  } else {
    return props.lineItemBid?.price / props.lineItemBid?.quantity
  }
})

// Highlight when parent says to highlight AND user hasn't manually selected yet
// Resets if selection becomes empty, disappears when dropdown is open
const shouldHighlightInput = computed(() => {
  if (!props.highlightInput) return false
  if (hasSelected.value && selectedPrebid.value) return false
  if (isOpen.value) return false
  return true
})

const selectedPrebidComputed = computed({
  get: () => selectedPrebid.value,
  set: (value) => {
    hasSelected.value = !!value
    selectedPrebid.value = value
    emit('prebidUpdated', { ...props.lineItemBid, price: value.price })
  }
})

watch(
  () => props.canSelectRounds,
  (newVal) => {
    if (newVal?.length > 0 && !selectedPrebid.value) {
      // Use nextTick to avoid potential reactivity issues
      nextTick(() => {
        selectedPrebid.value = newVal[0]
        emit('prebidUpdated', { ...props.lineItemBid, price: newVal[0].price })
      })
    }
  },
  { immediate: true }
)
</script>
<style scoped>
td {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0;
  padding-left: 0px !important;
  padding-right: 12px !important;
}

td:last-child {
  padding-right: 0px !important;
}

/* Multi-lot training guidance styles */
.select-wrapper--highlight :deep(.v-field__overlay) {
  border: 1px solid rgb(var(--v-theme-error));
  border-radius: 4px;
}
</style>

<style>
/* Thin scrollbar for teleported v-select dropdown menu */
.thin-scrollbar-menu,
.thin-scrollbar-menu .v-list {
  scrollbar-width: thin;
  scrollbar-color: #c5c7c9 transparent;
}
.thin-scrollbar-menu::-webkit-scrollbar,
.thin-scrollbar-menu .v-list::-webkit-scrollbar {
  width: 3px;
}
.thin-scrollbar-menu::-webkit-scrollbar-track,
.thin-scrollbar-menu .v-list::-webkit-scrollbar-track {
  background: transparent;
}
.thin-scrollbar-menu::-webkit-scrollbar-thumb,
.thin-scrollbar-menu .v-list::-webkit-scrollbar-thumb {
  background: #c5c7c9;
  border-radius: 3px;
}
</style>
