<template>
  <v-dialog
    :model-value="store.showParams"
    max-width="95vw"
    @update:model-value="store.showParams = $event"
  >
    <v-card max-height="90vh" class="d-flex flex-column">
      <!-- Header -->
      <v-card-title class="d-flex align-center justify-space-between py-4 px-6">
        <span class="text-subtitle-1 font-weight-bold">Scoring Parameters</span>
        <div class="d-flex align-center ga-3">
          <v-btn variant="outlined" size="small" @click="store.resetParams()">Reset defaults</v-btn>
          <v-btn icon variant="text" size="small" @click="store.showParams = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </v-card-title>
      <v-divider />

      <!-- Scrollable table area -->
      <div class="params-table-wrap">
          <table class="params-table">
            <thead>
              <!-- Row 1: main group headers -->
              <tr class="header-row-1">
                <th class="sticky-col strategy-header" rowspan="2">Strategy</th>
                <th class="num-header" rowspan="2">Base</th>
                <th class="num-header" rowspan="2">Savings</th>
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
              <tr v-for="(s, i) in SC" :key="s.id" class="data-row">
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
                    @input="onBaseInput(i, $event)"
                  />
                </td>
                <!-- Savings -->
                <td class="num-cell savings-cell" :style="cellBg(store.params.savings[i])">
                  <input
                    type="number"
                    class="cell-input"
                    :value="store.params.savings[i]"
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
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { SC, Q_LABELS, Q_OPTS } from '~/utils/decisionTree/scoring-engine'

const store = useCalculatorStore()

function cellBg(value: number): Record<string, string> {
  if (value === -999) return { background: '#FFCDD2' }
  if (value < 0) return { background: '#FFF0F0' }
  if (value === 0) return { background: '#F8F8F8' }
  return { background: '#C8E6C9' }
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
/* ── Table wrapper ── */
.params-table-wrap {
  overflow: auto;
  flex: 1;
}

/* ── Table ── */
.params-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  white-space: nowrap;
}

/* ── Sticky headers ── */
.params-table thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #F8F8F8;
  border-bottom: 1px solid #E9EAEC;
  padding: 6px 8px;
  font-weight: 600;
  color: #1D1D1B;
  text-align: center;
}

.header-row-2 th {
  font-size: 10px;
  font-weight: 500;
  color: #61615F;
  top: 33px;
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
  background: #F8F8F8;
}

.strategy-header {
  min-width: 180px;
  text-align: left;
  padding-left: 16px;
}

.strategy-cell {
  min-width: 180px;
  padding: 4px 8px 4px 16px;
  border-bottom: 1px solid #F8F8F8;
  border-right: 1px solid #E9EAEC;
}

.strategy-id {
  display: inline-block;
  width: 22px;
  font-weight: 700;
  color: #61615F;
  font-size: 10px;
}

.strategy-name {
  font-size: 11px;
  color: #1D1D1B;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 150px;
  display: inline-block;
  vertical-align: middle;
}

/* ── Question group header ── */
.q-group-header {
  border-left: 2px solid #E9EAEC;
  font-size: 11px;
}

/* ── Number cells ── */
.num-header {
  min-width: 56px;
}

.num-cell {
  padding: 2px;
  border-bottom: 1px solid #F8F8F8;
  text-align: center;
  position: relative;
}

.savings-cell {
  position: relative;
}

.pct-suffix {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #61615F;
  pointer-events: none;
}

/* ── Cell input ── */
.cell-input {
  width: 50px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
  color: #1D1D1B;
  background: transparent;
  outline: none;
  padding: 0 2px;
  -moz-appearance: textfield;
  transition: border-color 0.15s;
}

.cell-input::-webkit-inner-spin-button,
.cell-input::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.cell-input:focus {
  border-color: #3b82f6;
  background: #fff;
}

/* ── Data rows ── */
.data-row:hover .strategy-cell {
  background: #f0f9ff;
}

.data-row:hover .num-cell {
  filter: brightness(0.97);
}

/* ── Question column left borders ── */
.params-table td:nth-child(3n + 4) {
  border-left: 2px solid #F8F8F8;
}
</style>
