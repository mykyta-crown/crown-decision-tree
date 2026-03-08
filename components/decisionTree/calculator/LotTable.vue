<script setup lang="ts">
import { computed, ref, onMounted, onUpdated, nextTick } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { fmtE } from '~/utils/decisionTree/formatting'
import { DEMO_PRESETS } from '~/utils/decisionTree/demo-presets'

const store = useCalculatorStore()

const isGuided = computed(() => store.mode === 'guided')

const tableCard = ref<HTMLElement>()

function measureHeader() {
  const card = tableCard.value?.$el ?? tableCard.value
  if (!card) return
  const firstRow = card.querySelector('tbody tr')
  if (!firstRow) return
  const cardRect = card.getBoundingClientRect()
  const rowRect = firstRow.getBoundingClientRect()
  store.lotHeaderH = rowRect.top - cardRect.top
}

onMounted(() => { nextTick(measureHeader) })
onUpdated(() => { nextTick(measureHeader) })

function focusSetLot(li: number, e: FocusEvent) {
  store.selLot = li
  ;(e.target as HTMLInputElement).select()
}

/* Column widths (must match CSS .col-* values) */
const W = { num: 32, name: 180, unit: 80, qty: 80, pref: 120, intens: 130, award: 110, sup: 110, del: 28 }
const stickyLeftName = W.num + 'px'

const tableWidth = computed(() => {
  const base = W.num + W.name + W.unit + W.qty + W.pref + W.intens + W.del
  const award = isGuided.value ? W.award : 0
  return base + award + store.sc * W.sup + 'px'
})
</script>

<template>
  <v-card ref="tableCard" variant="outlined" class="lot-table-card">
    <!-- Header bar -->
    <div class="table-top">
      <div class="baseline-chip">
        <svg class="baseline-icon" width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M2 12L6 4l4 5 4-7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="baseline-label">Baseline</span>
        <v-tooltip
          content-class="bg-white text-black border text-body-2"
          location="top left"
          width="240"
        >
          <template #activator="{ props: tp }">
            <v-icon inline v-bind="tp" size="small" color="grey" icon="mdi-information-outline" class="ml-1 baseline-info" />
          </template>
          <template #default>
            Average of active supplier unit prices, multiplied by quantity. This is the estimated total spend for each lot.
          </template>
        </v-tooltip>
        <span class="baseline-dot" />
        <span class="baseline-value">{{ fmtE(store.totBase, store.ccy) }}</span>
      </div>
    </div>

    <!-- Scrollable table area -->
    <div class="table-scroll">
      <table class="xl-table" :style="{ width: tableWidth }">
        <colgroup>
          <col class="col-num" />
          <col class="col-name" />
          <col class="col-unit" />
          <col class="col-qty" />
          <col class="col-pref" />
          <col class="col-intens" />
          <col v-if="isGuided" class="col-award" />
          <col v-for="si in store.sc" :key="'sc'+si" class="col-sup" />
          <col class="col-del" />
        </colgroup>
        <thead>
          <!-- Group header row -->
          <tr class="group-row">
            <th class="grp grp--details grp--sticky-num">&nbsp;</th>
            <th class="grp grp--details grp--sticky-name" :style="{ left: stickyLeftName }">
              <div class="grp-inner">
                <span class="grp-label">Lot Details</span>
                <button
                  v-if="store.lots.length < 10"
                  class="grp-add-btn grp-add-btn--details"
                  title="Add lot"
                  aria-label="Add lot"
                  @click.stop="store.addLot"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                  <span class="grp-add-label">Lot</span>
                </button>
              </div>
            </th>
            <th class="grp grp--details" :colspan="2">&nbsp;</th>
            <th class="grp grp--criteria" :colspan="isGuided ? 3 : 2">
              <span class="grp-label">Criteria</span>
            </th>
            <th class="grp grp--suppliers" :colspan="store.sc">
              <div class="grp-inner">
                <span class="grp-label">Supplier Offers</span>
                <button
                  v-if="store.sc < 20"
                  class="grp-add-btn grp-add-btn--suppliers"
                  title="Add supplier"
                  aria-label="Add supplier"
                  @click.stop="store.addSupplier"
                >
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                  <span class="grp-add-label">Supplier</span>
                </button>
              </div>
            </th>
            <th class="grp grp--empty grp--sticky-del" />
          </tr>

          <!-- Column sub-headers -->
          <tr>
            <th class="xl-th xl-th--num xl-th--sticky-num">#</th>
            <th class="xl-th xl-th--name xl-th--sticky-name" :style="{ left: stickyLeftName }">Lot name</th>
            <th class="xl-th">Unit</th>
            <th class="xl-th">Qty</th>
            <th class="xl-th xl-th--crit">
              Preference
              <v-tooltip
                content-class="bg-white text-black border text-body-2"
                location="top left"
                width="220"
              >
                <template #activator="{ props: tp }">
                  <v-icon inline v-bind="tp" size="small" color="grey" icon="mdi-information-outline" class="ml-1" />
                </template>
                <template #default>
                  <div><b>None</b> — Price only, no preference.</div>
                  <div><b>Non-financial</b> — Qualitative criteria considered.</div>
                  <div><b>Financial</b> — Price-based preference applied.</div>
                </template>
              </v-tooltip>
            </th>
            <th class="xl-th xl-th--crit">
              Intensity
              <v-tooltip
                content-class="bg-white text-black border text-body-2"
                location="top left"
                width="240"
              >
                <template #activator="{ props: tp }">
                  <v-icon inline v-bind="tp" size="small" color="grey" icon="mdi-information-outline" class="ml-1" />
                </template>
                <template #default>
                  Competition level for this lot (0–100%). Higher values indicate stronger competitive pressure, influencing which auction types are recommended.
                </template>
              </v-tooltip>
            </th>
            <th v-if="isGuided" class="xl-th xl-th--crit">
              Awarding
              <v-tooltip
                content-class="bg-white text-black border text-body-2"
                location="top left"
                width="240"
              >
                <template #activator="{ props: tp }">
                  <v-icon inline v-bind="tp" size="small" color="grey" icon="mdi-information-outline" class="ml-1" />
                </template>
                <template #default>
                  <div><b>Award</b> — Best price wins the lot.</div>
                  <div><b>Rank</b> — Suppliers are ranked, no binding commitment.</div>
                  <div><b>No Rank</b> — No ranking, used for market testing.</div>
                </template>
              </v-tooltip>
            </th>
            <th v-for="(sn, si) in store.supNames" :key="si" class="xl-th xl-th--sup">
              <div class="sup-header">
                <input
                  type="text"
                  :value="sn"
                  class="sup-name-input"
                  @input="store.renameSupplier(si, ($event.target as HTMLInputElement).value)"
                  @focus="($event.target as HTMLInputElement).select()"
                />
                <span
                  v-if="store.sc > 1"
                  class="sup-remove-btn"
                  role="button"
                  :aria-label="'Remove ' + sn"
                  @click="store.removeSupplierAt(si)"
                >
                  <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                    <path d="M1 1L6 6M6 1L1 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  </svg>
                </span>
              </div>
            </th>
            <th class="xl-th xl-th--del xl-th--sticky-del" />
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(lot, li) in store.lots"
            :key="lot.id"
            class="xl-row"
            :class="{ 'xl-row--sel': store.selLot === li }"
            @click="store.selLot = li"
          >
            <!-- # -->
            <td class="xl-td xl-td--num xl-td--sticky-num" :class="{ active: store.selLot === li }">{{ li + 1 }}</td>

            <!-- Lot name -->
            <td class="xl-td xl-td--name xl-td--sticky-name" :style="{ left: stickyLeftName }">
              <input
                type="text"
                :value="lot.name"
                placeholder="Lot name"
                class="xl-input"
                @input="store.updateLot(li, 'name', ($event.target as HTMLInputElement).value)"
                @click.stop
                @focus="focusSetLot(li, $event)"
              />
            </td>

            <!-- Unit -->
            <td class="xl-td">
              <input
                type="text"
                :value="lot.unit"
                class="xl-input"
                @input="store.updateLot(li, 'unit', ($event.target as HTMLInputElement).value)"
                @click.stop
                @focus="focusSetLot(li, $event)"
              />
            </td>

            <!-- Qty -->
            <td class="xl-td">
              <input
                type="number"
                :value="lot.qty || ''"
                placeholder="0"
                class="xl-input"
                @input="store.updateLot(li, 'qty', Number(($event.target as HTMLInputElement).value) || 0)"
                @click.stop
                @focus="focusSetLot(li, $event)"
              />
            </td>

            <!-- Criteria -->
            <td class="xl-td xl-td--crit">
              <select
                :value="lot.pref"
                class="xl-select"
                :class="{ muted: lot.pref === 1 }"
                @change="store.updateLot(li, 'pref', Number(($event.target as HTMLSelectElement).value))"
                @click.stop
                @focus="store.selLot = li"
              >
                <option :value="1">None</option>
                <option :value="2">Non-financial</option>
                <option :value="3">Financial</option>
              </select>
            </td>
            <td class="xl-td xl-td--crit">
              <div class="intensity-cell" @click.stop>
                <div class="intensity-track-wrap">
                  <div class="intensity-track-bg" />
                  <div class="intensity-track-fill" :style="{ width: lot.intens + '%' }" />
                  <input
                    type="range"
                    :min="0"
                    :max="100"
                    :value="lot.intens"
                    class="intensity-range"
                    tabindex="-1"
                    @input="store.updateLot(li, 'intens', Number(($event.target as HTMLInputElement).value))"
                  />
                  <div class="intensity-thumb" :style="{ left: 'calc(' + lot.intens + '% - 7px)' }" />
                </div>
                <span class="intensity-val">{{ lot.intens }}%</span>
              </div>
            </td>
            <td v-if="isGuided" class="xl-td xl-td--crit">
              <select
                :value="lot.award"
                class="xl-select"
                :class="{ muted: lot.award === 1 }"
                @change="store.updateLot(li, 'award', Number(($event.target as HTMLSelectElement).value))"
                @click.stop
                @focus="store.selLot = li"
              >
                <option :value="1">Award</option>
                <option :value="2">Rank</option>
                <option :value="3">No Rank</option>
              </select>
            </td>

            <!-- Supplier prices -->
            <td v-for="si in store.sc" :key="si - 1" class="xl-td xl-td--price">
              <div
                v-if="lot.excl[si - 1]"
                class="price-excluded"
                @click.stop="store.toggleExclude(li, si - 1)"
              >
                <span class="price-excluded-plus">+</span>
              </div>
              <div v-else class="price-wrap" @click.stop>
                <input
                  type="number"
                  :value="lot.prices[si - 1] || ''"
                  placeholder="0"
                  class="xl-input xl-input--price"
                  @input="store.updatePrice(li, si - 1, Number(($event.target as HTMLInputElement).value) || 0)"
                  @focus="focusSetLot(li, $event)"
                />
                <button
                  class="price-x"
                  tabindex="-1"
                  @click.stop="store.toggleExclude(li, si - 1)"
                >&#215;</button>
              </div>
            </td>

            <!-- Delete -->
            <td class="xl-td xl-td--del xl-td--sticky-del" :class="{ 'xl-td--del-sel': store.selLot === li }">
              <button
                class="del-btn"
                :disabled="store.lots.length <= 1"
                :aria-label="'Delete ' + lot.name"
                tabindex="-1"
                @click.stop="store.removeLot(li)"
              >
                <svg width="11" height="12" viewBox="0 0 16 18" fill="none">
                  <path d="M1 4h14M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v11a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V4h9Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M6.5 8v5M9.5 8v5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="table-footer">
      <div class="table-footer-spacer" />
      <div class="demo-presets">
        <span class="demo-label">Quick fill:</span>
        <v-btn
          v-for="p in DEMO_PRESETS"
          :key="p.id"
          :title="p.label"
          variant="outlined"
          size="x-small"
          class="demo-btn"
          @click="store.applyDemoPreset(p)"
        >
          {{ p.emoji }}
        </v-btn>
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.lot-table-card {
  padding: 0;
  overflow: hidden;
}

/* ─── Top bar ─── */
.table-top {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  border-bottom: 1px solid #E9EAEC;
}
.baseline-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 14px 5px 10px;
  border-radius: 20px;
  background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%);
  border: 1px solid #A7F3D0;
}
.baseline-icon {
  color: #10B981;
  flex-shrink: 0;
}
.baseline-label {
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.baseline-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #D1D5DB;
}
.baseline-value {
  font-size: 14px;
  font-weight: 700;
  color: #065F46;
  font-variant-numeric: tabular-nums;
}
.baseline-info {
  cursor: help;
  opacity: 0.5;
  transition: opacity 0.15s;
}
.baseline-info:hover {
  opacity: 1;
}

/* Tooltip info icon in column headers */
.th-info {
  cursor: help;
  opacity: 0.4;
  margin-left: 2px;
  vertical-align: middle;
  transition: opacity 0.15s;
}
.th-info:hover {
  opacity: 1;
}

/* ─── Group header row (merged cells) ─── */
.group-row {
  background: #F9FAFB;
}
.grp {
  padding: 7px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  border-bottom: 2px solid #E5E7EB;
  white-space: nowrap;
  vertical-align: middle;
}
.grp--details {
  color: #065F46;
  background: #ECFDF5;
  border-bottom-color: #A7F3D0;
}
.grp--criteria {
  color: #3730A3;
  background: #EEF2FF;
  border-bottom-color: #C7D2FE;
  text-align: center;
}
.grp--suppliers {
  color: #9A3412;
  background: #FFF7ED;
  border-bottom-color: #FED7AA;
}
.grp--empty {
  background: #F9FAFB;
  border-bottom-color: #E5E7EB;
}
.grp-inner {
  display: flex;
  align-items: center;
  gap: 6px;
}
.grp-label {
  font-size: 11px;
}
.grp-add-btn {
  margin-left: 6px;
  height: 20px;
  border-radius: 10px;
  border: 1.5px solid rgba(0, 0, 0, 0.12);
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 0 7px 0 5px;
  transition: all 0.15s;
  flex-shrink: 0;
}
.grp-add-btn--details {
  color: #065F46;
  border-color: rgba(6, 95, 70, 0.25);
}
.grp-add-btn--details:hover {
  background: #FFF;
  border-color: #065F46;
}
.grp-add-btn--suppliers {
  color: #9A3412;
  border-color: rgba(154, 52, 18, 0.25);
}
.grp-add-btn--suppliers:hover {
  background: #FFF;
  border-color: #9A3412;
}
.grp-add-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: none;
}

/* ─── Sticky columns ─── */
/* Group row: # and Name pinned left */
.grp--sticky-num {
  position: sticky;
  left: 0;
  z-index: 4;
}
.grp--sticky-name {
  position: sticky;
  z-index: 4;
}
/* Sub-header & data: # pinned left */
.xl-th--sticky-num,
.xl-td--sticky-num {
  position: sticky;
  left: 0;
  z-index: 3;
  background: #F9FAFB;
}
.xl-td--sticky-num {
  background: #FFF;
}
/* Sub-header & data: name pinned left */
.xl-th--sticky-name,
.xl-td--sticky-name {
  position: sticky;
  z-index: 3;
  background: #F9FAFB;
}
.xl-td--sticky-name {
  background: #FFF;
}
/* Selected / hover backgrounds for sticky cells */
.xl-row--sel .xl-td--sticky-num,
.xl-row--sel .xl-td--sticky-name {
  background: #F0FDF4;
}
.xl-row:hover:not(.xl-row--sel) .xl-td--sticky-num,
.xl-row:hover:not(.xl-row--sel) .xl-td--sticky-name {
  background: #F9FAFB;
}
/* Delete pinned right */
.grp--sticky-del,
.xl-th--sticky-del,
.xl-td--sticky-del {
  position: sticky;
  right: 0;
  z-index: 3;
}
.grp--sticky-del {
  background: #F9FAFB;
}
.xl-th--sticky-del {
  background: #F9FAFB;
}
.xl-td--sticky-del {
  background: #FFF;
}
.xl-td--del-sel {
  background: #F0FDF4 !important;
}
.xl-row:hover:not(.xl-row--sel) .xl-td--sticky-del {
  background: #F9FAFB;
}

/* ─── Table scroll ─── */
.table-scroll {
  overflow-x: auto;
  scrollbar-width: thin;
  scrollbar-color: #D0D0D0 transparent;
}
.table-scroll::-webkit-scrollbar {
  height: 5px;
}
.table-scroll::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 3px;
}

/* ─── Excel-like table ─── */
.xl-table {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  table-layout: fixed;
}

/* ─── Column widths ─── */
.col-num { width: 32px; }
.col-name { width: 180px; }
.col-unit { width: 80px; }
.col-qty { width: 80px; }
.col-pref { width: 120px; }
.col-intens { width: 130px; }
.col-award { width: 110px; }
.col-sup { width: 110px; }
.col-del { width: 28px; }

/* ─── Header ─── */
.xl-th {
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 600;
  color: #8E8E8E;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: left;
  border-bottom: 2px solid #E5E7EB;
  background: #F9FAFB;
  white-space: nowrap;
}
.xl-th--num {
  text-align: center;
  padding: 8px 2px;
}
.xl-th--name {
  padding-left: 12px;
}
.xl-th--crit {
  background: #FAFAFF;
  border-bottom-color: #C7D2FE;
  text-align: center;
  padding: 8px 6px;
}
.xl-th--sup {
  background: #FFFAF5;
  border-bottom-color: #FED7AA;
}
.xl-th--del {
  padding: 8px 0;
  border-bottom-color: #E5E7EB;
}

.sup-header {
  display: flex;
  align-items: center;
  gap: 4px;
}
.sup-name-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 11px;
  font-weight: 600;
  color: #8E8E8E;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  font-family: inherit;
  width: 100%;
  min-width: 0;
  padding: 0;
}
.sup-remove-btn {
  cursor: pointer;
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.06);
  color: #AAAAAA;
  transition: background 0.15s, color 0.15s;
}
.sup-remove-btn:hover {
  background: #FECACA;
  color: #EF4444;
}

/* ─── Rows ─── */
.xl-row {
  cursor: pointer;
  transition: background 0.08s;
}
.xl-row:hover:not(.xl-row--sel) {
  background: #F9FAFB;
}
.xl-row--sel {
  background: #F0FDF4;
}

/* ─── Cells ─── */
.xl-td {
  padding: 6px 6px;
  border-bottom: 1px solid #F0F0F0;
  vertical-align: middle;
  height: 52px;
}
.xl-td--num {
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: #CCCCCC;
  padding: 6px 2px;
}
.xl-td--name {
  padding-left: 2px;
}
.xl-td--num.active {
  color: #34D399;
}
.xl-td--crit {
  background: rgba(238, 242, 255, 0.3);
  text-align: center;
}
.xl-td--price {
  background: rgba(255, 247, 237, 0.3);
}
.xl-td--del {
  padding: 4px 0;
}

/* ─── Inputs ─── */
.xl-input {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 7px 10px;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  background: transparent;
  box-sizing: border-box;
  transition: all 0.12s ease;
}
.xl-input:hover {
  border-color: #E5E7EB;
  background: #FFF;
}
.xl-input:focus {
  border-color: #34D399;
  background: #FFF;
  box-shadow: 0 0 0 2px rgba(52, 211, 153, 0.12);
}
.xl-input::placeholder {
  color: #D0D0D0;
}

/* Hide number spinners */
.xl-input[type="number"]::-webkit-inner-spin-button,
.xl-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.xl-input[type="number"] {
  -moz-appearance: textfield;
}

.xl-input--price {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ─── Selects ─── */
.xl-select {
  width: 100%;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 7px 22px 7px 8px;
  font-size: 12px;
  font-family: inherit;
  outline: none;
  background: transparent;
  box-sizing: border-box;
  cursor: pointer;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23BBBBBB' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: all 0.12s ease;
}
.xl-select:hover {
  border-color: #E5E7EB;
  background-color: #FFF;
}
.xl-select:focus {
  border-color: #34D399;
  background-color: #FFF;
}
.xl-select.muted {
  color: #AAAAAA;
}

/* ─── Intensity slider ─── */
.intensity-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 6px;
}
.intensity-track-wrap {
  flex: 1;
  position: relative;
  height: 24px;
  display: flex;
  align-items: center;
}
.intensity-track-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 2px;
  background: #E9EAEC;
}
.intensity-track-fill {
  position: absolute;
  left: 0;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(90deg, #818CF8, #6366F1);
  transition: width 0.1s;
}
.intensity-range {
  position: absolute;
  left: -2px;
  width: calc(100% + 4px);
  height: 24px;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 2;
}
.intensity-thumb {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #818CF8;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  pointer-events: none;
  transition: left 0.1s;
}
.intensity-val {
  font-size: 11px;
  color: #8E8E8E;
  font-weight: 600;
  min-width: 28px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* ─── Price cells ─── */
.price-excluded {
  border: 1px dashed #34D399;
  border-radius: 4px;
  background: #F0FDF9;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.price-excluded-plus {
  color: #34D399;
  font-size: 16px;
  font-weight: 600;
}
.price-wrap {
  position: relative;
}
.price-x {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  border: 1.5px solid #D0D0D0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 9px;
  color: #8E8E8E;
  padding: 0;
  opacity: 0;
  transition: opacity 0.12s;
  z-index: 1;
}
.price-wrap:hover .price-x {
  opacity: 1;
}

/* ─── Delete button ─── */
.del-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #CCCCCC;
  opacity: 0.5;
  transition: opacity 0.12s, color 0.12s;
}
.del-btn:disabled {
  cursor: default;
  opacity: 0.15;
}
.del-btn:not(:disabled):hover {
  opacity: 1;
  color: #EF4444;
}

/* ─── Footer ─── */
.table-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid #E9EAEC;
}
.table-footer-spacer {
  flex: 1;
}
.demo-presets {
  display: flex;
  align-items: center;
  gap: 6px;
}
.demo-label {
  font-size: 12px;
  font-weight: 500;
  color: #9CA3AF;
}
.demo-btn {
  min-width: 32px !important;
  font-size: 16px;
}
</style>
