<template>
  <v-row>
    <v-col md="4" class="pb-0">
      <div class="pb-2">
        <div class="mb-2 text-body-2">
          {{ titles.a }}
        </div>
        <v-text-field
          v-model="model.baseline"
          variant="outlined"
          type="number"
          :rules="[numberHandler]"
          :suffix="props.basics.currency"
          :placeholder="t('lotRules.baselinePrice.placeholder')"
        />
      </div>
      <div>
        <div class="mb-2 text-body-2">
          {{ titles.b }}
        </div>
        <v-text-field
          v-model="model.min_bid_decr"
          variant="outlined"
          :placeholder="t('lotRules.bidDecrement.placeholder')"
          type="number"
          :rules="[numberHandler]"
          :suffix="props.basics.currency"
        />
      </div>
    </v-col>
    <v-col cols="12" md="4" class="pb-0">
      <div class="pb-2">
        <div class="mb-2 text-body-2">
          {{ titles.c }}
        </div>
        <v-select
          v-model="model.duration"
          variant="outlined"
          :items="dutchDuration"
          item-title="label"
          item-value="value"
          :menu-icon="null"
        >
          <template #append-inner>
            <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
          </template>
        </v-select>
      </div>
      <div class="pb-2">
        <div class="mb-2 text-body-2">
          {{ titles.d }}
        </div>

        <v-select
          v-model="model.overtime_range"
          variant="outlined"
          :items="roundDurationOptions"
          item-title="label"
          item-value="value"
          :menu-icon="null"
        >
          <template #append-inner>
            <v-img src="@/assets/icons/basic/Clock.svg" width="20" height="20" />
          </template>
        </v-select>
      </div>
    </v-col>
    <v-col cols="12" md="4" class="pb-0">
      <div class="pb-2">
        <div class="mb-2 text-body-2">
          {{ titles.e }}
        </div>
        <v-text-field
          v-model="model.max_bid_decr"
          variant="outlined"
          type="number"
          :rules="[numberHandler]"
          :suffix="props.basics.currency"
          :placeholder="t('lotRules.startingPrice.placeholder')"
        />
      </div>

      <div class="pb-2">
        <div class="mb-2 text-body-2">
          {{ titles.f }}
        </div>
        <v-text-field
          :model-value="calculatedEndingPrice"
          variant="outlined"
          type="number"
          :rules="[numberHandler]"
          disabled
          :suffix="props.basics.currency"
        />
      </div>
    </v-col>
  </v-row>
  <v-row>
    <v-col cols="12" class="py-0">
      <div class="text-body-2">
        {{ t('lotRules.prebid') }}
      </div>
      <v-switch v-model="model.dutch_prebid_enabled" color="green" hide-details>
        <template #prepend>
          <div
            class="cursor-pointer text-body-1"
            :class="model.dutch_prebid_enabled ? 'text-grey' : ''"
            @click="model['dutch_prebid_enabled'] = true"
          >
            {{ t('common.off') }}
          </div>
        </template>
        <template #label>
          <span
            class="cursor-pointer text-body-1"
            :class="model.dutch_prebid_enabled ? '' : 'text-grey'"
            @click="model['dutch_prebid_enabled'] = false"
          >
            {{ t('common.on') }}
          </span>
        </template>
      </v-switch>
    </v-col>
    <v-col
      cols="12"
      class="d-flex justify-space-between align-center text-h6 font-weight-semibold textfield pt-1 pb-2"
    >
      <div>{{ t('lotRules.rounds') }}</div>
      <span>{{ nbRounds }}</span>
    </v-col>
    <v-col cols="12" class="mx-0 pa-0">
      <BuilderRoundsCard :rounds-list="rounds" />
    </v-col>
  </v-row>
</template>

<script setup>
import { z } from 'zod'

const props = defineProps({
  basics: {
    type: Object,
    required: true
  }
})

const model = defineModel()

// Use translations
const { t } = useTranslations()

const titles = {
  a: t('lotRules.baselinePrice.label'),
  b: t('lotRules.roundDecrement'),
  c: t('lotRules.duration'),
  d: t('lotRules.roundDuration'),
  e: t('lotRules.startingPrice.label'),
  f: t('lotRules.endingPrice.label')
}

// Form validation
const schemaToRule = useZodSchema()
const numberRule = computed(() => {
  const numberSchema = z.number().min(0.01, { message: t('validation.required') })
  return schemaToRule(numberSchema)
})

const numberHandler = (value) => numberRule.value(+value)

// Duration options
const dutchDuration = [
  { label: '5 min', value: 5 },
  { label: '10 min', value: 10 },
  { label: '15 min', value: 15 },
  { label: '20 min', value: 20 },
  { label: '25 min', value: 25 },
  { label: '30 min', value: 30 },
  { label: '35 min', value: 35 },
  { label: '40 min', value: 40 }
]

// Round duration options
const roundDurationOptions = [
  { label: '15 sec', value: 0.25 },
  { label: '30 sec', value: 0.5 },
  { label: '1 min', value: 1 }
]

const nbRounds = computed(() => {
  return +model.value.duration / model.value.overtime_range
})

const calculatedEndingPrice = computed(() => {
  const lastRound = rounds.value[rounds.value.length - 1]
  return lastRound ? lastRound.price : 0
})

const rounds = computed(() => {
  if (!nbRounds.value) return []

  return Array.from({ length: nbRounds.value }, (r, i) => {
    return {
      price: model.value.max_bid_decr - i * model.value.min_bid_decr,
      status: 'inactive'
    }
  })
})
</script>

<style scoped>
.custom-border-radius {
  border-radius: 0 8px 8px 8px !important;
}

.textfield:deep(input) {
  font-size: 16px !important;
  field-sizing: content;
}
</style>
