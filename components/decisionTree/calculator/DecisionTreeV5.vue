<template>
  <v-dialog v-model="show" max-width="1200" scrollable>
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
        <!-- ═══════════ DECISION TREE (SVG lines + positioned HTML) ═══════════ -->
        <div class="tree-section">
          <!-- SVG layer: ALL connecting lines -->
          <svg class="tree-svg" viewBox="0 0 100 380" preserveAspectRatio="none">
            <g fill="none" stroke="#D1D5DB" stroke-width="1.5">
              <!-- Root stem (center → fork) -->
              <line x1="50" y1="48" x2="50" y2="62" />
              <!-- Root fork bar (left-center ↔ right-center) -->
              <line x1="25" y1="62" x2="75" y2="62" />
              <!-- Root drops -->
              <line x1="25" y1="62" x2="25" y2="78" />
              <line x1="75" y1="62" x2="75" y2="78" />

              <!-- YES badge → Q2 bubble -->
              <line x1="25" y1="98" x2="25" y2="114" />
              <!-- NO badge → Simple label -->
              <line x1="75" y1="98" x2="75" y2="128" />

              <!-- Q2 bubble → Q2 fork -->
              <line x1="25" y1="162" x2="25" y2="178" />
              <!-- Simple label → triple fork -->
              <line x1="75" y1="144" x2="75" y2="178" />

              <!-- Q2 fork bar (col1 ↔ c23) -->
              <line x1="8.33" y1="178" x2="33.33" y2="178" />
              <!-- Q2 fork drops -->
              <line x1="8.33" y1="178" x2="8.33" y2="194" />
              <line x1="33.33" y1="178" x2="33.33" y2="194" />

              <!-- Triple fork bar (col4 ↔ col6) -->
              <line x1="58.33" y1="178" x2="91.67" y2="178" />
              <!-- Triple fork drops -->
              <line x1="58.33" y1="178" x2="58.33" y2="194" />
              <line x1="75" y1="178" x2="75" y2="194" />
              <line x1="91.67" y1="178" x2="91.67" y2="194" />

              <!-- Col 1: badge → BEST POTENTIAL → bottom -->
              <line x1="8.33" y1="194" x2="8.33" y2="198" />
              <line x1="8.33" y1="216" x2="8.33" y2="234" />
              <line x1="8.33" y1="234" x2="8.33" y2="380" />

              <!-- c23: badge → Q3 bubble -->
              <line x1="33.33" y1="194" x2="33.33" y2="198" />
              <line x1="33.33" y1="216" x2="33.33" y2="222" />

              <!-- Q3 bubble → Q3 fork -->
              <line x1="33.33" y1="256" x2="33.33" y2="270" />
              <!-- Q3 fork bar (col2 ↔ col3) -->
              <line x1="25" y1="270" x2="41.67" y2="270" />
              <!-- Q3 fork drops -->
              <line x1="25" y1="270" x2="25" y2="286" />
              <line x1="41.67" y1="270" x2="41.67" y2="286" />

              <!-- Col 2: badge → bottom -->
              <line x1="25" y1="286" x2="25" y2="290" />
              <line x1="25" y1="308" x2="25" y2="380" />
              <!-- Col 3: badge → bottom -->
              <line x1="41.67" y1="286" x2="41.67" y2="290" />
              <line x1="41.67" y1="308" x2="41.67" y2="380" />

              <!-- Cols 4-6: continuous from fork to bottom -->
              <line x1="58.33" y1="194" x2="58.33" y2="380" />
              <line x1="75" y1="194" x2="75" y2="380" />
              <line x1="91.67" y1="194" x2="91.67" y2="380" />
            </g>
          </svg>

          <!-- HTML content layer (positioned on top of SVG lines) -->
          <div class="tree-content">
            <!-- Root question -->
            <div class="tree-el" style="left: 50%; top: 4px">
              <div class="q-bubble q-bubble--root">
                <span class="q-icon">💰</span>
                <span class="q-text">{{ t('v5.q1') }}</span>
              </div>
            </div>

            <!-- YES badge (root left) -->
            <div class="tree-el" style="left: 25%; top: 80px">
              <div class="badge badge--yes">{{ t('v5.yes') }}</div>
            </div>

            <!-- NO badge (root right) -->
            <div class="tree-el" style="left: 75%; top: 80px">
              <div class="badge badge--no">{{ t('v5.no') }}</div>
            </div>

            <!-- Q2 bubble -->
            <div class="tree-el" style="left: 25%; top: 114px">
              <div class="q-bubble">
                <span class="q-icon">👥</span>
                <span class="q-text">{{ t('v5.q2') }}</span>
              </div>
            </div>

            <!-- Simple Approach label -->
            <div class="tree-el" style="left: 75%; top: 130px">
              <div class="hint-label">{{ t('v5.simpleApproach') }}</div>
            </div>

            <!-- Q2 → YES badge (col 1) -->
            <div class="tree-el" style="left: 8.33%; top: 198px">
              <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
            </div>

            <!-- BEST POTENTIAL label (col 1) -->
            <div class="tree-el" style="left: 8.33%; top: 218px">
              <div class="hint-label">{{ t('v5.bestPotential') }}</div>
            </div>

            <!-- Q2 → NO badge (cols 2-3 center) -->
            <div class="tree-el" style="left: 33.33%; top: 198px">
              <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
            </div>

            <!-- Q3 bubble (cols 2-3 center) -->
            <div class="tree-el" style="left: 33.33%; top: 222px">
              <div class="q-bubble q-bubble--small">
                <span class="q-icon">🏅</span>
                <span class="q-text">{{ t('v5.q3') }}</span>
              </div>
            </div>

            <!-- Q3 → YES badge (col 2) -->
            <div class="tree-el" style="left: 25%; top: 290px">
              <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
            </div>

            <!-- Q3 → NO badge (col 3) -->
            <div class="tree-el" style="left: 41.67%; top: 290px">
              <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
            </div>
          </div>
        </div>

        <!-- ═══════════ CARDS ROW (all same size, aligned) ═══════════ -->
        <div class="cards-grid">
          <div
            v-for="card in cards"
            :key="card.key"
            class="type-card"
            :style="cardBorder(card.family)"
            @click="toggle(card.key)"
          >
            <div class="card-bar" :style="barBg(card.family)" />
            <div class="card-head">
              <span class="card-emoji">{{ card.emoji }}</span>
              <span class="card-title" :style="cardColor(card.family)">{{ card.name }}</span>
              <span class="card-chevron" :class="{ open: expanded === card.key }">▾</span>
            </div>
            <div class="card-sub">{{ card.short }}</div>
            <div v-if="card.options.length" class="pills pills--always">
              <span v-for="o in card.options" :key="o" class="pill" :style="pillBg(card.family)">{{ o }}</span>
            </div>
            <div class="card-detail" :class="{ open: expanded === card.key }">
              <div class="card-detail-inner">
                <p class="card-desc">{{ card.desc }}</p>
                <p class="card-use">{{ card.use }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
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

const cards = computed(() => [
  {
    key: 'ds', family: 'Double Scenario', emoji: '🏆',
    name: t('families.doubleScenario'), short: t('v5.dsShort'),
    desc: t('v5.dsDesc'), use: t('v5.dsUse'),
    options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award'],
  },
  {
    key: 'en', family: 'English', emoji: '🥈',
    name: t('families.english'), short: t('v5.enShort'),
    desc: t('v5.enDesc'), use: t('v5.enUse'),
    options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award', 'Rank'],
  },
  {
    key: 'du', family: 'Dutch', emoji: '⏳',
    name: t('families.dutch'), short: t('v5.duShort'),
    desc: t('v5.duDesc'), use: t('v5.duUse'),
    options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award'],
  },
  {
    key: 'jp', family: 'Japanese', emoji: '🔺',
    name: t('families.japanese'), short: t('v5.jpShort'),
    desc: t('v5.jpDesc'), use: t('v5.jpUse'),
    options: ['Pre-bid', 'No Pre-bid', 'Award', 'Rank', 'No Rank'],
  },
  {
    key: 'sb', family: 'Sealed Bid', emoji: '📩',
    name: t('families.sealedBid'), short: t('v5.sbShort'),
    desc: t('v5.sbDesc'), use: t('v5.sbUse'),
    options: ['Preference', 'Award', 'Rank', 'No Rank'],
  },
  {
    key: 'tr', family: 'Traditional', emoji: '🤝',
    name: t('families.traditional'), short: t('v5.trShort'),
    desc: t('v5.trDesc'), use: t('v5.trUse'),
    options: [],
  },
])
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
  padding: 32px 24px 36px;
  overflow-y: auto; max-height: 78vh;
}

/* ════════════════════════════════════════════════
   TREE SECTION (SVG lines + absolutely positioned HTML)
   ════════════════════════════════════════════════ */
.tree-section {
  position: relative;
  height: 380px;
  margin-bottom: 0;
}

/* SVG line layer — fills the entire tree section */
.tree-svg {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  overflow: visible;
}

.tree-svg line {
  vector-effect: non-scaling-stroke;
}

/* HTML content layer */
.tree-content {
  position: relative;
  width: 100%; height: 100%;
}

/* Each positioned element */
.tree-el {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
}

/* ── Bubbles ── */
.q-bubble {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 10px 20px; border-radius: 12px;
  background: #F9FAFB; border: 1.5px solid #E5E7EB;
  white-space: nowrap;
}
.q-bubble--root {
  background: #F3F4F6; border-color: #D1D5DB;
  padding: 12px 24px;
}
.q-bubble--small {
  padding: 8px 14px;
}
.q-icon { font-size: 18px; flex-shrink: 0; }
.q-text { font-size: 13px; font-weight: 600; color: #374151; line-height: 1.4; }

/* ── Badges ── */
.badge {
  font-size: 10px; font-weight: 700;
  padding: 3px 14px; border-radius: 10px;
  text-transform: uppercase; letter-spacing: 0.06em;
  display: inline-block;
}
.badge--yes { background: #D1FAE5; color: #065F46; }
.badge--no  { background: #FEE2E2; color: #991B1B; }
.badge--sm  { padding: 2px 10px; font-size: 9px; }

.hint-label {
  font-size: 10px; font-weight: 700; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.07em;
}

/* ════════════════════════════════════════════════
   CARDS GRID — 6 equal columns, all same height
   ════════════════════════════════════════════════ */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 10px;
  align-items: stretch;
}

.type-card {
  border-radius: 10px; border: 1.5px solid;
  padding: 12px 12px 12px 16px;
  position: relative; overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.2s, transform 0.15s;
  display: flex;
  flex-direction: column;
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
  margin-bottom: 4px;
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
  margin-bottom: 8px; flex: 1;
}

/* Pills always visible */
.pills--always {
  display: flex; flex-wrap: wrap; gap: 4px;
}

.pill {
  font-size: 9px; font-weight: 600;
  padding: 2px 7px; border-radius: 5px;
  white-space: nowrap;
}

/* Expandable detail */
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
@media (max-width: 900px) {
  .cards-grid {
    grid-template-columns: repeat(3, 1fr);
  }

  .tree-section { display: none; }

  .dt5-body { padding: 20px 14px 24px; }
}

@media (max-width: 600px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .dt5-body { padding: 14px 10px 20px; }

  .card-sub { font-size: 9px; }
  .pill { font-size: 8px; padding: 2px 5px; }
}
</style>
