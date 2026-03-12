<template>
  <div class="chart-container">
    <svg viewBox="0 0 300 200" fill="none" :class="{ animated }">
      <defs>
        <marker id="axEnArr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0 0.5 L3.5 2 L0 3.5" stroke="#9CA3AF" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </marker>
      </defs>

      <!-- Axes -->
      <line x1="38" y1="185" x2="38" y2="14" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axEnArr)"/>
      <line x1="38" y1="185" x2="278" y2="185" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axEnArr)"/>
      <text x="41" y="13" class="ax">Price</text>
      <text x="275" y="195" class="ax" text-anchor="end">Time</text>

      <!-- Grid -->
      <line x1="38" y1="52"  x2="272" y2="52"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="88"  x2="272" y2="88"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="124" x2="272" y2="124" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="160" x2="272" y2="160" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>

      <!--
        English reverse auction: 3 suppliers bid their prices DOWN.
        Higher y = lower price = more competitive = better bid.

        Suppliers start at VERY DIFFERENT initial prices:
          A (accent): y=42  — most expensive (highest on chart)
          C (#C4C7CC): y=60 - middle price
          B (#9CA3AF): y=80 — cheapest at start (lowest on chart)

        A makes one massive early drop, crossing both C and B.
        B responds steeply, crossing A back.
        Then A and B grind down together, converging at (165,160),
        after which A separates decisively to win.

        Real drawn-path crossings:
          ~(66,71):   A's drop crosses C's line
          ~(78,96):   A's drop crosses B's line (A becomes cheapest)
          ~(100,126): B responds, crosses back below A
          (165,160):  A & B paths meet; A then pulls ahead to win
      -->

      <!-- ── C (exits mid-way) ── -->
      <path class="path-c" d="M52 60 L75 78 L100 96 L125 110 L148 122" stroke="#C4C7CC" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle cx="52"  cy="60"  r="2.5" fill="#fff" stroke="#C4C7CC" stroke-width="1.2"/>
      <circle cx="75"  cy="78"  r="2.5" fill="#fff" stroke="#C4C7CC" stroke-width="1.2"/>
      <circle cx="100" cy="96"  r="2.5" fill="#fff" stroke="#C4C7CC" stroke-width="1.2"/>
      <circle cx="125" cy="110" r="2.5" fill="#fff" stroke="#C4C7CC" stroke-width="1.2"/>
      <!-- C exits -->
      <g class="exit-c">
        <circle cx="148" cy="122" r="3.5" fill="#C4C7CC"/>
        <path d="M145.5 119.5 L150.5 124.5 M150.5 119.5 L145.5 124.5" stroke="#fff" stroke-width="1" stroke-linecap="round"/>
      </g>

      <!-- ── B (closest rival, crosses A twice) ── -->
      <!-- B starts cheapest, A undercuts it, B responds steeply, then A wins at (165,160) -->
      <path class="path-b" d="M52 80 L75 95 L90 100 L105 140 L135 152 L165 160 L200 165 L218 168" stroke="#9CA3AF" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle cx="52"  cy="80"  r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.3"/>
      <circle cx="75"  cy="95"  r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.3"/>
      <circle cx="90"  cy="100" r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.3"/>
      <circle cx="105" cy="140" r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.3"/>
      <circle cx="135" cy="152" r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.3"/>
      <circle cx="165" cy="160" r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.3"/>
      <circle cx="200" cy="165" r="2.5" fill="#fff" stroke="#9CA3AF" stroke-width="1.3"/>
      <!-- B exits -->
      <g class="exit-b">
        <circle cx="218" cy="168" r="3.5" fill="#9CA3AF"/>
        <path d="M215.5 165.5 L220.5 170.5 M220.5 165.5 L215.5 170.5" stroke="#fff" stroke-width="1.1" stroke-linecap="round"/>
      </g>

      <!-- ── A (winner) — huge initial drop, then races B to the bottom ── -->
      <path class="path-a" d="M52 42 L90 120 L115 136 L140 150 L165 160 L200 170 L240 174" :stroke="color" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" pathLength="1"/>
      <circle cx="52"  cy="42"  r="3"   fill="#fff" :stroke="color" stroke-width="1.6"/>
      <circle cx="90"  cy="120" r="2.5" fill="#fff" :stroke="color" stroke-width="1.5"/>
      <circle cx="115" cy="136" r="2.5" fill="#fff" :stroke="color" stroke-width="1.5"/>
      <circle cx="140" cy="150" r="2.5" fill="#fff" :stroke="color" stroke-width="1.5"/>
      <circle cx="165" cy="160" r="2.5" fill="#fff" :stroke="color" stroke-width="1.5"/>
      <circle cx="200" cy="170" r="2.5" fill="#fff" :stroke="color" stroke-width="1.5"/>
      <!-- A wins -->
      <g class="winner-badge">
        <circle cx="240" cy="174" r="11"  fill="#DCFCE7" stroke="#16A34A" stroke-width="1.8"/>
        <path d="M236 174 L239.5 177.5 L245 170" fill="none" stroke="#16A34A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- Legend (top-right, clear of all paths) -->
      <rect x="213" y="19" width="64" height="43" rx="4" fill="#F9FAFB" stroke="#E9EAEC" stroke-width="0.5"/>
      <circle cx="220" cy="31" r="3" :fill="color"/>
      <text x="226" y="34"  class="lg" :fill="color">A — wins</text>
      <circle cx="220" cy="44" r="3" fill="#9CA3AF"/>
      <text x="226" y="47"  class="lg" fill="#9CA3AF">B — #2</text>
      <circle cx="220" cy="57" r="3" fill="#C4C7CC"/>
      <text x="226" y="60"  class="lg" fill="#9CA3AF">C — #3</text>
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
.ax { font-size: 7px; fill: #6B7280; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.lg { font-size: 5.5px; font-weight: 600; font-family: Inter, system-ui, sans-serif; }

/* ── Default (no animation): paths fully visible ── */
.path-c,
.path-b,
.path-a {
  stroke-dasharray: 1;
  stroke-dashoffset: 0;
}

.exit-c,
.exit-b {
  opacity: 1;
}

.winner-badge {
  opacity: 1;
  transform: scale(1);
  transform-origin: 240px 174px;
}

/* ── Paused state (animated prop false): hide nothing, keep visible ── */
/* ── When animated=false, play-state is paused at 0%, so final state (forwards) shows initial keyframe value ── */
/* We use a different approach: default = visible, animated class triggers the animation FROM hidden to visible */

/* ── Animated state ── */
svg.animated .path-c {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 780ms ease-out 0ms 1 forwards;
}

svg.animated .path-b {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 975ms ease-out 390ms 1 forwards;
}

svg.animated .path-a {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: drawPath 1170ms ease-out 780ms 1 forwards;
}

svg.animated .exit-c {
  opacity: 0;
  animation: fadeIn 390ms ease-out 1755ms 1 forwards;
}

svg.animated .exit-b {
  opacity: 0;
  animation: fadeIn 390ms ease-out 1855ms 1 forwards;
}

svg.animated .winner-badge {
  opacity: 0;
  transform: scale(0);
  transform-origin: 240px 174px;
  animation: popIn 490ms cubic-bezier(0.34, 1.56, 0.64, 1) 2145ms 1 forwards;
}

/* ── Keyframes ── */
@keyframes drawPath {
  from {
    stroke-dashoffset: 1;
  }
  to {
    stroke-dashoffset: 0;
  }
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
