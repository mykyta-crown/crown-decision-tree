<template>
  <v-dialog
    :model-value="store.showParams"
    max-width="95vw"
    @update:model-value="store.showParams = $event"
  >
    <v-card max-height="90vh" class="params-card d-flex flex-column">

      <!-- Header -->
      <div class="params-header">
        <div class="params-header-left">
          <v-icon size="20" color="#1D1D1B" class="mr-2">mdi-tune-vertical</v-icon>
          <span class="params-title">{{ t('calc.params.title') }}</span>
        </div>
        <div class="d-flex align-center ga-2">
          <!-- Reset button — per-tab -->
          <v-btn
            v-if="isAdmin"
            variant="tonal"
            size="small"
            color="grey-darken-1"
            prepend-icon="mdi-refresh"
            @click="activeTab === 'scoring' ? store.resetParams() : store.resetBuilderParams()"
          >
            {{ t('calc.params.resetDefaults') }}
          </v-btn>
          <v-btn icon variant="text" size="x-small" @click="store.showParams = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Tabs -->
      <div class="params-tabs">
        <button
          class="params-tab"
          :class="{ 'params-tab--active': activeTab === 'scoring' }"
          @click="activeTab = 'scoring'"
        >
          <v-icon size="14" class="mr-1">mdi-table</v-icon>
          {{ t('calc.params.tabs.scoring') }}
        </button>
        <button
          class="params-tab"
          :class="{ 'params-tab--active': activeTab === 'builder' }"
          @click="activeTab = 'builder'"
        >
          <v-icon size="14" class="mr-1">mdi-cog-outline</v-icon>
          {{ t('calc.params.tabs.builder') }}
        </button>
      </div>

      <!-- ══ TAB 1: Scoring Parameters ══ -->
      <div v-if="activeTab === 'scoring'" class="params-table-wrap">
        <table class="params-table">
          <colgroup>
            <col class="col-strategy">
            <col class="col-fixed"><col class="col-fixed">
            <template v-for="q in 6" :key="q">
              <col v-for="o in 3" :key="o" :class="'col-q col-q' + q">
            </template>
          </colgroup>
          <thead>
            <tr class="header-row-1">
              <th class="sticky-col header-strategy" rowspan="2">{{ t('calc.params.strategy') }}</th>
              <th class="header-fixed header-base" rowspan="2">
                <span class="opt-label">{{ t('calc.params.base') }}</span>
              </th>
              <th class="header-fixed header-savings" rowspan="2">
                <span class="opt-label">{{ t('calc.params.savings') }}</span>
              </th>
              <th
                v-for="(label, q) in Q_LABELS"
                :key="'qh-' + q"
                :class="['q-group-head', 'q-group-head--' + (q + 1)]"
                colspan="3"
              >
                {{ label }}
              </th>
            </tr>
            <tr class="header-row-2">
              <template v-for="(opts, q) in Q_OPTS" :key="'qo-' + q">
                <th
                  v-for="(opt, o) in opts"
                  :key="'qo-' + q + '-' + o"
                  :class="['opt-head', 'opt-head--q' + (q + 1), { 'opt-head--first': o === 0 }]"
                >
                  <span class="opt-label">{{ opt }}</span>
                </th>
              </template>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, i) in SC" :key="s.id" class="data-row" :class="{ 'family-first': isFamilyFirst(i) }">
              <td class="sticky-col strategy-cell">
                <span class="strategy-id">{{ s.id }}</span>
                <span class="strategy-name" :title="s.name">{{ s.name }}</span>
              </td>
              <td class="num-cell col-base-cell" :style="cellBg(store.params.bases[i])">
                <input type="number" class="cell-input" :value="store.params.bases[i]" :disabled="!isAdmin" @input="onBaseInput(i, $event)" />
              </td>
              <td class="num-cell col-savings-cell" :style="cellBg(store.params.savings[i])">
                <input type="number" class="cell-input" :value="store.params.savings[i]" :disabled="!isAdmin" @input="onSavingsInput(i, $event)" />
              </td>
              <template v-for="q in 6" :key="'m-' + i + '-' + q">
                <td
                  v-for="o in 3"
                  :key="'m-' + i + '-' + q + '-' + o"
                  class="num-cell"
                  :class="{ 'q-col-first': o === 1 }"
                  :style="cellBg(store.params.matrix[i][q - 1][o - 1])"
                >
                  <input
                    type="number"
                    class="cell-input"
                    :value="store.params.matrix[i][q - 1][o - 1]"
                    :disabled="!isAdmin"
                    @input="onMatrixInput(i, q - 1, o - 1, $event)"
                  />
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- ══ TAB 2: Builder Parameters ══ -->
      <div v-else class="bp-wrap">

        <!-- Placeholders hint -->
        <div class="bp-placeholders-hint">
          <v-icon size="13" color="#9CA3AF">mdi-information-outline</v-icon>
          <span>{{ t('calc.bp.placeholdersHint') }} :</span>
          <code v-for="ph in PLACEHOLDERS" :key="ph" class="bp-placeholder-chip">{{ ph }}</code>
        </div>

        <!-- One card per auction type -->
        <div
          v-for="type in BP_TYPES"
          :key="type.key"
          class="bp-type-card"
          :style="{ '--type-color': type.color, '--type-tint': type.tint }"
        >
          <!-- Card header -->
          <div
            class="bp-type-header"
            :class="{ 'bp-type-header--open': expandedType === type.key }"
            @click="expandedType = expandedType === type.key ? null : type.key"
          >
            <div class="d-flex align-center ga-3">
              <span class="bp-type-pill" :style="{ background: type.color }">{{ type.shortLabel }}</span>
              <span class="bp-type-name">{{ type.label }}</span>
              <span v-if="type.params.length" class="bp-params-count">{{ type.params.length }}p</span>
            </div>
            <v-icon size="16" :color="expandedType === type.key ? type.color : '#9CA3AF'">
              {{ expandedType === type.key ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
            </v-icon>
          </div>

          <!-- Card body -->
          <div v-if="expandedType === type.key" class="bp-type-body">

            <!-- Numeric params -->
            <div v-if="type.params.length" class="bp-params-section">
              <div class="bp-section-badge" :style="{ background: type.tint, color: type.color }">
                <v-icon size="11" :color="type.color" style="margin-right: 4px">mdi-timer-outline</v-icon>
                {{ t('calc.bp.timing') }}
              </div>
              <div class="bp-params-grid">
                <div v-for="param in type.params" :key="param.key" class="bp-param-chip">
                  <span class="bp-param-label">{{ param.label }}</span>
                  <div class="bp-param-input-wrap">
                    <input
                      type="number"
                      class="bp-param-input"
                      :value="getBpValue(type.key, param.key)"
                      :disabled="!isAdmin"
                      step="any"
                      @input="setBpValue(type.key, param.key, $event)"
                    />
                    <span v-if="param.suffix" class="bp-param-suffix">{{ param.suffix }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Templates -->
            <div class="bp-templates-section">
              <div class="bp-section-label-row">
                <div class="bp-section-badge" :style="{ background: type.tint, color: type.color }">
                  <v-icon size="11" :color="type.color" style="margin-right: 4px">mdi-text-box-outline</v-icon>
                  {{ t('calc.bp.templates') }}
                </div>
                <div class="bp-lang-toggle">
                  <button
                    class="bp-lang-btn"
                    :style="templateLang === 'fr' ? { background: type.color, color: '#fff' } : {}"
                    @click="templateLang = 'fr'"
                  >FR</button>
                  <button
                    class="bp-lang-btn"
                    :style="templateLang === 'en' ? { background: type.color, color: '#fff' } : {}"
                    @click="templateLang = 'en'"
                  >EN</button>
                </div>
              </div>

              <div class="bp-editor-block">
                <div class="bp-editor-label">{{ t('calc.bp.awardingPrinciples') }}</div>
                <textarea
                  class="bp-textarea"
                  :value="getBpTemplate(type.key, 'awarding_principles')"
                  :disabled="!isAdmin"
                  rows="5"
                  @input="setBpTemplate(type.key, 'awarding_principles', ($event.target as HTMLTextAreaElement).value)"
                />
              </div>

              <div class="bp-editor-block">
                <div class="bp-editor-label">{{ t('calc.bp.commercialTerms') }}</div>
                <textarea
                  class="bp-textarea"
                  :value="getBpTemplate(type.key, 'commercials_terms')"
                  :disabled="!isAdmin"
                  rows="5"
                  @input="setBpTemplate(type.key, 'commercials_terms', ($event.target as HTMLTextAreaElement).value)"
                />
              </div>
            </div>

          </div>
        </div>
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import useTranslations from '~/composables/useTranslations'
import { useCalculatorStore } from '~/stores/architect/calculator'
import { SC, Q_LABELS, Q_OPTS } from '~/utils/architect/scoring-engine'

const { t } = useTranslations('architect')
const store = useCalculatorStore()
const { isAdmin } = useUser()

// ── Tab state ────────────────────────────────────────────────────────────────
const activeTab = ref<'scoring' | 'builder'>('scoring')
const expandedType = ref<string | null>(null)

// ── Template language (defaults to current UI locale) ────────────────────────
const locale = useState('locale')
const templateLang = ref<'fr' | 'en'>(locale.value === 'en' ? 'en' : 'fr')

// ── Placeholders ─────────────────────────────────────────────────────────────
const PLACEHOLDERS = ['{{lotName}}', '{{qty}}', '{{unit}}', '{{baseline}}', '{{currency}}']

// ── Builder param types config ────────────────────────────────────────────────
const BP_TYPES = computed(() => [
  {
    key: 'english',
    label: t('calc.bp.types.english'),
    color: '#34D399',
    tint: '#34D39918',
    shortLabel: 'EN',
    params: [
      { key: 'duration',         label: t('calc.bp.duration'),       suffix: 'min' },
      { key: 'overtime_range',   label: t('calc.bp.overtime'),        suffix: 'min' },
      { key: 'min_decr_factor',  label: t('calc.bp.minDecrFactor'),  suffix: '%' },
      { key: 'max_decr_factor',  label: t('calc.bp.maxDecrFactor'),  suffix: '%' },
    ],
  },
  {
    key: 'sealedBid',
    label: t('calc.bp.types.sealedBid'),
    color: '#67E8F9',
    tint: '#67E8F918',
    shortLabel: 'SB',
    params: [
      { key: 'min_decr_factor',  label: t('calc.bp.minDecrFactor'),  suffix: '%' },
      { key: 'max_decr_factor',  label: t('calc.bp.maxDecrFactor'),  suffix: '%' },
    ],
  },
  {
    key: 'dutch',
    label: t('calc.bp.types.dutch'),
    color: '#A78BFA',
    tint: '#A78BFA18',
    shortLabel: 'DU',
    params: [
      { key: 'duration',         label: t('calc.bp.duration'),        suffix: 'min' },
      { key: 'round_duration',   label: t('calc.bp.roundDuration'),   suffix: 'min' },
      { key: 'nb_rounds',        label: t('calc.bp.nbRounds'),        suffix: '' },
      { key: 'ending_factor',    label: t('calc.bp.endingFactor'),    suffix: '%' },
      { key: 'range_percent',    label: t('calc.bp.rangePercent'),    suffix: '%' },
      { key: 'steps',            label: t('calc.bp.steps'),           suffix: '' },
    ],
  },
  {
    key: 'dutchPreferred',
    label: t('calc.bp.types.dutchPreferred'),
    color: '#C4B5FD',
    tint: '#C4B5FD18',
    shortLabel: 'DP',
    params: [
      { key: 'duration',         label: t('calc.bp.duration'),        suffix: 'min' },
      { key: 'round_duration',   label: t('calc.bp.roundDuration'),   suffix: 'min' },
      { key: 'nb_rounds',        label: t('calc.bp.nbRounds'),        suffix: '' },
      { key: 'time_per_round',   label: t('calc.bp.timePrefWindow'),  suffix: 's' },
      { key: 'ending_factor',    label: t('calc.bp.endingFactor'),    suffix: '%' },
      { key: 'range_percent',    label: t('calc.bp.rangePercent'),    suffix: '%' },
      { key: 'steps',            label: t('calc.bp.steps'),           suffix: '' },
    ],
  },
  {
    key: 'japanese',
    label: t('calc.bp.types.japanese'),
    color: '#FBBF24',
    tint: '#FBBF2418',
    shortLabel: 'JP',
    params: [
      { key: 'duration',         label: t('calc.bp.duration'),        suffix: 'min' },
      { key: 'round_duration',   label: t('calc.bp.roundDuration'),   suffix: 'min' },
      { key: 'nb_rounds',        label: t('calc.bp.nbRounds'),        suffix: '' },
      { key: 'starting_factor',  label: t('calc.bp.startingFactor'),  suffix: '%' },
      { key: 'floor_factor',     label: t('calc.bp.floorFactor'),     suffix: '%' },
      { key: 'steps',            label: t('calc.bp.steps'),           suffix: '' },
    ],
  },
  {
    key: 'doubleScenario',
    label: t('calc.bp.types.doubleScenario'),
    color: '#F472B6',
    tint: '#F472B618',
    shortLabel: 'DS',
    params: [
      { key: 'duration',          label: t('calc.bp.duration'),         suffix: 'min' },
      { key: 'overtime_range',    label: t('calc.bp.overtime'),          suffix: 'min' },
      { key: 'min_decr_factor',   label: t('calc.bp.minDecrFactor'),    suffix: '%' },
      { key: 'max_decr_factor',   label: t('calc.bp.maxDecrFactor'),    suffix: '%' },
      { key: 'max_rank_displayed', label: t('calc.bp.maxRankDisplayed'), suffix: '' },
    ],
  },
])

// ── Builder param accessors ───────────────────────────────────────────────────
function getBpValue(typeKey: string, paramKey: string): number | undefined {
  return (store.builderParams as any)[typeKey]?.[paramKey]
}

function setBpValue(typeKey: string, paramKey: string, event: Event) {
  if (!isAdmin.value) return
  const val = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(val)) {
    ;(store.builderParams as any)[typeKey][paramKey] = val
  }
}

function getBpTemplate(typeKey: string, field: 'awarding_principles' | 'commercials_terms'): string {
  return (store.builderParams as any)[typeKey]?.templates?.[templateLang.value]?.[field] || ''
}

function setBpTemplate(typeKey: string, field: 'awarding_principles' | 'commercials_terms', value: string) {
  if (!isAdmin.value) return
  const bp = (store.builderParams as any)[typeKey]
  if (!bp.templates) bp.templates = {}
  if (!bp.templates[templateLang.value]) bp.templates[templateLang.value] = {}
  bp.templates[templateLang.value][field] = value
}

// ── Scoring tab helpers ───────────────────────────────────────────────────────
function cellBg(value: number): Record<string, string> {
  if (value === -999) return { background: '#FECACA' }           // élimination — rouge fort
  if (value < -5)    return { background: '#FEE2E2' }           // négatif fort — rouge moyen
  if (value < 0)     return { background: '#FFF1F1' }           // légèrement négatif — rose pâle
  if (value === 0)   return { background: '#F0F0F0' }           // zéro — gris neutre
  if (value <= 5)    return { background: '#ECFDF5' }           // petit positif — vert très clair
  if (value <= 15)   return { background: '#D1FAE5' }           // positif moyen — vert clair
  if (value <= 25)   return { background: '#A7F3D0' }           // bon — vert moyen
  if (value <= 35)   return { background: '#6EE7B7' }           // très bon — vert
  return                      { background: '#34D399' }           // excellent — vert fort
}

function isFamilyFirst(i: number): boolean {
  if (i === 0) return false
  const prev = SC[i - 1].name.split(' – ')[0].split(' - ')[0]
  const curr = SC[i].name.split(' – ')[0].split(' - ')[0]
  return prev !== curr
}

function onBaseInput(i: number, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(val)) store.params.bases[i] = val
}

function onSavingsInput(i: number, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(val)) store.params.savings[i] = val
}

function onMatrixInput(i: number, q: number, o: number, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(val)) store.params.matrix[i][q][o] = val
}
</script>

<style scoped>
/* ── Card ── */
.params-card {
  border-radius: 12px !important;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12) !important;
}

/* ── Header ── */
.params-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #E9EAEC;
  background: #fff;
  flex-shrink: 0;
}
.params-header-left { display: flex; align-items: center; }
.params-title { font-size: 15px; font-weight: 600; color: #1D1D1B; letter-spacing: -0.01em; }

/* ── Tabs ── */
.params-tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #E9EAEC;
  background: #FAFAFA;
  flex-shrink: 0;
}
.params-tab {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
  border: none;
  background: transparent;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
  font-family: 'Poppins', sans-serif;
}
.params-tab:hover { color: #374151; }
.params-tab--active { color: #1D1D1B; border-bottom-color: #1D1D1B; font-weight: 600; }

/* ══ SCORING TAB ══ */
.params-table-wrap { overflow-x: auto; flex: 1; background: #fff; }

.params-table {
  border-collapse: separate;
  border-spacing: 0;
  table-layout: fixed;
  width: 100%;
  min-width: 980px;
  font-family: 'Poppins', sans-serif;
}

/* ── Column widths ── */
.col-strategy { width: 162px; }
.col-fixed    { width: 48px; }
.col-q        { width: 44px; }

/* ── Sticky strategy column ── */
.sticky-col { position: sticky; left: 0; z-index: 5; background: #fff; }
thead .sticky-col { z-index: 15; background: #FAFAFA; }

/* ── All header cells: non-sticky, uniform base ── */
.params-table thead th {
  background: #FAFAFA;
  font-family: 'Poppins', sans-serif;
}

/* ── Strategy header ── */
.header-strategy {
  text-align: left; padding: 0 8px 6px 14px;
  vertical-align: bottom;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #9CA3AF;
  border-bottom: 3px solid #E9EAEC; border-right: 2px solid #E9EAEC;
}

/* ── Base / Savings rotated headers ── */
.header-fixed {
  padding: 4px 2px 6px; vertical-align: bottom; text-align: center;
  border-bottom: 3px solid #CBD5E1;
}
.header-base    { background: #EFF6FF; border-bottom-color: #93C5FD; }
.header-savings { background: #F0FDF4; border-bottom-color: #6EE7B7; }

/* ── Q group headers (row 1) ── */
.q-group-head {
  padding: 6px 4px 5px; text-align: center;
  font-size: 8.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
  white-space: nowrap; border-left: 2px solid rgba(255,255,255,0.6);
}
.q-group-head--1 { background: #DBEAFE; color: #1D4ED8; border-bottom: 2px solid #93C5FD; }
.q-group-head--2 { background: #EDE9FE; color: #5B21B6; border-bottom: 2px solid #C4B5FD; }
.q-group-head--3 { background: #D1FAE5; color: #065F46; border-bottom: 2px solid #6EE7B7; }
.q-group-head--4 { background: #FED7AA; color: #92400E; border-bottom: 2px solid #FDBA74; }
.q-group-head--5 { background: #FEF3C7; color: #78350F; border-bottom: 2px solid #FDE68A; }
.q-group-head--6 { background: #FCE7F3; color: #9D174D; border-bottom: 2px solid #F9A8D4; }

/* ── Sub-option headers (row 2, rotated) ── */
.opt-head {
  padding: 0 1px 6px; height: 78px; vertical-align: bottom; text-align: center;
  border-bottom: 3px solid #E9EAEC;
}
.opt-head--first { border-left: 2px solid rgba(255,255,255,0.6); }
.opt-head--q1 { background: #F0F8FF; border-bottom-color: #BFDBFE; }
.opt-head--q2 { background: #F5F3FF; border-bottom-color: #C4B5FD; }
.opt-head--q3 { background: #F0FDF4; border-bottom-color: #86EFAC; }
.opt-head--q4 { background: #FFF7ED; border-bottom-color: #FDBA74; }
.opt-head--q5 { background: #FFFBEB; border-bottom-color: #FDE68A; }
.opt-head--q6 { background: #FDF2F8; border-bottom-color: #F9A8D4; }

/* ── Rotated label ── */
.opt-label {
  display: inline-block;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  font-size: 9px; font-weight: 600; color: #6B7280;
  white-space: nowrap; letter-spacing: 0.02em;
}
.header-base .opt-label    { color: #2563EB; font-weight: 700; font-size: 10px; }
.header-savings .opt-label { color: #16A34A; font-weight: 700; font-size: 10px; }

/* ── Column body tints for Base / Savings ── */
.col-base-cell    { border-right: 1px solid #BFDBFE !important; }
.col-savings-cell { border-right: 2px solid #E9EAEC !important; }

/* ── Strategy column ── */
.strategy-cell {
  padding: 4px 8px 4px 14px;
  border-bottom: 1px solid #F3F4F6; border-right: 2px solid #E9EAEC;
  transition: background 0.12s; white-space: nowrap;
  overflow: hidden;
}
.strategy-id {
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 3px;
  background: #F3F4F6; font-weight: 700; color: #9CA3AF;
  font-size: 8px; margin-right: 6px; flex-shrink: 0;
  vertical-align: middle;
}
.strategy-name {
  font-size: 10.5px; font-weight: 500; color: #1D1D1B;
  overflow: hidden; text-overflow: ellipsis;
  display: inline-block; vertical-align: middle;
  max-width: 124px;
}

/* ── Data cells ── */
.num-cell {
  padding: 2px 1px; border-bottom: 1px solid #F3F4F6;
  text-align: center; transition: filter 0.12s;
}
.q-col-first { border-left: 2px solid rgba(0,0,0,0.06); }

/* ── Cell input ── */
.cell-input {
  width: 40px; height: 22px;
  border: 1px solid transparent; border-radius: 3px;
  text-align: center; font-size: 10.5px; font-weight: 500; color: #1D1D1B;
  background: transparent; outline: none; padding: 0;
  -moz-appearance: textfield; font-family: 'Poppins', sans-serif;
}
.cell-input::-webkit-inner-spin-button, .cell-input::-webkit-outer-spin-button { -webkit-appearance: none; }
.cell-input:focus { border-color: #3b82f6; box-shadow: 0 0 0 2px rgba(59,130,246,0.15); background: #fff; }
.cell-input:disabled { color: #1D1D1B; cursor: default; opacity: 1; -webkit-text-fill-color: #1D1D1B; }

/* ── Row states ── */
.data-row:hover .strategy-cell { background: #F0F9FF; }
.data-row:hover .num-cell { filter: brightness(0.96); }
.data-row.family-first .strategy-cell { border-top: 2px solid #D1D5DB; }
.data-row.family-first .num-cell { border-top: 2px solid #F0F0F0; }
.data-row:nth-child(even) .strategy-cell { background: #FAFBFC; }
.data-row:nth-child(even):hover .strategy-cell { background: #F0F9FF; }

/* ══ BUILDER TAB ══ */
.bp-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #F8F8F8;
}

.bp-placeholders-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 11px;
  color: #9CA3AF;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #E9EAEC;
  border-radius: 6px;
}
.bp-placeholder-chip {
  background: #F3F4F6;
  color: #374151;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

/* ── Type card ── */
.bp-type-card {
  background: #fff;
  border: 1px solid #E9EAEC;
  border-left: 4px solid var(--type-color);
  border-radius: 8px;
  overflow: hidden;
  transition: box-shadow 0.15s;
}
.bp-type-card:hover { box-shadow: 0 2px 12px rgba(0, 0, 0, 0.07); }

.bp-type-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.12s;
  user-select: none;
}
.bp-type-header:hover { background: #F9FAFB; }
.bp-type-header--open { background: var(--type-tint) !important; }

.bp-type-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.bp-type-name { font-size: 13px; font-weight: 600; color: #1D1D1B; }
.bp-params-count {
  font-size: 10px;
  color: #9CA3AF;
  font-weight: 400;
  background: #F3F4F6;
  padding: 1px 6px;
  border-radius: 10px;
}

/* ── Card body ── */
.bp-type-body {
  border-top: 1px solid #F3F4F6;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Section badge ── */
.bp-section-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 10px;
}

/* ── Numeric params ── */
.bp-params-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 8px;
}
.bp-param-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px 6px 12px;
  background: #F9FAFB;
  border: 1px solid #F3F4F6;
  border-left: 3px solid var(--type-color);
  border-radius: 6px;
}
.bp-param-label {
  font-size: 11px;
  color: #6B7280;
  font-weight: 500;
  flex: 1;
}
.bp-param-input-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
}
.bp-param-input {
  width: 60px;
  height: 26px;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: #1D1D1B;
  background: #fff;
  outline: none;
  padding: 0 4px;
  -moz-appearance: textfield;
  font-family: 'Poppins', sans-serif;
}
.bp-param-input::-webkit-inner-spin-button, .bp-param-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.bp-param-input:focus { border-color: var(--type-color, #3b82f6); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }
.bp-param-input:disabled { color: #1D1D1B; cursor: default; opacity: 1; -webkit-text-fill-color: #1D1D1B; }
.bp-param-suffix { font-size: 10px; color: #9CA3AF; font-weight: 500; }

/* ── Templates section ── */
.bp-templates-section { display: flex; flex-direction: column; gap: 14px; }
.bp-section-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bp-lang-toggle { display: flex; gap: 0; border: 1px solid #E9EAEC; border-radius: 6px; overflow: hidden; }
.bp-lang-btn {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
  background: #fff;
  border: none;
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  font-family: 'Poppins', sans-serif;
}
.bp-lang-btn:hover { background: #F3F4F6; color: #374151; }

.bp-editor-block { display: flex; flex-direction: column; gap: 6px; }
.bp-editor-label { font-size: 11px; font-weight: 600; color: #6B7280; }

.bp-textarea {
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  font-family: monospace;
  color: #1D1D1B;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  background: #fff;
  resize: vertical;
  outline: none;
  line-height: 1.5;
}
.bp-textarea:focus { border-color: var(--type-color, #3b82f6); box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15); }
.bp-textarea:disabled { background: #FAFAFA; color: #6B7280; cursor: default; }
</style>
