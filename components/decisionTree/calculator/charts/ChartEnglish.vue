<template>
  <div class="chart-container">
    <svg viewBox="0 0 210 88" preserveAspectRatio="none">
      <!-- Y-axis label -->
      <text x="4" y="8" class="chart-label">{{ pL }}</text>

      <!-- Supplier A — blue dashed -->
      <path
        d="M10 60L45 63L80 65L115 67L148 70"
        fill="none"
        stroke="#60A5FA"
        stroke-width="1.5"
        stroke-dasharray="4 2"
      />
      <circle cx="10" cy="60" r="2" fill="#60A5FA" />
      <circle cx="45" cy="63" r="2" fill="#60A5FA" />
      <circle cx="80" cy="65" r="2" fill="#60A5FA" />
      <circle cx="115" cy="67" r="2" fill="#60A5FA" />
      <circle cx="148" cy="70" r="2" fill="#60A5FA" />

      <!-- Supplier B — orange -->
      <path
        d="M10 35L45 46L80 58L115 66L148 71"
        fill="none"
        stroke="#FBBF24"
        stroke-width="1.5"
      />
      <circle cx="10" cy="35" r="2" fill="#FBBF24" />
      <circle cx="45" cy="46" r="2" fill="#FBBF24" />
      <circle cx="80" cy="58" r="2" fill="#FBBF24" />
      <circle cx="115" cy="66" r="2" fill="#FBBF24" />
      <circle cx="148" cy="71" r="2" fill="#FBBF24" />

      <!-- Supplier C — dark with arrow -->
      <path
        d="M10 15L45 36L80 60L115 70"
        fill="none"
        stroke="#374151"
        stroke-width="1.5"
      />
      <path
        d="M115 70L150 78"
        fill="none"
        stroke="#374151"
        stroke-width="1.5"
      />
      <path d="M144 74L150 78L144 82" fill="none" stroke="#374151" stroke-width="1.2" />
      <circle cx="10" cy="15" r="2" fill="#374151" />
      <circle cx="45" cy="36" r="2" fill="#374151" />
      <circle cx="80" cy="60" r="2" fill="#374151" />
      <circle cx="115" cy="70" r="2" fill="#374151" />

      <!-- Legend -->
      <rect x="158" y="20" width="8" height="4" rx="1" fill="#60A5FA" />
      <text x="169" y="24" class="chart-label">Supplier A</text>

      <rect x="158" y="32" width="8" height="4" rx="1" fill="#FBBF24" />
      <text x="169" y="36" class="chart-label">Supplier B</text>

      <rect x="158" y="44" width="8" height="4" rx="1" fill="#374151" />
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
