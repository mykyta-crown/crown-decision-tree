<template>
  <div class="chart-container">
    <svg viewBox="0 0 280 130" fill="none">
      <!-- Central sealed envelope -->
      <rect x="95" y="24" width="90" height="60" rx="6" fill="#F8FAFC" :stroke="color" stroke-width="1.5" />
      <path d="M95 30 L140 58 L185 30" fill="none" :stroke="color" stroke-width="1.5" stroke-linejoin="round" />

      <!-- Seal icon -->
      <circle cx="140" cy="66" r="8" fill="#FFF" :stroke="color" stroke-width="1.3" />
      <text x="140" y="69" text-anchor="middle" class="seal-text" :fill="color">BID</text>

      <!-- 3 bid cards going in -->
      <g transform="translate(22, 30)">
        <rect width="50" height="28" rx="4" fill="#FFF" stroke="#E5E7EB" stroke-width="0.8" />
        <circle cx="10" cy="10" r="3.5" :fill="color" opacity="0.3" />
        <text x="18" y="12" class="bid-label">Supplier A</text>
        <text x="25" y="23" text-anchor="middle" class="bid-price" :fill="color">???</text>
      </g>

      <g transform="translate(22, 68)">
        <rect width="50" height="28" rx="4" fill="#FFF" stroke="#E5E7EB" stroke-width="0.8" />
        <circle cx="10" cy="10" r="3.5" fill="#F59E0B" opacity="0.3" />
        <text x="18" y="12" class="bid-label">Supplier B</text>
        <text x="25" y="23" text-anchor="middle" class="bid-price" fill="#6B7280">???</text>
      </g>

      <g transform="translate(208, 30)">
        <rect width="50" height="28" rx="4" fill="#FFF" stroke="#E5E7EB" stroke-width="0.8" />
        <circle cx="10" cy="10" r="3.5" fill="#9CA3AF" opacity="0.3" />
        <text x="18" y="12" class="bid-label">Supplier C</text>
        <text x="25" y="23" text-anchor="middle" class="bid-price" fill="#6B7280">???</text>
      </g>

      <!-- Arrows pointing to envelope -->
      <path d="M72 46 L93 46" stroke="#D1D5DB" stroke-width="0.8" marker-end="url(#arr)" />
      <path d="M72 82 L93 72" stroke="#D1D5DB" stroke-width="0.8" marker-end="url(#arr)" />
      <path d="M208 46 L187 46" stroke="#D1D5DB" stroke-width="0.8" marker-end="url(#arr)" />

      <!-- Bottom label -->
      <rect x="98" y="96" width="84" height="18" rx="4" fill="#F3F4F6" />
      <text x="140" y="108" text-anchor="middle" class="bottom-label">Single blind submission</text>

      <defs>
        <marker id="arr" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto">
          <path d="M0 0 L5 2 L0 4" fill="#D1D5DB" />
        </marker>
      </defs>
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

.seal-text {
  font-size: 5.5px;
  font-weight: 700;
  font-family: Inter, system-ui, sans-serif;
}

.bid-label {
  font-size: 5px;
  fill: #9CA3AF;
  font-weight: 500;
  font-family: Inter, system-ui, sans-serif;
}

.bid-price {
  font-size: 7px;
  font-weight: 700;
  font-family: Inter, system-ui, sans-serif;
}

.bottom-label {
  font-size: 5.5px;
  fill: #6B7280;
  font-weight: 500;
  font-family: Inter, system-ui, sans-serif;
}
</style>
