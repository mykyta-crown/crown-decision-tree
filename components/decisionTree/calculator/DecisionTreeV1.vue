<template>
  <v-dialog v-model="show" max-width="1500" scrollable>
    <v-card class="dt-card" rounded="lg">
      <!-- Header -->
      <div class="dt-header">
        <div class="d-flex align-center ga-3">
          <div class="dt-icon">
            <v-icon size="20" color="white">mdi-file-tree</v-icon>
          </div>
          <div>
            <div class="dt-title">Negotiation Scenarios</div>
            <div class="dt-sub">Decision tree overview</div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Canvas -->
      <div class="dt-canvas-wrap">
        <div class="dt-canvas">
          <!-- SVG connection lines -->
          <svg class="dt-svg" viewBox="0 0 1400 820" fill="none" preserveAspectRatio="xMidYMid meet">
            <defs>
              <marker id="dt1-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                <path d="M0 0 L8 3 L0 6 Z" fill="#1D1D1B" />
              </marker>
            </defs>

            <!-- Left conditions → Double Scenario -->
            <path d="M130 230 L100 290" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Left conditions → English chart area -->
            <path d="M350 230 L350 310" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- English card → Center conditions -->
            <path d="M430 420 Q480 380 510 360" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Center conditions → Dutch -->
            <path d="M600 310 Q630 270 660 240" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Center conditions → Japanese -->
            <path d="M600 400 Q630 450 660 490" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Dutch → Petit spend -->
            <path d="M840 210 Q870 240 890 265" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Japanese → Petit spend -->
            <path d="M840 560 Q870 490 890 410" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Petit spend (near Dutch) → Sealed Bid -->
            <path d="M960 290 L1000 330" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Petit spend (near Japanese) → Sealed Bid -->
            <path d="M960 415 L1000 390" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Top-right Petit spend → Traditional -->
            <path d="M1270 195 L1270 270" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />

            <!-- Top-right Petit spend (left) → Sealed Bid area -->
            <path d="M1090 195 L1060 330" stroke="#1D1D1B" stroke-width="1.2" stroke-dasharray="6 4" marker-end="url(#dt1-arrow)" />
          </svg>

          <!-- ═══ TOP-LEFT: Condition nodes (column 1 - for Double Scenario) ═══ -->
          <div class="cond" style="left: 40px; top: 150px">> 3 Suppliers</div>
          <div class="cond cond--wide" style="left: 10px; top: 190px">Gap &lt;7% between best offers</div>

          <!-- Condition nodes (column 2 - for English) -->
          <div class="cond" style="left: 270px; top: 150px">> 3 Suppliers</div>
          <div class="cond cond--wide" style="left: 235px; top: 190px">Gap &lt;7% between best offers</div>

          <!-- ═══ CENTER: Condition group ═══ -->
          <div class="cond-group" style="left: 500px; top: 310px">
            <div class="cond">&lt; 3 Suppliers</div>
            <div class="cond-or">OR</div>
            <div class="cond cond--wide">Gap > 7% between best offers</div>
          </div>

          <!-- ═══ RIGHT: Petit spend conditions ═══ -->
          <div class="cond" style="left: 880px; top: 270px">Small spend</div>
          <div class="cond" style="left: 880px; top: 395px">Small spend</div>
          <div class="cond" style="left: 1020px; top: 160px">Small spend</div>
          <div class="cond" style="left: 1210px; top: 160px">Small spend</div>

          <!-- ═══════════════════════════════ -->
          <!-- AUCTION TYPE CARDS             -->
          <!-- ═══════════════════════════════ -->

          <!-- Double Scenario -->
          <div class="acard" style="left: 15px; top: 300px">
            <div class="acard-name" :style="{ color: colors['Double Scenario'].text }">
              <div class="acard-dot" :style="{ background: colors['Double Scenario'].border }" />
              Double Scenario
            </div>
            <div class="acard-opts">
              <span class="opt">Pre bid</span>
              <span class="opt">Preference</span>
              <span class="opt opt--hi">Competition ++++</span>
              <span class="opt">Award / Post Award</span>
            </div>
          </div>

          <!-- English chart (floating illustration) -->
          <div class="chart-float" style="left: 295px; top: 260px">
            <DecisionTreeCalculatorChartsAChart family="English" :color="colors['English'].border" ccy="EUR" />
          </div>

          <!-- English -->
          <div class="acard" style="left: 270px; top: 380px">
            <div class="acard-name" :style="{ color: colors['English'].text }">
              <div class="acard-dot" :style="{ background: colors['English'].border }" />
              English Reverse
            </div>
            <div class="acard-opts">
              <span class="opt">Pre bid</span>
              <span class="opt">Preference</span>
              <span class="opt opt--hi">Competition +++</span>
              <span class="opt">Award / Post Award</span>
            </div>
          </div>

          <!-- Dutch chart (floating illustration) -->
          <div class="chart-float" style="left: 680px; top: 70px">
            <DecisionTreeCalculatorChartsAChart family="Dutch" :color="colors['Dutch'].border" ccy="EUR" />
          </div>

          <!-- Dutch -->
          <div class="acard" style="left: 650px; top: 190px">
            <div class="acard-name" :style="{ color: colors['Dutch'].text }">
              <div class="acard-dot" :style="{ background: colors['Dutch'].border }" />
              Dutch Reverse
            </div>
            <div class="acard-opts">
              <span class="opt">Pre bid</span>
              <span class="opt">Preference</span>
              <span class="opt opt--hi">Competition ++</span>
              <span class="opt opt--hi">Award</span>
            </div>
          </div>

          <!-- Japanese chart (floating illustration) -->
          <div class="chart-float" style="left: 680px; top: 430px">
            <DecisionTreeCalculatorChartsAChart family="Japanese" :color="colors['Japanese'].border" ccy="EUR" />
          </div>

          <!-- Japanese -->
          <div class="acard" style="left: 650px; top: 545px">
            <div class="acard-name" :style="{ color: colors['Japanese'].text }">
              <div class="acard-dot" :style="{ background: colors['Japanese'].border }" />
              Japanese Reverse
            </div>
            <div class="acard-opts">
              <span class="opt">Pre bid</span>
              <span class="opt">Preference</span>
              <span class="opt opt--hi">Competition ++</span>
              <span class="opt">Award / Post Award</span>
            </div>
          </div>

          <!-- Sealed Bid illustration (envelope) -->
          <div class="chart-float" style="left: 1020px; top: 260px">
            <DecisionTreeCalculatorChartsAChart family="Sealed Bid" :color="colors['Sealed Bid'].border" ccy="EUR" />
          </div>

          <!-- Sealed Bid -->
          <div class="acard" style="left: 1000px; top: 380px">
            <div class="acard-name" :style="{ color: colors['Sealed Bid'].text }">
              <div class="acard-dot" :style="{ background: colors['Sealed Bid'].border }" />
              Sealed Bid
            </div>
            <div class="acard-opts">
              <span class="opt">Preference</span>
              <span class="opt opt--hi">Competition +</span>
              <span class="opt">Award / Post Award</span>
            </div>
          </div>

          <!-- Traditional -->
          <div class="acard" style="left: 1210px; top: 280px">
            <div class="acard-name" :style="{ color: colors['Traditional'].text }">
              <div class="acard-dot" :style="{ background: colors['Traditional'].border }" />
              Traditional Negotiation
            </div>
            <div class="acard-opts">
              <span class="opt">Preference</span>
              <span class="opt">Post Award</span>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { FC } from '~/utils/decisionTree/constants'

const show = defineModel<boolean>({ default: false })

const colors = FC
</script>

<style scoped>
/* ── Dialog card ── */
.dt-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* ── Header ── */
.dt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #E9EAEC;
  flex-shrink: 0;
}

.dt-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #34D399 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dt-title {
  font-size: 16px;
  font-weight: 700;
  color: #1D1D1B;
}

.dt-sub {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 1px;
}

/* ── Canvas ── */
.dt-canvas-wrap {
  overflow: auto;
  background: #FAFAFA;
  flex: 1;
  padding: 24px;
}

.dt-canvas {
  position: relative;
  width: 1400px;
  height: 820px;
  margin: 0 auto;
}

.dt-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

/* ── Condition nodes ── */
.cond {
  position: absolute;
  background: #FFF;
  border: 1.5px solid #E5E7EB;
  border-radius: 8px;
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  z-index: 1;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cond--wide {
  font-size: 12px;
}

.cond-group {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  z-index: 1;
}

.cond-group .cond {
  position: static;
}

.cond-or {
  font-size: 13px;
  font-weight: 700;
  color: #1D1D1B;
}

/* ── Floating chart illustrations ── */
.chart-float {
  position: absolute;
  width: 160px;
  height: 100px;
  z-index: 1;
  background: #FFF;
  border: 1.5px solid #E9EAEC;
  border-radius: 12px;
  padding: 6px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.chart-float :deep(.chart-container) {
  height: 85px;
  border: none;
  background: transparent;
  padding: 0;
}

/* ── Auction type cards ── */
.acard {
  position: absolute;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.acard-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  white-space: nowrap;
}

.acard-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Option pills ── */
.acard-opts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.opt {
  display: block;
  background: #FFF;
  border: 1.5px solid #E9EAEC;
  border-radius: 8px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.opt--hi {
  background: #FFFBEB;
  border-color: #FDE68A;
  font-weight: 600;
  color: #1D1D1B;
}
</style>
