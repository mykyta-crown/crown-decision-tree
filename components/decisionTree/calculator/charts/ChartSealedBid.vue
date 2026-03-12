<template>
  <div class="chart-container">
    <svg viewBox="0 0 300 200" fill="none" :class="{ animated }">
      <defs>
        <marker id="axSbArr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0 0.5 L3.5 2 L0 3.5" stroke="#9CA3AF" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </marker>
        <marker id="sbRevArr" markerWidth="4" markerHeight="4" refX="3.5" refY="2" orient="auto">
          <path d="M0 0.5 L3.5 2 L0 3.5" stroke="#D1D5DB" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </marker>
      </defs>

      <!-- Axes -->
      <line x1="38" y1="185" x2="38" y2="14" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axSbArr)"/>
      <line x1="38" y1="185" x2="278" y2="185" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axSbArr)"/>
      <text x="41" y="13" class="ax">Price</text>
      <text x="275" y="195" class="ax" text-anchor="end">Time</text>

      <!-- Grid -->
      <line x1="38" y1="52"  x2="272" y2="52"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="88"  x2="272" y2="88"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="124" x2="272" y2="124" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="160" x2="272" y2="160" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>

      <!-- Phase labels -->
      <text x="94"  y="23" text-anchor="middle" class="ph">Submission</text>
      <text x="210" y="23" text-anchor="middle" class="ph">Revealed</text>

      <!-- Sealed zone background -->
      <rect class="sealed-zone" x="46" y="26" width="110" height="156" rx="3" fill="#F9FAFB"/>

      <!-- Opening line -->
      <line class="open-line" x1="158" y1="26" x2="158" y2="182" stroke="#D1D5DB" stroke-width="1" stroke-dasharray="4 3"/>
      <text x="158" y="24" text-anchor="middle" class="ph" fill="#9CA3AF">Open →</text>

      <!-- Sealed bid lines (dashed, unknown) -->
      <!-- A: lowest bid (winner) at y=152 -->
      <line class="bid-a" x1="52"  y1="152" x2="152" y2="152" :stroke="color" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.4"/>
      <text class="ques-a sealed" x="88"  y="148" text-anchor="middle" :fill="color">???</text>
      <!-- B: mid bid at y=110 -->
      <line class="bid-b" x1="52"  y1="110" x2="152" y2="110" stroke="#9CA3AF" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.4"/>
      <text class="ques-b sealed" x="88"  y="106" text-anchor="middle" fill="#9CA3AF">???</text>
      <!-- C: highest bid at y=67 -->
      <line class="bid-c" x1="52"  y1="67"  x2="152" y2="67"  stroke="#D1D5DB" stroke-width="1.3" stroke-dasharray="5 3" opacity="0.4"/>
      <text class="ques-c sealed" x="88"  y="63"   text-anchor="middle" fill="#C4C4C4">???</text>

      <!-- Arrows crossing opening line -->
      <line x1="154" y1="152" x2="168" y2="152" stroke="#D1D5DB" stroke-width="0.8" marker-end="url(#sbRevArr)"/>
      <line x1="154" y1="110" x2="168" y2="110" stroke="#D1D5DB" stroke-width="0.8" marker-end="url(#sbRevArr)"/>
      <line x1="154" y1="67"  x2="168" y2="67"  stroke="#D1D5DB" stroke-width="0.8" marker-end="url(#sbRevArr)"/>

      <!-- Revealed dots (prices now known) -->
      <!-- C — most expensive -->
      <g class="reveal-c">
        <circle cx="176" cy="67"  r="5" fill="#fff" stroke="#D1D5DB" stroke-width="1.4"/>
        <text x="184" y="70"  class="bid-lbl" fill="#9CA3AF">C</text>
      </g>
      <!-- B — mid -->
      <g class="reveal-b">
        <circle cx="176" cy="110" r="5" fill="#fff" stroke="#9CA3AF" stroke-width="1.4"/>
        <text x="184" y="113" class="bid-lbl" fill="#9CA3AF">B</text>
      </g>
      <!-- A — lowest price (wins) -->
      <g class="reveal-a">
        <circle cx="176" cy="152" r="5" fill="#fff" :stroke="color" stroke-width="1.4"/>
        <text x="184" y="155" class="bid-lbl" :fill="color">A</text>
      </g>

      <!-- Comparison bar connecting all 3 revealed dots, extending cleanly past each -->
      <line x1="176" y1="62" x2="176" y2="157" stroke="#E9EAEC" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- Connector from A's dot to winner badge -->
      <line x1="181" y1="152" x2="216" y2="152" :stroke="color" stroke-width="1.3"/>

      <!-- Winner badge -->
      <g class="winner-badge">
        <circle cx="228" cy="152" r="12" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.6"/>
        <path d="M224 152 L227.5 155.5 L233 148" fill="none" stroke="#16A34A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- "Lowest bid wins" caption -->
      <g class="win-caption">
        <rect x="216" y="167" width="52" height="10" rx="2.5" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="0.5"/>
        <text x="242" y="174" text-anchor="middle" class="win">Lowest bid wins</text>
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
.ax     { font-size: 7px;   fill: #6B7280; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.ph     { font-size: 6.5px; fill: #9CA3AF; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.sealed { font-size: 7.5px; font-weight: 700; font-family: Inter, system-ui, sans-serif; }
.bid-lbl { font-size: 6px; font-weight: 700; font-family: Inter, system-ui, sans-serif; }
.win    { font-size: 5.5px; fill: #16A34A; font-weight: 700; font-family: Inter, system-ui, sans-serif; }

/* ── Animated state ── */

/* Sealed zone fades in first */
svg.animated .sealed-zone {
  opacity: 0;
  animation: fadeIn 585ms ease-out 0ms 1 forwards;
}

/* Bid lines draw in using scaleX from left (x1=52) */
svg.animated .bid-a { transform: scaleX(0); transform-origin: 52px 152px; animation: scaleXIn 585ms ease-out 390ms  1 forwards; }
svg.animated .bid-b { transform: scaleX(0); transform-origin: 52px 110px; animation: scaleXIn 585ms ease-out 780ms  1 forwards; }
svg.animated .bid-c { transform: scaleX(0); transform-origin: 52px 67px;  animation: scaleXIn 585ms ease-out 1170ms 1 forwards; }

/* ??? texts fade with their lines */
svg.animated .ques-a { opacity: 0; animation: fadeIn 390ms ease-out 390ms  1 forwards; }
svg.animated .ques-b { opacity: 0; animation: fadeIn 390ms ease-out 780ms  1 forwards; }
svg.animated .ques-c { opacity: 0; animation: fadeIn 390ms ease-out 1170ms 1 forwards; }

/* Opening line fades in */
svg.animated .open-line {
  opacity: 0;
  animation: fadeIn 585ms ease-out 1755ms 1 forwards;
}

/* Revealed dots pop in staggered */
svg.animated .reveal-c {
  opacity: 0;
  transform: scale(0);
  transform-origin: 176px 67px;
  animation: popIn 293ms cubic-bezier(0.34, 1.56, 0.64, 1) 2145ms 1 forwards;
}
svg.animated .reveal-b {
  opacity: 0;
  transform: scale(0);
  transform-origin: 176px 110px;
  animation: popIn 293ms cubic-bezier(0.34, 1.56, 0.64, 1) 2340ms 1 forwards;
}
svg.animated .reveal-a {
  opacity: 0;
  transform: scale(0);
  transform-origin: 176px 152px;
  animation: popIn 293ms cubic-bezier(0.34, 1.56, 0.64, 1) 2535ms 1 forwards;
}

/* Winner badge */
svg.animated .winner-badge {
  opacity: 0;
  transform: scale(0);
  transform-origin: 228px 152px;
  animation: popIn 488ms cubic-bezier(0.34, 1.56, 0.64, 1) 2730ms 1 forwards;
}

/* Win caption */
svg.animated .win-caption {
  opacity: 0;
  animation: fadeIn 390ms ease-out 3023ms 1 forwards;
}

/* ── Keyframes ── */
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes scaleXIn {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
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
