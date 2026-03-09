<template>
  <div class="chart-container">
    <svg viewBox="0 0 280 130" fill="none">
      <defs>
        <marker id="axisArrowJp" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0 1 L5 3 L0 5" fill="#D1D5DB" />
        </marker>
      </defs>

      <!-- Y-axis with arrow -->
      <line x1="28" y1="112" x2="28" y2="10" stroke="#E5E7EB" stroke-width="0.8" marker-end="url(#axisArrowJp)" />
      <text x="24" y="8" class="axis-label" text-anchor="end">Price</text>

      <!-- X-axis with arrow -->
      <line x1="28" y1="112" x2="254" y2="112" stroke="#E5E7EB" stroke-width="0.8" marker-end="url(#axisArrowJp)" />

      <!-- Round labels -->
      <text x="56" y="124" class="round-label">R1</text>
      <text x="100" y="124" class="round-label">R2</text>
      <text x="144" y="124" class="round-label">R3</text>
      <text x="188" y="124" class="round-label">R4</text>
      <text x="232" y="124" class="round-label">R5</text>

      <!-- Grid lines -->
      <line x1="28" y1="36" x2="250" y2="36" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />
      <line x1="28" y1="58" x2="250" y2="58" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />
      <line x1="28" y1="80" x2="250" y2="80" stroke="#F3F4F6" stroke-width="0.5" stroke-dasharray="3 3" />

      <!-- Descending staircase (price drops each round) -->
      <line x1="36" y1="24" x2="78" y2="24" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <line x1="80" y1="42" x2="122" y2="42" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <line x1="124" y1="60" x2="166" y2="60" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <line x1="168" y1="78" x2="210" y2="78" :stroke="color" stroke-width="2" stroke-linecap="round" />
      <line x1="212" y1="96" x2="250" y2="96" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3" />

      <!-- Vertical drops -->
      <line x1="78" y1="24" x2="80" y2="42" :stroke="color" stroke-width="1.2" stroke-dasharray="2 2" />
      <line x1="122" y1="42" x2="124" y2="60" :stroke="color" stroke-width="1.2" stroke-dasharray="2 2" />
      <line x1="166" y1="60" x2="168" y2="78" :stroke="color" stroke-width="1.2" stroke-dasharray="2 2" />
      <line x1="210" y1="78" x2="212" y2="96" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2" />

      <!-- R1: all 3 suppliers present -->
      <circle cx="50" cy="18" r="3.5" fill="#FFF" :stroke="color" stroke-width="1.3" />
      <circle cx="58" cy="18" r="3.5" fill="#FFF" stroke="#F59E0B" stroke-width="1.3" />
      <circle cx="66" cy="18" r="3.5" fill="#FFF" stroke="#9CA3AF" stroke-width="1.3" />

      <!-- R2: all present -->
      <circle cx="94" cy="36" r="3.5" fill="#FFF" :stroke="color" stroke-width="1.3" />
      <circle cx="102" cy="36" r="3.5" fill="#FFF" stroke="#F59E0B" stroke-width="1.3" />
      <circle cx="110" cy="36" r="3.5" fill="#FFF" stroke="#9CA3AF" stroke-width="1.3" />

      <!-- R3: C exits -->
      <circle cx="138" cy="54" r="3.5" fill="#FFF" :stroke="color" stroke-width="1.3" />
      <circle cx="146" cy="54" r="3.5" fill="#FFF" stroke="#F59E0B" stroke-width="1.3" />
      <circle cx="154" cy="54" r="3.5" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.3" />
      <path d="M151.5 51.5 L156.5 56.5 M156.5 51.5 L151.5 56.5" stroke="#EF4444" stroke-width="1" stroke-linecap="round" />

      <!-- R4: B exits, A wins (last standing) -->
      <circle cx="182" cy="72" r="3.5" fill="#FFF" :stroke="color" stroke-width="1.3" />
      <circle cx="190" cy="72" r="3.5" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.3" />
      <path d="M187.5 69.5 L192.5 74.5 M192.5 69.5 L187.5 74.5" stroke="#EF4444" stroke-width="1" stroke-linecap="round" />

      <!-- Winner marker -->
      <circle cx="182" cy="72" r="6" fill="none" stroke="#16A34A" stroke-width="1.5" />
      <text x="182" y="66" text-anchor="middle" class="winner-text">Last standing</text>

      <!-- Down arrow annotation -->
      <path d="M262 20 L262 100" stroke="#D1D5DB" stroke-width="0.8" />
      <path d="M259 94 L262 100 L265 94" fill="none" stroke="#D1D5DB" stroke-width="0.8" stroke-linecap="round" />
      <text x="262" y="16" text-anchor="middle" class="arrow-label">Price drops</text>
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

.round-label {
  font-size: 6px;
  fill: #9CA3AF;
  text-anchor: middle;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
}

.winner-text {
  font-size: 5.5px;
  fill: #16A34A;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
}

.arrow-label {
  font-size: 5.5px;
  fill: #9CA3AF;
  font-family: Inter, system-ui, sans-serif;
}
</style>
