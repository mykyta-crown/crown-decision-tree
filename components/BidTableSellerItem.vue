<template>
  <tr>
    <td>
      <div class="text-left font-weight-regular text-capitalize">
        {{ props.supplyBid.name }}
      </div>
    </td>
    <td>
      <div class="font-weight-regular text-capitalize">
        {{ formatNumber(props.supplyBid.quantity) }}
      </div>

      <div class="text-capitalize text-grey">
        {{ props.supplyBid.unit }}
      </div>
    </td>
    <td class="text-left">
      <div class="font-weight-bold text-no-wrap">
        {{ formatNumber(props.supplyBid.previous, 'currency', currency) }}
      </div>
      <div class="text-grey text-no-wrap">
        {{ t('bidding.total') }}
        {{
          formatNumber(props.supplyBid.previous * props.supplyBid.quantity, 'currency', currency)
        }}
      </div>
    </td>
    <td>
      <div class="py-2 mb-0 d-flex justify-start align-center">
        <div class="d-flex">
          <v-text-field
            v-model="priceDecrement"
            type="number"
            class="tf-price"
            flat
            persistent-hint
            validate-on="input"
            density="compact"
            block
            onwheel="this.blur()"
            variant="solo"
            :rules="[nameRule]"
            :disabled="disabled"
            @click="isTextFieldFocused = true"
            @blur="isTextFieldFocused = false"
          >
            <template #prepend-inner> - </template>
          </v-text-field>
          <v-select
            v-model="newCalcUnit"
            class="tf-unit"
            density="compact"
            :class="{ 'disabled-price': disabled }"
            variant="solo"
            min-width="75px"
            flat
            dense
            :disabled="disabled"
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
      </div>
    </td>
    <td class="text-left">
      <div class="font-weight-bold">
        {{ formatNumber(newPrice, 'currency', currency) }}
      </div>
      <div class="text-grey text-no-wrap d-flex">
        {{ t('bidding.total') }}
        {{ formatNumber(newPrice * props.supplyBid.quantity, 'currency', currency) }}
      </div>
    </td>
    <td v-if="props.showRank" style="vertical-align: middle">
      <div class="d-flex align-center justify-start">
        <!-- Loading state -->
        <v-progress-circular
          v-if="props.rankLoading"
          indeterminate
          size="20"
          width="2"
          color="primary"
        />
        <!-- Rank display -->
        <v-chip
          v-else-if="props.rank && props.rank > 0"
          variant="text"
          class="font-weight-bold rounded-lg d-flex align-center justify-center"
          :style="{ 'background-color': props.rankColor, height: '28px', width: '28px' }"
        >
          <span>{{ props.rank }}</span>
        </v-chip>
        <!-- No rank -->
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

const props = defineProps([
  'supplyBid',
  'currency',
  'modelValue',
  'calcUnit',
  'maxBidDecr',
  'disabled',
  'rank',
  'rankColor',
  'rankLoading',
  'showRank'
])

// Use translations
const { t } = useTranslations()

const previousPrice = computed(() => {
  return props.supplyBid.previous
})

const schemaToRule = useZodSchema()
let nameSchema = z
  .number({
    required_error: t('bidding.validation.cantBeEmpty'),
    invalid_type_error: t('bidding.validation.digitsOnly')
  })
  .min(0, t('bidding.validation.minValue') + ' ' + props.currency)
  .max(
    previousPrice.value - 0.01,
    `${t('bidding.validation.maxValue')} ${formatNumber(previousPrice.value - 0.01)} ${props.currency}`
  )

let nameRule = schemaToRule(nameSchema)

const newCalcUnit = defineModel('calcUnit')
const model = defineModel()

const decrementVal = ref(0)

const priceDecrement = computed({
  get() {
    return decrementVal.value
  },
  set(newVal) {
    if (newVal?.length) {
      decrementVal.value = Math.abs(newVal)
    }
  }
})

const isOpen = ref(false)
const isTextFieldFocused = ref(false)

const newPrice = computed(() => {
  if (newCalcUnit.value === '%') {
    return previousPrice.value - previousPrice.value * (priceDecrement.value / 100)
  } else {
    return previousPrice.value - priceDecrement.value
  }
})

watch(previousPrice, () => {
  decrementVal.value = 0
})

watch(
  newPrice,
  (newVal) => {
    model.value = newVal
  },
  { immediate: true }
)

watch(previousPrice, () => {
  nameSchema = z
    .number({
      required_error: t('bidding.validation.cantBeEmpty'),
      invalid_type_error: t('bidding.validation.digitOnly')
    })
    .max(
      previousPrice.value - 0.01,
      `${t('bidding.validation.maxValue')} ${formatNumber(previousPrice.value - 0.01)} ${props.currency}`
    )
    .min(0, t('bidding.validation.minValue') + ' ' + props.currency)

  nameRule = schemaToRule(nameSchema)
})

const displayMessage = computed(() => {
  return priceDecrement.value > previousPrice.value ? 'block' : 'none'
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
  padding-left: 3px;
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
  border-top: solid 1px rgb(197, 199, 201, 0.278) !important;
  border-bottom: solid 1px rgb(197, 199, 201, 0.278) !important;
}
.tf-unit:deep(.v-field__overlay) {
  border-radius: 0 4px 4px 0;
}
.tf-unit:deep(.v-field__input) {
  padding-right: 0px;
  padding-left: 30px;
  color: #8e8e8e !important;
}
td,
th {
  padding-left: 8px !important;
}
.tf-unit:deep(.v-field.v-field--appended) {
  padding-right: 6px !important;
}
</style>
