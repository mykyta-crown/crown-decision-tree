<template>
  <v-row>
    <!-- Baseline price -->
    <v-col cols="12" md="4" class="pt-0">
      <div class="mb-2 text-body-2">
        {{ titles.a }}
      </div>
      <v-text-field
        v-model="model.baseline"
        type="number"
        width="100%"
        :rules="[numberHandler]"
        :suffix="props.basics.currency"
        :placeholder="t('lotRules.baselinePrice.placeholder')"
      />
    </v-col>

    <!-- Min bid decrement -->
    <v-col v-if="props.basics.type !== 'sealed-bid'" cols="12" md="4" class="pt-0">
      <div class="mb-2 text-body-2">
        {{ titles.c }}
        <v-tooltip
          :text="t('lotRules.minBidDecrementTooltip')"
          content-class="bg-white text-black border text-body-2"
          location="top left"
          width="180"
        >
          <template #activator="{ props }">
            <v-icon
              inline
              class="ml-1"
              v-bind="props"
              size="small"
              color="grey"
              icon="mdi-information-outline"
            />
          </template>
        </v-tooltip>
      </div>
      <v-text-field
        v-model="model.min_bid_decr"
        variant="outlined"
        :placeholder="t('lotRules.bidDecrement.placeholder')"
        width="100%"
        type="number"
        :rules="[numberHandler]"
        :suffix="props.basics.currency"
      />
    </v-col>

    <!-- Overtime -->
    <v-col v-if="props.basics.type !== 'sealed-bid'" cols="12" md="4" class="pt-0">
      <div class="mb-2 text-body-2">
        {{ titles.e }}
      </div>
      <v-select
        v-model="model.overtime_range"
        variant="outlined"
        :items="overtimeItems"
        item-title="label"
        item-value="value"
        :menu-icon="null"
        width="100%"
        :disabled="props.basics.type === 'sealed-bid'"
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Clock.svg" width="20" height="20" />
        </template>
      </v-select>
    </v-col>

    <!-- Duration of competition -->
    <v-col v-if="props.basics.type !== 'sealed-bid'" cols="12" md="4" class="py-0">
      <div class="mb-2 text-body-2">
        {{ titles.b }}
      </div>
      <v-text-field
        v-model="model.duration"
        variant="outlined"
        :placeholder="t('lotRules.competitionDurationPlaceholder')"
        :suffix="t('lotRules.minutes')"
        type="number"
        :rules="[durationHandler]"
        width="100%"
        :min="props.basics.type === 'sealed-bid' ? 0 : 1"
        :disabled="props.basics.type === 'sealed-bid'"
      />
    </v-col>

    <!-- Max bid decrement -->
    <v-col cols="12" md="4" class="py-0">
      <div class="mb-2 text-body-2">
        {{ titles.d }}
        <v-tooltip
          :text="t('lotRules.maxBidDecrementTooltip')"
          content-class="bg-white text-black border text-body-2"
          location="top left"
          width="180"
        >
          <template #activator="{ props }">
            <v-icon
              inline
              class="ml-1"
              v-bind="props"
              size="small"
              color="grey"
              icon="mdi-information-outline"
            />
          </template>
        </v-tooltip>
      </div>
      <v-text-field
        v-model="model.max_bid_decr"
        variant="outlined"
        :placeholder="t('lotRules.bidDecrement.placeholder')"
        type="number"
        :rules="[numberHandler]"
        width="100%"
        :suffix="props.basics.currency"
      />
    </v-col>

    <!-- Ranks triggering overtime -->
    <v-col v-if="props.basics.type !== 'sealed-bid'" cols="12" md="4" class="py-0">
      <div class="mb-2 text-body-2">
        {{ titles.f }}
      </div>
      <v-select
        v-model="model.overtime_rule"
        variant="outlined"
        :items="[{ title: t('lotRules.all'), value: 'all' }]"
        :menu-icon="null"
        width="100%"
        disabled
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
        </template>
        />
      </v-select>
    </v-col>

    <!-- Max Rank Displayed -->
    <v-col cols="12" md="4" class="py-0">
      <div class="mb-2 text-body-2">
        {{ t('lotRules.maxRankDisplayed') }}
        <v-tooltip
          :text="t('lotRules.maxRankDisplayedTooltip')"
          content-class="bg-white text-black border text-body-2"
          location="top left"
          width="220"
        >
          <template #activator="{ props }">
            <v-icon
              inline
              class="ml-1"
              v-bind="props"
              size="small"
              color="grey"
              icon="mdi-information-outline"
            />
          </template>
        </v-tooltip>
      </div>
      <v-select
        v-model="model.max_rank_displayed"
        variant="outlined"
        :items="maxRankOptions"
        item-title="title"
        item-value="value"
        :menu-icon="null"
        width="100%"
      >
        <template #append-inner>
          <v-img src="@/assets/icons/basic/Chevron_down.svg" width="20" height="20" />
        </template>
      </v-select>
    </v-col>
  </v-row>
</template>

<script setup>
import { watch } from 'vue'
import { z } from 'zod'

const props = defineProps({
  basics: Object
})

// Use translations
const { t } = useTranslations()

const model = defineModel()

const schemaToRule = useZodSchema()
const numberRule = computed(() => {
  const numberSchema = z.number().min(0.01, { message: t('validation.required') })
  return schemaToRule(numberSchema)
})

const numberHandler = function (value) {
  return numberRule.value(+value)
}

const durationHandler = function (value) {
  if (props.basics.type === 'sealed-bid') {
    return true
  }
  return numberRule.value(+value)
}
const titles = {
  a: t('lotRules.baselinePrice.label'),
  b: t('lotRules.competitionDuration'),
  c: t('lotRules.minBidDecrement'),
  d: t('lotRules.maxBidDecrement'),
  e: t('lotRules.overtime'),
  f: t('lotRules.ranksTriggering')
}

const overtimeItems = [
  { label: t('lotRules.overtimeNone'), value: null },
  { label: '30 sec', value: 0.5 },
  { label: '1 min', value: 1 },
  { label: '2 min', value: 2 },
  { label: '3 min', value: 3 },
  { label: '4 min', value: 4 },
  { label: '5 min', value: 5 }
]

// Initialize overtime_rule if undefined
if (model.value.overtime_rule === undefined) {
  model.value.overtime_rule = 'all'
}

// Initialize rank_per_line_item if undefined
if (model.value.rank_per_line_item === undefined) {
  model.value.rank_per_line_item = false
}

// Fixed options for max_rank_displayed (1-5)
const maxRankOptions = computed(() => {
  const options = [
    { title: t('lotRules.noRank'), value: 0 },
    { title: t('lotRules.all'), value: 100 }
  ]

  // Add fixed numbered options from 1 to 5
  for (let i = 1; i <= 5; i++) {
    options.push({ title: String(i), value: i })
  }

  return options
})

watch(
  () => props.basics.type,
  (newVal) => {
    if (newVal === 'sealed-bid') {
      model.value.overtime_range = 0
      model.value.min_bid_decr = 0
      model.value.max_bid_decr = 0
    } else if (model.value.overtime_range === 0) {
      model.value.overtime_range = 1
    }
    if (newVal !== 'sealed-bid') {
      if (model.value.min_bid_decr === 0) {
        model.value.min_bid_decr = 1
      }
      if (model.value.max_bid_decr === 0) {
        model.value.max_bid_decr = 1
      }
    }
  }
)
</script>
