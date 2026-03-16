<template>
  <v-dialog v-model="show" max-width="1300" scrollable>
    <v-card class="v5-card" rounded="lg">
      <!-- ── Header ── -->
      <div class="v5-header">
        <div class="d-flex align-center ga-3">
          <div class="v5-icon">
            <v-icon size="16" color="white">mdi-sitemap-outline</v-icon>
          </div>
          <div>
            <div class="v5-title">{{ t('v5.title') }}</div>
            <div class="v5-sub">{{ t('v5.subtitle') }}</div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="v5-window">
          <div class="tab-body">
            <!-- Reset / status bar -->
            <div class="itree-bar">
              <div class="itree-status">
                <template v-if="iActive === 'done'">
                  <v-icon size="14" color="#059669">mdi-check-circle-outline</v-icon>
                  <span>{{ iWinnerName || t('v5.iDone') }}</span>
                </template>
                <template v-else>
                  <v-icon size="14" color="#6366F1">mdi-cursor-default-click-outline</v-icon>
                  <span>{{ t('v5.iClick') }}</span>
                </template>
              </div>
              <button v-if="Object.values(iAns).some(v => v !== null)" class="itree-reset" @click="iReset()">
                <v-icon size="13">mdi-refresh</v-icon> {{ t('v5.iReset') }}
              </button>
            </div>
            <div class="tree-section">
              <svg class="tree-svg" viewBox="0 0 100 400" preserveAspectRatio="none">
                <!-- Root stem — colors once q1 is answered -->
                <g fill="none" :stroke="gsRoot()" stroke-width="1.5">
                  <line x1="50" y1="46" x2="50" y2="60" />
                </g>
                <!-- Horizontal split: left half follows YES, right half follows NO -->
                <g fill="none" :stroke="gs({q1:'yes'})" :stroke-width="gsw({q1:'yes'})">
                  <line x1="33.33" y1="60" x2="50" y2="60" />
                </g>
                <g fill="none" :stroke="gs({q1:'no'})" :stroke-width="gsw({q1:'no'})">
                  <line x1="50" y1="60" x2="83.33" y2="60" />
                </g>
                <!-- Q1=YES branch -->
                <g fill="none" :stroke="gs({q1:'yes'})" :stroke-width="gsw({q1:'yes'})">
                  <line x1="33.33" y1="60" x2="33.33" y2="76" />
                  <line x1="33.33" y1="98" x2="33.33" y2="112" />
                  <line x1="33.33" y1="152" x2="33.33" y2="166" />
                  <line x1="16.67" y1="166" x2="50" y2="166" />
                </g>
                <!-- Q1=NO branch -->
                <g fill="none" :stroke="gs({q1:'no'})" :stroke-width="gsw({q1:'no'})">
                  <line x1="83.33" y1="60" x2="83.33" y2="76" />
                  <line x1="83.33" y1="98" x2="83.33" y2="128" />
                  <line x1="83.33" y1="142" x2="83.33" y2="194" />
                  <line x1="83.33" y1="232" x2="83.33" y2="248" />
                  <line x1="75" y1="248" x2="91.67" y2="248" />
                </g>
                <!-- Q2=YES branch -->
                <g fill="none" :stroke="gs({q1:'yes',q2:'yes'})" :stroke-width="gsw({q1:'yes',q2:'yes'})">
                  <line x1="16.67" y1="166" x2="16.67" y2="180" />
                  <line x1="16.67" y1="180" x2="16.67" y2="184" />
                  <line x1="16.67" y1="214" x2="16.67" y2="224" />
                  <line x1="16.67" y1="258" x2="16.67" y2="272" />
                  <line x1="8.33" y1="272" x2="25" y2="272" />
                </g>
                <!-- Q2=NO branch -->
                <g fill="none" :stroke="gs({q1:'yes',q2:'no'})" :stroke-width="gsw({q1:'yes',q2:'no'})">
                  <line x1="50" y1="166" x2="50" y2="180" />
                  <line x1="50" y1="180" x2="50" y2="184" />
                  <line x1="50" y1="202" x2="50" y2="224" />
                  <line x1="50" y1="258" x2="50" y2="272" />
                  <line x1="41.67" y1="272" x2="58.33" y2="272" />
                </g>
                <!-- Q4=YES → Sealed Bid -->
                <g fill="none" :stroke="gs({q1:'no',q4:'yes'})" :stroke-width="gsw({q1:'no',q4:'yes'})">
                  <line x1="75" y1="248" x2="75" y2="264" />
                  <line x1="75" y1="282" x2="75" y2="400" />
                </g>
                <!-- Q4=NO → Traditional -->
                <g fill="none" :stroke="gs({q1:'no',q4:'no'})" :stroke-width="gsw({q1:'no',q4:'no'})">
                  <line x1="91.67" y1="248" x2="91.67" y2="264" />
                  <line x1="91.67" y1="282" x2="91.67" y2="400" />
                </g>
                <!-- Q3a=YES → Double Scenario -->
                <g fill="none" :stroke="gs({q1:'yes',q2:'yes',q3a:'yes'})" :stroke-width="gsw({q1:'yes',q2:'yes',q3a:'yes'})">
                  <line x1="8.33" y1="272" x2="8.33" y2="286" />
                  <line x1="8.33" y1="286" x2="8.33" y2="290" />
                  <line x1="8.33" y1="308" x2="8.33" y2="400" />
                </g>
                <!-- Q3a=NO → English -->
                <g fill="none" :stroke="gs({q1:'yes',q2:'yes',q3a:'no'})" :stroke-width="gsw({q1:'yes',q2:'yes',q3a:'no'})">
                  <line x1="25" y1="272" x2="25" y2="286" />
                  <line x1="25" y1="286" x2="25" y2="290" />
                  <line x1="25" y1="308" x2="25" y2="400" />
                </g>
                <!-- Q3=YES → Dutch -->
                <g fill="none" :stroke="gs({q1:'yes',q2:'no',q3:'yes'})" :stroke-width="gsw({q1:'yes',q2:'no',q3:'yes'})">
                  <line x1="41.67" y1="272" x2="41.67" y2="286" />
                  <line x1="41.67" y1="286" x2="41.67" y2="290" />
                  <line x1="41.67" y1="308" x2="41.67" y2="400" />
                </g>
                <!-- Q3=NO → Japanese -->
                <g fill="none" :stroke="gs({q1:'yes',q2:'no',q3:'no'})" :stroke-width="gsw({q1:'yes',q2:'no',q3:'no'})">
                  <line x1="58.33" y1="272" x2="58.33" y2="286" />
                  <line x1="58.33" y1="286" x2="58.33" y2="290" />
                  <line x1="58.33" y1="308" x2="58.33" y2="400" />
                </g>
                <!-- Colored anchor dots -->
                <g>
                  <circle cx="8.33"  cy="400" r="3.5" fill="#F472B6" />
                  <circle cx="25"    cy="400" r="3.5" fill="#34D399" />
                  <circle cx="41.67" cy="400" r="3.5" fill="#A78BFA" />
                  <circle cx="58.33" cy="400" r="3.5" fill="#FBBF24" />
                  <circle cx="75"    cy="400" r="3.5" fill="#67E8F9" />
                  <circle cx="91.67" cy="400" r="3.5" fill="#FB923C" />
                </g>
              </svg>

              <div class="tree-content">
                <!-- Q1 — root -->
                <div class="tree-el" style="left: 50%; top: 2px">
                  <div class="q-bubble q-bubble--root" :class="iq('q1')">
                    <v-icon size="18" class="q-icon">mdi-cash-multiple</v-icon>
                    <div>
                      <span class="q-text">{{ t('v5.q1') }}</span>
                      <div class="q-hint">{{ t('v5.q1Hint') }}</div>
                    </div>
                  </div>
                </div>
                <div class="tree-el" style="left: 33.33%; top: 80px">
                  <button class="ibadge" :class="ib('q1','yes')" @click="ia('q1','yes')">
                    <div class="badge badge--yes"><v-icon :icon="iCheckIcon('q1','yes')" size="12" />{{ t('v5.yes') }}</div>
                  </button>
                </div>
                <div class="tree-el" style="left: 83.33%; top: 80px">
                  <button class="ibadge" :class="ib('q1','no')" @click="ia('q1','no')">
                    <div class="badge badge--no"><v-icon :icon="iCheckIcon('q1','no')" size="12" />{{ t('v5.no') }}</div>
                  </button>
                </div>
                <!-- Q2 -->
                <div class="tree-el" style="left: 33.33%; top: 112px">
                  <div class="q-bubble" :class="iq('q2')">
                    <v-icon size="18" class="q-icon">mdi-account-group-outline</v-icon>
                    <span class="q-text">{{ t('v5.q2') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 83.33%; top: 130px">
                  <div class="hint-label">{{ t('v5.simpleApproach') }}</div>
                </div>
                <!-- Q4 — Sealed Bid vs Traditional -->
                <div class="tree-el" style="left: 83.33%; top: 194px">
                  <div class="q-bubble q-bubble--small" :class="iq('q4')">
                    <v-icon size="16" class="q-icon">mdi-lock-outline</v-icon>
                    <span class="q-text">{{ t('v5.q4') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 75%; top: 264px">
                  <button class="ibadge" :class="ib('q4','yes')" @click="ia('q4','yes')">
                    <div class="badge badge--yes badge--sm"><v-icon :icon="iCheckIcon('q4','yes')" size="10" />{{ t('v5.yes') }}</div>
                  </button>
                </div>
                <div class="tree-el" style="left: 91.67%; top: 264px">
                  <button class="ibadge" :class="ib('q4','no')" @click="ia('q4','no')">
                    <div class="badge badge--no badge--sm"><v-icon :icon="iCheckIcon('q4','no')" size="10" />{{ t('v5.no') }}</div>
                  </button>
                </div>
                <!-- Q2 YES / NO -->
                <div class="tree-el" style="left: 16.67%; top: 184px">
                  <button class="ibadge" :class="ib('q2','yes')" @click="ia('q2','yes')">
                    <div class="badge badge--yes badge--sm"><v-icon :icon="iCheckIcon('q2','yes')" size="10" />{{ t('v5.yes') }}</div>
                  </button>
                </div>
                <div class="tree-el" style="left: 16.67%; top: 202px">
                  <div class="badge-best">{{ t('v5.bestPotential') }}</div>
                </div>
                <div class="tree-el" style="left: 50%; top: 184px">
                  <button class="ibadge" :class="ib('q2','no')" @click="ia('q2','no')">
                    <div class="badge badge--no badge--sm"><v-icon :icon="iCheckIcon('q2','no')" size="10" />{{ t('v5.no') }}</div>
                  </button>
                </div>
                <!-- Q3a -->
                <div class="tree-el" style="left: 16.67%; top: 224px">
                  <div class="q-bubble q-bubble--small" :class="iq('q3a')">
                    <v-icon size="16" class="q-icon">mdi-layers-triple-outline</v-icon>
                    <span class="q-text">{{ t('v5.q3a') }}</span>
                  </div>
                </div>
                <!-- Q3 -->
                <div class="tree-el" style="left: 50%; top: 224px">
                  <div class="q-bubble q-bubble--small" :class="iq('q3')">
                    <v-icon size="16" class="q-icon">mdi-trophy-outline</v-icon>
                    <span class="q-text">{{ t('v5.q3') }}</span>
                  </div>
                </div>
                <!-- Q3a YES → DS / NO → EN -->
                <div class="tree-el" style="left: 8.33%; top: 290px">
                  <button class="ibadge" :class="ib('q3a','yes')" @click="ia('q3a','yes')">
                    <div class="badge badge--yes badge--sm"><v-icon :icon="iCheckIcon('q3a','yes')" size="10" />{{ t('v5.yes') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintDS') }}</div>
                </div>
                <div class="tree-el" style="left: 25%; top: 290px">
                  <button class="ibadge" :class="ib('q3a','no')" @click="ia('q3a','no')">
                    <div class="badge badge--no badge--sm"><v-icon :icon="iCheckIcon('q3a','no')" size="10" />{{ t('v5.no') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintEN') }}</div>
                </div>
                <!-- Q3 YES → DU / NO → JP -->
                <div class="tree-el" style="left: 41.67%; top: 290px">
                  <button class="ibadge" :class="ib('q3','yes')" @click="ia('q3','yes')">
                    <div class="badge badge--yes badge--sm"><v-icon :icon="iCheckIcon('q3','yes')" size="10" />{{ t('v5.yes') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintDU') }}</div>
                </div>
                <div class="tree-el" style="left: 58.33%; top: 290px">
                  <button class="ibadge" :class="ib('q3','no')" @click="ia('q3','no')">
                    <div class="badge badge--no badge--sm"><v-icon :icon="iCheckIcon('q3','no')" size="10" />{{ t('v5.no') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintJP') }}</div>
                </div>
              </div>
            </div>

            <!-- Family cards — state driven by answers -->
            <div class="fam-grid">
              <div v-for="card in cards" :key="card.key" class="fam-card" :class="iCard(card.key)" :style="{ borderTop: `3px solid ${gfc(card.family).border}` }">

                <!-- Recommended badge -->
                <div v-if="iCard(card.key) === 'ic--win'" class="fam-recommended" :style="{ background: gfc(card.family).border }">
                  <v-icon size="10" color="white">mdi-star</v-icon>
                  <span>{{ t('v5.recommended') }}</span>
                </div>

                <!-- Top band: icon + name + savings + intensity pips -->
                <div class="fam-top" :style="{ background: gfc(card.family).bg, borderBottom: `2px solid ${gfc(card.family).border}` }">
                  <div class="fam-top-left">
                    <div class="fam-icon-wrap" :style="{ background: gfc(card.family).border + '22', borderColor: gfc(card.family).border + '55' }">
                      <v-icon :icon="card.icon" size="14" :color="gfc(card.family).text" />
                    </div>
                    <span class="fam-name" :style="{ color: gfc(card.family).text }">{{ card.name }}</span>
                  </div>
                  <div class="fam-top-right">
                    <span class="fam-savings" :style="{ color: gfc(card.family).text }">{{ card.savingsLabel }}</span>
                    <div class="fam-pips">
                      <div
                        v-for="i in 4" :key="i"
                        class="fam-pip"
                        :style="{ background: i <= card.intensityLevel ? gfc(card.family).border : '#E5E7EB' }"
                      />
                    </div>
                  </div>
                </div>

                <!-- Chart illustration -->
                <div class="fam-chart" :style="{ background: gfc(card.family).bg }">
                  <ArchitectCalculatorChartsAChart
                    :family="card.family"
                    :color="gfc(card.family).border"
                    ccy="EUR"
                  />
                </div>

                <!-- Body: description + flow + chips -->
                <div class="fam-body">
                  <p class="fam-desc">{{ card.short }}</p>

                  <!-- Flow steps — icon-only mini timeline -->
                  <div class="fam-flow">
                    <template v-for="(step, si) in famFlowKeys[card.key]" :key="si">
                      <div class="fam-step" :title="t(step.labelKey)" :style="{ borderColor: gfc(card.family).border + '66', background: gfc(card.family).border + '18' }">
                        <v-icon :icon="step.icon" size="9" :color="gfc(card.family).border" />
                      </div>
                      <div v-if="si < famFlowKeys[card.key].length - 1" class="fam-line" :style="{ background: gfc(card.family).border + '55' }" />
                    </template>
                  </div>

                </div>
              </div>
            </div>
          </div>
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue'
import { gfc } from '~/utils/architect/constants'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('architect')
const show = defineModel<boolean>({ default: false })

// ── Interactive Tree ──
const iAns = reactive<Record<string, 'yes'|'no'|null>>({
  q1: null, q2: null, q3a: null, q3: null, q4: null,
})

const iActive = computed(() => {
  if (!iAns.q1)                               return 'q1'
  if (iAns.q1 === 'yes' && !iAns.q2)         return 'q2'
  if (iAns.q1 === 'no'  && !iAns.q4)         return 'q4'
  if (iAns.q2 === 'yes' && !iAns.q3a)        return 'q3a'
  if (iAns.q2 === 'no'  && !iAns.q3)         return 'q3'
  return 'done'
})

const DOWNSTREAM: Record<string, string[]> = {
  q1: ['q2', 'q3a', 'q3', 'q4'],
  q2: ['q3a', 'q3'],
  q4: [], q3a: [], q3: [],
}

function iCheckIcon(q: string, v: 'yes'|'no') {
  return iAns[q] === v ? 'mdi-checkbox-marked' : 'mdi-checkbox-blank-outline'
}

// SVG line group stroke helpers
function gsRoot(): string {
  return Object.values(iAns).some(v => v !== null) ? '#4F46E5' : '#D1D5DB'
}
function gs(reqs: Record<string, string>): string {
  const anyAnswered = Object.values(iAns).some(v => v !== null)
  if (!anyAnswered) return '#D1D5DB'
  const eliminated = Object.entries(reqs).some(([q, v]) => iAns[q] !== null && iAns[q] !== v)
  if (eliminated) return '#EBEBEB'
  const chosen = Object.entries(reqs).every(([q, v]) => iAns[q] === v)
  if (chosen) return '#4F46E5'
  return '#D1D5DB'
}
function gsw(reqs: Record<string, string>): string {
  const chosen = Object.entries(reqs).every(([q, v]) => iAns[q] === v)
  return chosen && Object.values(iAns).some(v => v !== null) ? '2' : '1.5'
}

function ia(q: string, v: 'yes'|'no') {
  iAns[q] = iAns[q] === v ? null : v   // toggle off if same answer clicked again
  DOWNSTREAM[q]?.forEach(k => { iAns[k] = null })
}
function iReset() { Object.keys(iAns).forEach(k => { iAns[k] = null }) }

function handleKey(e: KeyboardEvent) {
  if (iActive.value === 'done') return
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
  if (e.key === 'y' || e.key === 'Y') ia(iActive.value, 'yes')
  if (e.key === 'n' || e.key === 'N') ia(iActive.value, 'no')
}

watch(show, (val) => {
  if (val) {
    window.addEventListener('keydown', handleKey)
  } else {
    iReset()
    window.removeEventListener('keydown', handleKey)
  }
})

const iWinnerName = computed(() => {
  if (iActive.value !== 'done') return null
  const winner = cards.value.find(c => iCard(c.key) === 'ic--win')
  return winner ? `→ ${winner.name}` : null
})

const CARD_PATHS: Record<string, Record<string, string>> = {
  ds:  { q1: 'yes', q2: 'yes', q3a: 'yes' },
  en:  { q1: 'yes', q2: 'yes', q3a: 'no'  },
  du:  { q1: 'yes', q2: 'no',  q3:  'yes' },
  jp:  { q1: 'yes', q2: 'no',  q3:  'no'  },
  sb:  { q1: 'no',  q4:  'yes'             },
  tr:  { q1: 'no',  q4:  'no'              },
}

function iCard(key: string) {
  const path = CARD_PATHS[key]
  if (!path) return 'ic--neutral'
  const anyAnswered = Object.values(iAns).some(v => v !== null)
  if (!anyAnswered) return 'ic--neutral'
  if (Object.entries(path).some(([q, v]) => iAns[q] !== null && iAns[q] !== v)) return 'ic--out'
  if (Object.entries(path).every(([q, v]) => iAns[q] === v)) return 'ic--win'
  return 'ic--maybe'
}

function iq(q: string) {
  if (iActive.value === q) return 'iq--on'
  if (iAns[q] !== null) return 'iq--done'
  const reach: Record<string, boolean> = {
    q1: true, q2: iAns.q1 === 'yes', q4: iAns.q1 === 'no',
    q3a: iAns.q2 === 'yes', q3: iAns.q2 === 'no',
  }
  return reach[q] ? 'iq--wait' : 'iq--off'
}

function ib(q: string, v: 'yes'|'no') {
  if (iActive.value === q) return 'ib--on'
  if (iAns[q] === v)       return 'ib--chosen'
  if (iAns[q] !== null)    return 'ib--fade'
  return 'ib--off'
}

const famFlowKeys: Record<string, { icon: string; labelKey: string }[]> = {
  ds: [
    { icon: 'mdi-clock-outline',           labelKey: 'hiw.flowDsPreBid'  },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowDsEnglish' },
    { icon: 'mdi-trending-up',             labelKey: 'hiw.flowDsDutch'   },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowDsAward'   },
  ],
  en: [
    { icon: 'mdi-currency-usd',            labelKey: 'hiw.flowEnCeiling' },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowEnBid1'    },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowEnBid2'    },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowEnBest'    },
  ],
  du: [
    { icon: 'mdi-currency-usd',            labelKey: 'hiw.flowDuHigh'    },
    { icon: 'mdi-trending-up',             labelKey: 'hiw.flowDuAuto'    },
    { icon: 'mdi-hand-back-right-outline', labelKey: 'hiw.flowDuAccept'  },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowDuWinner'  },
  ],
  jp: [
    { icon: 'mdi-currency-usd',            labelKey: 'hiw.flowJpLow'     },
    { icon: 'mdi-trending-down',           labelKey: 'hiw.flowJpRound'   },
    { icon: 'mdi-exit-to-app',             labelKey: 'hiw.flowJpExit'    },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowJpLast'    },
  ],
  sb: [
    { icon: 'mdi-email-outline',           labelKey: 'hiw.flowSbSubmit'  },
    { icon: 'mdi-lock-outline',            labelKey: 'hiw.flowSbSealed'  },
    { icon: 'mdi-chart-bar',               labelKey: 'hiw.flowSbCompare' },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowSbBest'    },
  ],
  tr: [
    { icon: 'mdi-handshake-outline',       labelKey: 'hiw.flowTrContact'   },
    { icon: 'mdi-chat-outline',            labelKey: 'hiw.flowTrNegotiate' },
    { icon: 'mdi-check-circle-outline',    labelKey: 'hiw.flowTrAgree'     },
  ],
}


const cards = computed(() => [
  { key: 'ds', family: 'Double Scenario', icon: 'mdi-layers-outline',   name: t('families.doubleScenario'), short: t('v5.dsShort'), savingsLabel: '12–18%', intensityLevel: 4 },
  { key: 'en', family: 'English',         icon: 'mdi-trending-down',     name: t('families.english'),        short: t('v5.enShort'), savingsLabel: '10–15%', intensityLevel: 3 },
  { key: 'du', family: 'Dutch',           icon: 'mdi-timer-sand',        name: t('families.dutch'),          short: t('v5.duShort'), savingsLabel: '8–12%',  intensityLevel: 2 },
  { key: 'jp', family: 'Japanese',        icon: 'mdi-trending-up',       name: t('families.japanese'),       short: t('v5.jpShort'), savingsLabel: '8–12%',  intensityLevel: 2 },
  { key: 'sb', family: 'Sealed Bid',      icon: 'mdi-lock-outline',      name: t('families.sealedBid'),      short: t('v5.sbShort'), savingsLabel: '5–8%',   intensityLevel: 1 },
  { key: 'tr', family: 'Traditional',     icon: 'mdi-handshake-outline', name: t('families.traditional'),    short: t('v5.trShort'), savingsLabel: '2–5%',   intensityLevel: 1 },
])

</script>

<style scoped>
/* ════ DIALOG ════ */
.v5-card { overflow: hidden; display: flex; flex-direction: column; max-height: 92vh; }

/* ════ HEADER ════ */
.v5-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #E9EAEC; flex-shrink: 0;
  gap: 16px;
  background: linear-gradient(to bottom, #F3F4F6, #FAFAFA);
}
.v5-icon {
  width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
  background: #1D1D1B;
  box-shadow: 0 1px 4px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06) inset;
  display: flex; align-items: center; justify-content: center;
}
.v5-title { font-size: 15px; font-weight: 700; color: #1D1D1B; }
.v5-sub   { font-size: 11px; color: #9CA3AF; margin-top: 1px; }

/* ════ WINDOW ════ */
.v5-window { flex: 1; overflow-y: auto; display: flex; flex-direction: column; }

/* ════ COMMON TAB BODY ════ */
.tab-body { padding: 24px 28px 32px; }

/* ════════════════════════════════════
   TAB 1 — TREE
   ════════════════════════════════════ */
.tree-section { position: relative; height: 400px; margin-bottom: 0; }
.tree-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: visible; }
.tree-svg line { vector-effect: non-scaling-stroke; }
.tree-content { position: relative; width: 100%; height: 100%; }
.tree-el { position: absolute; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 2px; white-space: nowrap; }

.q-bubble { display: inline-flex; align-items: center; gap: 10px; padding: 10px 20px; border-radius: 12px; background: #F9FAFB; border: 1.5px solid #E5E7EB; white-space: nowrap; }
.q-bubble--root { background: #F5F3FF; border-color: #C7D2FE; border-width: 2px; padding: 12px 24px; }
.q-bubble--root .q-icon { color: #4F46E5; opacity: 1; }
.q-bubble--small { padding: 8px 14px; }
.q-icon { flex-shrink: 0; opacity: 0.6; }
.q-text { font-size: 13px; font-weight: 600; color: #374151; line-height: 1.4; }
.q-hint { font-size: 10px; font-weight: 500; color: #9CA3AF; margin-top: 2px; }

.badge { font-size: 10px; font-weight: 700; padding: 3px 12px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.06em; display: inline-flex; align-items: center; gap: 4px; }
.badge--yes { background: #D1FAE5; color: #065F46; }
.badge--no  { background: #FEE2E2; color: #991B1B; }
.badge--sm  { padding: 2px 10px; font-size: 9px; }
.hint-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; }
.badge-best { font-size: 9px; font-weight: 700; padding: 2px 8px; border-radius: 6px; background: #ECFDF5; color: #059669; border: 1px solid #6EE7B7; text-transform: uppercase; letter-spacing: 0.06em; }

/* Family cards grid: 6 cols (matches tree x-positions) */
.fam-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; }
.fam-card { background: #fff; border-radius: 10px; border: 1px solid #E9EAEC; overflow: hidden; display: flex; flex-direction: column; }

/* Top band */
.fam-top { display: flex; align-items: flex-start; justify-content: space-between; padding: 8px 10px 6px; }
.fam-top-left { display: flex; align-items: center; gap: 5px; }
.fam-icon-wrap { width: 22px; height: 22px; border-radius: 6px; border: 1px solid; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.fam-name { font-size: 11px; font-weight: 700; line-height: 1.3; }
.fam-top-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; flex-shrink: 0; margin-left: 4px; }
.fam-savings { font-size: 10px; font-weight: 700; white-space: nowrap; }
.fam-pips { display: flex; gap: 2px; }
.fam-pip { width: 9px; height: 3px; border-radius: 2px; }

/* Chart */
.fam-chart { padding: 6px 10px 4px; }
.fam-chart :deep(.chart-container) { height: 72px; border: none; background: transparent; padding: 0; }

/* Body */
.fam-body { padding: 6px 10px 10px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
.fam-recommended {
  display: flex; align-items: center; gap: 4px;
  padding: 3px 8px; font-size: 9px; font-weight: 700;
  color: white; text-transform: uppercase; letter-spacing: 0.06em;
}
.fam-desc { font-size: 11px; color: #374151; line-height: 1.45; margin: 0; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; height: calc(11px * 1.45 * 2); }

/* Flow — icon-only mini timeline */
.fam-flow { display: flex; align-items: center; flex-wrap: nowrap; gap: 0; }
.fam-step { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; border: 1px solid; flex-shrink: 0; }
.fam-line { flex: 1; height: 1.5px; min-width: 4px; }

/* ════ INTERACTIVE TREE — STATUS BAR ════ */
.itree-bar { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; padding: 6px 12px; border-radius: 8px; background: #F9FAFB; border: 1px solid #E9EAEC; }
.itree-status { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 500; color: #374151; }
.itree-reset { display: flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 500; color: #6B7280; background: none; border: none; cursor: pointer; padding: 2px 6px; border-radius: 4px; transition: background 0.15s; }
.itree-reset:hover { background: #F3F4F6; color: #374151; }

/* ════ INTERACTIVE TREE — QUESTION BUBBLES ════ */
.iq--on  { background: #EEF2FF !important; border-color: #6366F1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
.iq--done { background: #F0FDF4 !important; border-color: #86EFAC !important; }
.iq--wait { opacity: 0.7; }
.iq--off  { opacity: 0.3; pointer-events: none; }

/* ════ INTERACTIVE TREE — YES/NO BADGES ════ */
.ibadge { background: transparent; border: none; padding: 0; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 2px; transition: transform 0.15s; }
.ibadge:hover { transform: scale(1.08); }
.ib--chosen .badge--yes { background: #059669; color: #FFF; }
.ib--chosen .badge--no  { background: #DC2626; color: #FFF; }
.ib--fade .badge { opacity: 0.25; }
.ib--off  { pointer-events: none; opacity: 0.4; }

/* ════ INTERACTIVE TREE — CARD STATES ════ */
.fam-card { transition: filter 0.25s ease, opacity 0.25s ease, transform 0.25s ease, box-shadow 0.25s ease; }
.ic--neutral { filter: grayscale(85%); opacity: 0.55; }
.ic--out     { filter: grayscale(100%); opacity: 0.3; transform: scale(0.97); }
.ic--maybe   { filter: grayscale(40%); opacity: 0.75; }
.ic--win     { filter: none; opacity: 1; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); animation: win-pulse 2.4s ease-in-out infinite; }

@keyframes win-pulse {
  0%, 100% { box-shadow: 0 8px 24px rgba(0,0,0,0.10); }
  50%       { box-shadow: 0 10px 32px rgba(0,0,0,0.18), 0 0 0 4px rgba(99,102,241,0.12); }
}

/* ════ RESPONSIVE ════ */
@media (max-width: 1000px) {
  .fam-grid, .ov-cards { grid-template-columns: repeat(3, 1fr); }
  .tree-section { display: none; }
  .tab-body { padding: 16px 14px 24px; }
}
@media (max-width: 640px) {
  .fam-grid, .ov-cards { grid-template-columns: repeat(2, 1fr); gap: 6px; }
  .cascade-pair { grid-template-columns: 1fr; }
}
</style>
