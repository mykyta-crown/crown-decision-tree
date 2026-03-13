<template>
  <v-dialog v-model="show" max-width="1460" scrollable>
    <v-card class="dt-card" rounded="lg">
      <!-- Header -->
      <div class="dt-header">
        <div class="d-flex align-center ga-3">
          <div class="dt-icon">
            <v-icon size="20" color="white">mdi-file-tree</v-icon>
          </div>
          <div>
            <div class="dt-title">{{ t('v1.title') }}</div>
            <div class="dt-sub">{{ t('v1.subtitle') }}</div>
          </div>
        </div>
        <div class="d-flex align-center ga-3">
          <div class="dt-legend">
            <span class="legend-tag legend-tag--high">{{ t('v1.mostRecommended') }}</span>
            <span class="legend-arrow">→</span>
            <span class="legend-tag legend-tag--low">{{ t('v1.leastRecommended') }}</span>
          </div>
          <v-btn icon variant="text" size="small" @click="show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <!-- Canvas -->
      <div class="dt-canvas-wrap">
        <div class="dt-canvas">
          <!-- ═══ SVG FLOW ARROWS ═══ -->
          <svg class="dt-svg" viewBox="0 0 1420 520">
            <!-- Arrow G1 → G2: from EN center to DU center -->
            <line x1="320" y1="82" x2="598" y2="82" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="6,4" />
            <polygon points="596,78 604,82 596,86" fill="#D1D5DB" />
            <!-- Arrow G2 → G3: from JP center to SB center -->
            <line x1="810" y1="82" x2="1088" y2="82" stroke="#D1D5DB" stroke-width="1.5" stroke-dasharray="6,4" />
            <polygon points="1086,78 1094,82 1086,86" fill="#D1D5DB" />
          </svg>

          <!-- ═══ GROUP LABELS ═══ -->
          <div class="group-label" style="left: 10px; top: 8px; width: 410px">{{ t('v1.veryHighCompetition') }}</div>
          <div class="group-label" style="left: 500px; top: 8px; width: 410px">{{ t('v1.highCompetition') }}</div>
          <div class="group-label" style="left: 990px; top: 8px; width: 410px">{{ t('v1.lowNoCompetition') }}</div>

          <!-- ═══ ELIMINATION CRITERIA (on arrows between groups) ═══ -->
          <!-- Between G1 and G2 -->
          <div class="cond-group" style="left: 360px; top: 42px; width: 200px">
            <div class="cond cond--static">{{ t('v1.lessThan3Suppliers') }}</div>
            <div class="cond-or">{{ t('v1.or') }}</div>
            <div class="cond cond--static">{{ t('v1.gapOver7') }}</div>
          </div>

          <!-- Between G2 and G3 -->
          <div class="cond" style="left: 902px; top: 68px">{{ t('v1.smallSpend') }}</div>

          <!-- ═══ AUCTION CARDS ═══ -->

          <!-- 1. Double Scenario -->
          <div class="sc" style="left: 10px; top: 160px">
            <div class="sc-top" :style="{ borderColor: c.DS.border, background: c.DS.bg }">
              <DecisionTreeCalculatorChartsAChart family="Double Scenario" :color="c.DS.border" ccy="EUR" />
            </div>
            <div class="sc-body">
              <div class="sc-name" :style="{ color: c.DS.text }">
                <span class="sc-dot" :style="{ background: c.DS.border }" />
                {{ t('families.doubleScenario') }}
              </div>
              <div class="sc-savings">~15-25% {{ t('v1.savings') }}</div>
              <div class="sc-comp">
                <span v-for="i in 5" :key="i" class="pip" :style="{ background: c.DS.border }" />
                <span class="comp-txt">{{ t('v1.veryHigh') }}</span>
              </div>
              <div class="pills">
                <span class="p">{{ t('v1.preBid') }}</span>
                <span class="p">{{ t('v1.preference') }}</span>
                <span class="p p--y">{{ t('v1.competition') }} +++++</span>
                <span class="p">{{ t('v1.awardPostAward') }}</span>
              </div>
            </div>
          </div>

          <!-- 2. English Reverse -->
          <div class="sc" style="left: 220px; top: 160px">
            <div class="sc-top" :style="{ borderColor: c.EN.border, background: c.EN.bg }">
              <DecisionTreeCalculatorChartsAChart family="English" :color="c.EN.border" ccy="EUR" />
            </div>
            <div class="sc-body">
              <div class="sc-name" :style="{ color: c.EN.text }">
                <span class="sc-dot" :style="{ background: c.EN.border }" />
                {{ t('families.english') }}
              </div>
              <div class="sc-savings">~10-18% {{ t('v1.savings') }}</div>
              <div class="sc-comp">
                <span v-for="i in 5" :key="i" class="pip" :style="i <= 4 ? { background: c.EN.border } : {}" />
                <span class="comp-txt">{{ t('v1.high') }}</span>
              </div>
              <div class="pills">
                <span class="p">{{ t('v1.preBid') }}</span>
                <span class="p">{{ t('v1.preference') }}</span>
                <span class="p">{{ t('v1.ceiling') }}</span>
                <span class="p p--y">{{ t('v1.mostOptions') }}</span>
                <span class="p">{{ t('v1.awardPostAward') }}</span>
              </div>
            </div>
          </div>

          <!-- 3. Dutch Reverse -->
          <div class="sc" style="left: 500px; top: 160px">
            <div class="sc-top" :style="{ borderColor: c.DU.border, background: c.DU.bg }">
              <DecisionTreeCalculatorChartsAChart family="Dutch" :color="c.DU.border" ccy="EUR" />
            </div>
            <div class="sc-body">
              <div class="sc-name" :style="{ color: c.DU.text }">
                <span class="sc-dot" :style="{ background: c.DU.border }" />
                {{ t('families.dutch') }}
              </div>
              <div class="sc-savings">~8-15% {{ t('v1.savings') }}</div>
              <div class="sc-comp">
                <span v-for="i in 5" :key="i" class="pip" :style="i <= 3 ? { background: c.DU.border } : {}" />
                <span class="comp-txt">{{ t('v1.high') }}</span>
              </div>
              <div class="pills">
                <span class="p">{{ t('v1.preBid') }}</span>
                <span class="p">{{ t('v1.preference') }}</span>
                <span class="p p--y">{{ t('v1.competition') }} +++</span>
                <span class="p p--g">{{ t('v1.awardBinding') }}</span>
              </div>
            </div>
          </div>

          <!-- 4. Japanese Reverse -->
          <div class="sc" style="left: 710px; top: 160px">
            <div class="sc-top" :style="{ borderColor: c.JP.border, background: c.JP.bg }">
              <DecisionTreeCalculatorChartsAChart family="Japanese" :color="c.JP.border" ccy="EUR" />
            </div>
            <div class="sc-body">
              <div class="sc-name" :style="{ color: c.JP.text }">
                <span class="sc-dot" :style="{ background: c.JP.border }" />
                {{ t('families.japanese') }}
              </div>
              <div class="sc-savings">~8-15% {{ t('v1.savings') }}</div>
              <div class="sc-comp">
                <span v-for="i in 5" :key="i" class="pip" :style="i <= 3 ? { background: c.JP.border } : {}" />
                <span class="comp-txt">{{ t('v1.high') }}</span>
              </div>
              <div class="pills">
                <span class="p">{{ t('v1.preBid') }}</span>
                <span class="p">{{ t('v1.preference') }}</span>
                <span class="p p--y">{{ t('v1.competition') }} +++</span>
                <span class="p p--w">{{ t('v1.rankingOnly') }}</span>
              </div>
            </div>
          </div>

          <!-- 5. Sealed Bid -->
          <div class="sc" style="left: 990px; top: 160px">
            <div class="sc-top" :style="{ borderColor: c.SB.border, background: c.SB.bg }">
              <DecisionTreeCalculatorChartsAChart family="Sealed Bid" :color="c.SB.border" ccy="EUR" />
            </div>
            <div class="sc-body">
              <div class="sc-name" :style="{ color: c.SB.text }">
                <span class="sc-dot" :style="{ background: c.SB.border }" />
                {{ t('families.sealedBid') }}
              </div>
              <div class="sc-savings">~3-8% {{ t('v1.savings') }}</div>
              <div class="sc-comp">
                <span v-for="i in 5" :key="i" class="pip" :style="i <= 2 ? { background: c.SB.border } : {}" />
                <span class="comp-txt">{{ t('v1.medium') }}</span>
              </div>
              <div class="pills">
                <span class="p">{{ t('v1.preference') }}</span>
                <span class="p p--y">{{ t('v1.competition') }} ++</span>
                <span class="p">{{ t('v1.awardPostAward') }}</span>
              </div>
            </div>
          </div>

          <!-- 6. Traditional Negotiation -->
          <div class="sc" style="left: 1200px; top: 160px">
            <div class="sc-top" :style="{ borderColor: c.TR.border, background: c.TR.bg }">
              <DecisionTreeCalculatorChartsAChart family="Traditional" :color="c.TR.border" ccy="EUR" />
            </div>
            <div class="sc-body">
              <div class="sc-name" :style="{ color: c.TR.text }">
                <span class="sc-dot" :style="{ background: c.TR.border }" />
                {{ t('families.traditional') }}
              </div>
              <div class="sc-savings">~0-3% {{ t('v1.savings') }}</div>
              <div class="sc-comp">
                <span v-for="i in 5" :key="i" class="pip" :style="i <= 1 ? { background: c.TR.border } : {}" />
                <span class="comp-txt">{{ t('v1.low') }}</span>
              </div>
              <div class="pills">
                <span class="p">{{ t('v1.preference') }}</span>
                <span class="p p--y">{{ t('v1.competition') }} +</span>
                <span class="p">{{ t('v1.postAward') }}</span>
              </div>
            </div>
          </div>

          <!-- ═══ DUTCH vs JAPANESE DISTINCTION ═══ -->
          <div class="dt-note" style="left: 500px; top: 475px; width: 410px">
            {{ t('v1.awardBindingNote') }} <strong>Dutch</strong>
            <span class="dt-note-sep">|</span>
            {{ t('v1.noAwardNote') }} <strong>Japanese</strong>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { FC } from '~/utils/decisionTree/constants'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('decisiontree')
const show = defineModel<boolean>({ default: false })

const c = {
  DS: FC['Double Scenario'],
  EN: FC['English'],
  DU: FC['Dutch'],
  JP: FC['Japanese'],
  SB: FC['Sealed Bid'],
  TR: FC['Traditional'],
}
</script>

<style scoped>
/* ── Dialog ── */
.dt-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}

/* ── Header ── */
.dt-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #E9EAEC;
  flex-shrink: 0;
}

.dt-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #34D399 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dt-title { font-size: 16px; font-weight: 700; color: #1D1D1B; }
.dt-sub { font-size: 12px; color: #9CA3AF; margin-top: 1px; }

.dt-legend { display: flex; align-items: center; gap: 8px; }
.legend-tag {
  font-size: 10px; font-weight: 600; padding: 3px 8px;
  border-radius: 4px; text-transform: uppercase; letter-spacing: 0.03em;
}
.legend-tag--high { background: #ECFDF5; color: #065F46; }
.legend-tag--low { background: #F3F4F6; color: #6B7280; }
.legend-arrow { color: #D1D5DB; font-size: 14px; }

/* ── Canvas ── */
.dt-canvas-wrap {
  overflow: auto;
  background: #FAFAFA;
  flex: 1;
  padding: 20px;
}

.dt-canvas {
  position: relative;
  width: 1420px;
  height: 520px;
  margin: 0 auto;
}

/* ── SVG connection lines ── */
.dt-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 1420px;
  height: 520px;
  pointer-events: none;
  z-index: 0;
}

/* ── Group labels ── */
.group-label {
  position: absolute;
  text-align: center;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #9CA3AF;
  z-index: 1;
}

/* ── Condition nodes (elimination criteria) ── */
.cond {
  position: absolute;
  background: #FFF;
  border: 1.5px solid #E5E7EB;
  border-radius: 20px;
  padding: 5px 14px;
  font-size: 11.5px;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.cond--static { position: static; }

.cond-group {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  z-index: 2;
}

.cond-or {
  font-size: 12px;
  font-weight: 700;
  color: #1D1D1B;
}

/* ── Scenario cards ── */
.sc {
  position: absolute;
  z-index: 1;
  width: 200px;
  border-radius: 10px;
  overflow: hidden;
  background: #FFF;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s, transform 0.2s;
}

.sc:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

/* ── Card chart area ── */
.sc-top {
  height: 70px;
  padding: 6px 10px 0;
  overflow: hidden;
  border-bottom: 2px solid;
}

.sc-top :deep(.chart-container) {
  height: 62px;
  border: none;
  background: transparent;
  padding: 0;
}

/* ── Card body ── */
.sc-body {
  padding: 10px 12px 12px;
}

.sc-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  margin-bottom: 2px;
}

.sc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── Savings indicator ── */
.sc-savings {
  font-size: 11px;
  font-weight: 600;
  color: #059669;
  margin-bottom: 6px;
  padding-left: 14px;
}

/* ── Competition bar ── */
.sc-comp {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 8px;
}

.pip {
  width: 14px;
  height: 4px;
  border-radius: 2px;
  background: #E5E7EB;
}

.comp-txt {
  font-size: 10px;
  font-weight: 500;
  color: #9CA3AF;
  margin-left: 4px;
}

/* ── Attribute pills ── */
.pills {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.p {
  display: block;
  background: #FFF;
  border: 1.5px solid #E9EAEC;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11.5px;
  font-weight: 500;
  color: #374151;
  text-align: center;
  white-space: nowrap;
}

.p--y {
  background: #FFFBEB;
  border-color: #FDE68A;
  font-weight: 600;
  color: #1D1D1B;
}

.p--w {
  background: #FEF2F2;
  border-color: #FECACA;
  font-weight: 600;
  color: #991B1B;
}

.p--g {
  background: #ECFDF5;
  border-color: #A7F3D0;
  font-weight: 600;
  color: #065F46;
}

/* ── Dutch vs Japanese note ── */
.dt-note {
  position: absolute;
  text-align: center;
  font-size: 11.5px;
  color: #6B7280;
  z-index: 1;
}

.dt-note strong {
  color: #374151;
}

.dt-note-sep {
  margin: 0 10px;
  color: #D1D5DB;
}
</style>
