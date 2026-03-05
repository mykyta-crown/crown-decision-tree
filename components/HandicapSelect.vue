<template>
  <tr>
    <td class="text-left w-25 text-no-wrap">
      {{ groupName }}
    </td>
    <td class="text-start w-15" />
    <td class="text-left w-20 text-no-wrap">
      <div class="font-weight-bold text-no-wrap">
        {{ savedHandicap?.option_name || '-' }}
      </div>
      <div class="text-grey text-no-wrap">
        {{
          savedHandicap?.amount ? formatNumber(savedHandicap?.amount, 'currency', currency) : '-'
        }}
      </div>
    </td>
    <td>
      <div class="py-2 mb-0 d-flex justify-start align-center">
        <v-select
          v-model="selectedHandicap"
          class="handicap-select"
          max-width="262px"
          :items="handicapGroup"
          item-title="option_name"
          :item-props="getItemProps"
          return-object
          flat
          hide-details
          :menu-icon="null"
          @click="handleSelectOpen"
          @blur="isOpen = false"
        >
          <template #selection>
            <div class="font-weight-bold">
              {{ selectedHandicap.option_name }}
            </div>
          </template>
          <template #item="{ props: itemProps, item: handicapOption }">
            <v-list-item
              v-bind="itemProps"
              :subtitle="formatNumber(handicapOption.raw.amount, 'currency', currency)"
              :class="{ 'text-disabled': isOptionDisabled(handicapOption.raw) }"
            />
          </template>
          <template #append-inner>
            <v-img
              src="@/assets/icons/basic/Chevron_down.svg"
              width="25"
              height="25"
              style="filter: brightness(1)"
              :style="{
                transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }"
            />
          </template>
        </v-select>
        <v-tooltip
          v-if="savedHandicap"
          v-model="showTooltip"
          :text="t('bidding.validation.handicapInfoMessage')"
          content-class="bg-white text-black border text-body-2"
          location="top"
          max-width="280"
        >
          <template #activator="{ props: tooltipProps }">
            <v-icon
              v-bind="tooltipProps"
              class="ml-2"
              size="small"
              color="grey"
              icon="mdi-information-outline"
            />
          </template>
        </v-tooltip>
      </div>
    </td>
    <td class="text-left text-no-wrap">
      <div class="font-weight-bold text-no-wrap">
        {{ selectedHandicap?.option_name }}
      </div>
      <div class="text-grey text-no-wrap">
        {{ formatNumber(selectedHandicap?.amount, 'currency', currency) }}
      </div>
    </td>
  </tr>
</template>

<script setup>
const { t } = useTranslations()

const props = defineProps({
  groupName: {
    type: String,
    required: true
  },
  handicapGroup: {
    type: Array,
    required: true
  },
  modelValue: {
    type: Object,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  savedHandicaps: {
    type: Array,
    required: true
  },
  maxAllowedAmount: {
    type: Number,
    default: Infinity // No restriction if not provided
  }
})
const emit = defineEmits(['update:modelValue'])
const isOpen = ref(false)
const showTooltip = ref(false)
const hasOpenedOnce = ref(false)

const savedHandicap = computed(() => {
  return props.savedHandicaps.find((h) => h.group_name === props.groupName)
})

// Handle select open - show tooltip on first open
function handleSelectOpen() {
  isOpen.value = !isOpen.value

  // Show tooltip on first open if there's a saved handicap (restriction applies)
  if (isOpen.value && !hasOpenedOnce.value && savedHandicap.value) {
    hasOpenedOnce.value = true
    showTooltip.value = true

    // Auto-hide tooltip after 3 seconds
    setTimeout(() => {
      showTooltip.value = false
    }, 3000)
  }
}

const selectedHandicap = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Check if an option should be disabled based on max allowed amount
function isOptionDisabled(option) {
  // No restriction if no maxAllowedAmount or no saved handicap
  if (props.maxAllowedAmount === Infinity || !savedHandicap.value) return false

  // Disable if option amount would make total equal or higher than previous
  // (total must be strictly lower than previous bid)
  return option.amount >= props.maxAllowedAmount
}

// Get item props including disabled state
function getItemProps(item) {
  return {
    disabled: isOptionDisabled(item)
  }
}
</script>

<style scoped>
.handicap-select:deep(.v-select__selection) {
  width: 100% !important;
}
td,
th {
  padding-left: 8px !important;
}
.w-20 {
  width: 20%;
  max-width: 244px;
}
</style>
