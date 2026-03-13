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
          <v-btn
            v-if="isAdmin"
            variant="tonal"
            size="small"
            color="grey-darken-1"
            prepend-icon="mdi-refresh"
            @click="store.resetParams()"
          >
            {{ t('calc.params.resetDefaults') }}
          </v-btn>
          <v-btn icon variant="text" size="x-small" @click="store.showParams = false">
            <v-icon size="18">mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Scrollable table area -->
      <div class="params-table-wrap">
          <table class="params-table">
            <thead>
              <!-- Row 1: main group headers -->
              <tr class="header-row-1">
                <th class="sticky-col strategy-header" rowspan="2">{{ t('calc.params.strategy') }}</th>
                <th class="num-header" rowspan="2">{{ t('calc.params.base') }}</th>
                <th class="num-header" rowspan="2">{{ t('calc.params.savings') }}</th>
                <th
                  v-for="(label, q) in Q_LABELS"
                  :key="'qh-' + q"
                  class="q-group-header"
                  colspan="3"
                >
                  {{ label }}
                </th>
              </tr>
              <!-- Row 2: sub-headers for each question's 3 options -->
              <tr class="header-row-2">
                <template v-for="(opts, q) in Q_OPTS" :key="'qo-' + q">
                  <th v-for="(opt, o) in opts" :key="'qo-' + q + '-' + o" class="opt-header">
                    {{ opt }}
                  </th>
                </template>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(s, i) in SC" :key="s.id" class="data-row" :class="{ 'family-first': isFamilyFirst(i) }">
                <!-- Sticky strategy column -->
                <td class="sticky-col strategy-cell">
                  <span class="strategy-id">{{ s.id }}</span>
                  <span class="strategy-name" :title="s.name">{{ s.name }}</span>
                </td>
                <!-- Base -->
                <td class="num-cell" :style="cellBg(store.params.bases[i])">
                  <input
                    type="number"
                    class="cell-input"
                    :value="store.params.bases[i]"
                    :disabled="!isAdmin"
                    @input="onBaseInput(i, $event)"
                  />
                </td>
                <!-- Savings -->
                <td class="num-cell savings-cell" :style="cellBg(store.params.savings[i])">
                  <input
                    type="number"
                    class="cell-input"
                    :value="store.params.savings[i]"
                    :disabled="!isAdmin"
                    @input="onSavingsInput(i, $event)"
                  />
                  <span class="pct-suffix">%</span>
                </td>
                <!-- Matrix cells: 6 questions x 3 options -->
                <template v-for="q in 6" :key="'m-' + i + '-' + q">
                  <td
                    v-for="o in 3"
                    :key="'m-' + i + '-' + q + '-' + o"
                    class="num-cell"
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
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import useTranslations from '~/composables/useTranslations'
import { useCalculatorStore } from '~/stores/architect/calculator'
import { SC, Q_LABELS, Q_OPTS } from '~/utils/architect/scoring-engine'

const { t } = useTranslations('architect')
const store = useCalculatorStore()
const { isAdmin } = useUser()

function cellBg(value: number): Record<string, string> {
  if (value === -999) return { background: '#FEE2E2' }
  if (value < 0) return { background: '#FFF5F5' }
  if (value === 0) return { background: '#FAFAFA' }
  return { background: '#DCFCE7' }
}

// Detect first row of each auction family for visual grouping
function isFamilyFirst(i: number): boolean {
  if (i === 0) return false
  const prev = SC[i - 1].name.split(' – ')[0].split(' - ')[0]
  const curr = SC[i].name.split(' – ')[0].split(' - ')[0]
  return prev !== curr
}

function onBaseInput(i: number, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(val)) {
    store.params.bases[i] = val
  }
}

function onSavingsInput(i: number, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(val)) {
    store.params.savings[i] = val
  }
}

function onMatrixInput(i: number, q: number, o: number, event: Event) {
  const val = parseFloat((event.target as HTMLInputElement).value)
  if (!isNaN(val)) {
    store.params.matrix[i][q][o] = val
  }
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
}

.params-header-left {
  display: flex;
  align-items: center;
}

.params-title {
  font-size: 15px;
  font-weight: 600;
  color: #1D1D1B;
  letter-spacing: -0.01em;
}

/* ── Table wrapper ── */
.params-table-wrap {
  overflow: auto;
  flex: 1;
  background: #fff;
}

/* ── Table ── */
.params-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  white-space: nowrap;
  font-family: 'Poppins', sans-serif;
}

/* ── Sticky headers ── */
.params-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #FAFAFA;
  border-bottom: 1px solid #E9EAEC;
  padding: 8px 10px;
  font-weight: 600;
  color: #1D1D1B;
  text-align: center;
  font-size: 11px;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.header-row-2 th {
  font-size: 10px;
  font-weight: 500;
  color: #8B8D8F;
  top: 37px;
  text-transform: none;
  letter-spacing: 0;
}

/* ── Sticky first column ── */
.sticky-col {
  position: sticky;
  left: 0;
  z-index: 5;
  background: #fff;
}

thead .sticky-col {
  z-index: 15;
  background: #FAFAFA;
}

.strategy-header {
  min-width: 200px;
  text-align: left;
  padding-left: 20px;
}

.strategy-cell {
  min-width: 200px;
  padding: 6px 12px 6px 20px;
  border-bottom: 1px solid #F3F4F6;
  border-right: 1px solid #E9EAEC;
  transition: background 0.15s;
}

.strategy-id {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  background: #F3F4F6;
  font-weight: 600;
  color: #8B8D8F;
  font-size: 9px;
  margin-right: 8px;
  flex-shrink: 0;
}

.strategy-name {
  font-size: 11px;
  font-weight: 500;
  color: #1D1D1B;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 155px;
  display: inline-block;
  vertical-align: middle;
}

/* ── Question group header ── */
.q-group-header {
  border-left: 2px solid #E9EAEC;
  font-size: 10px;
}

/* ── Number cells ── */
.num-header {
  min-width: 60px;
}

.num-cell {
  padding: 3px;
  border-bottom: 1px solid #F3F4F6;
  text-align: center;
  position: relative;
  transition: filter 0.15s;
}

.savings-cell {
  position: relative;
}

.pct-suffix {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #8B8D8F;
  pointer-events: none;
}

/* ── Cell input ── */
.cell-input {
  width: 52px;
  height: 26px;
  border: 1px solid transparent;
  border-radius: 4px;
  text-align: center;
  font-size: 11px;
  font-weight: 500;
  color: #1D1D1B;
  background: transparent;
  outline: none;
  padding: 0 2px;
  -moz-appearance: textfield;
  transition: border-color 0.15s, box-shadow 0.15s;
}

.cell-input::-webkit-inner-spin-button,
.cell-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cell-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  background: #fff;
}

.cell-input:disabled {
  color: #1D1D1B;
  cursor: default;
  opacity: 1;
  -webkit-text-fill-color: #1D1D1B;
}

/* ── Data rows ── */
.data-row:hover .strategy-cell {
  background: #F0F9FF;
}

.data-row:hover .num-cell {
  filter: brightness(0.97);
}

/* ── Family grouping separator ── */
.data-row.family-first .strategy-cell {
  border-top: 2px solid #E0E0E0;
}
.data-row.family-first .num-cell {
  border-top: 2px solid #E0E0E0;
}

/* ── Question column left borders ── */
.params-table td:nth-child(3n + 4) {
  border-left: 2px solid #F3F4F6;
}

/* ── Alternating row tint ── */
.data-row:nth-child(even) .strategy-cell {
  background: #FAFBFC;
}
.data-row:nth-child(even):hover .strategy-cell {
  background: #F0F9FF;
}
</style>
