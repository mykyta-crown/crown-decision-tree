<template>
  <v-container fluid class="py-6 px-6">
    <v-card variant="outlined">
      <!-- Column headers -->
      <div class="results-header">
        <span class="header-label">{{ t('calc.phase3.lot') }}</span>
        <div class="header-rec">
          <span class="header-rank header-rank--1">1</span>
          <span class="header-rec-text header-rec-text--strong">{{ t('calc.phase3.bestMatch') }}</span>
        </div>
        <div class="header-rec">
          <span class="header-rank header-rank--2">2</span>
          <span class="header-rec-text">{{ t('calc.phase3.alternative') }}</span>
        </div>
        <div class="header-rec">
          <span class="header-rank header-rank--3">3</span>
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
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.99992 18.3332C13.6818 18.3332 16.6666 15.3484 16.6666 11.6665C16.6666 6.6665 9.99992 1.6665 9.99992 1.6665C9.67637 3.73894 9.35953 4.85115 8.33325 6.6665C7.33248 6.20392 7.08325 5.83317 6.66659 4.7915C4.99992 6.6665 3.33325 9.1665 3.33325 11.6665C3.33325 15.3484 6.31802 18.3332 9.99992 18.3332Z" stroke="#6B7280" stroke-linejoin="round"/>
                      <path d="M8.33325 14.1666L11.6666 10.8333" stroke="#6B7280" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M8.33325 10.8333H8.34072M11.6591 14.1666H11.6666" stroke="#6B7280" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div class="stat-label">{{ t('calc.phase3.spend') }}</div>
                    <div class="stat-value">{{ fmtE(store.lotBaseline(lot), store.ccy) }}</div>
                  </div>
                </div>
                <div class="lot-stat">
                  <div class="stat-icon">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.3117 15C17.9361 15 18.4328 14.6071 18.8787 14.0576C19.7916 12.9329 18.2928 12.034 17.7211 11.5938C17.14 11.1463 16.4912 10.8928 15.8333 10.8333M15 9.16667C16.1506 9.16667 17.0833 8.23393 17.0833 7.08333C17.0833 5.93274 16.1506 5 15 5" stroke="#6B7280" stroke-linecap="round"/>
                      <path d="M2.68846 15C2.06404 15 1.56739 14.6071 1.12145 14.0576C0.20857 12.9329 1.70739 12.034 2.27903 11.5938C2.86014 11.1463 3.50898 10.8928 4.16683 10.8333M4.5835 9.16667C3.4329 9.16667 2.50016 8.23393 2.50016 7.08333C2.50016 5.93274 3.4329 5 4.5835 5" stroke="#6B7280" stroke-linecap="round"/>
                      <path d="M6.73642 12.5925C5.88494 13.119 3.65241 14.1941 5.01217 15.5394C5.6764 16.1965 6.41619 16.6665 7.34627 16.6665H12.6536C13.5837 16.6665 14.3234 16.1965 14.9877 15.5394C16.3474 14.1941 14.1149 13.119 13.2634 12.5925C11.2667 11.3578 8.73313 11.3578 6.73642 12.5925Z" stroke="#6B7280" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M12.9166 6.24992C12.9166 7.86075 11.6107 9.16659 9.99992 9.16659C8.38909 9.16659 7.08325 7.86075 7.08325 6.24992C7.08325 4.63909 8.38909 3.33325 9.99992 3.33325C11.6107 3.33325 12.9166 4.63909 12.9166 6.24992Z" stroke="#6B7280"/>
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
              :class="{ 'rec-card--expanded': store.expLot === li, [`rec-card--col${ri}`]: true }"
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
                    <button class="card-btn-params" @click.stop="emit('learn-more', familyToKey(getTop3(li)[ri - 1].family))">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                      </svg>
                      {{ t('calc.phase3.learnMore') }}
                    </button>
                    <button v-if="getTop3(li)[ri - 1].family !== 'Traditional'" class="card-btn" @click.stop="openParams(li, ri - 1)">
                      {{ t('calc.auctionParams.viewParams') }}
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3.5 8h9M8.5 4l4 4-4 4" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
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

    <!-- Auction params modal -->
    <ArchitectCalculatorAuctionParamsModal
      v-if="paramsLotIndex >= 0"
      v-model="showParamsModal"
      :family="paramsFamily"
      :lot="store.lots[paramsLotIndex]"
      :lot-baseline="store.lotBaseline(store.lots[paramsLotIndex])"
      :ccy="store.ccy"
      :sup-names="store.supNames"
      :ev-name="store.evName"
    />

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
import { computeAuctionParams } from '~/utils/architect/computeAuctionParams'
import useTranslations from '~/composables/useTranslations'
import type { Lot } from '~/stores/architect/calculator'
import type { ScoreResult } from '~/utils/architect/scoring-engine'

const { t } = useTranslations('architect')
const emit = defineEmits<{ 'learn-more': [family: string] }>()

const store = useCalculatorStore()
const projectsStore = useProjectsStore()

const animatedLots = ref(new Set<number>())

// Auction params modal
const showParamsModal = ref(false)
const paramsFamily = ref('')
const paramsLotIndex = ref(-1)

function openParams(li: number, ri: number) {
  const rec = getTop3(li)[ri]
  if (!rec) return
  paramsLotIndex.value = li
  paramsFamily.value = rec.family
  showParamsModal.value = true
}

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
    lots: store.lots.map((lot, i) => {
      const top3 = getTop3(i)
      const baseline = store.lotBaseline(lot)
      const topFamily = top3[0]?.family ?? null
      return {
        ...lot,
        baseline,
        top3,
        params: topFamily
          ? computeAuctionParams(topFamily, lot.pref, lot.prices, lot.excl, baseline, store.builderParams) ?? undefined
          : undefined,
      }
    }),
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
  color: #595959;
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
  width: 20px;
  height: 20px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
  line-height: 1;
}
.header-rank--1 { background: #1D1D1B; color: #fff; }
.header-rank--2 { background: #E9EAEC; color: #595959; }
.header-rank--3 { background: #F3F4F6; color: #6B6B6B; }

.header-rec-text {
  font-size: 13px;
  font-weight: 400;
  color: #767676;
  line-height: 1;
}
.header-rec-text--strong {
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
  font-size: 12px;
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
  gap: 20px;
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
  font-size: 14px;
  font-weight: 700;
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

.rec-card--col2,
.rec-card--col3 {
  filter: grayscale(1);
  transition: filter 0.3s ease;
}
.rec-card--col2:hover,
.rec-card--col3:hover {
  filter: grayscale(0);
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
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* In expanded state the chip shouldn't grow — the expand body takes the rest */
.rec-card--expanded .rec-chip {
  flex: none;
}

.rec-chip:hover {
  opacity: 0.9;
}

.chip-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  flex: 1;
  margin-bottom: 6px;
  min-width: 0;
}

.chip-family {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.chip-pct {
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
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

.card-btn-params {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 9px 0;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #E9EAEC;
  cursor: pointer;
  transition: all 0.15s ease;
}

.card-btn-params:hover {
  background: #F9FAFB;
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
