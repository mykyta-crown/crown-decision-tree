<template>
  <div class="guided-p1">
    <div class="p1-row">
      <!-- 1. Total spend -->
      <div class="p1-card" :class="{ 'p1-card--done': store.spend > 0 }">
        <div class="p1-card-header">
          <div class="p1-card-title">{{ t('calc.phase1.totalSpend') }}</div>
          <v-icon size="16" color="#9CA3AF">mdi-information-outline</v-icon>
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
      <div class="p1-card" :class="{ 'p1-card--done': store.nSup > 0 }">
        <div class="p1-card-header">
          <div class="p1-card-title">{{ t('calc.phase1.numSuppliers') }}</div>
          <v-icon size="16" color="#9CA3AF">mdi-information-outline</v-icon>
        </div>
        <div class="p1-card-sub">{{ t('calc.phase1.suppliersSub') }}</div>

        <div class="sup-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <circle cx="20" cy="16" r="6" stroke="#C4C4C4" stroke-width="1.8" fill="none" />
            <path d="M10 38c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="#C4C4C4" stroke-width="1.8" fill="none" stroke-linecap="round" />
            <circle cx="32" cy="18" r="4.5" stroke="#C4C4C4" stroke-width="1.5" fill="none" />
            <path d="M36 38c0-4.418-2.686-8-6-8" stroke="#C4C4C4" stroke-width="1.5" fill="none" stroke-linecap="round" />
          </svg>
        </div>

        <div class="sup-counter">
          <button class="sup-btn" aria-label="Remove supplier" @click="store.nSup = Math.max(0, store.nSup - 1)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 8h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
            </svg>
          </button>
          <span class="sup-val" :class="{ 'sup-val--zero': store.nSup === 0 }">{{ store.nSup }}</span>
          <button class="sup-btn sup-btn--plus" aria-label="Add supplier" @click="store.nSup = Math.min(20, store.nSup + 1)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 4v8M4 8h8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" />
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
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import SpendInput from '~/components/decisionTree/calculator/SpendInput.vue'
import NLSlider from '~/components/decisionTree/calculator/NLSlider.vue'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('decisiontree')
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
.guided-p1 {
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
  border: 1.5px solid #E5E7EB;
  border-radius: 14px;
  background: #FFF;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.3s, box-shadow 0.3s;
}

.p1-card:hover {
  border-color: #D1D5DB;
}

.p1-card--done {
  border-color: #34D399;
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.1);
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
  font-size: 15px;
  font-weight: 700;
  color: #1D1D1B;
}

.p1-card-sub {
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 2px;
  margin-bottom: 14px;
}

/* ── Spend input ── */
.spend-input-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1.5px dashed #D1D5DB;
  border-radius: 10px;
  padding: 6px 14px;
  margin: 0 auto;
  transition: border-color 0.25s;
}

.spend-input-wrap--done {
  border-color: #34D399;
}

.spend-slider-area {
  margin-top: 12px;
}

.ccy-select {
  width: 68px;
  flex: 0 0 68px;
  font-weight: 600;
  font-size: 16px;
}

.ccy-select :deep(.v-field__input) {
  padding: 0;
  min-height: auto;
  font-weight: 600;
  font-size: 16px;
}

.ccy-select :deep(.v-field) {
  padding: 0;
}

.ccy-select :deep(.v-field__append-inner) {
  padding: 0;
  margin: 0;
}

/* ── Suppliers ── */
.sup-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.sup-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border: 1.5px solid #E5E7EB;
  border-radius: 10px;
  padding: 8px 20px;
  margin: 0 auto;
}

.sup-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1.5px solid #E5E7EB;
  background: #FFF;
  color: #9CA3AF;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.sup-btn:hover {
  border-color: #1D1D1B;
  color: #1D1D1B;
}

.sup-btn:active {
  transform: scale(0.93);
}

.sup-btn--plus {
  border-color: #1D1D1B;
  color: #1D1D1B;
}

.sup-val {
  font-size: 28px;
  font-weight: 700;
  color: #1D1D1B;
  min-width: 32px;
  text-align: center;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.sup-val--zero {
  color: #D1D5DB;
}

/* ── Verdict card ── */
.p1-verdict {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.verdict {
  border-radius: 14px;
  padding: 22px 20px;
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
  font-size: 16px;
  font-weight: 700;
  font-style: italic;
  color: #1D1D1B;
  line-height: 1.3;
  margin-bottom: 8px;
}

.verdict-desc {
  font-size: 13px;
  color: #6B7280;
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
  border-radius: 10px;
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
</style>
