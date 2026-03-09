<template>
  <div class="chart-container">
    <svg viewBox="0 0 280 130" fill="none">
      <defs>
        <marker id="axisArrowDu" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0 1 L5 3 L0 5" fill="#D1D5DB" />
        </marker>
      </defs>

      <!-- Y-axis with arrow -->
      <line x1="28" y1="112" x2="28" y2="10" stroke="#E5E7EB" stroke-width="0.8" marker-end="url(#axisArrowDu)" />
      <text x="24" y="8" class="axis-label" text-anchor="end">Price</text>

      <!-- X-axis with arrow -->
      <line x1="28" y1="112" x2="254" y2="112" stroke="#E5E7EB" stroke-width="0.8" marker-end="url(#axisArrowDu)" />
      <text x="248" y="124" class="axis-label" text-anchor="end">Time</text>

      <!-- Grid lines -->
      <line x1="28" y1="36" x2="250" y2="36" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />
      <line x1="28" y1="58" x2="250" y2="58" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />
      <line x1="28" y1="80" x2="250" y2="80" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />

      <!-- Ascending staircase blocks -->
      <rect x="38" y="92" width="38" height="20" rx="2" :fill="color" opacity="0.08" />
      <line x1="38" y1="92" x2="76" y2="92" :stroke="color" stroke-width="2" stroke-linecap="round" />

      <rect x="80" y="74" width="38" height="38" rx="2" :fill="color" opacity="0.1" />
      <line x1="80" y1="74" x2="118" y2="74" :stroke="color" stroke-width="2" stroke-linecap="round" />

      <rect x="122" y="56" width="38" height="56" rx="2" :fill="color" opacity="0.12" />
      <line x1="122" y1="56" x2="160" y2="56" :stroke="color" stroke-width="2" stroke-linecap="round" />

      <rect x="164" y="38" width="38" height="74" rx="2" :fill="color" opacity="0.15" />
      <line x1="164" y1="38" x2="202" y2="38" :stroke="color" stroke-width="2" stroke-linecap="round" />

      <rect x="206" y="22" width="38" height="90" rx="2" fill="#F3F4F6" opacity="0.3" />
      <line x1="206" y1="22" x2="244" y2="22" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3" />

      <!-- Vertical risers -->
      <line x1="76" y1="92" x2="80" y2="74" :stroke="color" stroke-width="1.2" stroke-dasharray="2 2" />
      <line x1="118" y1="74" x2="122" y2="56" :stroke="color" stroke-width="1.2" stroke-dasharray="2 2" />
      <line x1="160" y1="56" x2="164" y2="38" :stroke="color" stroke-width="1.2" stroke-dasharray="2 2" />
      <line x1="202" y1="38" x2="206" y2="22" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2" />

      <!-- Accept marker on step 4 -->
      <circle cx="183" cy="38" r="7" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.5" />
      <path d="M179.5 38 L182 40.5 L186.5 35.5" fill="none" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />

      <!-- First to accept label -->
      <text x="183" y="28" text-anchor="middle" class="accept-text">First to accept</text>

      <!-- Up arrow annotation -->
      <path d="M262 100 L262 26" stroke="#D1D5DB" stroke-width="0.8" />
      <path d="M259 32 L262 26 L265 32" fill="none" stroke="#D1D5DB" stroke-width="0.8" stroke-linecap="round" />
      <text x="262" y="112" text-anchor="middle" class="arrow-label">Price rises</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  color: string
  ccy?: string
}>(), {
  ccy: 'EUR',
})
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

.accept-text {
  font-size: 5.5px;
  fill: #16A34A;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
}

.arrow-label {
  font-size: 5px;
  fill: #9CA3AF;
  font-family: Inter, system-ui, sans-serif;
}
</style>
