<template>
  <v-dialog v-model="show" max-width="850" width="90%">
    <v-card class="dt4-card" rounded="lg" :style="{ height: '820px', maxHeight: '92vh' }">
      <!-- Header -->
      <div class="dt4-header">
        <div class="d-flex align-center ga-3">
          <div class="dt4-icon">
            <v-icon size="15" color="white">mdi-tune-variant</v-icon>
          </div>
          <div>
            <div class="dt4-title">{{ t('v4.title') }}</div>
            <div class="dt4-sub">{{ t('v4.subtitle') }}</div>
          </div>
        </div>
        <div class="d-flex align-center ga-1">
          <v-btn
            v-if="hasSelection"
            icon
            variant="text"
            size="x-small"
            color="grey-darken-1"
            :title="t('v4.reset')"
            @click="reset"
          >
            <v-icon size="15">mdi-restart</v-icon>
          </v-btn>
          <v-btn icon variant="text" size="small" @click="show = false">
            <v-icon size="17">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <div class="dt4-body">
        <!-- Criteria rows -->
        <div class="dt4-criteria">
          <div v-for="(q, qi) in questions" :key="qi" class="crit-row">
            <div class="crit-label">
              <v-icon :icon="q.icon" size="18" color="#9CA3AF" class="crit-icon" />
              <div>
                <div class="crit-name">
                  {{ q.label }}
                  <v-tooltip v-if="q.tooltip" location="top end" max-width="240" content-class="bg-white text-black border text-body-2">
                    <template #activator="{ props: tip }">
                      <v-icon v-bind="tip" size="12" color="#C4C4C4" style="cursor:help;vertical-align:middle;margin-left:3px">mdi-information-outline</v-icon>
                    </template>
                    <span style="font-size:12px;line-height:1.5">{{ q.tooltip }}</span>
                  </v-tooltip>
                </div>
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

        <!-- Bottom area — fixed height reserved from the start -->
        <div class="dt4-bottom">
          <!-- Result -->
          <Transition name="result-fade">
            <div v-if="topResult" class="dt4-result">
              <div class="result-divider" />
              <div class="result-label">
                <v-icon size="16" class="mr-1">mdi-check-decagram</v-icon>
                {{ t('v4.bestMatch') }}
              </div>

              <div class="result-card" :style="{ background: topColor.bg, borderColor: topColor.border }">
                <div class="result-accent" :style="{ background: topColor.border }" />
                <div class="result-main">
                  <div class="result-title" :style="{ color: topColor.text }">{{ topResult.displayName }}</div>
                  <div class="result-pct">{{ topResult.pctMatch }}% {{ t('v4.match') }}</div>
                  <div class="result-stats">
                    <div class="result-stat">
                      <span class="stat-label">{{ t('v4.savingsLabel') }}</span>
                      <span class="stat-value">{{ topResult.saving }}%</span>
                    </div>
                    <div class="result-stat">
                      <span class="stat-label">{{ t('v4.familyLabel') }}</span>
                      <span class="stat-value">{{ topResult.family }}</span>
                    </div>
                  </div>
                  <button class="result-learn-btn" @click="openLearnMore(topResult.family)">
                    {{ t('v4.learnMore') }}
                    <v-icon size="13">mdi-arrow-right</v-icon>
                  </button>
                </div>
                <div class="result-chart">
                  <ArchitectCalculatorChartsAChart
                    :family="topResult.family"
                    :color="topColor.border"
                    ccy="EUR"
                  />
                </div>
              </div>

              <!-- Runner-ups — always 3 slots to keep stable height -->
              <div class="runners">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="runner"
                  :class="{ 'runner--ghost': i > runners.length }"
                  :style="i <= runners.length ? { borderLeftColor: getFC(runners[i - 1].family).border } : {}"
                >
                  <span v-if="i <= runners.length" class="runner-name">{{ runners[i - 1].displayName }}</span>
                  <span v-if="i <= runners.length" class="runner-pct">{{ runners[i - 1].pctMatch }}%</span>
                </div>
              </div>
            </div>
          </Transition>

          <!-- Progress / empty state -->
          <div v-if="!topResult" class="dt4-empty">
            <div class="empty-progress">
              <div class="progress-dots">
                <div
                  v-for="i in 6"
                  :key="i"
                  class="progress-dot"
                  :class="{ 'progress-dot--filled': sel[i - 1] > 0 }"
                />
              </div>
              <div class="empty-text">
                {{ selectedCount }} / 6 {{ t('v4.emptyState') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <ArchitectCalculatorHowItWorksDialog
      v-model="showHiw"
      initial-section="families"
      :initial-family="hiwFamily"
    />
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useCalculatorStore } from '~/stores/architect/calculator'
import { getScoresPartial, Q_OPTS, DEF_BASES, DEF_SAVINGS, DEF_MATRIX, type ScoreResult } from '~/utils/architect/scoring-engine'

// Quick Selector always uses default scoring params — never project-specific tuning
const DEF_PARAMS = { bases: DEF_BASES, savings: DEF_SAVINGS, matrix: DEF_MATRIX }
import { FC, gfc } from '~/utils/architect/constants'
import useTranslations from '~/composables/useTranslations'

const { t, pageTranslations } = useTranslations('architect')
const show = defineModel<boolean>({ default: false })
const store = useCalculatorStore()

interface DisplayResult extends ScoreResult {
  displayName: string
}

const questions = computed(() => [
  { label: t('v4.spend'),        icon: 'mdi-cash-multiple',         hint: t('v4.spendHint'),      options: pageTranslations.value?.v4?.spendOpts      || Q_OPTS[0] },
  { label: t('v4.suppliers'),    icon: 'mdi-account-group-outline', hint: t('v4.suppliersHint'),  options: pageTranslations.value?.v4?.suppliersOpts  || Q_OPTS[1] },
  { label: t('v4.awarding'),     icon: 'mdi-trophy-outline',        hint: t('v4.awardingHint'),   options: pageTranslations.value?.v4?.awardingOpts   || Q_OPTS[2], tooltip: t('v4.awardingTooltip') },
  { label: t('v4.preferenceQ'),  icon: 'mdi-star-outline',          hint: t('v4.preferenceHint'), options: pageTranslations.value?.v4?.preferenceOpts || Q_OPTS[3], tooltip: t('v4.preferenceTooltip') },
  { label: t('v4.intensity'),    icon: 'mdi-fire',                  hint: t('v4.intensityHint'),  options: pageTranslations.value?.v4?.intensityOpts  || Q_OPTS[4], tooltip: t('v4.intensityTooltip') },
  { label: t('v4.priceGap'),     icon: 'mdi-ruler',                 hint: t('v4.priceGapHint'),   options: pageTranslations.value?.v4?.priceGapOpts   || Q_OPTS[5], tooltip: t('v4.priceGapTooltip') },
])

// Selection state: 0 = not selected, 1-3 = option index
const sel = ref<number[]>([0, 0, 0, 0, 0, 0])

const hasSelection = computed(() => sel.value.some(v => v > 0))
const selectedCount = computed(() => sel.value.filter(v => v > 0).length)

function toggle(qi: number, val: number) {
  sel.value[qi] = sel.value[qi] === val ? 0 : val
  sel.value = [...sel.value] // trigger reactivity
}

function reset() {
  sel.value = [0, 0, 0, 0, 0, 0]
}

function getFamilyName(family: string): string {
  const map: Record<string, string> = {
    English: t('families.english'),
    Dutch: t('families.dutch'),
    'Sealed Bid': t('families.sealedBid'),
    Japanese: t('families.japanese'),
    'Double Scenario': t('families.doubleScenario'),
    Traditional: t('families.traditional'),
  }
  return map[family] || family
}

const tfLabels = computed<Record<string, string>>(() => ({
  'Fixed+Dynamic': t('calc.rec.transfo'),
  Ceiling: t('calc.rec.ceiling'),
  Preference: t('calc.rec.preferred'),
  'Ceiling+Pref': t('calc.rec.ceilingPreferred'),
}))

function buildDisplayName(r: ScoreResult): string {
  const base = getFamilyName(r.family)
  if (r.family === 'Traditional' || r.family === 'Double Scenario') return base
  const parts = [base]
  if (r.tf && r.tf !== 'None' && r.tf !== '—') parts.push(tfLabels.value[r.tf] || r.tf)
  if (r.aw && r.aw !== '—') parts.push(r.aw)
  return parts.join(' - ')
}

const scores = computed<DisplayResult[]>(() => {
  if (!hasSelection.value) return []
  const raw = getScoresPartial(
    DEF_PARAMS,
    sel.value[0], sel.value[1], sel.value[2], sel.value[3], sel.value[4], sel.value[5],
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

const showHiw = ref(false)
const hiwFamily = ref('')
const familyKeyMap: Record<string, string> = {
  'Double Scenario': 'ds', English: 'en', Dutch: 'du',
  Japanese: 'jp', 'Sealed Bid': 'sb', Traditional: 'tr',
}
function openLearnMore(family: string) {
  hiwFamily.value = familyKeyMap[family] || 'en'
  showHiw.value = true
}
</script>

<style scoped>
.dt4-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Header */
.dt4-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: linear-gradient(to bottom, #F3F4F6, #FAFAFA);
  border-bottom: 1px solid #E9EAEC;
}

.dt4-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: #1D1D1B;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06) inset;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dt4-title {
  font-size: 14px;
  font-weight: 700;
  color: #1D1D1B;
}

.dt4-sub {
  font-size: 12px;
  color: #757575;
  margin-top: 1px;
}

/* Body */
.dt4-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px;
}

/* Bottom — fixed height = full result section (badge + card + 3 runners) */
.dt4-bottom {
  height: 400px;
  flex-shrink: 0;
}

/* Criteria */
.dt4-criteria {
  display: grid;
  grid-template-columns: 260px 1fr 1fr 1fr;
  gap: 12px 16px;
  align-items: center;
}

.crit-row {
  display: contents;
}

.crit-label {
  display: flex;
  align-items: center;
  gap: 10px;
}

.crit-icon {
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
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1B;
}

.crit-hint {
  font-size: 12px;
  color: #757575;
  margin-top: 2px;
  white-space: nowrap;
}

.crit-pills {
  grid-column: 2 / -1;
  display: flex;
  gap: 8px;
}

.pill {
  flex: 1;
  min-height: 40px;
  padding: 9px 8px;
  border-radius: 8px;
  border: 1.5px solid #E5E7EB;
  background: #FFF;
  font-size: 14px;
  font-weight: 500;
  color: #636363;
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

.result-learn-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 12px;
  padding: 0;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  cursor: pointer;
  transition: color 0.15s;
}

.result-learn-btn:hover {
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
  min-width: 0;
  padding: 10px 14px;
  border-radius: 8px;
  background: #F9FAFB;
  border-left: 3px solid;
  display: flex;
  justify-content: space-between;
  align-items: center;
  overflow: hidden;
  gap: 6px;
}

.runner-name {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
}

.runner-pct {
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
}

.runner--ghost {
  visibility: hidden;
}

/* Empty state */
.dt4-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 0 16px;
}

.empty-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.progress-dots {
  display: flex;
  gap: 6px;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #E5E7EB;
  transition: background 0.2s ease;
}

.progress-dot--filled {
  background: #1D1D1B;
}

.empty-text {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 500;
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

/* ── Responsive ── */
@media (max-width: 600px) {
  .dt4-header {
    padding: 12px 14px;
  }

  .dt4-body {
    padding: 16px 14px;
  }

  .dt4-criteria {
    gap: 14px;
  }

  .dt4-criteria {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .crit-row {
    display: contents;
  }

  .crit-pills {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .pill {
    flex: 1;
    min-width: 70px;
    padding: 7px 10px;
    font-size: 11px;
    white-space: normal;
  }

  .result-card {
    flex-direction: column;
  }

  .result-chart {
    width: 100%;
    padding: 8px 12px;
  }

  .runners {
    flex-direction: column;
  }

  .dt4-empty {
    padding: 24px 0 8px;
  }
}
</style>
