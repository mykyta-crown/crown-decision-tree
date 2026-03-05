<template>
  <v-expansion-panel bg-color="transparent" :class="isSelected ? '' : 'border-b-thin rounded-b-0'">
    <v-expansion-panel-title class="px-2" hide-actions>
      <TermsStepTitle v-model="validLots" :is-selected="props.isSelected" :builder="true">
        <template #numero> 3 </template>
        <template #title>
          <div class="d-flex align-center justify-space-between">
            <div>
              {{ t('lots.title') }}
            </div>
          </div>
        </template>
      </TermsStepTitle>
    </v-expansion-panel-title>
    <v-expansion-panel-text class="pr-0">
      <div>
        <v-tabs v-model="tabs" height="36" class="align-center" hide-slider>
          <div v-for="(lot, i) in model" :key="i" class="d-flex align-center">
            <v-tab
              :value="i"
              class="text-primary rounded-tab d-flex align-center justify-space-between px-5 border border-b-0"
              rounded="0"
              :class="{
                'bg-yellow-lighten-1': i % 4 === 0,
                'bg-purple': i % 4 === 1,
                'bg-orange-light-2': i % 4 === 2,
                'bg-green-light-2': i % 4 === 3,
                'font-weight-bold': i === tabs
              }"
            >
              <span class="mr-4">
                {{ lot.name }}
              </span>
              <v-icon
                v-if="model.length > 1"
                icon="mdi-close"
                :color="hoveredDelete === i ? 'grey' : ''"
                :class="hoveredDelete === i ? 'bg-grey-lighten-3 rounded-circle' : ''"
                @click.stop="deleteLot(i)"
                @mouseover="ishovered(i)"
                @mouseleave="hoveredDelete = null"
              />
            </v-tab>
            <v-btn
              v-if="model.length > 1 && i !== model.length - 1"
              variant="text"
              icon=""
              @click="showTimingRulesDialog = true"
            >
              <v-tooltip
                activator="parent"
                location="top"
                content-class="bg-white elevation-4 text-body-1"
                location-strategy="connected"
                offset="0"
              >
                <span class="text-capitalize">
                  {{ timingRule }}
                </span>
              </v-tooltip>
              <img :src="`/builder/${timingRule}-icon.svg`" height="30px" />
            </v-btn>
          </div>
          <v-btn
            class="text-primary text-subtitle-1 ml-1"
            color="primary"
            size="large"
            variant="text"
            prepend-icon="mdi-plus-circle-outline"
            @click.stop="addLot"
          >
            {{ t('lots.addLot') }}
          </v-btn>
        </v-tabs>
        <v-tabs-window v-model="tabs">
          <v-tabs-window-item v-for="(lot, i) in model" :key="i" :value="i">
            <BuilderLotForm
              v-model="model[i]"
              :suppliers="props.suppliers"
              :basics="props.basics"
            />
          </v-tabs-window-item>
        </v-tabs-window>
      </div>

      <BuilderTimingRulesDialogContent
        v-model="showTimingRulesDialog"
        :timing-rules="timingRule"
        :disabled-types="props.basics.type === 'japanese' ? ['parallel', 'staggered'] : []"
        @confirmed="(rule) => updateTimingRules(rule)"
      />
    </v-expansion-panel-text>
  </v-expansion-panel>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['suppliers', 'basics', 'isSelected'])

// Use translations
const { t } = useTranslations()
const model = defineModel()

const tabs = ref(0)
const showTimingRulesDialog = ref(false)
const timingRule = inject('timingRuleInjection')

const hoveredDelete = ref(null)
const ishovered = (id) => {
  hoveredDelete.value = id
}

function addLot() {
  // Use nextTick to ensure translations are available
  const lotNumber = model.value.length + 1
  const newLot = {
    name: `${t('lots.lot')} ${lotNumber}`,
    duration: props.basics.type === 'sealed-bid' ? 0 : 5,
    max_rank_displayed: props.basics.max_rank_displayed,
    baseline: 0,
    multiplier: true,
    rank_trigger: 'all',
    min_bid_decr: 0,
    min_bid_decr_type: props.basics.currency,
    max_bid_decr: 0,
    max_bid_decr_type: props.basics.currency,
    overtime_range: props.basics.type === 'sealed-bid' ? 0 : 1,
    suppliers: [],
    suppliersTimePerRound: [],
    items: [],
    awarding_principles: t('lots.defaultAwardingPrinciples'),
    commercials_terms: t('lots.defaultCommercialTerms'),
    general_terms: t('lots.defaultGeneralTerms'),
    commercials_docs: [],
    dutch_prebid_enabled: true,
    got_fixed_handicap: false,
    show_fixed_handicap_calculations: false,
    got_dynamic_handicap: false,
    handicaps: [],
    rank_per_line_item: false
  }

  model.value.push(newLot)

  setTimeout(() => {
    tabs.value = model.value.length - 1
  }, 100)
}

function deleteLot(index) {
  model.value.splice(index, 1)
  if (model.value.length === 0) {
    addLot()
  }
  if (tabs.value === model.value.length) {
    tabs.value = model.value.length - 1
  }
  if (tabs.value == index) {
    tabs.value = index - 1
  }
}

const lotsErrors = computed(() => {
  const errors = []
  model.value.forEach((lot, lotIdx) => {
    const lotLabel = lot.name || `${t('lots.lot')} ${lotIdx + 1}`

    if (lot.suppliers.length === 0) {
      errors.push(`${lotLabel}: ${t('validation.atLeastOneSupplier')}`)
    }
    if (lot.items.length === 0) {
      errors.push(`${lotLabel}: ${t('validation.atLeastOneItem')}`)
    }

    lot.items.forEach((item, itemIdx) => {
      Object.entries(item).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          errors.push(
            `${lotLabel}, ${t('validation.item')} ${itemIdx + 1}: ${t('validation.fieldRequired')} '${key}'`
          )
        }
      })
    })

    const isSealedBid = props.basics.type === 'sealed-bid'

    if (!(lot.baseline > 0)) {
      errors.push(`${lotLabel}: ${t('validation.baselineRequired')}`)
    }
    if (!isSealedBid && !(lot.duration > 0)) {
      errors.push(`${lotLabel}: ${t('validation.durationRequired')}`)
    }
    if (!isSealedBid && !(lot.overtime_range > 0)) {
      errors.push(`${lotLabel}: ${t('validation.overtimeRequired')}`)
    }
    if (!isSealedBid && !(lot.min_bid_decr > 0)) {
      errors.push(`${lotLabel}: ${t('validation.minBidDecrementRequired')}`)
    }
    if (!isSealedBid && !(lot.max_bid_decr > 0)) {
      errors.push(`${lotLabel}: ${t('validation.maxBidDecrementRequired')}`)
    }
    if (!lot.name || lot.name === '') {
      errors.push(`${t('lots.lot')} ${lotIdx + 1}: ${t('validation.nameRequired')}`)
    }
    if (
      !lot.awarding_principles ||
      lot.awarding_principles === '' ||
      lot.awarding_principles === '<p><br></p>'
    ) {
      errors.push(`${lotLabel}: ${t('validation.awardingPrinciplesRequired')}`)
    }
    if (
      !lot.commercials_terms ||
      lot.commercials_terms === '' ||
      lot.commercials_terms === '<p><br></p>'
    ) {
      errors.push(`${lotLabel}: ${t('validation.commercialTermsRequired')}`)
    }
  })
  return errors
})

const validLots = computed(() => {
  console.log('lotsErrors: ', lotsErrors.value)
  return lotsErrors.value.length === 0
})

function updateTimingRules(rule) {
  timingRule.value = rule
  showTimingRulesDialog.value = false
}

const modelLength = computed(() => model.value.length)
watch(modelLength, (newValue, oldValue) => {
  if (newValue === 2 && oldValue === 1) {
    showTimingRulesDialog.value = true
  }
})

// Watch for translation changes and update lots with translation keys
watch(
  () => t('lots.lot'),
  (newValue) => {
    if (newValue && newValue !== 'lots.lot' && !newValue.includes('MISSING TRANSLATION')) {
      // Translation is now available, update any lots that have translation keys
      model.value.forEach((lot, index) => {
        // Update lot name if it's showing a translation key or missing translation
        if (
          lot.name &&
          (lot.name.includes('lots.lot') || lot.name.includes('MISSING TRANSLATION'))
        ) {
          lot.name = `${t('lots.lot')} ${index + 1}`
        }
        // Update default texts if they're showing translation keys or missing translations
        if (
          lot.awarding_principles &&
          (lot.awarding_principles.includes('lots.defaultAwardingPrinciples') ||
            lot.awarding_principles.includes('MISSING TRANSLATION'))
        ) {
          lot.awarding_principles = t('lots.defaultAwardingPrinciples')
        }
        if (
          lot.commercials_terms &&
          (lot.commercials_terms.includes('lots.defaultCommercialTerms') ||
            lot.commercials_terms.includes('MISSING TRANSLATION'))
        ) {
          lot.commercials_terms = t('lots.defaultCommercialTerms')
        }
        if (
          lot.general_terms &&
          (lot.general_terms.includes('lots.defaultGeneralTerms') ||
            lot.general_terms.includes('MISSING TRANSLATION'))
        ) {
          lot.general_terms = t('lots.defaultGeneralTerms')
        }
      })
    }
  },
  { immediate: true }
)
</script>

<style>
.v-expansion-panel-text__wrapper {
  padding: 0 0 0 2px !important;
}
.rounded-tab {
  border-radius: 4px 4px 0 0 !important;
}
/* .focused-tab{
  z-index: 10 !important;
  box-shadow: 0px 40px 15px 10px rgba(0, 0, 0, 0.2) !important;
  border-top: 1px solid #ffffff !important;
  font-weight: bold;
  transition: all 0.3s ease-in-out;
} */
</style>
