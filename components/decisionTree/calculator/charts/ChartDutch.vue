<template>
  <div class="chart-container">
    <svg viewBox="0 0 210 88" preserveAspectRatio="none">
      <!-- Y-axis label -->
      <text x="4" y="8" class="chart-label">{{ pL }}</text>

      <!-- Descending staircase -->
      <path
        d="M8 17H36V30H68V45H102V60H130V74"
        fill="none"
        stroke="#A78BFA"
        stroke-width="1.8"
      />

      <!-- Acceptance circles -->
      <circle cx="36" cy="30" r="3.5" fill="#EF4444" opacity="0.85" />
      <circle cx="68" cy="45" r="3.5" fill="#FBBF24" opacity="0.85" />
      <circle cx="102" cy="60" r="3.5" fill="#34D399" opacity="0.85" />

      <!-- Legend -->
      <circle cx="152" cy="22" r="3" fill="#EF4444" />
      <text x="158" y="24" class="chart-label">Supplier A</text>

      <circle cx="152" cy="34" r="3" fill="#FBBF24" />
      <text x="158" y="36" class="chart-label">Supplier B</text>

      <circle cx="152" cy="46" r="3" fill="#34D399" />
      <text x="158" y="48" class="chart-label">Supplier C</text>
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
