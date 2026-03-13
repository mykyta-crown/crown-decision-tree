<template>
  <v-container fluid class="py-6 px-6">
    <v-card variant="outlined">
      <!-- Column headers -->
      <div class="results-header">
        <span class="header-label">{{ t('calc.phase3.lot') }}</span>
        <div class="header-rec">
          <span class="header-rank header-rank--1">{{ t('calc.phase3.rank1') }}</span>
          <span class="header-rec-text">{{ t('calc.phase3.bestMatch') }}</span>
        </div>
        <div class="header-rec">
          <span class="header-rank header-rank--2">{{ t('calc.phase3.rank2') }}</span>
          <span class="header-rec-text">{{ t('calc.phase3.alternative') }}</span>
        </div>
        <div class="header-rec">
          <span class="header-rank header-rank--3">{{ t('calc.phase3.rank3') }}</span>
          <span class="header-rec-text">{{ t('calc.phase3.option') }}</span>
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
                <div class="lot-index">{{ t('calc.phase3.lotPrefix') }} {{ li + 1 }}</div>
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
                    <div class="stat-label">{{ t('calc.phase3.spend') }}</div>
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
                    <div class="stat-label">{{ t('calc.phase3.suppliers') }}</div>
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
                  <!-- Savings row with label -->
                  <div class="card-savings">
                    <span class="savings-chip">+{{ getTop3(li)[ri - 1].saving }}%</span>
                    <span
                      v-if="store.lotBaseline(lot) > 0"
                      class="savings-amount"
                    >
                      &#8776; {{ fmtE(Math.round(store.lotBaseline(lot) * getTop3(li)[ri - 1].saving / 100), store.ccy) }}
                    </span>
                    <span class="savings-label">{{ t('calc.phase3.estSavings') }}</span>
                  </div>

                  <!-- Chart illustration -->
                  <div class="card-chart">
                    <ArchitectCalculatorChartsAChart
                      :family="getTop3(li)[ri - 1].family"
                      :color="chartColor(li, ri - 1)"
                      :ccy="store.ccy"
                      :animated="animatedLots.has(li)"
                    />
                  </div>

                  <!-- Option pills (blue variant with lighter selected state) -->
                  <div class="card-options">
                    <ArchitectCalculatorOptionRowBlue
                      v-if="getFamilyOptions(getTop3(li)[ri - 1].family).security"
                      :label="t('calc.phase3.security')"
                      :options="trPills(getFamilyOptions(getTop3(li)[ri - 1].family).security!)"
                      :selected="getSecuritySelected(li, ri - 1)"
                    />
                    <ArchitectCalculatorOptionRowBlue
                      v-if="getFamilyOptions(getTop3(li)[ri - 1].family).preference"
                      :label="t('calc.phase3.preference')"
                      :options="trPills(getFamilyOptions(getTop3(li)[ri - 1].family).preference!)"
                      :selected="trPrefLabels[lot.pref] || trPill('None')"
                    />
                    <ArchitectCalculatorOptionRowBlue
                      v-if="getFamilyOptions(getTop3(li)[ri - 1].family).awarding"
                      :label="t('calc.phase3.awarding')"
                      :options="trPills(getFamilyOptions(getTop3(li)[ri - 1].family).awarding!)"
                      :selected="getAwardingSelected(li, ri - 1)"
                    />
                    <ArchitectCalculatorIntensityBar :family="getTop3(li)[ri - 1].family" :label="t('calc.phase3.intensity')" />
                  </div>

                  <!-- Action buttons -->
                  <div class="card-btn-wrap">
                    <button class="card-btn" @click.stop="emit('learn-more', familyToKey(getTop3(li)[ri - 1].family))">
                      {{ t('calc.phase3.learnMore') }}
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

    <!-- Footer — black buttons -->
    <div class="d-flex justify-center ga-8 mt-6">
      <v-btn
        variant="text"
        color="#1D1D1B"
        prepend-icon="mdi-refresh"
        @click="editInputs"
      >
        {{ t('calc.phase3.editInputs') }}
      </v-btn>
      <v-btn
        variant="text"
        color="#1D1D1B"
        prepend-icon="mdi-download"
        @click="exportReport"
      >
        {{ t('calc.phase3.exportReport') }}
      </v-btn>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useCalculatorStore } from '~/stores/architect/calculator'
import { useProjectsStore } from '~/stores/architect/projects'
import { FC, gfc, PREF_LABELS, getFamilyOptions } from '~/utils/architect/constants'
import { fmtE } from '~/utils/architect/formatting'
import { exportArchitectPdf } from '~/utils/architect/exportPdf'
import useTranslations from '~/composables/useTranslations'
import type { Lot } from '~/stores/architect/calculator'
import type { ScoreResult } from '~/utils/architect/scoring-engine'

const { t } = useTranslations('architect')
const emit = defineEmits<{ 'learn-more': [family: string] }>()

const store = useCalculatorStore()
const projectsStore = useProjectsStore()

const animatedLots = ref(new Set<number>())

onMounted(() => {
  if (store.expLot >= 0) {
    nextTick(() => {
      setTimeout(() => {
        animatedLots.value = new Set([store.expLot])
      }, 50)
    })
  }
})

const engC = FC['English']
const dutC = FC['Dutch']

function getTop3(li: number): ScoreResult[] {
  return store.lotTop3[li] || []
}

// Translate option pill labels from English identifiers to current locale
const pillMap = computed(() => ({
  'Pre-bid': t('calc.phase3.preBidYes'),
  'No Pre-bid': t('calc.phase3.preBidNo'),
  'None': t('calc.phase3.prefNone'),
  'Non-Financial': t('calc.phase3.prefNonFin'),
  'Financial': t('calc.phase3.prefFinancial'),
  'Award': t('calc.phase3.awardAward'),
  'Rank': t('calc.phase3.awardRank'),
  'No Rank': t('calc.phase3.awardNoRank'),
} as Record<string, string>))

function trPill(s: string): string {
  return pillMap.value[s] || s
}

function trPills(arr: string[]): string[] {
  return arr.map(trPill)
}

const trPrefLabels = computed<Record<number, string>>(() => ({
  1: t('calc.phase3.prefNone'),
  2: t('calc.phase3.prefNonFin'),
  3: t('calc.phase3.prefFinancial'),
}))

function getSecuritySelected(li: number, ri: number): string {
  const rec = getTop3(li)[ri]
  if (!rec) return trPill('Pre-bid')
  // Sealed Bid only has 'No Pre-bid'; all others default to 'Pre-bid'
  if (rec.family === 'Sealed Bid') return trPill('No Pre-bid')
  return trPill('Pre-bid')
}

function getAwardingSelected(li: number, ri: number): string {
  const rec = getTop3(li)[ri]
  if (!rec) return trPill('Award')
  if (rec.family === 'Double Scenario') return trPill('Award')
  return rec.aw && rec.aw !== '—' ? trPill(rec.aw) : trPill('Award')
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
    English: t('families.english'),
    Dutch: t('families.dutch'),
    'Sealed Bid': t('families.sealedBid'),
    Japanese: t('families.japanese'),
    'Double Scenario': t('families.doubleScenario'),
    Traditional: t('families.traditional'),
  }

  const base = familyNames[rec.family] || rec.family
  if (rec.family === 'Traditional' || rec.family === 'Double Scenario') return base

  const tfLabels: Record<string, string> = {
    'Fixed+Dynamic': t('calc.rec.transfo'),
    Ceiling: t('calc.rec.ceiling'),
    Preference: t('calc.rec.preferred'),
    'Ceiling+Pref': t('calc.rec.ceilingPreferred'),
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

// Map family display name to the short key used in HowItWorksDialog
const familyKeyMap: Record<string, string> = {
  'Double Scenario': 'ds',
  English: 'en',
  Dutch: 'du',
  Japanese: 'jp',
  'Sealed Bid': 'sb',
  Traditional: 'tr',
}
function familyToKey(family: string): string {
  return familyKeyMap[family] || 'ds'
}

// --- Actions ---
function toggleExpand(li: number) {
  const isOpening = store.expLot !== li
  store.expLot = isOpening ? li : -1
  if (isOpening && !animatedLots.value.has(li)) {
    setTimeout(() => {
      animatedLots.value = new Set([...animatedLots.value, li])
    }, 50)
  }
}

function goToConfig() {
  store.phase = 2
}

function editInputs() {
  store.phase = 2
  store.expLot = 0
}

function exportReport() {
  exportArchitectPdf({
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
  font-size: 12px;
  font-weight: 400;
  color: #787878;
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
  font-size: 12px;
  font-weight: 400;
  color: #787878;
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
  font-size: 12px;
  color: #61615F;
  font-weight: 500;
}

.stat-value {
  font-size: 12px;
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

/* ── Savings row with label ── */
.card-savings {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px 0;
}

.savings-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
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
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-btn-learn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 0;
  border-radius: 8px;
  background: transparent;
  color: #6B7280;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #E9EAEC;
  cursor: pointer;
  transition: all 0.15s ease;
}

.card-btn-learn:hover {
  background: #F9FAFB;
  color: #1D1D1B;
  border-color: #D1D5DB;
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

/* ── Responsive ── */
@media (max-width: 1100px) {
  .results-header {
    grid-template-columns: 120px 1fr 1fr 1fr;
    padding: 12px 16px;
    gap: 8px;
  }
  .lot-grid {
    grid-template-columns: 120px 1fr 1fr 1fr;
    padding: 12px 16px;
    gap: 8px;
  }
}

@media (max-width: 900px) {
  .results-header {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px 16px;
  }
  .results-header .header-label {
    grid-column: 1 / -1;
  }
  .lot-grid {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 12px 16px;
  }
  .lot-col {
    border-bottom: 1px solid #E9EAEC;
    padding-bottom: 10px;
  }
  .rec-card {
    min-height: auto;
  }
  .chip-family {
    font-size: 13px;
  }
}

@media (max-width: 600px) {
  .results-header {
    grid-template-columns: 1fr;
    gap: 4px;
    padding: 10px 12px;
  }
  .lot-grid {
    padding: 10px 12px;
  }
  .card-savings {
    padding: 8px 12px 0;
  }
  .card-chart {
    margin: 8px 12px 0;
  }
  .card-options {
    padding: 10px 12px 0;
  }
  .card-btn-wrap {
    padding: 10px 12px 12px;
  }
}
</style>
