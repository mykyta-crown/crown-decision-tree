<template>
  <div class="chart-container">
    <svg viewBox="0 0 210 88" preserveAspectRatio="none">
      <!-- Y-axis label -->
      <text x="4" y="8" class="chart-label">{{ pL }}</text>

      <!-- Baseline -->
      <line x1="6" y1="76" x2="148" y2="76" stroke="#E5E7EB" stroke-width="0.5" />

      <!-- Supplier A bars -->
      <rect x="10" y="20" width="14" height="56" rx="1" fill="#C4B5FD" />
      <rect x="26" y="30" width="14" height="46" rx="1" fill="#7C3AED" opacity="0.65" />

      <!-- Supplier B bars -->
      <rect x="58" y="32" width="14" height="44" rx="1" fill="#93C5FD" />
      <rect x="74" y="43" width="14" height="33" rx="1" fill="#1D4ED8" opacity="0.65" />

      <!-- Supplier C bars -->
      <rect x="106" y="46" width="14" height="30" rx="1" fill="#6EE7B7" />
      <rect x="122" y="57" width="14" height="19" rx="1" fill="#059669" opacity="0.65" />

      <!-- Legend -->
      <rect x="158" y="20" width="8" height="4" rx="1" fill="#C4B5FD" />
      <text x="169" y="24" class="chart-label">Supplier A</text>

      <rect x="158" y="32" width="8" height="4" rx="1" fill="#93C5FD" />
      <text x="169" y="36" class="chart-label">Supplier B</text>

      <rect x="158" y="44" width="8" height="4" rx="1" fill="#6EE7B7" />
      <text x="169" y="48" class="chart-label">Supplier C</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  color: string
  ccy?: string
}>(), {
  ccy: 'EUR',
})

const pL = computed(() => `Price (${props.ccy})`)
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 130px;
  border-radius: 4px;
  background: #F8F8F8;
  border: 1px solid #E9EAEC;
  overflow: hidden;
}

.chart-container svg {
  width: 100%;
  height: 100%;
}

.chart-label {
  font-size: 4.5px;
  fill: #6B7280;
  font-family: Inter, system-ui, sans-serif;
}
</style>
