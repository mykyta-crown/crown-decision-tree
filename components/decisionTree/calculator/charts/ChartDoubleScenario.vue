<template>
  <div class="chart-container">
    <svg viewBox="0 0 280 130" fill="none">
      <!-- Phase divider -->
      <line x1="140" y1="18" x2="140" y2="112" stroke="#D1D5DB" stroke-width="0.8" stroke-dasharray="3 3" />

      <!-- Phase labels -->
      <rect x="30" y="4" width="76" height="14" rx="4" fill="#EFF6FF" />
      <text x="68" y="14" text-anchor="middle" class="phase-label" fill="#1E40AF">Phase 1: English</text>

      <rect x="158" y="4" width="68" height="14" rx="4" fill="#F5F3FF" />
      <text x="192" y="14" text-anchor="middle" class="phase-label" fill="#5B21B6">Phase 2: Dutch</text>

      <!-- Y-axis -->
      <line x1="18" y1="22" x2="18" y2="112" stroke="#E5E7EB" stroke-width="0.6" />
      <text x="6" y="24" class="axis-label">Price</text>

      <!-- X-axis -->
      <line x1="18" y1="112" x2="268" y2="112" stroke="#E5E7EB" stroke-width="0.6" />

      <!-- Grid -->
      <line x1="18" y1="46" x2="268" y2="46" stroke="#F3F4F6" stroke-width="0.4" stroke-dasharray="2 3" />
      <line x1="18" y1="68" x2="268" y2="68" stroke="#F3F4F6" stroke-width="0.4" stroke-dasharray="2 3" />
      <line x1="18" y1="90" x2="268" y2="90" stroke="#F3F4F6" stroke-width="0.4" stroke-dasharray="2 3" />

      <!-- Phase 1: English - 3 lines competing down -->
      <path d="M26 34 L52 46 L78 58 L104 72 L130 82" :stroke="color" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="26" cy="34" r="2.5" fill="#FFF" :stroke="color" stroke-width="1.2" />
      <circle cx="78" cy="58" r="2.5" fill="#FFF" :stroke="color" stroke-width="1.2" />
      <circle cx="130" cy="82" r="2.5" :fill="color" />

      <path d="M26 30 L52 50 L78 68 L104 82 L130 90" stroke="#F59E0B" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="26" cy="30" r="2.5" fill="#FFF" stroke="#F59E0B" stroke-width="1.2" />
      <circle cx="78" cy="68" r="2.5" fill="#FFF" stroke="#F59E0B" stroke-width="1.2" />
      <circle cx="130" cy="90" r="2.5" fill="#F59E0B" />

      <path d="M26 26 L52 52 L78 76 L104 94 L130 100" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" />
      <circle cx="26" cy="26" r="2.5" fill="#FFF" stroke="#9CA3AF" stroke-width="1.2" />
      <circle cx="78" cy="76" r="2.5" fill="#FFF" stroke="#9CA3AF" stroke-width="1.2" />
      <circle cx="130" cy="100" r="2.5" fill="#9CA3AF" />

      <!-- Phase 2: Dutch - ascending staircase -->
      <rect x="150" y="98" width="26" height="14" rx="1" fill="#7C3AED" opacity="0.06" />
      <line x1="150" y1="98" x2="176" y2="98" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" />

      <rect x="180" y="84" width="26" height="28" rx="1" fill="#7C3AED" opacity="0.08" />
      <line x1="180" y1="84" x2="206" y2="84" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" />

      <rect x="210" y="70" width="26" height="42" rx="1" fill="#7C3AED" opacity="0.1" />
      <line x1="210" y1="70" x2="236" y2="70" stroke="#7C3AED" stroke-width="2" stroke-linecap="round" />

      <rect x="240" y="56" width="24" height="56" rx="1" fill="#F3F4F6" opacity="0.3" />
      <line x1="240" y1="56" x2="264" y2="56" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3" />

      <!-- Vertical risers -->
      <line x1="176" y1="98" x2="180" y2="84" stroke="#7C3AED" stroke-width="1" stroke-dasharray="2 2" />
      <line x1="206" y1="84" x2="210" y2="70" stroke="#7C3AED" stroke-width="1" stroke-dasharray="2 2" />
      <line x1="236" y1="70" x2="240" y2="56" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2" />

      <!-- Accept marker -->
      <circle cx="226" cy="70" r="5.5" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.2" />
      <path d="M223 70 L225.5 72.5 L229 67.5" fill="none" stroke="#16A34A" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" />
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

.phase-label {
  font-size: 5.5px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
}

.axis-label {
  font-size: 5.5px;
  fill: #9CA3AF;
  font-family: Inter, system-ui, sans-serif;
}
</style>
