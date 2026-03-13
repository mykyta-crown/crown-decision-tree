<template>
  <v-dialog v-model="show" max-width="1200" scrollable>
    <v-card class="ov-card" rounded="lg">

      <!-- Header -->
      <div class="ov-header">
        <div class="d-flex align-center ga-3">
          <div class="ov-icon">
            <v-icon size="20" color="white">mdi-tag-multiple-outline</v-icon>
          </div>
          <div>
            <div class="ov-title">{{ t('v1.title') }}</div>
            <div class="ov-sub">{{ t('v1.subtitle') }}</div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Grid -->
      <div class="ov-body">
        <div class="fam-grid">
          <div v-for="fam in families" :key="fam.key" class="fam-card">

            <!-- Top band: name + savings + intensity -->
            <div class="fam-top" :style="{ background: gfc(fam.family).bg, borderBottom: `2px solid ${gfc(fam.family).border}` }">
              <div class="fam-top-left">
                <div class="fam-icon-wrap" :style="{ background: gfc(fam.family).border + '22', borderColor: gfc(fam.family).border + '44' }">
                  <v-icon :icon="fam.icon" size="16" :color="gfc(fam.family).text" />
                </div>
                <span class="fam-name" :style="{ color: gfc(fam.family).text }">{{ t(fam.nameKey) }}</span>
              </div>
              <div class="fam-top-right">
                <span class="fam-savings" :style="{ color: gfc(fam.family).text }">{{ fam.savingsLabel }}</span>
                <div class="int-pip-row">
                  <div
                    v-for="i in 4" :key="i"
                    class="int-pip"
                    :style="{ background: i <= fam.intensityLevel ? famOptionDetails[fam.key].intensity.color : '#E5E7EB' }"
                  />
                </div>
              </div>
            </div>

            <!-- Chart illustration -->
            <div class="fam-chart-area" :style="{ background: gfc(fam.family).bg }">
              <ArchitectCalculatorChartsAChart
                :family="fam.family"
                :color="gfc(fam.family).border"
                ccy="EUR"
              />
            </div>

            <!-- Short description -->
            <div class="fam-body">
              <p class="fam-desc">{{ t(fam.shortKey) }}</p>

              <!-- Flow steps -->
              <div class="fam-flow">
                <template v-for="(step, si) in famFlowKeys[fam.key]" :key="si">
                  <div class="flow-step">
                    <v-icon :icon="step.icon" size="10" :color="gfc(fam.family).border" />
                    <span>{{ t(step.labelKey) }}</span>
                  </div>
                  <span v-if="si < famFlowKeys[fam.key].length - 1" class="flow-sep" :style="{ color: gfc(fam.family).border }">›</span>
                </template>
              </div>

              <!-- Option chips -->
              <div class="fam-chips">
                <span v-if="famOptionDetails[fam.key].preBid" class="chip">
                  <v-icon size="9" color="#6B7280">mdi-clock-fast</v-icon>
                  {{ t('v1.preBid') }}
                </span>
                <span v-if="famOptionDetails[fam.key].pref" class="chip">
                  <v-icon size="9" color="#6B7280">mdi-scale-balance</v-icon>
                  {{ t('v1.preference') }}
                </span>
                <span v-for="mode in famOptionDetails[fam.key].awardModes" :key="mode" class="chip">
                  <v-icon size="9" color="#6B7280">{{ mode === 'award' ? 'mdi-trophy-outline' : mode === 'rank' ? 'mdi-format-list-numbered' : 'mdi-eye-outline' }}</v-icon>
                  {{ mode === 'award' ? t('hiw.lvlAwardAward') : mode === 'rank' ? t('hiw.lvlAwardRank') : t('hiw.lvlAwardNoRank') }}
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { gfc } from '~/utils/architect/constants'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('architect')
const show = defineModel<boolean>({ default: false })

const families = [
  { key: 'ds', family: 'Double Scenario', icon: 'mdi-layers-outline',    nameKey: 'families.doubleScenario', shortKey: 'v5.dsShort', savingsLabel: '12–18%', intensityLevel: 4 },
  { key: 'en', family: 'English',          icon: 'mdi-gavel',             nameKey: 'families.english',        shortKey: 'v5.enShort', savingsLabel: '10–15%', intensityLevel: 3 },
  { key: 'du', family: 'Dutch',            icon: 'mdi-trending-up',        nameKey: 'families.dutch',          shortKey: 'v5.duShort', savingsLabel: '8–12%',  intensityLevel: 2 },
  { key: 'jp', family: 'Japanese',         icon: 'mdi-trending-down',      nameKey: 'families.japanese',       shortKey: 'v5.jpShort', savingsLabel: '8–12%',  intensityLevel: 2 },
  { key: 'sb', family: 'Sealed Bid',       icon: 'mdi-email-lock-outline', nameKey: 'families.sealedBid',      shortKey: 'v5.sbShort', savingsLabel: '5–8%',   intensityLevel: 1 },
  { key: 'tr', family: 'Traditional',      icon: 'mdi-handshake-outline',  nameKey: 'families.traditional',    shortKey: 'v5.trShort', savingsLabel: '2–5%',   intensityLevel: 1 },
]

const famFlowKeys: Record<string, { icon: string; labelKey: string }[]> = {
  ds: [
    { icon: 'mdi-clock-outline',           labelKey: 'hiw.flowDsPreBid'     },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowDsEnglish'    },
    { icon: 'mdi-trending-up',             labelKey: 'hiw.flowDsDutch'      },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowDsAward'      },
  ],
  en: [
    { icon: 'mdi-currency-usd',            labelKey: 'hiw.flowEnCeiling'    },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowEnBid1'       },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowEnBid2'       },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowEnBest'       },
  ],
  du: [
    { icon: 'mdi-currency-usd',            labelKey: 'hiw.flowDuHigh'       },
    { icon: 'mdi-trending-up',             labelKey: 'hiw.flowDuAuto'       },
    { icon: 'mdi-hand-back-right-outline', labelKey: 'hiw.flowDuAccept'     },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowDuWinner'     },
  ],
  jp: [
    { icon: 'mdi-currency-usd',            labelKey: 'hiw.flowJpLow'        },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowJpRound'      },
    { icon: 'mdi-exit-to-app',             labelKey: 'hiw.flowJpExit'       },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowJpLast'       },
  ],
  sb: [
    { icon: 'mdi-email-outline',           labelKey: 'hiw.flowSbSubmit'     },
    { icon: 'mdi-lock-outline',            labelKey: 'hiw.flowSbSealed'     },
    { icon: 'mdi-chart-bar',               labelKey: 'hiw.flowSbCompare'    },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowSbBest'       },
  ],
  tr: [
    { icon: 'mdi-handshake-outline',       labelKey: 'hiw.flowTrContact'    },
    { icon: 'mdi-chat-outline',            labelKey: 'hiw.flowTrNegotiate'  },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowTrAgree'      },
  ],
}

const famOptionDetails: Record<string, {
  preBid: boolean
  pref: boolean
  awardModes: ('award' | 'rank' | 'norank')[]
  intensity: { labelKey: string; labelFb: string; fill: string; color: string }
}> = {
  ds: { preBid: true,  pref: true,  awardModes: ['award'],                   intensity: { labelKey: 'hiw.lvlIntAggr',   labelFb: 'Intense',       fill: '100%', color: '#EF4444' } },
  en: { preBid: true,  pref: true,  awardModes: ['award', 'rank'],            intensity: { labelKey: 'hiw.lvlIntHigh',   labelFb: 'Very High',     fill: '75%',  color: '#F59E0B' } },
  du: { preBid: true,  pref: true,  awardModes: ['award'],                   intensity: { labelKey: 'hiw.lvlIntCompet', labelFb: 'Competitive',   fill: '50%',  color: '#FBBF24' } },
  jp: { preBid: true,  pref: true,  awardModes: ['award', 'rank', 'norank'], intensity: { labelKey: 'hiw.lvlIntCompet', labelFb: 'Competitive',   fill: '50%',  color: '#FBBF24' } },
  sb: { preBid: false, pref: true,  awardModes: ['award', 'rank', 'norank'], intensity: { labelKey: 'hiw.lvlIntCollab', labelFb: 'Collaborative', fill: '25%',  color: '#34D399' } },
  tr: { preBid: false, pref: false, awardModes: [],                          intensity: { labelKey: 'hiw.lvlIntCollab', labelFb: 'Collaborative', fill: '25%',  color: '#34D399' } },
}
</script>

<style scoped>
.ov-card {
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
}

/* ── Header ── */
.ov-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #E9EAEC;
  flex-shrink: 0;
}
.ov-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #34D399 0%, #059669 100%);
  display: flex; align-items: center; justify-content: center;
}
.ov-title { font-size: 16px; font-weight: 700; color: #1D1D1B; }
.ov-sub   { font-size: 12px; color: #9CA3AF; margin-top: 1px; }

/* ── Body ── */
.ov-body {
  overflow-y: auto;
  padding: 20px;
  background: #F8F8F8;
}

/* ── Grid: 3 cols × 2 rows ── */
.fam-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

/* ── Card ── */
.fam-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #E9EAEC;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Top band */
.fam-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
}
.fam-top-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.fam-icon-wrap {
  width: 28px; height: 28px;
  border-radius: 8px;
  border: 1px solid;
  display: flex; align-items: center; justify-content: center;
}
.fam-name {
  font-size: 13px;
  font-weight: 700;
}
.fam-top-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}
.fam-savings {
  font-size: 12px;
  font-weight: 700;
}
.int-pip-row {
  display: flex;
  gap: 3px;
}
.int-pip {
  width: 12px; height: 4px;
  border-radius: 2px;
}

/* Chart */
.fam-chart-area {
  padding: 12px 16px 8px;
}
.fam-chart-area :deep(.chart-container) {
  height: 96px;
  border: none;
  background: transparent;
  padding: 0;
}

/* Body */
.fam-body {
  padding: 10px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}
.fam-desc {
  font-size: 12px;
  color: #374151;
  line-height: 1.5;
  margin: 0;
}

/* Flow */
.fam-flow {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 3px;
}
.flow-step {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 500;
  color: #4B5563;
  background: #F9FAFB;
  border: 1px solid #E9EAEC;
  border-radius: 4px;
  padding: 2px 5px;
  white-space: nowrap;
}
.flow-sep {
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

/* Option chips */
.fam-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  font-weight: 500;
  color: #6B7280;
  background: #F3F4F6;
  border: 1px solid #E5E7EB;
  border-radius: 20px;
  padding: 2px 8px;
  white-space: nowrap;
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .fam-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .fam-grid { grid-template-columns: 1fr; }
  .ov-body  { padding: 12px; }
}
</style>
