<template>
  <v-card
    variant="outlined"
    class="d-flex flex-column fill-height pa-5"
    :class="{ 'border-green': store.spend > 0 }"
    min-height="320"
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
            :items="['EUR', 'USD', 'GBP']"
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
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import SpendInput from '~/components/decisionTree/calculator/SpendInput.vue'
import NLSlider from '~/components/decisionTree/calculator/NLSlider.vue'

const store = useCalculatorStore()
</script>

<style scoped>
.border-green {
  border: 2px solid rgb(var(--v-theme-green)) !important;
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
  max-width: 80px;
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
</style>
