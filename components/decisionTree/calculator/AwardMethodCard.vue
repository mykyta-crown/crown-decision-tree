<template>
  <v-card
    variant="outlined"
    class="d-flex flex-column fill-height pa-5"
    :class="{ 'border-green': store.award !== null, 'border-red-shake': store.awardErr && store.award === null }"
    min-height="270"
  >
    <div class="mb-1">
      <div class="d-flex align-center ga-2 mb-1">
        <span class="text-subtitle-1 font-weight-bold">Award method</span>
        <v-icon size="14" color="grey-ligthen-1">mdi-information-outline</v-icon>
      </div>
      <p class="text-caption text-grey-darken-1 mb-4">Choose how the winner will be selected</p>
    </div>
    <div class="flex-grow-1 d-flex flex-column justify-center ga-2">
      <v-card
        v-for="opt in options"
        :key="opt.v"
        variant="outlined"
        class="option-card pa-3"
        :class="{ 'option-card--selected': store.award === opt.v }"
        @click="store.award = opt.v"
      >
        <v-icon
          v-if="store.award === opt.v"
          class="check-badge"
          size="16"
          color="white"
        >
          mdi-check
        </v-icon>
        <div class="text-body-2 font-weight-bold">{{ opt.t }}</div>
        <div class="text-caption text-grey-darken-1">{{ opt.d }}</div>
      </v-card>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { useCalculatorStore } from '~/stores/decisionTree/calculator'

const store = useCalculatorStore()

const options = [
  { v: 1, t: 'Award from eAuction results', d: 'Winner is selected based on the results' },
  { v: 2, t: 'Ranking only', d: 'Final award is decided later' },
  { v: 3, t: 'No rank and post reward', d: 'Final award is decided later' },
]
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

.option-card {
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s, background 0.15s;
}

.option-card:hover {
  border-color: rgb(var(--v-theme-grey-ligthen-1)) !important;
}

.option-card--selected {
  border: 2px solid rgb(var(--v-theme-green)) !important;
  background: rgb(var(--v-theme-green-light)) !important;
}

.option-card--selected:hover {
  border-color: rgb(var(--v-theme-green)) !important;
}

.check-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgb(var(--v-theme-green));
}
</style>
