<template>
  <div class="chart-container">
    <svg viewBox="0 0 210 88" preserveAspectRatio="none">
      <!-- Y-axis label -->
      <text x="4" y="8" class="chart-label">{{ pL }}</text>

      <!-- Horizontal price-level lines -->
      <line x1="30" y1="22" x2="160" y2="22" stroke="#E5E7EB" stroke-width="0.4" stroke-dasharray="2 2" />
      <line x1="30" y1="38" x2="160" y2="38" stroke="#E5E7EB" stroke-width="0.4" stroke-dasharray="2 2" />
      <line x1="30" y1="54" x2="160" y2="54" stroke="#E5E7EB" stroke-width="0.4" stroke-dasharray="2 2" />
      <line x1="30" y1="70" x2="160" y2="70" stroke="#E5E7EB" stroke-width="0.4" stroke-dasharray="2 2" />

      <!-- R1: green, blue, yellow circles -->
      <circle cx="44" cy="22" r="3" fill="#34D399" />
      <circle cx="44" cy="38" r="3" fill="#60A5FA" />
      <circle cx="44" cy="54" r="3" fill="#FBBF24" />

      <!-- R2: green, blue circles + red X -->
      <circle cx="80" cy="38" r="3" fill="#34D399" />
      <circle cx="80" cy="54" r="3" fill="#60A5FA" />
      <text x="73" y="60" class="elim-x">X</text>

      <!-- R3: green circle + red X -->
      <circle cx="116" cy="54" r="3" fill="#34D399" />
      <text x="109" y="44" class="elim-x">X</text>

      <!-- R4: green winner circle -->
      <circle cx="152" cy="70" r="4" fill="#34D399" stroke="#059669" stroke-width="1.2" />

      <!-- Round labels -->
      <text x="42" y="82" class="round-label">R1</text>
      <text x="78" y="82" class="round-label">R2</text>
      <text x="114" y="82" class="round-label">R3</text>
      <text x="150" y="82" class="round-label">R4</text>

      <!-- Legend -->
      <circle cx="173" cy="22" r="2.5" fill="#34D399" />
      <text x="178" y="24" class="chart-label">Supplier A</text>

      <circle cx="173" cy="32" r="2.5" fill="#60A5FA" />
      <text x="178" y="34" class="chart-label">Supplier B</text>

      <circle cx="173" cy="42" r="2.5" fill="#FBBF24" />
      <text x="178" y="44" class="chart-label">Supplier C</text>
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

.round-label {
  font-size: 4px;
  fill: #9CA3AF;
  text-anchor: middle;
  font-family: Inter, system-ui, sans-serif;
}

.elim-x {
  font-size: 7px;
  fill: #EF4444;
  font-weight: 700;
  font-family: Inter, system-ui, sans-serif;
}
</style>
