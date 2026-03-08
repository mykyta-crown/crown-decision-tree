<template>
  <div class="chart-container">
    <svg viewBox="0 0 280 130" fill="none">
      <!-- Buyer -->
      <g transform="translate(70, 32)">
        <circle cx="0" cy="0" r="14" :fill="color" opacity="0.08" :stroke="color" stroke-width="1.2" />
        <circle cx="-3" cy="-2" r="1.2" fill="#374151" />
        <circle cx="3" cy="-2" r="1.2" fill="#374151" />
        <path d="M-3 3 Q0 6 3 3" fill="none" stroke="#374151" stroke-width="0.8" stroke-linecap="round" />
      </g>
      <text x="70" y="56" text-anchor="middle" class="role-label" :fill="color">Buyer</text>

      <!-- Seller -->
      <g transform="translate(210, 32)">
        <circle cx="0" cy="0" r="14" fill="#FEF3C7" stroke="#FCD34D" stroke-width="1.2" />
        <circle cx="-3" cy="-2" r="1.2" fill="#374151" />
        <circle cx="3" cy="-2" r="1.2" fill="#374151" />
        <path d="M-3 3 Q0 6 3 3" fill="none" stroke="#374151" stroke-width="0.8" stroke-linecap="round" />
      </g>
      <text x="210" y="56" text-anchor="middle" class="role-label" fill="#92400E">Seller</text>

      <!-- Back-and-forth arrows -->
      <path d="M90 28 L190 28" :stroke="color" stroke-width="1" marker-end="url(#arrR)" />
      <path d="M190 38 L90 38" stroke="#FCD34D" stroke-width="1" marker-end="url(#arrL)" />

      <!-- Price bubbles -->
      <g transform="translate(44, 70)">
        <rect width="52" height="22" rx="6" :fill="color" opacity="0.08" :stroke="color" stroke-width="0.8" />
        <text x="26" y="10" text-anchor="middle" class="bubble-label">Target</text>
        <text x="26" y="19" text-anchor="middle" class="bubble-price" :fill="color">{{ sym }}220</text>
      </g>

      <g transform="translate(184, 70)">
        <rect width="52" height="22" rx="6" fill="#FEF3C7" stroke="#FCD34D" stroke-width="0.8" />
        <text x="26" y="10" text-anchor="middle" class="bubble-label">Ask</text>
        <text x="26" y="19" text-anchor="middle" class="bubble-price" fill="#92400E">{{ sym }}300</text>
      </g>

      <!-- Handshake in center -->
      <circle cx="140" y="78" r="10" fill="#F0FDF4" stroke="#86EFAC" stroke-width="1" />
      <text x="140" y="81" text-anchor="middle" class="handshake-icon">&#129309;</text>

      <!-- Bottom label -->
      <rect x="100" y="102" width="80" height="16" rx="4" fill="#F3F4F6" />
      <text x="140" y="113" text-anchor="middle" class="bottom-label">Direct negotiation</text>

      <defs>
        <marker id="arrR" markerWidth="5" markerHeight="4" refX="5" refY="2" orient="auto">
          <path d="M0 0 L5 2 L0 4" :fill="color" />
        </marker>
        <marker id="arrL" markerWidth="5" markerHeight="4" refX="0" refY="2" orient="auto">
          <path d="M5 0 L0 2 L5 4" fill="#FCD34D" />
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

const sym = computed(() => {
  const m: Record<string, string> = { EUR: '\u20AC', USD: '$', GBP: '\u00A3', CHF: 'CHF', JPY: '\u00A5' }
  return m[props.ccy] || props.ccy
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

.role-label {
  font-size: 6.5px;
  font-weight: 600;
  font-family: Inter, system-ui, sans-serif;
}

.bubble-label {
  font-size: 5px;
  fill: #6B7280;
  font-weight: 500;
  font-family: Inter, system-ui, sans-serif;
}

.bubble-price {
  font-size: 7px;
  font-weight: 700;
  font-family: Inter, system-ui, sans-serif;
}

.handshake-icon {
  font-size: 10px;
}

.bottom-label {
  font-size: 5.5px;
  fill: #6B7280;
  font-weight: 500;
  font-family: Inter, system-ui, sans-serif;
}
</style>
