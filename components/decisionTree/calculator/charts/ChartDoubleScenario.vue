<template>
  <div class="chart-container">
    <svg viewBox="0 0 300 200" fill="none" :class="{ animated }">
      <defs>
        <marker id="axDsArr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0 0.5 L3.5 2 L0 3.5" stroke="#9CA3AF" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </marker>
      </defs>

      <!-- Phase tint backgrounds (behind axes) -->
      <rect x="38"  y="22" width="118" height="163" fill="#EFF6FF" opacity="0.55"/>
      <rect x="156" y="22" width="116" height="163" fill="#F5F3FF" opacity="0.55"/>

      <!-- Axes -->
      <line x1="38" y1="185" x2="38" y2="14" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axDsArr)"/>
      <line x1="38" y1="185" x2="278" y2="185" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axDsArr)"/>
      <text x="41" y="13" class="ax">Price</text>
      <text x="275" y="195" class="ax" text-anchor="end">Time</text>

      <!-- Grid -->
      <line x1="38" y1="52"  x2="272" y2="52"  stroke="#D1D5DB" stroke-width="0.4" stroke-dasharray="3 3"/>
      <line x1="38" y1="88"  x2="272" y2="88"  stroke="#D1D5DB" stroke-width="0.4" stroke-dasharray="3 3"/>
      <line x1="38" y1="124" x2="272" y2="124" stroke="#D1D5DB" stroke-width="0.4" stroke-dasharray="3 3"/>
      <line x1="38" y1="160" x2="272" y2="160" stroke="#D1D5DB" stroke-width="0.4" stroke-dasharray="3 3"/>

      <!-- Phase divider -->
      <line class="phase-divider" x1="156" y1="22" x2="156" y2="185" stroke="#7C3AED" stroke-width="1" stroke-dasharray="4 3" opacity="0.35"/>

      <!-- Phase labels -->
      <rect x="46"  y="24" width="76" height="13" rx="3" fill="#DBEAFE"/>
      <text x="84"  y="33" text-anchor="middle" class="ph" fill="#1E40AF">Phase 1 — English</text>
      <rect x="162" y="24" width="70" height="13" rx="3" fill="#EDE9FE"/>
      <text x="197" y="33" text-anchor="middle" class="ph" fill="#5B21B6">Phase 2 — Dutch</text>

      <!-- Phase 1: 3 suppliers competing DOWN (English reverse) -->
      <!-- C (lightest) -->
      <path class="path-ds-c" d="M48 56 L80 80 L112 101 L144 120" stroke="#D1D5DB" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle cx="48"  cy="56"  r="2.5" fill="#fff" stroke="#D1D5DB" stroke-width="1.1"/>
      <circle cx="80"  cy="80"  r="2.5" fill="#fff" stroke="#D1D5DB" stroke-width="1.1"/>
      <circle cx="112" cy="101" r="2.5" fill="#fff" stroke="#D1D5DB" stroke-width="1.1"/>
      <circle cx="144" cy="120" r="2.5" fill="#D1D5DB"/>
      <!-- B (grey) -->
      <path class="path-ds-b" d="M48 46 L80 70 L112 90 L144 110" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle cx="48"  cy="46"  r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.2"/>
      <circle cx="80"  cy="70"  r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.2"/>
      <circle cx="112" cy="90"  r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.2"/>
      <circle cx="144" cy="110" r="2.5" fill="#9CA3AF"/>
      <!-- A (accent) -->
      <path class="path-ds-a" d="M48 35 L80 59 L112 79 L144 99" :stroke="color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle cx="48"  cy="35"  r="3"   fill="#fff" :stroke="color" stroke-width="1.4"/>
      <circle cx="80"  cy="59"  r="2.5" fill="#fff" :stroke="color" stroke-width="1.3"/>
      <circle cx="112" cy="79"  r="2.5" fill="#fff" :stroke="color" stroke-width="1.3"/>
      <circle cx="144" cy="99"  r="3"   :fill="color"/>

      <!-- Phase 2: ascending staircase (Dutch) — purple -->
      <!-- Step areas -->
      <rect class="ds-area-s1" x="162" y="152" width="30" height="33" rx="1" fill="#7C3AED" opacity="0.07"/>
      <rect class="ds-area-s2" x="196" y="122" width="30" height="63" rx="1" fill="#7C3AED" opacity="0.11"/>
      <rect class="future-ds" x="230" y="94"  width="30" height="91" rx="1" fill="#F3F4F6" opacity="0.45"/>
      <!-- Step tops -->
      <line class="ds-top-s1" x1="162" y1="152" x2="192" y2="152" stroke="#7C3AED" stroke-width="2.2" stroke-linecap="round"/>
      <line class="ds-top-s2" x1="196" y1="122" x2="226" y2="122" stroke="#7C3AED" stroke-width="2.2" stroke-linecap="round"/>
      <line class="future-ds" x1="230" y1="94"  x2="260" y2="94"  stroke="#D1D5DB" stroke-width="2"   stroke-linecap="round" stroke-dasharray="4 3"/>
      <!-- Risers -->
      <line class="ds-riser-s1" x1="192" y1="152" x2="196" y2="122" stroke="#7C3AED" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="future-ds" x1="226" y1="122" x2="230" y2="94"  stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- Accept marker step 2 -->
      <g class="ds-accept">
        <circle cx="211" cy="122" r="9" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.4"/>
        <path d="M207.5 122 L210.5 125 L215.5 119" fill="none" stroke="#16A34A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
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
.ax { font-size: 7px;   fill: #6B7280; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.ph { font-size: 5.5px; font-weight: 700; font-family: Inter, system-ui, sans-serif; }

/* ── Animated state ── */

/* Phase 1: supplier paths draw in staggered */
svg.animated .path-ds-c {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 780ms ease-out 0ms 1 forwards;
}
svg.animated .path-ds-b {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 780ms ease-out 293ms 1 forwards;
}
svg.animated .path-ds-a {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 780ms ease-out 585ms 1 forwards;
}

/* Phase divider line fades in after English phase */
svg.animated .phase-divider {
  opacity: 0;
  animation: fadeIn 390ms ease-out 1365ms 1 forwards;
}

/* Phase 2: Dutch step tops */
svg.animated .ds-top-s1 { transform: scaleX(0); transform-origin: 162px 152px; animation: scaleXIn 293ms ease-out 1755ms 1 forwards; }
svg.animated .ds-top-s2 { transform: scaleX(0); transform-origin: 196px 122px; animation: scaleXIn 293ms ease-out 2145ms 1 forwards; }

/* Riser after step 1 top */
svg.animated .ds-riser-s1 { opacity: 0; animation: fadeIn 195ms ease-out 2048ms 1 forwards; }

/* Step areas fade in with their tops */
svg.animated .ds-area-s1 { opacity: 0; animation: fadeIn 293ms ease-out 1755ms 1 forwards; }
svg.animated .ds-area-s2 { opacity: 0; animation: fadeIn 293ms ease-out 2145ms 1 forwards; }

/* Future grey elements: hidden until after accept marker */
svg.animated .future-ds {
  opacity: 0;
  animation: fadeIn 500ms ease-out 3300ms 1 forwards;
}

/* Accept marker pops in last */
svg.animated .ds-accept {
  opacity: 0;
  transform: scale(0);
  transform-origin: 211px 122px;
  animation: popIn 488ms cubic-bezier(0.34, 1.56, 0.64, 1) 2730ms 1 forwards;
}

/* ── Keyframes ── */
@keyframes drawPath {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}

@keyframes scaleXIn {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
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
