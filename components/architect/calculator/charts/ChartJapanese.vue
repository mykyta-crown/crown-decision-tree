<template>
  <div class="chart-container">
    <svg viewBox="0 0 300 200" fill="none" :class="{ animated }">
      <defs>
        <marker id="axJpArr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0 0.5 L3.5 2 L0 3.5" stroke="#9CA3AF" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </marker>
      </defs>

      <!-- Axes -->
      <line x1="38" y1="185" x2="38" y2="14" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axJpArr)"/>
      <line x1="38" y1="185" x2="278" y2="185" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axJpArr)"/>
      <text x="41" y="13" class="ax">Price</text>
      <text x="275" y="195" class="ax" text-anchor="end">Time</text>

      <!-- Grid -->
      <line x1="38" y1="52"  x2="272" y2="52"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="88"  x2="272" y2="88"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="124" x2="272" y2="124" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="160" x2="272" y2="160" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>

      <!-- Round labels on x-axis -->
      <text x="61"  y="196" text-anchor="middle" class="rnd">R1</text>
      <text x="95"  y="196" text-anchor="middle" class="rnd">R2</text>
      <text x="129" y="196" text-anchor="middle" class="rnd">R3</text>
      <text x="163" y="196" text-anchor="middle" class="rnd">R4</text>
      <text x="197" y="196" text-anchor="middle" class="rnd">R5</text>

      <!-- Step lines (active) -->
      <line class="step-r1" x1="46"  y1="28"  x2="76"  y2="28"  :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="step-r2" x1="80"  y1="56"  x2="110" y2="56"  :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="step-r3" x1="114" y1="84"  x2="144" y2="84"  :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="step-r4" x1="148" y1="112" x2="178" y2="112" :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="step-r5" x1="182" y1="140" x2="212" y2="140" :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Step lines (future, grey dashed) -->
      <line class="future-jp" x1="216" y1="158" x2="246" y2="158" stroke="#D1D5DB" stroke-width="2"   stroke-linecap="round" stroke-dasharray="4 3"/>
      <line class="future-jp" x1="250" y1="172" x2="280" y2="172" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 3"/>

      <!-- Vertical drops (active) -->
      <line class="drop-r1" x1="76"  y1="28"  x2="80"  y2="56"  :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="drop-r2" x1="110" y1="56"  x2="114" y2="84"  :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="drop-r3" x1="144" y1="84"  x2="148" y2="112" :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="drop-r4" x1="178" y1="112" x2="182" y2="140" :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <!-- Vertical drops (future, grey) -->
      <line class="future-jp" x1="212" y1="140" x2="216" y2="158" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="future-jp" x1="246" y1="158" x2="250" y2="172" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- R1: 3 suppliers all in -->
      <g class="round-r1">
        <circle cx="54"  cy="20" r="4.5" fill="#fff" :stroke="color"  stroke-width="1.4"/>
        <circle cx="65"  cy="20" r="4.5" fill="#fff" stroke="#F59E0B" stroke-width="1.4"/>
        <circle cx="76"  cy="20" r="4.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.4"/>
      </g>

      <!-- R2: C exits → #3 -->
      <g class="round-r2">
        <circle cx="88"  cy="48" r="4.5" fill="#fff" :stroke="color"   stroke-width="1.4"/>
        <circle cx="99"  cy="48" r="4.5" fill="#fff" stroke="#F59E0B"  stroke-width="1.4"/>
        <circle cx="110" cy="48" r="4.5" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.4"/>
        <path d="M107.5 45.5 L112.5 50.5 M112.5 45.5 L107.5 50.5" stroke="#EF4444" stroke-width="1.2" stroke-linecap="round"/>
        <rect x="102" y="34" width="16" height="9" rx="2.5" fill="#FEE2E2" stroke="#EF4444" stroke-width="0.5"/>
        <text x="110" y="40.5" text-anchor="middle" class="rnk" fill="#EF4444">#3</text>
      </g>

      <!-- R3: 2 suppliers remain -->
      <g class="round-r3">
        <circle cx="122" cy="76" r="4.5" fill="#fff" :stroke="color"  stroke-width="1.4"/>
        <circle cx="134" cy="76" r="4.5" fill="#fff" stroke="#F59E0B" stroke-width="1.4"/>
      </g>

      <!-- R4: B exits → #2 -->
      <g class="round-r4">
        <circle cx="156" cy="104" r="4.5" fill="#fff" :stroke="color" stroke-width="1.4"/>
        <circle cx="168" cy="104" r="4.5" fill="#FEE2E2" stroke="#EF4444" stroke-width="1.4"/>
        <path d="M165.5 101.5 L170.5 106.5 M170.5 101.5 L165.5 106.5" stroke="#EF4444" stroke-width="1.2" stroke-linecap="round"/>
        <rect x="160" y="90" width="16" height="9" rx="2.5" fill="#FEE2E2" stroke="#EF4444" stroke-width="0.5"/>
        <text x="168" y="96.5" text-anchor="middle" class="rnk" fill="#EF4444">#2</text>
      </g>

      <!-- R5: A wins → #1 -->
      <g class="round-r5">
        <circle cx="196" cy="132" r="7" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.6"/>
        <path d="M193 132 L195.5 135 L200.5 129" fill="none" stroke="#16A34A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="188" y="118" width="16" height="9" rx="2.5" fill="#DCFCE7" stroke="#16A34A" stroke-width="0.5"/>
        <text x="196" y="124.5" text-anchor="middle" class="rnk" fill="#16A34A">#1</text>
      </g>

      <!-- "Price drops" annotation -->
      <line x1="263" y1="34" x2="263" y2="136" stroke="#D1D5DB" stroke-width="0.8"/>
      <path d="M260 130 L263 136 L266 130" fill="none" stroke="#D1D5DB" stroke-width="0.8" stroke-linecap="round"/>
      <text x="263" y="27" text-anchor="middle" class="ann">drops</text>
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
.ax  { font-size: 7px;   fill: #6B7280; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.rnd { font-size: 6px;   fill: #9CA3AF; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.rnk { font-size: 5.5px; font-weight: 700; font-family: Inter, system-ui, sans-serif; }
.ann { font-size: 6px;   fill: #9CA3AF; font-family: Inter, system-ui, sans-serif; }

/* ── Step lines: scaleX from left ── */
svg.animated .step-r1 { transform: scaleX(0); transform-origin: 46px 28px;   animation: scaleXIn 293ms ease-out 0ms    1 forwards; }
svg.animated .step-r2 { transform: scaleX(0); transform-origin: 80px 56px;   animation: scaleXIn 293ms ease-out 585ms  1 forwards; }
svg.animated .step-r3 { transform: scaleX(0); transform-origin: 114px 84px;  animation: scaleXIn 293ms ease-out 1170ms 1 forwards; }
svg.animated .step-r4 { transform: scaleX(0); transform-origin: 148px 112px; animation: scaleXIn 293ms ease-out 1755ms 1 forwards; }
svg.animated .step-r5 { transform: scaleX(0); transform-origin: 182px 140px; animation: scaleXIn 390ms ease-out 2340ms 1 forwards; }

/* ── Vertical drops: fade in after their step ── */
svg.animated .drop-r1 { opacity: 0; animation: fadeIn 195ms ease-out 293ms  1 forwards; }
svg.animated .drop-r2 { opacity: 0; animation: fadeIn 195ms ease-out 878ms  1 forwards; }
svg.animated .drop-r3 { opacity: 0; animation: fadeIn 195ms ease-out 1463ms 1 forwards; }
svg.animated .drop-r4 { opacity: 0; animation: fadeIn 195ms ease-out 2048ms 1 forwards; }

/* ── Round circles: appear with their step ── */
svg.animated .round-r1 { opacity: 0; animation: fadeIn 390ms ease-out 0ms    1 forwards; }
svg.animated .round-r2 { opacity: 0; animation: fadeIn 390ms ease-out 585ms  1 forwards; }
svg.animated .round-r3 { opacity: 0; animation: fadeIn 390ms ease-out 1170ms 1 forwards; }
svg.animated .round-r4 { opacity: 0; animation: fadeIn 390ms ease-out 1755ms 1 forwards; }

/* ── Future grey elements: hidden until after R5 winner ── */
svg.animated .future-jp {
  opacity: 0;
  animation: fadeIn 500ms ease-out 3050ms 1 forwards;
}

/* ── R5 winner: pop in with slight scale emphasis ── */
svg.animated .round-r5 {
  opacity: 0;
  transform: scale(0);
  transform-origin: 196px 132px;
  animation: popInWinner 585ms cubic-bezier(0.34, 1.56, 0.64, 1) 2340ms 1 forwards;
}

/* ── Keyframes ── */
@keyframes scaleXIn {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes popInWinner {
  0%   { opacity: 0; transform: scale(0); }
  60%  { opacity: 1; transform: scale(1.2); }
  100% { opacity: 1; transform: scale(1); }
}
</style>
