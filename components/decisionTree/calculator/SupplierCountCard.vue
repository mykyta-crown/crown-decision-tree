<template>
  <v-card
    variant="outlined"
    class="d-flex flex-column fill-height pa-5"
    :class="{ 'border-green': store.nSup > 0 }"
    min-height="320"
  >
    <div class="mb-1">
      <div class="d-flex align-center ga-2 mb-1">
        <span class="text-subtitle-1 font-weight-bold">Number of suppliers</span>
        <v-icon size="14" color="grey-ligthen-1">mdi-information-outline</v-icon>
      </div>
      <p class="text-caption text-grey-darken-1 mb-4">More suppliers mean stronger competition</p>
    </div>
    <div class="flex-grow-1 d-flex flex-column align-center justify-center ga-5">
      <svg width="60" height="48" viewBox="0 0 60 48" fill="none">
        <circle cx="20" cy="16" r="5.5" stroke="#BDBDBD" stroke-width="1.6" opacity="0.55" />
        <path d="M8 44c0-6.6 5.4-11.5 12-11.5" stroke="#BDBDBD" stroke-width="1.6" stroke-linecap="round" opacity="0.55" />
        <circle cx="40" cy="16" r="5.5" stroke="#BDBDBD" stroke-width="1.6" opacity="0.55" />
        <path d="M52 44c0-6.6-5.4-11.5-12-11.5" stroke="#BDBDBD" stroke-width="1.6" stroke-linecap="round" opacity="0.55" />
        <circle cx="30" cy="13" r="7.5" stroke="#BDBDBD" stroke-width="2" />
        <path d="M15 44c0-8.3 6.7-14 15-14s15 5.7 15 14" stroke="#BDBDBD" stroke-width="2" stroke-linecap="round" />
      </svg>
      <div class="pill-counter">
        <v-btn icon variant="text" size="small" color="grey" @click="decrement">
          <v-icon>mdi-minus</v-icon>
        </v-btn>
        <div class="pill-value text-subtitle-1 font-weight-bold">{{ store.nSup }}</div>
        <v-btn icon variant="text" size="small" color="grey" @click="increment">
          <v-icon>mdi-plus</v-icon>
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { useCalculatorStore } from '~/stores/decisionTree/calculator'

const store = useCalculatorStore()

function decrement() {
  store.nSup = Math.max(0, store.nSup - 1)
}

function increment() {
  store.nSup = Math.min(20, store.nSup + 1)
}
</script>

<style scoped>
.border-green {
  border: 2px solid rgb(var(--v-theme-green)) !important;
}

.pill-counter {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgb(var(--v-theme-grey-ligthen-2));
  border-radius: 999px;
  overflow: hidden;
}

.pill-value {
  width: 56px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(var(--v-theme-grey-ligthen-3));
  border-left: 1px solid rgb(var(--v-theme-grey-ligthen-2));
  border-right: 1px solid rgb(var(--v-theme-grey-ligthen-2));
}
</style>
