<template>
  <v-card
    variant="outlined"
    class="d-flex flex-column fill-height pa-5"
    :class="{ 'border-green': store.spend > 0, 'border-red-shake': store.spendErr && store.spend <= 0 }"
    min-height="270"
  >
    <div class="mb-1">
      <div class="d-flex align-center ga-2 mb-1">
        <span class="text-subtitle-1 font-weight-bold">Total spend</span>
        <v-icon size="14" color="grey-ligthen-1">mdi-information-outline</v-icon>
      </div>
      <p class="text-caption text-grey-darken-1 mb-4">Used to assess the potential impact</p>
    </div>
    <div class="flex-grow-1 d-flex flex-column justify-center">
      <div class="d-flex justify-center mb-4">
        <div class="spend-input-wrap">
          <SpendInput v-model="store.spend" />
          <v-divider vertical class="mx-2" />
          <v-select
            v-model="store.ccy"
            :items="['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN']"
            variant="plain"
            density="compact"
            hide-details
            class="ccy-select"
          />
        </div>
      </div>
      <NLSlider v-model="store.spend" />
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { useCalculatorStore } from '~/stores/architect/calculator'
import SpendInput from '~/components/architect/calculator/SpendInput.vue'
import NLSlider from '~/components/architect/calculator/NLSlider.vue'

const store = useCalculatorStore()
</script>

<style scoped>
.border-green {
  border: 2px solid rgb(var(--v-theme-green)) !important;
}

.border-red-shake {
  border: 2px solid #EF4444 !important;
  animation: card-shake 0.5s ease;
}

@keyframes card-shake {
  0%, 100% { transform: translateX(0); }
  15% { transform: translateX(-4px); }
  30% { transform: translateX(3px); }
  45% { transform: translateX(-2px); }
  60% { transform: translateX(1px); }
}

.spend-input-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px dashed rgb(var(--v-theme-green));
  border-radius: 8px;
  padding: 8px 16px;
}

.ccy-select {
  width: 70px;
  flex: 0 0 70px;
  font-weight: 600;
}

.ccy-select :deep(.v-field__input) {
  padding: 0;
  min-height: auto;
  font-weight: 600;
}

.ccy-select :deep(.v-field) {
  padding: 0;
}

.ccy-select :deep(.v-field__append-inner) {
  padding: 0;
  margin: 0;
}
</style>
