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
    <div class="d-flex flex-column align-center ga-2" style="margin-top:12px">
      <svg width="32" height="32" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.3117 15C17.9361 15 18.4328 14.6071 18.8787 14.0576C19.7916 12.9329 18.2928 12.034 17.7211 11.5938C17.14 11.1463 16.4912 10.8928 15.8333 10.8333M15 9.16667C16.1506 9.16667 17.0833 8.23393 17.0833 7.08333C17.0833 5.93274 16.1506 5 15 5" stroke="#1D1D1B" stroke-linecap="round"/>
        <path d="M2.68846 15C2.06404 15 1.56739 14.6071 1.12145 14.0576C0.20857 12.9329 1.70739 12.034 2.27903 11.5938C2.86014 11.1463 3.50898 10.8928 4.16683 10.8333M4.5835 9.16667C3.4329 9.16667 2.50016 8.23393 2.50016 7.08333C2.50016 5.93274 3.4329 5 4.5835 5" stroke="#1D1D1B" stroke-linecap="round"/>
        <path d="M6.73642 12.5925C5.88494 13.119 3.65241 14.1941 5.01217 15.5394C5.6764 16.1965 6.41619 16.6665 7.34627 16.6665H12.6536C13.5837 16.6665 14.3234 16.1965 14.9877 15.5394C16.3474 14.1941 14.1149 13.119 13.2634 12.5925C11.2667 11.3578 8.73313 11.3578 6.73642 12.5925Z" stroke="#1D1D1B" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M12.9166 6.24992C12.9166 7.86075 11.6107 9.16659 9.99992 9.16659C8.38909 9.16659 7.08325 7.86075 7.08325 6.24992C7.08325 4.63909 8.38909 3.33325 9.99992 3.33325C11.6107 3.33325 12.9166 4.63909 12.9166 6.24992Z" stroke="#1D1D1B"/>
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
