<template>
  <div class="blue-p1">
    <div class="p1-row">
      <!-- 1. Total spend -->
      <div class="p1-card" :class="{ 'p1-card--done': store.spend > 0 }">
        <div class="p1-card-header">
          <div class="p1-card-title">{{ t('calc.phase1.totalSpend') }}</div>
          <v-tooltip
            content-class="bg-white text-black border text-body-2"
            location="top"
            max-width="240"
          >
            <template #activator="{ props: tip }">
              <v-icon v-bind="tip" size="16" color="#9CA3AF">mdi-information-outline</v-icon>
            </template>
            <template #default>
              {{ t('calc.phase1.spendTooltip') }}
            </template>
          </v-tooltip>
        </div>
        <div class="p1-card-sub">{{ t('calc.phase1.spendSub') }}</div>

        <div class="spend-input-wrap" :class="{ 'spend-input-wrap--done': store.spend > 0 }">
          <SpendInput v-model="store.spend" />
          <v-select
            v-model="store.ccy"
            :items="['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN']"
            variant="plain"
            density="compact"
            hide-details
            class="ccy-select"
          />
        </div>

        <div class="spend-slider-area">
          <NLSlider v-model="store.spend" />
        </div>
      </div>

      <!-- connector -->
      <div v-if="store.p1Ok" class="connector">
        <svg width="100%" height="2" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="100%" y2="1" stroke="#34D399" stroke-width="2" stroke-dasharray="6 4" />
        </svg>
      </div>
      <div v-else class="connector" />

      <!-- 2. Number of suppliers -->
      <div class="p1-card p1-card--sup" :class="{ 'p1-card--done': store.nSup > 0 }">
        <div class="p1-card-header">
          <div class="p1-card-title">{{ t('calc.phase1.numSuppliers') }}</div>
          <v-tooltip
            content-class="bg-white text-black border text-body-2"
            location="top"
            max-width="240"
          >
            <template #activator="{ props: tip }">
              <v-icon v-bind="tip" size="16" color="#9CA3AF">mdi-information-outline</v-icon>
            </template>
            <template #default>
              {{ t('calc.phase1.suppliersTooltip') }}
            </template>
          </v-tooltip>
        </div>
        <div class="p1-card-sub">{{ t('calc.phase1.suppliersSub') }}</div>

        <div class="sup-icon">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <ellipse cx="16" cy="13" rx="5" ry="5" stroke="#C4C4C4" stroke-width="1.6" />
            <path d="M24 22c0-4.418-3.582-8-8-8s-8 3.582-8 8" stroke="#C4C4C4" stroke-width="1.6" stroke-linecap="round" />
            <path d="M26 14c1.657 0 3 1.343 3 3" stroke="#C4C4C4" stroke-width="1.4" stroke-linecap="round" />
            <path d="M29 22c0-2.761-1.343-5-3-5" stroke="#C4C4C4" stroke-width="1.4" stroke-linecap="round" />
            <path d="M6 14c-1.657 0-3 1.343-3 3" stroke="#C4C4C4" stroke-width="1.4" stroke-linecap="round" />
            <path d="M3 22c0-2.761 1.343-5 3-5" stroke="#C4C4C4" stroke-width="1.4" stroke-linecap="round" />
          </svg>
        </div>

        <div class="sup-counter">
          <button class="sup-btn sup-btn--minus" aria-label="Remove supplier" @click="store.nSup = Math.max(0, store.nSup - 1)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
          <span class="sup-val" :class="{ 'sup-val--zero': store.nSup === 0 }">{{ store.nSup }}</span>
          <button class="sup-btn sup-btn--plus" aria-label="Add supplier" @click="store.nSup = Math.min(20, store.nSup + 1)">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <!-- connector -->
      <div v-if="store.p1Ok" class="connector">
        <svg width="100%" height="2" preserveAspectRatio="none">
          <line x1="0" y1="1" x2="100%" y2="1" stroke="#34D399" stroke-width="2" stroke-dasharray="6 4" />
        </svg>
      </div>
      <div v-else class="connector" />

      <!-- 3. Verdict -->
      <div class="p1-verdict">
        <Transition name="vfade" mode="out-in">
          <!-- waiting -->
          <div v-if="!store.p1Ok" key="w" class="verdict verdict--wait">
            <div class="verdict-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="#D1D5DB" stroke-width="1.5" />
                <path d="M14 9v5M14 18h.01" stroke="#D1D5DB" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <div class="verdict-title">{{ t('calc.phase1.verdictWaitTitle') }}</div>
            <div class="verdict-desc">{{ t('calc.phase1.verdictWaitDesc') }}</div>
            <div class="verdict-btn verdict-btn--ghost" aria-hidden="true">{{ t('calc.phase1.nextStep') }}</div>
          </div>

          <!-- stop -->
          <div v-else-if="verdictLevel === 'stop'" key="s" class="verdict verdict--stop">
            <div class="verdict-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="#EF4444" stroke-width="1.5" />
                <path d="M14 9v5M14 18h.01" stroke="#EF4444" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <div class="verdict-title">{{ t('calc.phase1.verdictStopTitle') }}</div>
            <div class="verdict-desc">{{ verdictDesc }}</div>
            <div class="verdict-btn verdict-btn--ghost" aria-hidden="true">{{ t('calc.phase1.nextStep') }}</div>
          </div>

          <!-- ok -->
          <div v-else-if="verdictLevel === 'ok'" key="o" class="verdict verdict--ok">
            <div class="verdict-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="#3B82F6" stroke-width="1.5" />
                <path d="M14 9v5M14 18h.01" stroke="#3B82F6" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <div class="verdict-title">{{ t('calc.phase1.verdictOkTitle') }}</div>
            <div class="verdict-desc">{{ verdictDesc }}</div>
            <button class="verdict-btn" @click="store.phase = 2">
              {{ t('calc.phase1.nextStep') }}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>

          <!-- perfect -->
          <div v-else key="p" class="verdict verdict--perfect">
            <div class="verdict-icon">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="#34D399" stroke-width="1.5" />
                <path d="M9 14.5L12 17.5L19 10" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <div class="verdict-title">{{ t('calc.phase1.verdictPerfTitle') }}</div>
            <div class="verdict-desc">{{ verdictDesc }}</div>
            <button class="verdict-btn" @click="store.phase = 2">
              {{ t('calc.phase1.nextStep') }}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useCalculatorStore } from '~/stores/architect/calculator'
import SpendInput from '~/components/architect/calculator/SpendInput.vue'
import NLSlider from '~/components/architect/calculator/NLSlider.vue'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('architect')
const store = useCalculatorStore()

const verdictLevel = computed<'perfect' | 'ok' | 'stop'>(() => {
  if (store.spend < 100000 && store.nSup <= 1) return 'stop'
  if (store.spend > 500000 && store.nSup > 1) return 'perfect'
  return 'ok'
})

const verdictDesc = computed(() => {
  switch (verdictLevel.value) {
    case 'perfect': return t('calc.phase1.verdictPerfDesc')
    case 'ok': return t('calc.phase1.verdictOkDesc')
    case 'stop': return t('calc.phase1.verdictStopDesc')
  }
})
</script>

<style scoped>
.blue-p1 {
  padding: 20px 24px;
}

/* ── 3-column horizontal row ── */
.p1-row {
  display: flex;
  align-items: stretch;
  gap: 0;
}

.p1-card {
  flex: 1;
  min-width: 0;
  height: 220px;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  background: #FFF;
  padding: 20px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s;
}

.p1-card:hover,
.p1-card:focus-within {
  border-color: #A6F0D3;
}

.p1-card--done {
  border-color: #A6F0D3;
}

/* ── Connector dashes ── */
.connector {
  width: 28px;
  min-width: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Card header ── */
.p1-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.p1-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1B;
  line-height: normal;
}

.p1-card-sub {
  font-size: 12px;
  font-weight: 400;
  color: #787878;
  line-height: normal;
  margin-top: 2px;
  margin-bottom: 28px;
}

/* ── Spend input ── */
.spend-input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 160px;
  height: 40px;
  gap: 4px;
  border: 1px solid #DBDCDD;
  border-radius: 4px;
  padding: 0 12px;
  margin: 0 auto;
  transition: border-color 0.25s;
}

.spend-input-wrap:focus-within {
  border-color: #8E8E8E;
}

.spend-input-wrap--done {
  border-color: #DBDCDD;
}

.spend-slider-area {
  margin-top: 20px;
}

.ccy-select {
  width: 52px;
  flex: 0 0 52px;
  font-weight: 400;
  font-size: 14px;
  color: #787878;
}

.ccy-select :deep(.v-field__input) {
  padding: 0;
  min-height: auto;
  font-weight: 400;
  font-size: 14px;
  color: #787878;
}

.ccy-select :deep(.v-field) {
  padding: 0;
}

.ccy-select :deep(.v-field__append-inner) {
  padding: 0;
  margin: 0;
  color: #787878;
}

/* ── Suppliers card layout ── */
.p1-card--sup {
  align-items: center;
  justify-content: space-between;
}

.p1-card--sup .p1-card-header,
.p1-card--sup .p1-card-sub {
  align-self: flex-start;
}

/* ── Suppliers ── */
.sup-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.sup-counter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 150px;
  height: 40px;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  margin: 0 auto;
  overflow: hidden;
}

.sup-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: none;
  background: #F8F9FA;
  color: #636363;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}

.sup-btn--minus {
  border-right: 1px solid #E9EAEC;
  border-radius: 4px 0 0 4px;
}

.sup-btn--plus {
  border-left: 1px solid #E9EAEC;
  border-radius: 0 4px 4px 0;
}

.sup-btn:hover {
  background: #EFEFEF;
}

.sup-btn:active {
  background: #E5E5E5;
}

.sup-val {
  font-size: 16px;
  font-weight: 600;
  color: #333333;
  font-feature-settings: 'liga' off, 'clig' off;
  flex: 1;
  text-align: center;
  line-height: 1;
}

.sup-val--zero {
  color: #C5C7C9;
}

/* ── Verdict card ── */
.p1-verdict {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.verdict {
  border-radius: 4px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.verdict--wait {
  background: #F9FAFB;
  border: 1.5px dashed #E5E7EB;
}

.verdict--stop {
  background: #FEF2F2;
  border: 1.5px dashed #FECACA;
}

.verdict--ok {
  background: #EFF6FF;
  border: 1.5px dashed #93C5FD;
}

.verdict--perfect {
  background: #ECFDF5;
  border: 1.5px dashed #6EE7B7;
}

.verdict-icon {
  margin-bottom: 14px;
}

.verdict-title {
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1B;
  line-height: normal;
  margin-bottom: 8px;
}

.verdict-desc {
  font-size: 12px;
  font-weight: 400;
  color: #595959;
  line-height: 1.55;
  flex: 1;
}

.verdict-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
  padding: 12px 20px;
  background: #1D1D1B;
  color: #FFF;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.verdict-btn:hover {
  background: #333;
}

.verdict-btn--ghost {
  visibility: hidden;
  pointer-events: none;
}

/* ── Fade transition ── */
.vfade-enter-active,
.vfade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.vfade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.vfade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .p1-row {
    flex-wrap: wrap;
    gap: 12px;
  }
  .connector {
    display: none;
  }
  .p1-card,
  .p1-verdict {
    flex: 1 1 100%;
  }
}

@media (max-width: 600px) {
  .blue-p1 {
    padding: 12px;
  }
  .p1-card {
    padding: 14px;
  }
  .verdict {
    padding: 16px 14px;
  }
  .verdict-title {
    font-size: 13px;
  }
  .verdict-desc {
    font-size: 11px;
  }
  .verdict-btn {
    padding: 10px 16px;
    font-size: 13px;
  }
}
</style>
