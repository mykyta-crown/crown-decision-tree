<template>
  <v-dialog v-model="show" max-width="720" scrollable>
    <v-card class="dt4-card" rounded="lg">
      <!-- Header -->
      <div class="dt4-header">
        <div class="d-flex align-center ga-3">
          <div class="dt4-icon">
            <v-icon size="20" color="white">mdi-tune-variant</v-icon>
          </div>
          <div>
            <div class="dt4-title">Quick Selector</div>
            <div class="dt4-sub">Select criteria to find the best auction type</div>
          </div>
        </div>
        <div class="d-flex align-center ga-2">
          <v-btn
            v-if="hasSelection"
            variant="text"
            size="small"
            color="grey-darken-1"
            prepend-icon="mdi-restart"
            @click="reset"
          >
            Reset
          </v-btn>
          <v-btn icon variant="text" size="small" @click="show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="dt4-body">
        <!-- Criteria rows -->
        <div class="dt4-criteria">
          <div v-for="(q, qi) in questions" :key="qi" class="crit-row">
            <div class="crit-label">
              <div class="crit-icon">{{ q.icon }}</div>
              <div>
                <div class="crit-name">{{ q.label }}</div>
                <div class="crit-hint">{{ q.hint }}</div>
              </div>
            </div>
            <div class="crit-pills">
              <button
                v-for="(opt, oi) in q.options"
                :key="oi"
                class="pill"
                :class="{ 'pill--active': sel[qi] === oi + 1 }"
                @click="toggle(qi, oi + 1)"
              >
                {{ opt }}
              </button>
            </div>
          </div>
        </div>

        <!-- Result -->
        <Transition name="result-fade">
          <div v-if="topResult" class="dt4-result">
            <div class="result-divider" />
            <div class="result-label">
              <v-icon size="16" class="mr-1">mdi-check-decagram</v-icon>
              Best match
            </div>

            <div class="result-card" :style="{ background: topColor.bg, borderColor: topColor.border }">
              <div class="result-accent" :style="{ background: topColor.border }" />
              <div class="result-main">
                <div class="result-title" :style="{ color: topColor.text }">{{ topResult.displayName }}</div>
                <div class="result-pct">{{ topResult.pctMatch }}% match</div>
                <div class="result-stats">
                  <div class="result-stat">
                    <span class="stat-label">Savings</span>
                    <span class="stat-value">{{ topResult.saving }}%</span>
                  </div>
                  <div class="result-stat">
                    <span class="stat-label">Family</span>
                    <span class="stat-value">{{ topResult.family }}</span>
                  </div>
                </div>
              </div>
              <div class="result-chart">
                <DecisionTreeCalculatorChartsAChart
                  :family="topResult.family"
                  :color="topColor.border"
                  ccy="EUR"
                />
              </div>
            </div>

            <!-- Runner-ups -->
            <div v-if="runners.length" class="runners">
              <div v-for="r in runners" :key="r.id" class="runner" :style="{ borderLeftColor: getFC(r.family).border }">
                <span class="runner-name">{{ r.displayName }}</span>
                <span class="runner-pct">{{ r.pctMatch }}%</span>
              </div>
            </div>
          </div>
        </Transition>

        <!-- Empty state -->
        <div v-if="!topResult" class="dt4-empty">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="18" stroke="#E5E7EB" stroke-width="2" stroke-dasharray="4 4" />
              <path d="M14 20h12M20 14v12" stroke="#D1D5DB" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <div class="empty-text">Select at least one criterion to see recommendations</div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { getScores, Q_OPTS, type ScoreResult } from '~/utils/decisionTree/scoring-engine'
import { FC, gfc } from '~/utils/decisionTree/constants'

const show = defineModel<boolean>({ default: false })
const store = useCalculatorStore()

interface DisplayResult extends ScoreResult {
  displayName: string
}

const questions = [
  { label: 'Spend', icon: '💰', hint: 'Total budget for this category', options: Q_OPTS[0] },
  { label: 'Suppliers', icon: '👥', hint: 'Number of qualified suppliers', options: Q_OPTS[1] },
  { label: 'Awarding', icon: '🏆', hint: 'How do you want to decide?', options: Q_OPTS[2] },
  { label: 'Preference', icon: '⚖️', hint: 'Preference for incumbents?', options: Q_OPTS[3] },
  { label: 'Intensity', icon: '🔥', hint: 'Level of competitive pressure', options: Q_OPTS[4] },
  { label: 'Price Gap', icon: '📊', hint: 'Spread between best offers', options: Q_OPTS[5] },
]

// Selection state: 0 = not selected, 1-3 = option index
const sel = ref<number[]>([0, 0, 0, 0, 0, 0])

const hasSelection = computed(() => sel.value.some(v => v > 0))

function toggle(qi: number, val: number) {
  sel.value[qi] = sel.value[qi] === val ? 0 : val
  sel.value = [...sel.value] // trigger reactivity
}

function reset() {
  sel.value = [0, 0, 0, 0, 0, 0]
}

const familyNames: Record<string, string> = {
  English: 'English',
  Dutch: 'Dutch',
  'Sealed Bid': 'Sealed Bid',
  Japanese: 'Japanese',
  'Double Scenario': 'Double Scenario',
  Traditional: 'Traditional Negotiation',
}

const tfLabels: Record<string, string> = {
  'Fixed+Dynamic': 'Transfo',
  Ceiling: 'Ceiling',
  Preference: 'Preferred',
  'Ceiling+Pref': 'Ceiling + Preferred',
}

function buildDisplayName(r: ScoreResult): string {
  const base = familyNames[r.family] || r.family
  if (r.family === 'Traditional' || r.family === 'Double Scenario') return base
  const parts = [base]
  if (r.tf && r.tf !== 'None' && r.tf !== '—') parts.push(tfLabels[r.tf] || r.tf)
  if (r.aw && r.aw !== '—') parts.push(r.aw)
  return parts.join(' - ')
}

const scores = computed<DisplayResult[]>(() => {
  if (!hasSelection.value) return []
  // Default unselected criteria to middle option (2)
  const vals = sel.value.map(v => v || 2)

  // Use store params (may have been customized via Base Table)
  const raw = getScores(
    store.params,
    vals[0], vals[1], vals[2], vals[3], vals[4], vals[5],
  )
  return raw
    .filter(r => !r.eliminated)
    .map(r => ({ ...r, displayName: buildDisplayName(r) }))
})

const topResult = computed(() => scores.value[0] || null)
const runners = computed(() => scores.value.slice(1, 4))
const topColor = computed(() => topResult.value ? gfc(topResult.value.family) : gfc(''))
function getFC(f: string) { return gfc(f) }

watch(show, (val) => { if (val) reset() })
</script>

<style scoped>
.dt4-card {
  overflow: hidden;
}

/* Header */
.dt4-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #E9EAEC;
}

.dt4-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #34D399 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dt4-title {
  font-size: 16px;
  font-weight: 700;
  color: #1D1D1B;
}

.dt4-sub {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 1px;
}

/* Body */
.dt4-body {
  padding: 24px;
}

/* Criteria */
.dt4-criteria {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.crit-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.crit-label {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 200px;
  flex-shrink: 0;
}

.crit-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.crit-name {
  font-size: 13px;
  font-weight: 600;
  color: #1D1D1B;
}

.crit-hint {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 1px;
}

.crit-pills {
  display: flex;
  gap: 6px;
  flex: 1;
}

.pill {
  flex: 1;
  padding: 9px 8px;
  border-radius: 8px;
  border: 1.5px solid #E5E7EB;
  background: #FFF;
  font-size: 12px;
  font-weight: 500;
  color: #6B7280;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  white-space: nowrap;
}

.pill:hover {
  border-color: #D1D5DB;
  background: #F9FAFB;
}

.pill--active {
  background: #1D1D1B;
  border-color: #1D1D1B;
  color: #FFF;
  font-weight: 600;
}

.pill--active:hover {
  background: #333;
  border-color: #333;
}

/* Result */
.dt4-result {
  margin-top: 24px;
}

.result-divider {
  height: 1px;
  background: #E9EAEC;
  margin-bottom: 20px;
}

.result-label {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 16px;
  background: #F0FDF4;
  color: #16A34A;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 14px;
}

.result-card {
  border: 2px solid;
  border-radius: 14px;
  display: flex;
  overflow: hidden;
  position: relative;
}

.result-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 5px;
}

.result-main {
  flex: 1;
  padding: 20px 20px 20px 24px;
}

.result-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.result-pct {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
  margin-bottom: 14px;
}

.result-stats {
  display: flex;
  gap: 20px;
}

.result-stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  font-size: 10px;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.stat-value {
  font-size: 14px;
  font-weight: 700;
  color: #1D1D1B;
}

.result-chart {
  width: 220px;
  padding: 10px 12px;
  flex-shrink: 0;
}

.result-chart :deep(.chart-container) {
  height: 100px;
  border: none;
  background: transparent;
  padding: 0;
}

/* Runners */
.runners {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.runner {
  flex: 1;
  padding: 10px 14px;
  border-radius: 8px;
  background: #F9FAFB;
  border-left: 3px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.runner-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.runner-pct {
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
}

/* Empty state */
.dt4-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 0 16px;
  gap: 12px;
}

.empty-text {
  font-size: 13px;
  color: #9CA3AF;
}

/* Transition */
.result-fade-enter-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.result-fade-leave-active {
  transition: all 0.2s ease;
}

.result-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.result-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
