<template>
  <div class="chart-container">
    <svg viewBox="0 0 300 200" fill="none" :class="{ animated }">
      <defs>
        <marker id="axTrArr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0 0.5 L3.5 2 L0 3.5" stroke="#9CA3AF" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </marker>
      </defs>

      <!-- Axes -->
      <line x1="38" y1="185" x2="38" y2="14" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axTrArr)"/>
      <line x1="38" y1="185" x2="278" y2="185" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axTrArr)"/>
      <text x="41" y="13" class="ax">Price</text>
      <text x="275" y="195" class="ax" text-anchor="end">Time</text>

      <!-- Grid -->
      <line x1="38" y1="52"  x2="272" y2="52"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="88"  x2="272" y2="88"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="124" x2="272" y2="124" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="160" x2="272" y2="160" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>

      <!-- Seller ask — starts HIGH (low y), descends to agreement -->
      <path class="path-seller" d="M50 43 L92 57 L136 73 L178 91 L202 107" :stroke="color" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle class="dot-s0" cx="50"  cy="43"  r="3"   fill="#fff" :stroke="color" stroke-width="1.6"/>
      <circle class="dot-s1" cx="92"  cy="57"  r="2.5" fill="#fff" :stroke="color" stroke-width="1.4"/>
      <circle class="dot-s2" cx="136" cy="73"  r="2.5" fill="#fff" :stroke="color" stroke-width="1.4"/>
      <circle class="dot-s3" cx="178" cy="91"  r="2.5" fill="#fff" :stroke="color" stroke-width="1.4"/>
      <!-- Seller label -->
      <rect x="46" y="29" width="42" height="10" rx="2" :fill="color" opacity="0.13"/>
      <text x="67" y="36" text-anchor="middle" class="role" :fill="color">Seller ask ↓</text>

      <!-- Buyer offer — starts LOW (high y), rises toward agreement -->
      <path class="path-buyer" d="M50 141 L92 133 L136 125 L178 115 L202 107" stroke="#F59E0B" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle class="dot-b0" cx="50"  cy="141" r="3"   fill="#fff" stroke="#F59E0B" stroke-width="1.6"/>
      <circle class="dot-b1" cx="92"  cy="133" r="2.5" fill="#fff" stroke="#F59E0B" stroke-width="1.4"/>
      <circle class="dot-b2" cx="136" cy="125" r="2.5" fill="#fff" stroke="#F59E0B" stroke-width="1.4"/>
      <circle class="dot-b3" cx="178" cy="115" r="2.5" fill="#fff" stroke="#F59E0B" stroke-width="1.4"/>
      <!-- Buyer label -->
      <rect x="46" y="145" width="42" height="10" rx="2" fill="#FEF3C7"/>
      <text x="67" y="152" text-anchor="middle" class="role" fill="#92400E">Buyer offer ↑</text>

      <!-- Agreement point -->
      <g class="agreement-badge">
        <circle cx="202" cy="107" r="13" fill="#F0FDF4" stroke="#16A34A" stroke-width="1.6"/>
        <text x="202" y="111" text-anchor="middle" class="handshake">🤝</text>
      </g>

      <!-- "Agreement" badge -->
      <g class="agreement-label">
        <rect x="218" y="100" width="54" height="12" rx="3" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="0.5"/>
        <text x="245" y="108" text-anchor="middle" class="win">Agreement</text>
      </g>

      <!-- Round labels along x-axis -->
      <text x="50"  y="176" text-anchor="middle" class="rnd">R1</text>
      <text x="92"  y="176" text-anchor="middle" class="rnd">R2</text>
      <text x="136" y="176" text-anchor="middle" class="rnd">R3</text>
      <text x="178" y="176" text-anchor="middle" class="rnd">R4</text>
      <text x="202" y="176" text-anchor="middle" class="deal">Deal</text>
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ color: string; ccy?: string; animated?: boolean }>(), { ccy: 'EUR', animated: false })
</script>

<style scoped>
.chart-container {
  width: 100%; height: 200px;
  background: #FFFFFF;
  border-radius: 6px;
  border: 1px solid #D1D5DB;
  overflow: hidden;
}
.chart-container svg { width: 100%; height: 100%; }
.ax   { font-size: 7px;   fill: #6B7280; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.role { font-size: 5.5px; font-weight: 700; font-family: Inter, system-ui, sans-serif; }
.rnd  { font-size: 6px;   fill: #9CA3AF; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.deal { font-size: 6px;   fill: #16A34A; font-weight: 700; font-family: Inter, system-ui, sans-serif; }
.win  { font-size: 5.5px; fill: #16A34A; font-weight: 700; font-family: Inter, system-ui, sans-serif; }
.handshake { font-size: 10px; }

/* ── Animated state ── */

/* Both paths draw in simultaneously, same duration, arrive together */
svg.animated .path-seller {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 1800ms ease-in-out 0ms 1 forwards;
}
svg.animated .path-buyer {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 1800ms ease-in-out 0ms 1 forwards;
}

/* Dots for both curves: 1800ms / 4 segments = 450ms per segment */
svg.animated .dot-s0 { opacity: 0; animation: fadeIn 120ms ease-out 0ms    1 forwards; }
svg.animated .dot-s1 { opacity: 0; animation: fadeIn 120ms ease-out 450ms  1 forwards; }
svg.animated .dot-s2 { opacity: 0; animation: fadeIn 120ms ease-out 900ms  1 forwards; }
svg.animated .dot-s3 { opacity: 0; animation: fadeIn 120ms ease-out 1350ms 1 forwards; }

svg.animated .dot-b0 { opacity: 0; animation: fadeIn 120ms ease-out 0ms    1 forwards; }
svg.animated .dot-b1 { opacity: 0; animation: fadeIn 120ms ease-out 450ms  1 forwards; }
svg.animated .dot-b2 { opacity: 0; animation: fadeIn 120ms ease-out 900ms  1 forwards; }
svg.animated .dot-b3 { opacity: 0; animation: fadeIn 120ms ease-out 1350ms 1 forwards; }

/* Agreement badge scales in after both paths arrive */
svg.animated .agreement-badge {
  opacity: 0;
  transform: scale(0);
  transform-origin: 202px 107px;
  animation: popIn 585ms cubic-bezier(0.34, 1.56, 0.64, 1) 1950ms 1 forwards;
}

/* Agreement label fades in */
svg.animated .agreement-label {
  opacity: 0;
  animation: fadeIn 390ms ease-out 2535ms 1 forwards;
}

/* ── Keyframes ── */
@keyframes drawPath {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
