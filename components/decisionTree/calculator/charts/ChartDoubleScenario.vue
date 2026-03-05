<template>
  <div class="chart-container">
    <svg viewBox="0 0 210 88" preserveAspectRatio="none">
      <!-- Y-axis label -->
      <text x="4" y="8" class="chart-label">{{ pL }}</text>

      <!-- Dashed divider -->
      <line x1="107" y1="6" x2="107" y2="82" stroke="#D1D5DB" stroke-width="0.5" stroke-dasharray="2 2" />

      <!-- Phase labels -->
      <text x="55" y="84" class="phase-label">English Phase</text>
      <text x="133" y="84" class="phase-label">Dutch Phase</text>

      <!-- LEFT: English phase — descending dashed line (Supplier A) -->
      <path
        d="M12 20L38 32L65 44L92 52"
        fill="none"
        stroke="#60A5FA"
        stroke-width="1.3"
        stroke-dasharray="3 2"
      />
      <circle cx="12" cy="20" r="2" fill="#60A5FA" />
      <circle cx="38" cy="32" r="2" fill="#60A5FA" />
      <circle cx="65" cy="44" r="2" fill="#60A5FA" />
      <circle cx="92" cy="52" r="2" fill="#60A5FA" />

      <!-- LEFT: English phase — descending solid line (Supplier B) -->
      <path
        d="M12 15L38 30L65 48L92 58"
        fill="none"
        stroke="#374151"
        stroke-width="1.3"
      />
      <circle cx="12" cy="15" r="2" fill="#374151" />
      <circle cx="38" cy="30" r="2" fill="#374151" />
      <circle cx="65" cy="48" r="2" fill="#374151" />
      <circle cx="92" cy="58" r="2" fill="#374151" />

      <!-- RIGHT: Dutch phase — staircase -->
      <path
        d="M112 40H127V52H142V64H157V74"
        fill="none"
        stroke="#A78BFA"
        stroke-width="1.5"
      />

      <!-- Acceptance circles in Dutch phase -->
      <circle cx="127" cy="52" r="3" fill="#EF4444" opacity="0.85" />
      <circle cx="150" cy="72" r="3" fill="#34D399" opacity="0.85" />

      <!-- Legend -->
      <rect x="163" y="18" width="6" height="3" rx="1" fill="#60A5FA" />
      <text x="172" y="21" class="chart-label">Supplier A</text>

      <rect x="163" y="28" width="6" height="3" rx="1" fill="#374151" />
      <text x="172" y="31" class="chart-label">Supplier B</text>

      <circle cx="166" cy="40" r="2.5" fill="#EF4444" />
      <text x="172" y="42" class="chart-label">Rejected</text>

      <circle cx="166" cy="50" r="2.5" fill="#34D399" />
      <text x="172" y="52" class="chart-label">Accepted</text>
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

.phase-label {
  font-size: 4px;
  fill: #9CA3AF;
  text-anchor: middle;
  font-family: Inter, system-ui, sans-serif;
}
</style>
