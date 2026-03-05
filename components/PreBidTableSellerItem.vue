<template>
  <tr>
    <td class="supply-name">
      <div class="text-left text-capitalize">
        {{ props.supply.name }}
      </div>
    </td>
    <td class="supply-quantity">
      <div class="font-weight-regular text-capitalize">
        {{ formatNumber(props.supply.quantity) }}
      </div>

      <div class="text-capitalize text-grey">
        {{ props.supply.unit }}
      </div>
    </td>
    <td v-if="matchingSupplyBid" class="supply-bid">
      <div class="font-weight-bold">
        {{ formatNumber(matchingSupplyBid.price) }}
      </div>
      <div class="text-grey text-no-wrap">
        Total {{ formatNumber(matchingSupplyBid.price * props.supply.quantity) }}
      </div>
    </td>
    <td v-else class="supply-ceiling">
      <div class="font-weight-bold">
        {{ formatNumber(supply.supplies_sellers[0].ceiling) }}
      </div>
      <div class="text-grey text-no-wrap">
        Total {{ formatNumber(supply.supplies_sellers[0].ceiling * props.supply.quantity) }}
      </div>
    </td>
    <td class="supply-price">
      <div class="py-2 mb-0 d-flex justify-start align-center">
        <TrainingsGuidanceTooltip
          tooltip-id="prebid-submit-input"
          :title="t('guidance.prebid.submitPrebid')"
          :message="t('guidance.prebid.submitPrebidMessage')"
          location="start"
          :show-dismiss="true"
          :condition="shouldShowTooltip"
        >
          <template #default="{ props: tooltipProps }">
            <div
              v-bind="tooltipProps"
              class="input-wrapper"
              :class="{ 'input-wrapper--highlight': shouldHighlightInput }"
            >
              <v-text-field
                v-model="bidPrice"
                type="number"
                class="tf-price"
                flat
                persistent-hint
                validate-on="input"
                density="compact"
                block
                onwheel="this.blur()"
                variant="solo"
                :rules="[maxRule]"
                :disabled="disabled"
                @click="isTextFieldFocused = true"
                @blur="isTextFieldFocused = false"
              />
              <v-select
                v-model="newCalcUnit"
                class="tf-unit"
                :class="{ 'disabled-price': disabled }"
                density="compact"
                variant="solo"
                min-width="75px"
                flat
                dense
                :disabled="true"
                :menu-icon="null"
                :items="[props.currency]"
                @click="isOpen = !isOpen"
                @blur="isOpen = false"
              >
                <!--
                  <template #append-inner>

                  <v-img
                  src="@/assets/icons/basic/Chevron_down.svg"
                  width="25"
                  height="25"
                  style="filter: brightness(1);"
                  :style="{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
                  />

                  </template>
                -->
              </v-select>
            </div>
          </template>
        </TrainingsGuidanceTooltip>
      </div>
    </td>
    <td class="supply-total text-left">
      <div class="font-weight-bold">
        {{ +formatNumber(bidPrice) === 0 ? '-' : formatNumber(bidPrice) }}
      </div>
      <div class="text-grey text-no-wrap">
        Total {{ formatNumber(bidPrice * props.supply.quantity) }}
      </div>
    </td>
    <td v-if="props.showRank" style="vertical-align: middle">
      <div class="d-flex align-center justify-start">
        <v-chip
          v-if="props.rank && props.rank > 0"
          variant="text"
          class="font-weight-bold rounded-lg d-flex align-center justify-center"
          :style="{ 'background-color': props.rankColor, height: '28px', width: '28px' }"
        >
          <span>{{ props.rank }}</span>
        </v-chip>
        <v-chip
          v-else
          variant="text"
          class="font-weight-bold rounded-lg d-flex align-center justify-center"
          :style="{ 'background-color': '#F8F8F8', height: '28px', width: '28px' }"
        >
          <span>-</span>
        </v-chip>
      </div>
    </td>
  </tr>
</template>

<script setup>
import { z } from 'zod'

const { t } = useTranslations()

const props = defineProps({
  supply: {
    type: Object,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  modelValue: {
    type: Number,
    default: 0
  },
  calcUnit: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  },
  supplierId: {
    type: [String, null],
    default: null
  },
  rank: {
    type: Number,
    default: null
  },
  rankColor: {
    type: String,
    default: 'grey'
  },
  showRank: {
    type: Boolean,
    default: true
  },
  highlightInput: {
    type: Boolean,
    default: false
  },
  showGuidanceTooltip: {
    type: Boolean,
    default: true
  }
})

const newCalcUnit = defineModel('calcUnit')
const model = defineModel()

const isOpen = ref(false)
const isTextFieldFocused = ref(false)
const route = useRoute()
const { lastPrebids } = await useBids({ auctionId: route.params.auctionId })
const { user } = useUser()

const lastPrebidFromUser = computed(() => {
  return lastPrebids.value[props.supplierId || user.value.id]
})

const matchingSupplyBid = computed(() => {
  return lastPrebidFromUser.value?.bid_supplies.find((bid) => bid.supplies.id === props.supply.id)
})

const maxValue = computed(() => {
  if (matchingSupplyBid.value && matchingSupplyBid.value.price) {
    return matchingSupplyBid.value.price
  } else {
    return props.supply.supplies_sellers[0].ceiling
  }
})
const schemaToRule = useZodSchema()

const maxValidatedValue = computed(() => {
  if (lastPrebidFromUser.value) {
    return maxValue.value
  } else {
    return props.supply.supplies_sellers[0].ceiling
  }
})

let maxSchema = z
  .number({
    required_error: "Can't be empty",
    invalid_type_error: 'Digits only'
  })
  .max(maxValidatedValue.value, {
    message: `Max value: ${formatNumber(maxValidatedValue.value)} ${props.currency}`
  })
  .min(0.01, {
    message: `Min: 0.01 ${props.currency}`
  })

let maxRule = schemaToRule(maxSchema)

watch(maxValue, () => {
  maxSchema = z
    .number({
      required_error: "Can't be empty",
      invalid_type_error: 'Digits only'
    })
    .max(maxValidatedValue.value, {
      message: `Max value: ${formatNumber(maxValidatedValue.value)} ${props.currency}`
    })
    .min(0.01, {
      message: `Min: 0.01 ${props.currency}`
    })
  maxRule = schemaToRule(maxSchema)
})

const bidPrice = computed({
  get() {
    return model.value
  },
  set(newVal) {
    if (newVal === null || newVal === '' || newVal === undefined) {
      model.value = 0
      return
    }
    if (newVal?.length) {
      model.value = Math.abs(newVal)
    }
  }
})

const displayMessage = computed(() => {
  return bidPrice.value > maxValidatedValue.value ? 'block' : 'none'
})

// Highlight input when parent says to highlight AND input is empty
const shouldHighlightInput = computed(() => {
  if (!props.highlightInput) return false
  if (bidPrice.value > 0) return false
  return true
})

// Only show tooltip on the first item of multi-item lots
const shouldShowTooltip = computed(() => {
  return shouldHighlightInput.value && props.showGuidanceTooltip
})
const textfieldFocusedBorder = computed(() => {
  return isTextFieldFocused.value
    ? '1px solid rgba(142, 142, 142, 1)'
    : '1px solid rgba(197, 199, 201, 1)'
})
</script>
<style scoped>
.tf-price:deep(.v-input__details) {
  padding-inline: 0px;
}
.tf-price,
.tf-unit {
  height: 42px !important;
  position: relative;
}
.tf-price:deep(.v-field__input) {
  /* padding-right: 0px; */
  padding-left: 8px;
}
.tf-price:deep(.v-input__details) {
  position: absolute;
  padding-top: 3px;
  display: v-bind(displayMessage) !important;
  background-color: white !important;
  padding-left: 4px !important;
  padding-right: 4px !important;
  max-height: 12px !important;
  height: 12px !important;
  display: flex;
  align-items: start;
  font-size: 10px;
}
.tf-price:deep(.v-messages__message) {
  font-size: 10px;
  background-color: white !important;
  text-align: center !important;
}
.tf-price:deep(.v-field__overlay) {
  border-radius: 4px 0px 0px 4px;
  border-top: v-bind(textfieldFocusedBorder);
  border-left: v-bind(textfieldFocusedBorder);
  border-bottom: v-bind(textfieldFocusedBorder);
}
.tf-unit:deep(.v-input__control) {
  border-radius: 0 4px 4px 0;
  border-right: v-bind(textfieldFocusedBorder);
  border-top: v-bind(textfieldFocusedBorder);
  border-bottom: v-bind(textfieldFocusedBorder);
}
.disabled-price:deep(.v-input__control) {
  border-radius: 0 4px 4px 0;
  border-right: solid 1px rgba(197, 199, 201, 0.278) !important;
  border-top: solid 1px rgba(197, 199, 201, 0.278) !important;
  border-bottom: solid 1px rgba(197, 199, 201, 0.278) !important;
}
.tf-unit:deep(.v-field__overlay) {
  border-radius: 0 4px 4px 0;
}

.tf-unit:deep(.v-field__input) {
  padding-right: 0px;
  padding-left: 30px;
  color: #2e2e2e !important;
}
td,
th {
  padding-left: 8px !important;
}
.tf-unit:deep(.v-field.v-field--appended) {
  padding-right: 6px !important;
}
.tf-price:deep(input::-webkit-outer-spin-button),
.tf-price:deep(input::-webkit-inner-spin-button) {
  /* display: none; <- Crashes Chrome on hover */
  -webkit-appearance: none !important;
  margin: 0; /* <-- Apparently some margin are still there even though it's hidden */
}

/* Multi-lot training guidance styles */
.input-wrapper {
  display: flex;
  border-radius: 4px;
  position: relative;
}
.input-wrapper--highlight:not(:focus-within)::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgb(var(--v-theme-error));
  border-radius: 4px;
  pointer-events: none;
  z-index: 1;
}
</style>
