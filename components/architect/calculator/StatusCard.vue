<template>
  <v-card
    variant="flat"
    class="d-flex flex-column fill-height pa-5"
    :class="{ 'border-green': store.status === 'eligible' }"
    :color="cfg.bgColor"
    :style="store.status !== 'eligible' ? { border: '2px solid ' + cfg.br } : {}"
    min-height="270"
  >
    <!-- Icon -->
    <div class="mb-4">
      <v-avatar v-if="store.status === 'setup'" size="40" variant="outlined" color="grey-ligthen-1" rounded="lg">
        <span class="text-h6 font-weight-bold text-grey">i</span>
      </v-avatar>
      <v-avatar v-else-if="store.status === 'notRec'" size="40" color="error">
        <v-icon color="white">mdi-exclamation</v-icon>
      </v-avatar>
      <v-avatar v-else-if="store.status === 'eligible'" size="40" color="green">
        <v-icon color="white">mdi-check</v-icon>
      </v-avatar>
    </div>

    <!-- Title -->
    <div class="text-h6 font-weight-bold mb-2" :style="{ color: cfg.tc }">{{ cfg.t }}</div>

    <!-- Description -->
    <p class="text-body-2 flex-grow-1" :style="{ color: cfg.dc, lineHeight: 1.6 }">{{ cfg.d }}</p>

    <!-- Next button (eligible only) -->
    <v-btn
      v-if="store.status === 'eligible'"
      color="primary"
      variant="flat"
      block
      class="mt-4"
      append-icon="mdi-arrow-right"
      @click="goNext"
    >
      {{ t('calc.phase1.nextStep') }}
    </v-btn>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import useTranslations from '~/composables/useTranslations'
const { t } = useTranslations('decisiontree')

const store = useCalculatorStore()

interface StatusConfig {
  bgColor: string
  br: string
  t: string
  d: string
  tc: string
  dc: string
}

const configs = computed<Record<string, StatusConfig>>(() => ({
  setup: {
    bgColor: 'grey-ligthen-3',
    br: '#E9EAEC',
    t: t('calc.phase1.verdictWaitTitle'),
    d: t('calc.phase1.verdictWaitDesc'),
    tc: '#1D1D1B',
    dc: '#61615F',
  },
  notRec: {
    bgColor: 'red-light',
    br: '#FECDD3',
    t: t('calc.phase1.verdictStopTitle'),
    d: t('calc.phase1.verdictStopDesc'),
    tc: '#881337',
    dc: '#BE123C',
  },
  eligible: {
    bgColor: 'green-light',
    br: '#86EFAC',
    t: t('calc.phase1.verdictPerfTitle'),
    d: t('calc.phase1.verdictPerfDesc'),
    tc: '#1D1D1B',
    dc: '#166534',
  },
}))

const cfg = computed(() => configs.value[store.status] || configs.value.setup)

function goNext() {
  store.phase = 2
}
</script>

<style scoped>
.border-green {
  border: 2px solid rgb(var(--v-theme-green)) !important;
}
</style>
