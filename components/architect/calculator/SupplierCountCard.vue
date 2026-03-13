<template>
  <v-card
    variant="outlined"
    class="d-flex flex-column fill-height pa-5"
    :class="{ 'border-green': store.nSup > 0, 'border-red-shake': store.nSupErr && store.nSup <= 0 }"
    min-height="270"
  >
    <div class="mb-1">
      <div class="d-flex align-center ga-2 mb-1">
        <span class="text-subtitle-1 font-weight-bold">Number of suppliers</span>
        <v-icon size="14" color="grey-ligthen-1">mdi-information-outline</v-icon>
      </div>
      <p class="text-caption text-grey-darken-1 mb-4">More suppliers mean stronger competition</p>
    </div>
    <div class="flex-grow-1 d-flex flex-column align-center justify-center ga-5">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M27.6987 24C28.6978 24 29.4924 23.3713 30.2059 22.4922C31.6665 20.6926 29.2684 19.2545 28.3538 18.5501C27.424 17.8342 26.3859 17.4286 25.3333 17.3333M24 14.6667C25.8409 14.6667 27.3333 13.1743 27.3333 11.3333C27.3333 9.49238 25.8409 8 24 8" stroke="#1D1D1B" stroke-linecap="round"/>
        <path d="M4.30095 24C3.30188 24 2.50723 23.3713 1.79374 22.4922C0.333126 20.6926 2.73124 19.2545 3.64587 18.5501C4.57564 17.8342 5.61378 17.4286 6.66634 17.3333M7.33301 14.6667C5.49206 14.6667 3.99967 13.1743 3.99967 11.3333C3.99967 9.49238 5.49206 8 7.33301 8" stroke="#1D1D1B" stroke-linecap="round"/>
        <path d="M10.7781 20.1482C9.41571 20.9906 5.84366 22.7107 8.01927 24.8632C9.08205 25.9146 10.2657 26.6666 11.7538 26.6666H20.2455C21.7336 26.6666 22.9173 25.9146 23.9801 24.8632C26.1557 22.7107 22.5836 20.9906 21.2213 20.1482C18.0265 18.1728 13.9728 18.1728 10.7781 20.1482Z" stroke="#1D1D1B" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M20.6663 10C20.6663 12.5774 18.577 14.6667 15.9997 14.6667C13.4223 14.6667 11.333 12.5774 11.333 10C11.333 7.42271 13.4223 5.33337 15.9997 5.33337C18.577 5.33337 20.6663 7.42271 20.6663 10Z" stroke="#1D1D1B"/>
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
import { useCalculatorStore } from '~/stores/architect/calculator'

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
