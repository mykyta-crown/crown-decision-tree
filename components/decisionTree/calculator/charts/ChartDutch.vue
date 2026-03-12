<template>
  <div class="chart-container">
    <svg viewBox="0 0 300 200" fill="none" :class="{ animated }">
      <defs>
        <marker id="axDuArr" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0 0.5 L3.5 2 L0 3.5" stroke="#9CA3AF" stroke-width="0.8" fill="none" stroke-linecap="round"/>
        </marker>
      </defs>

      <!-- Axes -->
      <line x1="38" y1="185" x2="38" y2="14" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axDuArr)"/>
      <line x1="38" y1="185" x2="278" y2="185" stroke="#9CA3AF" stroke-width="1" marker-end="url(#axDuArr)"/>
      <text x="41" y="13" class="ax">Price</text>
      <text x="275" y="195" class="ax" text-anchor="end">Time</text>

      <!-- Grid -->
      <line x1="38" y1="52"  x2="272" y2="52"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="88"  x2="272" y2="88"  stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="124" x2="272" y2="124" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>
      <line x1="38" y1="160" x2="272" y2="160" stroke="#E9EAEC" stroke-width="0.5" stroke-dasharray="3 3"/>

      <!--
        Dutch auction: price ascends automatically each step.
        First supplier to accept the current price wins.
        7 steps shown: steps 1-5 active, steps 6-7 are unreached future.
        Acceptance happens at step 5.

        Steps (step top y, left x, right x):
          S1: y=168, x=48-76
          S2: y=147, x=80-108
          S3: y=126, x=112-140
          S4: y=105, x=144-172
          S5: y=84,  x=176-204  ← ACCEPT
          S6: y=63,  x=208-236  (future, grey)
          S7: y=42,  x=240-256  (future, grey)
      -->

      <!-- Step areas (accent fill, increasing opacity = more pressure) -->
      <rect class="area-s1" x="48"  y="168" width="28" height="17"  rx="1" :fill="color" opacity="0.05"/>
      <rect class="area-s2" x="80"  y="147" width="28" height="38"  rx="1" :fill="color" opacity="0.08"/>
      <rect class="area-s3" x="112" y="126" width="28" height="59"  rx="1" :fill="color" opacity="0.11"/>
      <rect class="area-s4" x="144" y="105" width="28" height="80"  rx="1" :fill="color" opacity="0.14"/>
      <rect class="area-s5" x="176" y="84"  width="28" height="101" rx="1" :fill="color" opacity="0.18"/>
      <!-- Future steps (grey) -->
      <rect class="future-du" x="208" y="63"  width="28" height="122" rx="1" fill="#F3F4F6" opacity="0.55"/>
      <rect class="future-du" x="240" y="42"  width="28" height="143" rx="1" fill="#F3F4F6" opacity="0.40"/>

      <!-- Step tops S1–S5 (accent colour) -->
      <line class="top-s1" x1="48"  y1="168" x2="76"  y2="168" :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="top-s2" x1="80"  y1="147" x2="108" y2="147" :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="top-s3" x1="112" y1="126" x2="140" y2="126" :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="top-s4" x1="144" y1="105" x2="172" y2="105" :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <line class="top-s5" x1="176" y1="84"  x2="204" y2="84"  :stroke="color" stroke-width="2.5" stroke-linecap="round"/>
      <!-- Step tops S6–S7 (grey dashed, future) -->
      <line class="future-du" x1="208" y1="63"  x2="236" y2="63"  stroke="#D1D5DB" stroke-width="2"   stroke-linecap="round" stroke-dasharray="4 3"/>
      <line class="future-du" x1="240" y1="42"  x2="268" y2="42"  stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" stroke-dasharray="3 3"/>

      <!-- Risers S1→S5 (accent) -->
      <line class="riser-s1" x1="76"  y1="168" x2="80"  y2="147" :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="riser-s2" x1="108" y1="147" x2="112" y2="126" :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="riser-s3" x1="140" y1="126" x2="144" y2="105" :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="riser-s4" x1="172" y1="105" x2="176" y2="84"  :stroke="color" stroke-width="1" stroke-dasharray="2 2"/>
      <!-- Risers S5→S7 (grey) -->
      <line class="future-du" x1="204" y1="84"  x2="208" y2="63"  stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2"/>
      <line class="future-du" x1="236" y1="63"  x2="240" y2="42"  stroke="#D1D5DB" stroke-width="1" stroke-dasharray="2 2"/>

      <!-- "Price rises" annotation (right edge) -->
      <g class="future-du">
        <line x1="272" y1="172" x2="272" y2="48" stroke="#D1D5DB" stroke-width="0.8"/>
        <path d="M269 54 L272 48 L275 54" fill="none" stroke="#D1D5DB" stroke-width="0.8" stroke-linecap="round"/>
        <text x="272" y="181" text-anchor="middle" class="ann">rises</text>
      </g>

      <!-- Accept marker on S5 (center x=190, y=84) -->
      <g class="accept-circle">
        <circle cx="190" cy="84" r="11" fill="#DCFCE7" stroke="#16A34A" stroke-width="1.6"/>
        <path d="M186.5 84 L189.5 87 L194.5 81" fill="none" stroke="#16A34A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
      </g>

      <!-- "First to accept wins" badge (above accept circle) -->
      <g class="win-badge">
        <rect x="149" y="60" width="82" height="12" rx="3" fill="#F0FDF4" stroke="#BBF7D0" stroke-width="0.5"/>
        <text x="190" y="68" text-anchor="middle" class="win">First to accept wins</text>
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
.ax  { font-size: 7px;   fill: #6B7280; font-weight: 600; font-family: Inter, system-ui, sans-serif; }
.ann { font-size: 6px;   fill: #9CA3AF; font-family: Inter, system-ui, sans-serif; }
.win { font-size: 5.5px; fill: #16A34A; font-weight: 700; font-family: Inter, system-ui, sans-serif; }

/* ── Animated state: step-by-step reveal ── */

/* Step tops: scaleX 0→1 from left edge */
svg.animated .top-s1 { transform: scaleX(0); transform-origin: 48px 168px; animation: scaleXIn 293ms ease-out 0ms    1 forwards; }
svg.animated .top-s2 { transform: scaleX(0); transform-origin: 80px 147px; animation: scaleXIn 293ms ease-out 390ms   1 forwards; }
svg.animated .top-s3 { transform: scaleX(0); transform-origin: 112px 126px; animation: scaleXIn 293ms ease-out 780ms  1 forwards; }
svg.animated .top-s4 { transform: scaleX(0); transform-origin: 144px 105px; animation: scaleXIn 293ms ease-out 1170ms 1 forwards; }
svg.animated .top-s5 { transform: scaleX(0); transform-origin: 176px 84px;  animation: scaleXIn 293ms ease-out 1560ms 1 forwards; }

/* Risers: fade in after their step top */
svg.animated .riser-s1 { opacity: 0; animation: fadeIn 195ms ease-out 293ms  1 forwards; }
svg.animated .riser-s2 { opacity: 0; animation: fadeIn 195ms ease-out 683ms  1 forwards; }
svg.animated .riser-s3 { opacity: 0; animation: fadeIn 195ms ease-out 1073ms 1 forwards; }
svg.animated .riser-s4 { opacity: 0; animation: fadeIn 195ms ease-out 1463ms 1 forwards; }

/* Step areas: fade in parallel with their step tops */
svg.animated .area-s1 { opacity: 0; animation: fadeInArea 293ms ease-out 0ms    1 forwards; }
svg.animated .area-s2 { opacity: 0; animation: fadeInArea 293ms ease-out 390ms  1 forwards; }
svg.animated .area-s3 { opacity: 0; animation: fadeInArea 293ms ease-out 780ms  1 forwards; }
svg.animated .area-s4 { opacity: 0; animation: fadeInArea 293ms ease-out 1170ms 1 forwards; }
svg.animated .area-s5 { opacity: 0; animation: fadeInArea 293ms ease-out 1560ms 1 forwards; }

/* Accept circle: pop in after last step */
svg.animated .accept-circle {
  opacity: 0;
  transform: scale(0);
  transform-origin: 190px 84px;
  animation: popIn 488ms cubic-bezier(0.34, 1.56, 0.64, 1) 2145ms 1 forwards;
}

/* Win badge: fade in after accept circle */
svg.animated .win-badge {
  opacity: 0;
  animation: fadeIn 390ms ease-out 2535ms 1 forwards;
}

/* Future grey elements: hidden until after accept circle */
svg.animated .future-du {
  opacity: 0;
  animation: fadeIn 500ms ease-out 2700ms 1 forwards;
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

/* Fade in areas to their final opacity values (the opacity attr handles the exact value) */
@keyframes fadeInArea {
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
