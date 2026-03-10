<template>
  <v-dialog v-model="show" max-width="960" scrollable>
    <v-card class="dt5-card" rounded="lg">
      <!-- Header -->
      <div class="dt5-header">
        <div class="d-flex align-center ga-3">
          <div class="dt5-icon">
            <v-icon size="20" color="white">mdi-sitemap-outline</v-icon>
          </div>
          <div>
            <div class="dt5-title">{{ t('v5.title') }}</div>
            <div class="dt5-sub">{{ t('v5.subtitle') }}</div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <div class="dt5-body">
        <!-- ═══════════ LEVEL 1: Root question ═══════════ -->
        <div class="level">
          <div class="q-bubble q-bubble--root">
            <span class="q-icon">💰</span>
            <span class="q-text">{{ t('v5.q1') }}</span>
          </div>
          <div class="vline vline--short" />

          <div class="hsplit">
            <div class="hsplit-line" />

            <!-- ═══════════ LEFT: YES ═══════════ -->
            <div class="col">
              <div class="badge badge--yes">{{ t('v5.yes') }}</div>
              <div class="vline" />

              <div class="q-bubble">
                <span class="q-icon">👥</span>
                <span class="q-text">{{ t('v5.q2') }}</span>
              </div>
              <div class="vline vline--short" />

              <div class="hsplit">
                <div class="hsplit-line" />

                <!-- YES → DS + English -->
                <div class="col">
                  <div class="badge badge--yes">{{ t('v5.yes') }}</div>
                  <div class="vline" />
                  <div class="hint-label">{{ t('v5.bestPotential') }}</div>

                  <div
                    class="type-card"
                    :style="cardBorder('Double Scenario')"
                    @click="toggle('ds')"
                  >
                    <div class="card-bar" :style="barBg('Double Scenario')" />
                    <div class="card-head">
                      <span class="card-emoji">🏆</span>
                      <span class="card-title" :style="cardColor('Double Scenario')">{{ t('families.doubleScenario') }}</span>
                      <span class="card-chevron" :class="{ open: expanded === 'ds' }">▾</span>
                    </div>
                    <div class="card-sub">{{ t('v5.dsShort') }}</div>
                    <div class="pills pills--always">
                      <span v-for="o in dsOptions" :key="o" class="pill" :style="pillBg('Double Scenario')">{{ o }}</span>
                    </div>
                    <div class="card-detail" :class="{ open: expanded === 'ds' }">
                      <div class="card-detail-inner">
                        <p class="card-desc">{{ t('v5.dsDesc') }}</p>
                        <p class="card-use">{{ t('v5.dsUse') }}</p>
                      </div>
                    </div>
                  </div>

                  <div class="vline vline--tiny" />

                  <div
                    class="type-card"
                    :style="cardBorder('English')"
                    @click="toggle('en')"
                  >
                    <div class="card-bar" :style="barBg('English')" />
                    <div class="card-head">
                      <span class="card-emoji">🥈</span>
                      <span class="card-title" :style="cardColor('English')">{{ t('families.english') }}</span>
                      <span class="card-chevron" :class="{ open: expanded === 'en' }">▾</span>
                    </div>
                    <div class="card-sub">{{ t('v5.enShort') }}</div>
                    <div class="pills pills--always">
                      <span v-for="o in enOptions" :key="o" class="pill" :style="pillBg('English')">{{ o }}</span>
                    </div>
                    <div class="card-detail" :class="{ open: expanded === 'en' }">
                      <div class="card-detail-inner">
                        <p class="card-desc">{{ t('v5.enDesc') }}</p>
                        <p class="card-use">{{ t('v5.enUse') }}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- NO → Award question -->
                <div class="col">
                  <div class="badge badge--no">{{ t('v5.no') }}</div>
                  <div class="vline" />

                  <div class="q-bubble">
                    <span class="q-icon">🏅</span>
                    <span class="q-text">{{ t('v5.q3') }}</span>
                  </div>
                  <div class="vline vline--short" />

                  <div class="hsplit">
                    <div class="hsplit-line" />

                    <!-- Award YES → Dutch -->
                    <div class="col">
                      <div class="badge badge--yes">{{ t('v5.yes') }}</div>
                      <div class="vline" />

                      <div
                        class="type-card"
                        :style="cardBorder('Dutch')"
                        @click="toggle('du')"
                      >
                        <div class="card-bar" :style="barBg('Dutch')" />
                        <div class="card-head">
                          <span class="card-emoji">⏳</span>
                          <span class="card-title" :style="cardColor('Dutch')">{{ t('families.dutch') }}</span>
                          <span class="card-chevron" :class="{ open: expanded === 'du' }">▾</span>
                        </div>
                        <div class="card-sub">{{ t('v5.duShort') }}</div>
                        <div class="pills pills--always">
                          <span v-for="o in duOptions" :key="o" class="pill" :style="pillBg('Dutch')">{{ o }}</span>
                        </div>
                        <div class="card-detail" :class="{ open: expanded === 'du' }">
                          <div class="card-detail-inner">
                            <p class="card-desc">{{ t('v5.duDesc') }}</p>
                            <p class="card-use">{{ t('v5.duUse') }}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Award NO → Japanese -->
                    <div class="col">
                      <div class="badge badge--no">{{ t('v5.no') }}</div>
                      <div class="vline" />

                      <div
                        class="type-card"
                        :style="cardBorder('Japanese')"
                        @click="toggle('jp')"
                      >
                        <div class="card-bar" :style="barBg('Japanese')" />
                        <div class="card-head">
                          <span class="card-emoji">🔺</span>
                          <span class="card-title" :style="cardColor('Japanese')">{{ t('families.japanese') }}</span>
                          <span class="card-chevron" :class="{ open: expanded === 'jp' }">▾</span>
                        </div>
                        <div class="card-sub">{{ t('v5.jpShort') }}</div>
                        <div class="pills pills--always">
                          <span v-for="o in jpOptions" :key="o" class="pill" :style="pillBg('Japanese')">{{ o }}</span>
                        </div>
                        <div class="card-detail" :class="{ open: expanded === 'jp' }">
                          <div class="card-detail-inner">
                            <p class="card-desc">{{ t('v5.jpDesc') }}</p>
                            <p class="card-use">{{ t('v5.jpUse') }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- ═══════════ RIGHT: NO ═══════════ -->
            <div class="col col--narrow">
              <div class="badge badge--no">{{ t('v5.no') }}</div>
              <div class="vline" />
              <div class="hint-label">{{ t('v5.simpleApproach') }}</div>

              <div
                class="type-card"
                :style="cardBorder('Sealed Bid')"
                @click="toggle('sb')"
              >
                <div class="card-bar" :style="barBg('Sealed Bid')" />
                <div class="card-head">
                  <span class="card-emoji">📩</span>
                  <span class="card-title" :style="cardColor('Sealed Bid')">{{ t('families.sealedBid') }}</span>
                  <span class="card-chevron" :class="{ open: expanded === 'sb' }">▾</span>
                </div>
                <div class="card-sub">{{ t('v5.sbShort') }}</div>
                <div class="pills pills--always">
                  <span v-for="o in sbOptions" :key="o" class="pill" :style="pillBg('Sealed Bid')">{{ o }}</span>
                </div>
                <div class="card-detail" :class="{ open: expanded === 'sb' }">
                  <div class="card-detail-inner">
                    <p class="card-desc">{{ t('v5.sbDesc') }}</p>
                    <p class="card-use">{{ t('v5.sbUse') }}</p>
                  </div>
                </div>
              </div>

              <div class="vline vline--tiny" />

              <div
                class="type-card"
                :style="cardBorder('Traditional')"
                @click="toggle('tr')"
              >
                <div class="card-bar" :style="barBg('Traditional')" />
                <div class="card-head">
                  <span class="card-emoji">🤝</span>
                  <span class="card-title" :style="cardColor('Traditional')">{{ t('families.traditional') }}</span>
                  <span class="card-chevron" :class="{ open: expanded === 'tr' }">▾</span>
                </div>
                <div class="card-sub">{{ t('v5.trShort') }}</div>
                <div class="card-detail" :class="{ open: expanded === 'tr' }">
                  <div class="card-detail-inner">
                    <p class="card-desc">{{ t('v5.trDesc') }}</p>
                    <p class="card-use">{{ t('v5.trUse') }}</p>
                  </div>
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
import { ref } from 'vue'
import { gfc } from '~/utils/decisionTree/constants'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('decisiontree')
const show = defineModel<boolean>({ default: false })

const expanded = ref<string | null>(null)

function toggle(key: string) {
  expanded.value = expanded.value === key ? null : key
}

function cardBorder(f: string) {
  const c = gfc(f)
  return { borderColor: c.border, background: c.bg }
}
function barBg(f: string) { return { background: gfc(f).border } }
function cardColor(f: string) { return { color: gfc(f).text } }
function pillBg(f: string) {
  const c = gfc(f)
  return { background: c.border + '20', color: c.text }
}

const dsOptions = ['Pre-bid', 'No Pre-bid', 'Preference', 'Award']
const enOptions = ['Pre-bid', 'No Pre-bid', 'Preference', 'Award', 'Rank']
const duOptions = ['Pre-bid', 'No Pre-bid', 'Preference', 'Award']
const jpOptions = ['Pre-bid', 'No Pre-bid', 'Award', 'Rank', 'No Rank']
const sbOptions = ['Preference', 'Award', 'Rank', 'No Rank']
</script>

<style scoped>
/* ════════════════════════════════════════════════
   HEADER
   ════════════════════════════════════════════════ */
.dt5-card { overflow: hidden; }

.dt5-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid #E9EAEC;
}

.dt5-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  display: flex; align-items: center; justify-content: center;
}

.dt5-title { font-size: 16px; font-weight: 700; color: #1D1D1B; }
.dt5-sub   { font-size: 12px; color: #9CA3AF; margin-top: 1px; }

.dt5-body {
  padding: 32px 28px 36px;
  overflow-y: auto; max-height: 78vh;
}

/* ════════════════════════════════════════════════
   TREE STRUCTURE
   ════════════════════════════════════════════════ */
.level { display: flex; flex-direction: column; align-items: center; }

.q-bubble {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 20px; border-radius: 12px;
  background: #F9FAFB; border: 1.5px solid #E5E7EB;
}

.q-bubble--root {
  background: #F3F4F6; border-color: #D1D5DB;
  padding: 12px 24px;
}

.q-icon { font-size: 18px; flex-shrink: 0; }
.q-text { font-size: 13px; font-weight: 600; color: #374151; line-height: 1.4; }

.vline { width: 1.5px; height: 20px; background: #D1D5DB; }
.vline--short { height: 14px; }
.vline--tiny  { height: 8px; }

.hsplit {
  display: flex; gap: 0; width: 100%; position: relative;
}

.hsplit-line {
  position: absolute; top: 0; left: 0; right: 0;
  height: 1.5px; background: #D1D5DB;
}

.col {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; padding: 0 6px; min-width: 0;
}

.col--narrow { flex: 0.55; }

.badge {
  font-size: 10px; font-weight: 700;
  padding: 3px 14px; border-radius: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-top: -8px; position: relative; z-index: 2;
}

.badge--yes { background: #D1FAE5; color: #065F46; }
.badge--no  { background: #FEE2E2; color: #991B1B; }

.hint-label {
  font-size: 10px; font-weight: 700; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin-bottom: 6px;
}

/* ════════════════════════════════════════════════
   TYPE CARDS — fixed size, click to expand
   ════════════════════════════════════════════════ */
.type-card {
  width: 100%; max-width: 220px;
  min-height: 100px;
  border-radius: 10px; border: 1.5px solid;
  padding: 10px 12px 10px 16px;
  position: relative; overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
}

.type-card:hover {
  box-shadow: 0 3px 14px rgba(0,0,0,0.07);
  transform: translateY(-1px);
}

.card-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
}

.card-head {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 3px;
}

.card-emoji { font-size: 14px; }

.card-title { font-size: 12px; font-weight: 700; flex: 1; }

.card-chevron {
  font-size: 12px; color: #9CA3AF;
  transition: transform 0.25s ease;
  flex-shrink: 0;
}

.card-chevron.open { transform: rotate(180deg); }

.card-sub {
  font-size: 10px; color: #6B7280; line-height: 1.4;
  margin-bottom: 6px;
}

/* Pills always visible */
.pills--always {
  display: flex; flex-wrap: wrap; gap: 3px;
}

.pill {
  font-size: 9px; font-weight: 600;
  padding: 2px 7px; border-radius: 5px;
  white-space: nowrap;
}

/* Expandable detail — click to open */
.card-detail {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1);
}

.card-detail.open { grid-template-rows: 1fr; }

.card-detail-inner { overflow: hidden; min-height: 0; }

.card-desc {
  font-size: 10px; color: #374151; line-height: 1.5;
  margin-top: 8px; padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.06);
}

.card-use {
  font-size: 10px; color: #6B7280; font-style: italic;
  margin-top: 6px; line-height: 1.4;
}

/* ════════════════════════════════════════════════
   RESPONSIVE
   ════════════════════════════════════════════════ */
@media (max-width: 700px) {
  .dt5-body {
    padding: 20px 14px 24px;
  }

  .hsplit { flex-direction: column; align-items: center; }
  .hsplit-line { display: none; }
  .col, .col--narrow { flex: none; width: 100%; padding: 0; }
  .badge { margin-top: 4px; }
  .type-card { max-width: 100%; }

  .q-bubble {
    padding: 8px 14px;
    gap: 8px;
  }

  .q-bubble--root {
    padding: 10px 18px;
  }

  .q-text {
    font-size: 12px;
  }
}

@media (max-width: 400px) {
  .dt5-body {
    padding: 14px 10px 20px;
  }

  .card-sub {
    font-size: 9px;
  }

  .pill {
    font-size: 8px;
    padding: 2px 5px;
  }
}
</style>
