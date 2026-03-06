<template>
  <v-container fluid class="py-6 px-6">
    <v-card variant="outlined">
      <!-- Column headers -->
      <div class="results-header">
        <span class="header-label">Lot</span>
        <span class="header-label center">Recommendation 1</span>
        <span class="header-label center">Recommendation 2</span>
        <span class="header-label center">Recommendation 3</span>
      </div>

      <!-- Lot blocks -->
      <div
        v-for="(lot, li) in store.lots"
        :key="lot.id"
        class="lot-block"
        :class="{ 'lot-block--expanded': store.expLot === li }"
      >
        <div class="lot-grid" @click="toggleExpand(li)">
          <!-- Col 1: Lot info -->
          <div class="lot-col">
            <div class="lot-index">Lot {{ li + 1 }}</div>
            <div class="lot-name">{{ lot.name }}</div>

            <!-- Stats expand smoothly below lot name -->
            <div class="lot-stats-anim" :class="{ open: store.expLot === li }">
              <div class="lot-stats-inner">
                <div class="lot-stat">
                  <div class="stat-icon">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="#6B7280" stroke-width="1.3" />
                      <path d="M8 4.5v7M5.5 6.5c0-1.1.9-2 2.5-2s2.5.9 2.5 2-1 1.5-2.5 2-2.5.9-2.5 2 .9 2 2.5 2 2.5-.9 2.5-2" stroke="#6B7280" stroke-width="1.2" stroke-linecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div class="stat-label">Spend</div>
                    <div class="stat-value">{{ fmtE(store.lotBaseline(lot), store.ccy) }}</div>
                  </div>
                </div>
                <div class="lot-stat">
                  <div class="stat-icon">
                    <svg width="16" height="13" viewBox="0 0 18 15" fill="none">
                      <circle cx="5.5" cy="4.5" r="2.5" stroke="#6B7280" stroke-width="1.3" />
                      <circle cx="12.5" cy="4.5" r="2.5" stroke="#6B7280" stroke-width="1.3" />
                      <path d="M1 14c0-2.8 2-4.5 4.5-4.5" stroke="#6B7280" stroke-width="1.3" stroke-linecap="round" />
                      <path d="M17 14c0-2.8-2-4.5-4.5-4.5" stroke="#6B7280" stroke-width="1.3" stroke-linecap="round" />
                      <circle cx="9" cy="5" r="3" stroke="#6B7280" stroke-width="1.3" />
                      <path d="M5 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#6B7280" stroke-width="1.3" stroke-linecap="round" />
                    </svg>
                  </div>
                  <div>
                    <div class="stat-label">Suppliers</div>
                    <div class="stat-value">{{ activeSupplierCount(lot) }}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Col 2–4: Recommendation cards (seamless chip + body) -->
          <template v-for="ri in 3" :key="ri">
            <div
              v-if="getTop3(li)[ri - 1]"
              class="rec-card"
              :class="{ 'rec-card--expanded': store.expLot === li }"
            >
              <!-- Chip header (always visible) -->
              <div class="rec-chip" :style="chipBg(li, ri - 1)">
                <div class="chip-accent" :style="accentBg(li, ri - 1)" />
                <div class="chip-top">
                  <span class="chip-family" :style="chipText(li, ri - 1)">
                    {{ displayName(li, ri - 1) }}
                  </span>
                  <span class="chip-pct" :style="chipText(li, ri - 1)">
                    {{ getTop3(li)[ri - 1].pctMatch }}%
                  </span>
                </div>
                <div class="chip-bar-track">
                  <div class="chip-bar-fill" :style="barFill(li, ri - 1)" />
                </div>
              </div>

              <!-- Expandable body (seamless below chip) -->
              <div class="rec-expand" :class="{ open: store.expLot === li }">
                <div class="rec-body">
                  <div class="body-accent" :style="accentBg(li, ri - 1)" />

                  <!-- Chart -->
                  <div class="body-chart">
                    <DecisionTreeCalculatorChartsAChart
                      :family="getTop3(li)[ri - 1].family"
                      :color="chartColor(li, ri - 1)"
                      :ccy="store.ccy"
                    />
                  </div>

                  <!-- Est. Savings -->
                  <div class="body-savings">
                    <span class="savings-label">Est. Savings:</span>
                    <span class="savings-chip">+{{ getTop3(li)[ri - 1].saving }}%</span>
                    <span
                      v-if="store.lotBaseline(lot) > 0"
                      class="savings-amount"
                    >
                      &#8776; {{ fmtE(Math.round(store.lotBaseline(lot) * getTop3(li)[ri - 1].saving / 100), store.ccy) }}
                    </span>
                  </div>

                  <!-- Option pills -->
                  <div class="body-options">
                    <DecisionTreeCalculatorOptionRow
                      v-if="getFamilyOptions(getTop3(li)[ri - 1].family).security"
                      label="Security"
                      :options="getFamilyOptions(getTop3(li)[ri - 1].family).security!"
                      selected="Pre-bid"
                    />
                    <DecisionTreeCalculatorOptionRow
                      v-if="getFamilyOptions(getTop3(li)[ri - 1].family).preference"
                      label="Preference"
                      :options="getFamilyOptions(getTop3(li)[ri - 1].family).preference!"
                      :selected="PREF_LABELS[lot.pref] || 'None'"
                    />
                    <DecisionTreeCalculatorOptionRow
                      v-if="getFamilyOptions(getTop3(li)[ri - 1].family).awarding"
                      label="Awarding"
                      :options="getFamilyOptions(getTop3(li)[ri - 1].family).awarding!"
                      :selected="getTop3(li)[ri - 1].aw"
                    />
                    <DecisionTreeCalculatorIntensityBar :value="lot.intens" />
                  </div>

                  <!-- Go to Configuration -->
                  <div class="body-btn-wrap">
                    <v-btn
                      color="primary"
                      variant="flat"
                      block
                      append-icon="mdi-arrow-right"
                      @click.stop="goToConfig"
                    >
                      Go to Configuration
                    </v-btn>
                  </div>
                </div>
              </div>
            </div>
            <!-- Empty placeholder when no recommendation -->
            <div v-else class="rec-empty" />
          </template>
        </div>
      </div>
    </v-card>

    <!-- Footer -->
    <div class="d-flex justify-center ga-8 mt-6">
      <v-btn
        variant="text"
        color="green"
        prepend-icon="mdi-refresh"
        @click="editInputs"
      >
        Edit inputs
      </v-btn>
      <v-btn
        variant="text"
        color="green"
        prepend-icon="mdi-download"
        @click="exportReport"
      >
        Export Report
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { FC, gfc, PREF_LABELS, getFamilyOptions } from '~/utils/decisionTree/constants'
import { fmtE } from '~/utils/decisionTree/formatting'
import type { Lot } from '~/stores/decisionTree/calculator'
import type { ScoreResult } from '~/utils/decisionTree/scoring-engine'

const store = useCalculatorStore()

const engC = FC['English']
const dutC = FC['Dutch']

function getTop3(li: number): ScoreResult[] {
  return store.lotTop3[li] || []
}

function activeSupplierCount(lot: Lot): number {
  return lot.prices.filter((p, i) => !lot.excl[i] && p > 0).length
}

function getColors(li: number, ri: number) {
  const rec = getTop3(li)[ri]
  if (!rec) return { c: gfc(''), isDbl: false }
  return { c: gfc(rec.family), isDbl: rec.family === 'Double Scenario' }
}

// --- Chip styles ---
function chipBg(li: number, ri: number) {
  const { c, isDbl } = getColors(li, ri)
  return {
    background: isDbl
      ? `linear-gradient(135deg, ${engC.bg} 0%, ${dutC.bg} 100%)`
      : c.bg,
  }
}

function accentBg(li: number, ri: number) {
  const { c, isDbl } = getColors(li, ri)
  return {
    background: isDbl
      ? `linear-gradient(180deg, ${engC.border} 0%, ${dutC.border} 100%)`
      : c.border,
  }
}

function chipText(li: number, ri: number) {
  const { c, isDbl } = getColors(li, ri)
  return { color: isDbl ? '#1D1D1B' : c.text }
}

function barFill(li: number, ri: number) {
  const rec = getTop3(li)[ri]
  const { c, isDbl } = getColors(li, ri)
  return {
    background: isDbl
      ? `linear-gradient(90deg, ${engC.border}, ${dutC.border})`
      : c.border,
    width: (rec?.pctMatch || 0) + '%',
  }
}

function displayName(li: number, ri: number): string {
  const rec = getTop3(li)[ri]
  if (!rec) return ''
  const names: Record<string, string> = {
    English: 'English Reverse',
    Dutch: 'Dutch Reverse',
    'Sealed Bid': 'Sealed Bid',
    Japanese: 'Japanese',
    'Double Scenario': 'Double Scenario',
  }
  return names[rec.family] || rec.family
}

function chartColor(li: number, ri: number): string {
  const rec = getTop3(li)[ri]
  if (!rec) return '#C7C7C7'
  return rec.family === 'Double Scenario' ? engC.border : gfc(rec.family).border
}

// --- Actions ---
function toggleExpand(li: number) {
  store.expLot = store.expLot === li ? -1 : li
}

function goToConfig() {
  store.phase = 2
}

function editInputs() {
  store.phase = 2
  store.expLot = 0
}

function exportReport() {
  window.print()
}
</script>

<style scoped>
/* ----------------------------------------------------------------
   Column headers
   ---------------------------------------------------------------- */
.results-header {
  display: grid;
  grid-template-columns: 160px 1fr 1fr 1fr;
  gap: 12px;
  padding: 14px 28px;
  border-bottom: 1px solid #E9EAEC;
}

.header-label {
  font-size: 12px;
  font-weight: 500;
  color: #61615F;
  letter-spacing: 0.03em;
}

.header-label.center {
  text-align: center;
}

/* ----------------------------------------------------------------
   Lot block — one per lot
   ---------------------------------------------------------------- */
.lot-block {
  border-bottom: 1px solid #E9EAEC;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.lot-block:last-child {
  border-bottom: none;
}

.lot-block--expanded {
  background: #F8F8F8;
}

.lot-grid {
  display: grid;
  grid-template-columns: 160px 1fr 1fr 1fr;
  gap: 12px;
  padding: 14px 28px;
  align-items: start;
}

/* ----------------------------------------------------------------
   Left column — lot info + expandable stats
   ---------------------------------------------------------------- */
.lot-col {
  padding-top: 4px;
  min-width: 0;
}

.lot-index {
  font-size: 11px;
  color: #61615F;
  font-weight: 500;
  margin-bottom: 2px;
}

.lot-name {
  font-weight: 600;
  font-size: 14px;
  color: #1D1D1B;
  line-height: 1.4;
}

/* Animated stats reveal */
.lot-stats-anim {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lot-stats-anim.open {
  grid-template-rows: 1fr;
}

.lot-stats-inner {
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 0;
  transition: padding-top 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lot-stats-anim.open .lot-stats-inner {
  padding-top: 18px;
}

.lot-stat {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stat-icon {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: #F8F8F8;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-label {
  font-size: 11px;
  color: #61615F;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1B;
}

/* ----------------------------------------------------------------
   Recommendation card — seamless chip + body
   ---------------------------------------------------------------- */
.rec-card {
  border-radius: 4px;
  overflow: hidden;
  min-width: 0;
}

.rec-card--expanded {
}

.rec-empty {
  min-width: 0;
}

/* Chip header (always visible) */
.rec-chip {
  padding: 11px 14px 11px 18px;
  position: relative;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.rec-chip:hover {
  opacity: 0.9;
}

.chip-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

.chip-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.chip-family {
  font-size: 12px;
  font-weight: 500;
}

.chip-pct {
  font-size: 12px;
  font-weight: 500;
}

.chip-bar-track {
  height: 4px;
  border-radius: 2px;
  background: rgba(0, 0, 0, 0.08);
}

.chip-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ----------------------------------------------------------------
   Expandable body — roll/unroll animation
   ---------------------------------------------------------------- */
.rec-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rec-expand.open {
  grid-template-rows: 1fr;
}

.rec-body {
  overflow: hidden;
  min-height: 0;
  background: #fff;
  position: relative;
}

.body-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
}

/* Chart */
.body-chart {
  padding: 16px 16px 0 20px;
}

/* Savings row */
.body-savings {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 16px 0 20px;
}

.savings-label {
  font-size: 13px;
  color: #61615F;
  font-weight: 500;
}

.savings-chip {
  background: #D1FAE5;
  color: #065F46;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
}

.savings-amount {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

/* Option pills */
.body-options {
  display: flex;
  flex-direction: column;
  gap: 9px;
  border-top: 1px solid #E9EAEC;
  margin: 14px 16px 0 20px;
  padding-top: 14px;
}

/* Go to Configuration button */
.body-btn-wrap {
  padding: 14px 16px 18px 20px;
}
</style>
