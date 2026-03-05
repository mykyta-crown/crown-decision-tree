<script setup lang="ts">
import { computed } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { fmtE } from '~/utils/decisionTree/formatting'
import { gridC } from '~/utils/decisionTree/formatting'
import { DEMO_PRESETS } from '~/utils/decisionTree/demo-presets'

const store = useCalculatorStore()

const columns = computed(() => gridC(store.sc))

function onLotClick(li: number) {
  store.selLot = li
}

function onNameInput(li: number, e: Event) {
  store.updateLot(li, 'name', (e.target as HTMLInputElement).value)
}

function onUnitInput(li: number, e: Event) {
  store.updateLot(li, 'unit', (e.target as HTMLInputElement).value)
}

function onQtyInput(li: number, e: Event) {
  store.updateLot(li, 'qty', Number((e.target as HTMLInputElement).value) || 0)
}

function onPrefChange(li: number, e: Event) {
  store.updateLot(li, 'pref', Number((e.target as HTMLSelectElement).value))
}

function onIntensInput(li: number, e: Event) {
  store.updateLot(li, 'intens', Number((e.target as HTMLInputElement).value))
}

function onPriceInput(li: number, si: number, e: Event) {
  store.updatePrice(li, si, Number((e.target as HTMLInputElement).value) || 0)
}

function onSupNameInput(si: number, e: Event) {
  store.renameSupplier(si, (e.target as HTMLInputElement).value)
}

function focusSetLot(li: number, e: FocusEvent) {
  store.selLot = li
  ;(e.target as HTMLInputElement).select()
}
</script>

<template>
  <v-card variant="outlined" class="pa-5">
    <!-- Header bar -->
    <div class="d-flex align-center ga-4 mb-5">
      <span class="text-subtitle-1 font-weight-bold">Active lots</span>
      <v-chip size="small" color="primary" variant="flat" label>{{ store.lots.length }}</v-chip>
      <span class="text-body-2 text-grey">
        Total baseline:
        <strong class="text-primary">{{ fmtE(store.totBase, store.ccy) }}</strong>
      </span>
      <div class="d-flex ga-1 align-center ml-1">
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
      <v-spacer />
      <v-btn
        variant="text"
        color="green"
        size="small"
        prepend-icon="mdi-plus-circle-outline"
        :disabled="store.sc >= 6"
        @click="store.addSupplier"
      >
        Add supplier
      </v-btn>
    </div>

    <!-- Scrollable table area -->
    <div class="table-scroll">
      <!-- Column headers -->
      <div class="col-headers" :style="{ gridTemplateColumns: columns }">
        <span class="col-h">#</span>
        <span class="col-h">LOT NAME</span>
        <span class="col-h">UNIT</span>
        <span class="col-h">QTY</span>
        <span class="col-h">PREFERENCE</span>
        <span class="col-h">INTENSITY</span>
        <span v-for="(sn, si) in store.supNames" :key="si" class="col-h col-h-sup">
          <input
            type="text"
            :value="sn"
            @input="onSupNameInput(si, $event)"
            @focus="($event.target as HTMLInputElement).select()"
            class="sup-name-input"
          />
          <span
            v-if="store.sc > 1"
            class="sup-remove-btn"
            @click="store.removeSupplierAt(si)"
          >
            <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
              <path d="M1 1L6 6M6 1L1 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </span>
        </span>
        <span />
      </div>

      <!-- Lot rows -->
      <div
        v-for="(lot, li) in store.lots"
        :key="lot.id"
        class="lot-row"
        :class="{ selected: store.selLot === li }"
        :style="{ gridTemplateColumns: columns }"
        @click="onLotClick(li)"
      >
        <!-- Row number -->
        <span class="row-num" :class="{ active: store.selLot === li }">{{ li + 1 }}</span>

        <!-- Lot name -->
        <input
          type="text"
          :value="lot.name"
          @input="onNameInput(li, $event)"
          @click.stop
          @focus="focusSetLot(li, $event)"
          placeholder="Lot name"
          class="cell-input"
        />

        <!-- Unit -->
        <input
          type="text"
          :value="lot.unit"
          @input="onUnitInput(li, $event)"
          @click.stop
          @focus="focusSetLot(li, $event)"
          class="cell-input"
        />

        <!-- Qty -->
        <input
          type="number"
          :value="lot.qty || ''"
          @input="onQtyInput(li, $event)"
          @click.stop
          @focus="focusSetLot(li, $event)"
          placeholder="0"
          class="cell-input"
        />

        <!-- Preference -->
        <select
          :value="lot.pref"
          @change="onPrefChange(li, $event)"
          @click.stop
          @focus="store.selLot = li"
          class="cell-input cell-select"
          :class="{ muted: lot.pref === 1 }"
        >
          <option :value="1">No preference</option>
          <option :value="2">Non-financial</option>
          <option :value="3">Financial</option>
        </select>

        <!-- Intensity slider -->
        <div class="intensity-cell" @click.stop>
          <span class="intensity-label">Low</span>
          <div class="intensity-track-wrap">
            <div class="intensity-track-bg" />
            <div class="intensity-track-fill" :style="{ width: lot.intens + '%' }" />
            <input
              type="range"
              :min="0"
              :max="100"
              :value="lot.intens"
              @input="onIntensInput(li, $event)"
              tabindex="-1"
              class="intensity-range"
            />
            <div class="intensity-thumb" :style="{ left: 'calc(' + lot.intens + '% - 7px)' }" />
          </div>
          <span class="intensity-label">High</span>
        </div>

        <!-- Supplier price inputs -->
        <template v-for="si in store.sc" :key="si - 1">
          <!-- Excluded: dashed green "+" -->
          <div
            v-if="lot.excl[si - 1]"
            class="price-excluded"
            @click.stop="store.toggleExclude(li, si - 1)"
          >
            <div class="price-excluded-icon">+</div>
          </div>
          <!-- Normal price input -->
          <div v-else class="price-cell" @click.stop>
            <input
              type="number"
              :value="lot.prices[si - 1] || ''"
              @input="onPriceInput(li, si - 1, $event)"
              @focus="focusSetLot(li, $event)"
              placeholder="0"
              class="cell-input"
            />
            <button
              class="price-x-btn"
              tabindex="-1"
              @click.stop="store.toggleExclude(li, si - 1)"
            >
              &#215;
            </button>
          </div>
        </template>

        <!-- Delete lot -->
        <button
          class="delete-lot-btn"
          :disabled="store.lots.length <= 1"
          tabindex="-1"
          @click.stop="store.removeLot(li)"
        >
          <svg width="14" height="16" viewBox="0 0 16 18" fill="none">
            <path d="M1 4h14M5.5 4V2.5A1.5 1.5 0 0 1 7 1h2a1.5 1.5 0 0 1 1.5 1.5V4m2 0v11a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2V4h9Z" stroke="#8E8E8E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6.5 8v5M9.5 8v5" stroke="#8E8E8E" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Add new lot -->
    <v-divider class="mt-2 mb-3" />
    <v-btn
      variant="text"
      color="green"
      size="small"
      prepend-icon="mdi-plus-circle-outline"
      :disabled="store.lots.length >= 10"
      @click="store.addLot"
    >
      Add new lot
      <span v-if="store.lots.length >= 10" class="text-caption text-grey ml-2">(max 10)</span>
    </v-btn>
  </v-card>
</template>

<style scoped>
.demo-btn {
  min-width: 32px !important;
  font-size: 16px;
}

/* ─── Table scroll ─── */
.table-scroll {
  overflow-x: auto;
  margin-right: -8px;
  padding-right: 8px;
}

/* ─── Column headers ─── */
.col-headers {
  display: grid;
  gap: 8px;
  padding: 0 0 14px;
  border-bottom: 1px solid #E9EAEC;
  margin-bottom: 4px;
  min-width: fit-content;
}
.col-h {
  font-size: 11px;
  font-weight: 600;
  color: #AAAAAA;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  gap: 4px;
}
.col-h-sup {
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
  color: #AAAAAA;
  letter-spacing: 0.05em;
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
  background: rgba(0, 0, 0, 0.07);
  color: #AAAAAA;
  transition: background 0.15s, color 0.15s;
}
.sup-remove-btn:hover {
  background: #FECACA;
  color: #EF4444;
}

/* ─── Lot rows ─── */
.lot-row {
  display: grid;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid #E9EAEC;
  cursor: pointer;
  align-items: center;
  min-width: fit-content;
  border-radius: 4px;
  transition: background 0.1s;
}
.lot-row:last-child {
  border-bottom: none;
}
.lot-row:hover:not(.selected) {
  background: #F8F8F8;
}
.lot-row.selected {
  background: #F0FAF7;
}
.row-num {
  font-size: 12px;
  font-weight: 600;
  color: #BBBBBB;
  text-align: center;
  transition: color 0.15s;
}
.row-num.active {
  color: #35DE9E;
}

/* ─── Cell inputs ─── */
.cell-input {
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  background: #F8F8F8;
  width: 100%;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.cell-input:focus {
  border-color: #35DE9E !important;
}
.cell-select {
  cursor: pointer;
  padding-right: 28px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238E8E8E' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
}
.cell-select.muted {
  color: #8E8E8E;
}
/* Hide number input spinners */
.cell-input[type="number"]::-webkit-inner-spin-button,
.cell-input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.cell-input[type="number"] {
  -moz-appearance: textfield;
}

/* ─── Intensity slider ─── */
.intensity-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}
.intensity-label {
  font-size: 10px;
  color: #B0B0B0;
  font-weight: 500;
  flex-shrink: 0;
}
.intensity-track-wrap {
  flex: 1;
  position: relative;
  height: 28px;
  display: flex;
  align-items: center;
}
.intensity-track-bg {
  position: absolute;
  left: 0;
  right: 0;
  height: 5px;
  border-radius: 3px;
  background: #E9EAEC;
}
.intensity-track-fill {
  position: absolute;
  left: 0;
  height: 5px;
  border-radius: 3px;
  background: linear-gradient(90deg, #2DD4A0, #10B981);
  transition: width 0.1s;
}
.intensity-range {
  position: absolute;
  left: -2px;
  width: calc(100% + 4px);
  height: 28px;
  opacity: 0;
  cursor: pointer;
  margin: 0;
  z-index: 2;
}
.intensity-thumb {
  position: absolute;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #2DD4A0;
  border: 2.5px solid #fff;
  pointer-events: none;
  transition: left 0.1s;
}

/* ─── Price cells ─── */
.price-excluded {
  border: 1px dashed #34D399;
  border-radius: 4px;
  text-align: center;
  background: #F0FDF9;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  box-sizing: border-box;
}
.price-excluded-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #34D399;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #34D399;
  font-size: 15px;
  line-height: 1;
}
.price-cell {
  position: relative;
}
.price-x-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  border: 1.5px solid #C7C7C7;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 9px;
  color: #8E8E8E;
  padding: 0;
  opacity: 0;
  transition: opacity 0.15s;
}
.price-cell:hover .price-x-btn {
  opacity: 1;
}

/* ─── Delete lot button ─── */
.delete-lot-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.3;
  transition: opacity 0.15s;
}
.delete-lot-btn:disabled {
  cursor: default;
  opacity: 0.12;
}
.delete-lot-btn:not(:disabled):hover {
  opacity: 0.7;
}

</style>
