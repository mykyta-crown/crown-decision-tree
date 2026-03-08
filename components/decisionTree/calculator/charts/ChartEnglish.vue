<template>
  <div class="chart-container">
    <svg viewBox="0 0 280 130" fill="none">
      <!-- Y-axis -->
      <text x="8" y="20" class="axis-label">{{ pL }}</text>
      <line x1="28" y1="14" x2="28" y2="112" stroke="#E5E7EB" stroke-width="0.8" />

      <!-- X-axis -->
      <line x1="28" y1="112" x2="250" y2="112" stroke="#E5E7EB" stroke-width="0.8" />

      <!-- Grid lines -->
      <line x1="28" y1="36" x2="250" y2="36" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />
      <line x1="28" y1="58" x2="250" y2="58" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />
      <line x1="28" y1="80" x2="250" y2="80" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />

      <!-- Supplier A: starts highest, crosses down through others -->
      <path d="M38 24 L78 38 L118 56 L160 70 L200 84" :stroke="color" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <line x1="200" y1="84" x2="235" y2="100" :stroke="color" stroke-width="1.8" marker-end="url(#arrowA)" />
      <circle cx="38" cy="24" r="3" :fill="color" :stroke="color" stroke-width="1" />
      <circle cx="78" cy="38" r="3" :fill="color" :stroke="color" stroke-width="1" />
      <circle cx="118" cy="56" r="3" :fill="color" :stroke="color" stroke-width="1" />
      <circle cx="160" cy="70" r="3" :fill="color" :stroke="color" stroke-width="1" />
      <circle cx="200" cy="84" r="3" :fill="color" :stroke="color" stroke-width="1" />

      <!-- Supplier B: starts mid, stays flatter, crosses below others -->
      <path d="M38 38 L78 50 L118 52 L160 66 L200 78" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <line x1="200" y1="78" x2="235" y2="94" stroke="#9CA3AF" stroke-width="1.8" marker-end="url(#arrowB)" />
      <circle cx="38" cy="38" r="3" fill="#FFF" stroke="#9CA3AF" stroke-width="1.5" />
      <circle cx="78" cy="50" r="3" fill="#FFF" stroke="#9CA3AF" stroke-width="1.5" />
      <circle cx="118" cy="52" r="3" fill="#FFF" stroke="#9CA3AF" stroke-width="1.5" />
      <circle cx="160" cy="66" r="3" fill="#FFF" stroke="#9CA3AF" stroke-width="1.5" />
      <circle cx="200" cy="78" r="3" fill="#FFF" stroke="#9CA3AF" stroke-width="1.5" />

      <!-- Supplier C: starts lowest, flatter in middle, then drops steeply -->
      <path d="M38 50 L78 42 L118 58 L160 62 L200 88" stroke="#6B7280" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      <line x1="200" y1="88" x2="235" y2="106" stroke="#6B7280" stroke-width="1.8" marker-end="url(#arrowC)" />
      <circle cx="38" cy="50" r="3" fill="#6B7280" stroke="#6B7280" stroke-width="1" />
      <circle cx="78" cy="42" r="3" fill="#6B7280" stroke="#6B7280" stroke-width="1" />
      <circle cx="118" cy="58" r="3" fill="#6B7280" stroke="#6B7280" stroke-width="1" />
      <circle cx="160" cy="62" r="3" fill="#6B7280" stroke="#6B7280" stroke-width="1" />
      <circle cx="200" cy="88" r="3" fill="#6B7280" stroke="#6B7280" stroke-width="1" />

      <!-- Legend pills top-right -->
      <rect x="208" y="14" width="48" height="12" rx="6" fill="#F3F4F6" />
      <circle cx="215" cy="20" r="2.5" :fill="color" />
      <text x="220" y="23" class="legend-text">Supplier A</text>

      <rect x="208" y="29" width="48" height="12" rx="6" fill="#FFF" stroke="#E5E7EB" stroke-width="0.5" />
      <circle cx="215" cy="35" r="2.5" fill="#FFF" stroke="#9CA3AF" stroke-width="1" />
      <text x="220" y="38" class="legend-text">Supplier B</text>

      <rect x="208" y="44" width="48" height="12" rx="6" fill="#F3F4F6" />
      <circle cx="215" cy="50" r="2.5" fill="#6B7280" />
      <text x="220" y="53" class="legend-text">Supplier C</text>

      <!-- Arrow markers -->
      <defs>
        <marker id="arrowA" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <path d="M0 0 L6 2.5 L0 5" :fill="color" />
        </marker>
        <marker id="arrowB" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <path d="M0 0 L6 2.5 L0 5" fill="#9CA3AF" />
        </marker>
        <marker id="arrowC" markerWidth="6" markerHeight="5" refX="6" refY="2.5" orient="auto">
          <path d="M0 0 L6 2.5 L0 5" fill="#6B7280" />
        </marker>
      </defs>
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
  height: 140px;
  border-radius: 8px;
  background: #FAFAFA;
  border: 1px solid #E9EAEC;
  overflow: hidden;
  padding: 4px;
}

.chart-container svg {
  width: 100%;
  height: 100%;
}

.axis-label {
  font-size: 6px;
  fill: #9CA3AF;
  font-family: Inter, system-ui, sans-serif;
}

.legend-text {
  font-size: 5px;
  fill: #6B7280;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
}
</style>
