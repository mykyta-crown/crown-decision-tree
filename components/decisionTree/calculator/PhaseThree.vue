<template>
  <v-container fluid class="py-6 px-6">
    <v-card variant="outlined">
      <!-- Column headers -->
      <div class="results-header">
        <span class="header-label">Lot</span>
        <div class="header-rec">
          <span class="header-rank header-rank--1">1st</span>
          <span class="header-rec-text">Best Match</span>
        </div>
        <div class="header-rec">
          <span class="header-rank header-rank--2">2nd</span>
          <span class="header-rec-text">Alternative</span>
        </div>
        <div class="header-rec">
          <span class="header-rank header-rank--3">3rd</span>
          <span class="header-rec-text">Option</span>
        </div>
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
            <div class="lot-top-row">
              <div>
                <div class="lot-index">Lot {{ li + 1 }}</div>
                <div class="lot-name">{{ lot.name }}</div>
              </div>
              <div class="lot-chevron" :class="{ 'lot-chevron--open': store.expLot === li }">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M6 7.5L9 10.5L12 7.5" stroke="#9CA3AF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>

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

          <!-- Col 2–4: Recommendation cards -->
          <template v-for="ri in 3" :key="ri">
            <div
              v-if="getTop3(li)[ri - 1]"
              class="rec-card"
              :class="{ 'rec-card--expanded': store.expLot === li }"
            >
              <!-- Accent bar spanning full card height -->
              <div class="card-accent" :style="accentBg(li, ri - 1)" />
              <!-- Chip header (always visible — collapsed summary) -->
              <div class="rec-chip" :style="chipBg(li, ri - 1)">
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

              <!-- Expandable body (designer card layout) -->
              <div class="rec-expand" :class="{ open: store.expLot === li }">
                <div class="rec-body">
                  <!-- Savings row -->
                  <div class="card-savings">
                    <span class="savings-chip">+{{ getTop3(li)[ri - 1].saving }}%</span>
                    <span
                      v-if="store.lotBaseline(lot) > 0"
                      class="savings-amount"
                    >
                      &#8776; {{ fmtE(Math.round(store.lotBaseline(lot) * getTop3(li)[ri - 1].saving / 100), store.ccy) }}
                    </span>
                  </div>

                  <!-- Chart illustration -->
                  <div class="card-chart">
                    <DecisionTreeCalculatorChartsAChart
                      :family="getTop3(li)[ri - 1].family"
                      :color="chartColor(li, ri - 1)"
                      :ccy="store.ccy"
                    />
                  </div>

                  <!-- Option pills -->
                  <div class="card-options">
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
                      :selected="getAwardingSelected(li, ri - 1)"
                    />
                    <DecisionTreeCalculatorIntensityBar :family="getTop3(li)[ri - 1].family" />
                  </div>

                  <!-- Configure button -->
                  <div class="card-btn-wrap">
                    <button class="card-btn" @click.stop="goToConfig">
                      Configure
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                    </button>
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
import { useProjectsStore } from '~/stores/decisionTree/projects'
import { FC, gfc, PREF_LABELS, getFamilyOptions } from '~/utils/decisionTree/constants'
import { fmtE } from '~/utils/decisionTree/formatting'
import { exportDecisionTreePdf } from '~/utils/decisionTree/exportPdf'
import type { Lot } from '~/stores/decisionTree/calculator'
import type { ScoreResult } from '~/utils/decisionTree/scoring-engine'

const store = useCalculatorStore()
const projectsStore = useProjectsStore()

const engC = FC['English']
const dutC = FC['Dutch']

function getTop3(li: number): ScoreResult[] {
  return store.lotTop3[li] || []
}

function getAwardingSelected(li: number, ri: number): string {
  const rec = getTop3(li)[ri]
  if (!rec) return 'Award'
  if (rec.family === 'Double Scenario') return 'Award'
  return rec.aw && rec.aw !== '—' ? rec.aw : 'Award'
}

function activeSupplierCount(lot: Lot): number {
  return lot.prices.filter((p, i) => !lot.excl[i] && p > 0).length
}

function getColors(li: number, ri: number) {
  const rec = getTop3(li)[ri]
  if (!rec) return { c: gfc(''), isDbl: false }
  return { c: gfc(rec.family), isDbl: rec.family === 'Double Scenario' }
}

// --- Collapsed chip styles ---
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

  const familyNames: Record<string, string> = {
    English: 'English',
    Dutch: 'Dutch',
    'Sealed Bid': 'Sealed Bid',
    Japanese: 'Japanese',
    'Double Scenario': 'Double Scenario',
    Traditional: 'Traditional Negotiation',
  }

  const base = familyNames[rec.family] || rec.family
  if (rec.family === 'Traditional' || rec.family === 'Double Scenario') return base

  const tfLabels: Record<string, string> = {
    'Fixed+Dynamic': 'Transfo',
    Ceiling: 'Ceiling',
    Preference: 'Preferred',
    'Ceiling+Pref': 'Ceiling + Preferred',
  }

  const parts = [base]
  if (rec.tf && rec.tf !== 'None' && rec.tf !== '—') {
    parts.push(tfLabels[rec.tf] || rec.tf)
  }
  if (rec.aw && rec.aw !== '—') {
    parts.push(rec.aw)
  }
  return parts.join(' - ')
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
  exportDecisionTreePdf({
    evName: store.evName,
    userName: projectsStore.userName,
    mode: store.mode,
    spend: store.spend,
    nSup: store.nSup,
    award: store.award,
    ccy: store.ccy,
    totBase: store.totBase,
    supNames: store.supNames,
    lots: store.lots.map((lot, i) => ({
      ...lot,
      baseline: store.lotBaseline(lot),
      top3: getTop3(i),
    })),
  })
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
  font-size: 13px;
  font-weight: 500;
  color: #61615F;
  letter-spacing: 0.03em;
}

.header-rec {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.header-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
}

.header-rank--1 {
  background: #D1FAE5;
  color: #065F46;
}

.header-rank--2 {
  background: #FEF3C7;
  color: #92400E;
}

.header-rank--3 {
  background: #F3F4F6;
  color: #6B7280;
}

.header-rec-text {
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1B;
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
  align-items: stretch;
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

.lot-top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.lot-chevron {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.15s;
  flex-shrink: 0;
}

.lot-chevron:hover {
  background: #F3F4F6;
}

.lot-chevron--open {
  transform: rotate(180deg);
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
   Recommendation card — collapsed chip + expandable body
   ---------------------------------------------------------------- */
.rec-card {
  border-radius: 8px;
  overflow: hidden;
  min-width: 0;
  background: #FFF;
  display: flex;
  flex-direction: column;
  position: relative;
}

.card-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  z-index: 1;
}

.rec-card--expanded {
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.rec-empty {
  min-width: 0;
}

/* Chip header (collapsed summary) */
.rec-chip {
  padding: 11px 14px 11px 18px;
  position: relative;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.rec-chip:hover {
  opacity: 0.9;
}

.chip-top {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.chip-family {
  font-size: 14px;
  font-weight: 600;
}

.chip-pct {
  font-size: 14px;
  font-weight: 600;
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
   Expandable body — designer card layout
   ---------------------------------------------------------------- */
.rec-expand {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.rec-expand.open {
  grid-template-rows: 1fr;
  flex: 1;
}

.rec-body {
  overflow: hidden;
  min-height: 0;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* ── Savings row ── */
.card-savings {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 0;
}

.savings-chip {
  background: #D1FAE5;
  color: #065F46;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 13px;
  font-weight: 600;
}

.savings-amount {
  font-size: 14px;
  color: #374151;
  font-weight: 500;
}

/* ── Chart illustration ── */
.card-chart {
  margin: 12px 16px 0;
}

/* ── Option pills ── */
.card-options {
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding: 14px 16px 0;
}

/* ── Configure button (black, full width) ── */
.card-btn-wrap {
  padding: 14px 16px 16px;
  margin-top: auto;
}

.card-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px 0;
  border-radius: 8px;
  background: #1D1D1B;
  color: #FFF;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.card-btn:hover {
  background: #333;
}
</style>
