<template>
  <div class="guided-p1">
    <!-- Top row: How it works + two input cards -->
    <div class="p1-grid">
      <!-- How does it work — left column -->
      <div class="how-card">
        <div class="how-header">
          <div class="how-icon-wrap">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6" />
              <path d="M12 17h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </div>
          <span class="how-title">How does it work?</span>
        </div>

        <div class="how-steps">
          <div class="how-step" :class="{ 'how-step--active': activeHowStep === 0 }" @mouseenter="activeHowStep = 0">
            <div class="how-step-num">1</div>
            <div class="how-step-body">
              <div class="how-step-label">Feasibility Check</div>
              <div class="how-step-desc">Enter your spend and supplier count to check if an eAuction is suitable for your category.</div>
            </div>
          </div>
          <div class="how-step" :class="{ 'how-step--active': activeHowStep === 1 }" @mouseenter="activeHowStep = 1">
            <div class="how-step-num">2</div>
            <div class="how-step-body">
              <div class="how-step-label">Lot Configuration</div>
              <div class="how-step-desc">Define your lots with quantities, supplier prices, and strategic preferences to model your scenario.</div>
            </div>
          </div>
          <div class="how-step" :class="{ 'how-step--active': activeHowStep === 2 }" @mouseenter="activeHowStep = 2">
            <div class="how-step-num">3</div>
            <div class="how-step-body">
              <div class="how-step-label">Get Recommendations</div>
              <div class="how-step-desc">Our algorithm scores 22 auction strategies and recommends the best eAuction type for each lot.</div>
            </div>
          </div>
        </div>

        <div class="how-footer">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" opacity="0.3" />
            <circle cx="8" cy="8" r="3" stroke="currentColor" stroke-width="1.2" />
          </svg>
          <span>Guided mode walks you through each step</span>
        </div>
      </div>

      <!-- Right column: two input cards stacked -->
      <div class="p1-inputs">
        <!-- Spend card -->
        <div class="p1-card" :class="{ 'p1-card--done': store.spend > 0 }">
          <div class="p1-card-header">
            <div class="p1-card-badge" :class="{ 'p1-card-badge--done': store.spend > 0 }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.6" />
                <path d="M12 6v12M9 8.5c0-1.4 1.3-2.5 3-2.5s3 1.1 3 2.5-1.2 2-3 2.8c-1.8.8-3 1.4-3 2.7s1.3 2.5 3 2.5 3-1.1 3-2.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
              </svg>
            </div>
            <span class="p1-card-label">Total spend</span>
            <Transition name="check-fade">
              <svg v-if="store.spend > 0" class="p1-card-check" width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5L6.5 12L13 4" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </Transition>
          </div>
          <div class="p1-card-body">
            <div class="spend-ccy-row">
              <v-select
                v-model="store.ccy"
                :items="['EUR', 'USD', 'GBP', 'CHF', 'JPY', 'CNY', 'CAD', 'AUD', 'SEK', 'NOK', 'DKK', 'PLN']"
                variant="plain"
                density="compact"
                hide-details
                class="ccy-select"
              />
            </div>
            <div class="spend-input-wrap">
              <SpendInput v-model="store.spend" />
            </div>
            <div class="spend-slider">
              <NLSlider v-model="store.spend" />
            </div>
          </div>
        </div>

        <!-- Suppliers card -->
        <div class="p1-card" :class="{ 'p1-card--done': store.nSup > 0 }">
          <div class="p1-card-header">
            <div class="p1-card-badge" :class="{ 'p1-card-badge--done': store.nSup > 0 }">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="7" r="3" stroke="currentColor" stroke-width="1.5" />
                <circle cx="16" cy="7" r="3" stroke="currentColor" stroke-width="1.5" />
                <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                <path d="M14 14.5c1-.6 2.2-1 3.5-1 3 0 5.5 2.7 5.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <span class="p1-card-label">Suppliers</span>
            <Transition name="check-fade">
              <svg v-if="store.nSup > 0" class="p1-card-check" width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 8.5L6.5 12L13 4" stroke="#34D399" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </Transition>
          </div>
          <div class="p1-card-body p1-card-body--center">
            <div class="sup-controls">
              <button class="sup-btn" aria-label="Remove supplier" @click="store.nSup = Math.max(0, store.nSup - 1)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
              <span class="sup-value">{{ store.nSup }}</span>
              <button class="sup-btn" aria-label="Add supplier" @click="store.nSup = Math.min(20, store.nSup + 1)">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 3v8M3 7h8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                </svg>
              </button>
            </div>
            <div class="sup-hint">
              {{ store.nSup === 0 ? 'Add at least 1 supplier' : store.nSup === 1 ? '1 supplier selected' : store.nSup + ' suppliers selected' }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Verdict banner -->
    <Transition name="verdict-fade" mode="out-in">
      <div v-if="store.p1Ok" :key="verdictLevel" class="verdict" :class="'verdict--' + verdictLevel">
        <div class="verdict-icon">
          <v-icon v-if="verdictLevel === 'perfect'" color="white" size="22">mdi-check-circle</v-icon>
          <v-icon v-else-if="verdictLevel === 'ok'" color="white" size="22">mdi-information</v-icon>
          <v-icon v-else color="white" size="22">mdi-alert-circle</v-icon>
        </div>
        <div class="verdict-text">
          <div class="verdict-title">{{ verdictTitle }}</div>
          <div class="verdict-desc">{{ verdictDesc }}</div>
        </div>
        <v-btn
          v-if="verdictLevel !== 'stop'"
          color="white"
          variant="flat"
          size="small"
          class="verdict-btn"
          :class="'verdict-btn--' + verdictLevel"
          append-icon="mdi-arrow-right"
          @click="store.phase = 2"
        >
          Continue
        </v-btn>
      </div>
    </Transition>

    <!-- Subtle hint when not yet complete -->
    <Transition name="verdict-fade">
      <div v-if="!store.p1Ok" class="hint-row">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-width="1.2" />
          <path d="M8 5v3M8 10v.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
        <span>Fill in both fields to check eAuction eligibility</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import SpendInput from '~/components/decisionTree/calculator/SpendInput.vue'
import NLSlider from '~/components/decisionTree/calculator/NLSlider.vue'

const store = useCalculatorStore()

const activeHowStep = ref(0)

const verdictLevel = computed<'perfect' | 'ok' | 'stop'>(() => {
  if (store.spend < 100000 && store.nSup <= 1) return 'stop'
  if (store.spend > 500000 && store.nSup > 1) return 'perfect'
  return 'ok'
})

const verdictTitle = computed(() => {
  switch (verdictLevel.value) {
    case 'perfect': return 'Perfect fit for an eAuction'
    case 'ok': return 'eAuction possible, but not ideal'
    case 'stop': return 'eAuction not recommended'
  }
})

const verdictDesc = computed(() => {
  switch (verdictLevel.value) {
    case 'perfect': return 'Your spend and supplier count are ideal. Continue to configure your lots.'
    case 'ok': return 'You can run an eAuction, but results may be limited with fewer suppliers or lower spend.'
    case 'stop': return 'With less than 100K spend and only one supplier, a traditional negotiation is more effective.'
  }
})
</script>

<style scoped>
.guided-p1 {
  padding: 32px 32px 36px;
}

/* ── Main grid: how-card left, inputs right ── */
.p1-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  min-height: 380px;
}

@media (max-width: 860px) {
  .p1-grid {
    grid-template-columns: 1fr;
  }
}

/* ── How does it work card ── */
.how-card {
  background: linear-gradient(160deg, #F0FDF4 0%, #ECFDF5 40%, #F9FEFB 100%);
  border: 1.5px solid #D1FAE5;
  border-radius: 16px;
  padding: 28px 26px 22px;
  display: flex;
  flex-direction: column;
}

.how-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.how-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #FFF;
  border: 1.5px solid #D1FAE5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #10B981;
}

.how-title {
  font-size: 17px;
  font-weight: 700;
  color: #065F46;
}

/* ── How steps ── */
.how-steps {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.how-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  cursor: default;
  transition: all 0.25s ease;
  border: 1.5px solid transparent;
}

.how-step--active {
  background: #FFF;
  border-color: #D1FAE5;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
}

.how-step-num {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #D1FAE5;
  color: #065F46;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.25s ease;
}

.how-step--active .how-step-num {
  background: #10B981;
  color: #FFF;
}

.how-step-body {
  flex: 1;
  min-width: 0;
}

.how-step-label {
  font-size: 14px;
  font-weight: 600;
  color: #1D1D1B;
  margin-bottom: 3px;
}

.how-step-desc {
  font-size: 12px;
  color: #6B7280;
  line-height: 1.5;
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition: max-height 0.3s ease, opacity 0.25s ease, margin 0.3s ease;
}

.how-step--active .how-step-desc {
  max-height: 60px;
  opacity: 1;
  margin-top: 2px;
}

/* ── How footer ── */
.how-footer {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #D1FAE5;
  font-size: 12px;
  color: #6B7280;
}

.how-footer svg {
  color: #10B981;
  flex-shrink: 0;
}

/* ── Right column: inputs ── */
.p1-inputs {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Individual card ── */
.p1-card {
  flex: 1;
  min-height: 0;
  border: 1.5px solid #E9EAEC;
  border-radius: 14px;
  background: #FAFAFA;
  transition: border-color 0.3s, background 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.p1-card--done {
  border-color: #D1FAE5;
  background: #F9FEFB;
  box-shadow: 0 0 0 1px rgba(52, 211, 153, 0.08);
}

.p1-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px 0;
}

.p1-card-badge {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #FFF;
  border: 1.5px solid #E9EAEC;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #9CA3AF;
  transition: all 0.25s;
}

.p1-card-badge--done {
  color: #34D399;
  border-color: #D1FAE5;
  background: #F0FDF4;
}

.p1-card-label {
  font-size: 12px;
  font-weight: 700;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex: 1;
}

.p1-card-check {
  flex-shrink: 0;
}

.p1-card-body {
  padding: 14px 20px 18px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.p1-card-body--center {
  justify-content: center;
  align-items: center;
}

/* ── Spend ── */
.spend-ccy-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 6px;
}

.spend-input-wrap {
  margin-bottom: 12px;
}

.spend-slider {
  padding-top: 12px;
  border-top: 1px solid #E9EAEC;
  margin-top: auto;
}

.p1-card--done .spend-slider {
  border-top-color: #D1FAE5;
}

.ccy-select {
  width: 58px;
  flex: 0 0 58px;
  font-weight: 600;
  font-size: 13px;
}

.ccy-select :deep(.v-field__input) {
  padding: 0;
  min-height: auto;
  font-weight: 600;
  font-size: 13px;
}

.ccy-select :deep(.v-field) {
  padding: 0;
}

.ccy-select :deep(.v-field__append-inner) {
  padding: 0;
  margin: 0;
}

/* ── Supplier controls ── */
.sup-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  justify-content: center;
  padding: 8px 0;
}

.sup-btn {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1.5px solid #E5E7EB;
  background: #FFF;
  color: #6B7280;
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

.sup-value {
  font-size: 36px;
  font-weight: 700;
  color: #1D1D1B;
  min-width: 52px;
  text-align: center;
  line-height: 1;
}

.sup-hint {
  text-align: center;
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 4px;
}

/* ── Verdict banner ── */
.verdict {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px 24px;
  border-radius: 12px;
  margin-top: 24px;
}

.verdict--perfect {
  background: linear-gradient(135deg, #065F46 0%, #047857 100%);
  color: #FFF;
}

.verdict--ok {
  background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
  color: #FFF;
}

.verdict--stop {
  background: linear-gradient(135deg, #92400E 0%, #B45309 100%);
  color: #FFF;
}

.verdict-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verdict-text {
  flex: 1;
}

.verdict-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 2px;
}

.verdict-desc {
  font-size: 12px;
  opacity: 0.85;
}

.verdict-btn {
  font-weight: 600;
  flex-shrink: 0;
}

.verdict-btn--perfect {
  color: #065F46 !important;
}

.verdict-btn--ok {
  color: #1E40AF !important;
}

/* ── Hint ── */
.hint-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 13px;
  color: #C7C7C7;
}

/* ── Transitions ── */
.verdict-fade-enter-active,
.verdict-fade-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.verdict-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.verdict-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

.check-fade-enter-active,
.check-fade-leave-active {
  transition: all 0.25s ease;
}

.check-fade-enter-from {
  opacity: 0;
  transform: scale(0.5);
}

.check-fade-leave-to {
  opacity: 0;
  transform: scale(0.5);
}
</style>
