<template>
  <v-dialog v-model="show" max-width="820" scrollable @keydown="onKeydown">
    <v-card class="hiw-card" rounded="lg">
      <!-- Header -->
      <div class="hiw-header">
        <div class="d-flex align-center ga-3">
          <div class="hiw-icon">
            <v-icon size="20" color="white">mdi-lightbulb-outline</v-icon>
          </div>
          <div>
            <div class="hiw-title">{{ t('page.howItWorks') }}</div>
            <div class="hiw-sub">{{ t('page.howIntro') }}</div>
          </div>
        </div>
        <v-btn icon variant="text" size="small" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Progress bar -->
      <div class="hiw-progress-track">
        <div class="hiw-progress-fill" :style="{ width: scrollProgress + '%' }" />
      </div>

      <div class="hiw-layout">
        <!-- Left sidebar nav -->
        <nav class="hiw-sidebar" role="navigation" aria-label="Sections">
          <button
            v-for="s in sections"
            :key="s.id"
            class="sidebar-btn"
            :class="{ active: activeSection === s.id }"
            :aria-current="activeSection === s.id ? 'true' : undefined"
            @click="scrollTo(s.id)"
          >
            <span class="sidebar-icon">{{ s.icon }}</span>
            <span class="sidebar-label">{{ s.label }}</span>
          </button>
        </nav>

        <!-- Right content -->
        <div ref="scrollContainer" class="hiw-body" @scroll="onScroll">
          <!-- ═══════════ 1. OVERVIEW ═══════════ -->
          <div id="section-overview" class="hiw-section" data-section="overview">
            <h3 class="section-title">{{ t('hiw.overviewTitle') }}</h3>
            <p class="section-desc">{{ t('hiw.overviewDesc') }}</p>
          </div>

          <div class="section-divider" />

          <!-- ═══════════ 2. PHASES ═══════════ -->
          <div id="section-phases" class="hiw-section" data-section="phases">
            <h3 class="section-title">{{ t('hiw.phasesTitle') }}</h3>

            <!-- Visual flow diagram -->
            <div class="phase-flow">
              <!-- Step 1: Check -->
              <div class="phase-flow-step">
                <div class="phase-flow-circle">
                  <span class="phase-flow-icon">🔍</span>
                </div>
                <span class="phase-flow-label">{{ t('hiw.phaseFlowCheck') }}</span>
              </div>

              <!-- Arrow 1: Check → Yes/No -->
              <div class="phase-flow-connector">
                <div class="connector-line" />
              </div>

              <!-- Step 2: Yes / No decision -->
              <div class="phase-flow-step">
                <div class="phase-flow-decision">
                  <span class="decision-yes">✓ Yes</span>
                  <span class="decision-divider">/</span>
                  <span class="decision-no">✗ No</span>
                </div>
                <span class="phase-flow-label phase-flow-label--decision">{{ t('hiw.phaseFlowDecision') }}</span>
              </div>

              <!-- Arrow 2: Yes/No → Configure -->
              <div class="phase-flow-connector">
                <div class="connector-line" />
                <div class="connector-arrow" />
              </div>

              <!-- Step 3: Configure -->
              <div class="phase-flow-step">
                <div class="phase-flow-circle">
                  <span class="phase-flow-icon">⚙️</span>
                </div>
                <span class="phase-flow-label">{{ t('hiw.phaseFlowConfigure') }}</span>
              </div>

              <!-- Arrow 3: Configure → Results -->
              <div class="phase-flow-connector">
                <div class="connector-line" />
                <div class="connector-arrow" />
              </div>

              <!-- Step 4: Results -->
              <div class="phase-flow-step">
                <div class="phase-flow-circle">
                  <span class="phase-flow-icon">🏆</span>
                </div>
                <span class="phase-flow-label">{{ t('hiw.phaseFlowResults') }}</span>
              </div>
            </div>

            <div class="phases-list">
              <div v-for="n in 3" :key="n" class="phase-item">
                <div class="phase-num">{{ n }}</div>
                <div class="phase-body">
                  <div class="phase-title">{{ t(`page.step${n}Title`) }}</div>
                  <div class="phase-desc">{{ t(`page.step${n}Desc`) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-divider" />

          <!-- ═══════════ 3. FAMILIES ═══════════ -->
          <div id="section-families" class="hiw-section" data-section="families">
            <h3 class="section-title">{{ t('hiw.familiesTitle') }}</h3>
            <p class="section-desc">{{ t('hiw.familiesIntro') }}</p>

            <!-- Savings comparison chart -->
            <div class="savings-compare">
              <div class="savings-compare-title">{{ t('hiw.savingsCompareTitle') }}</div>
              <div class="savings-bars">
                <div v-for="fam in families" :key="fam.key" class="savings-bar-row">
                  <span class="savings-bar-label">{{ fam.emoji }} {{ fam.shortName }}</span>
                  <div class="savings-bar-track">
                    <div
                      class="savings-bar-fill"
                      :style="{ width: (fam.savings / 15 * 100) + '%', background: gfc(fam.family).border }"
                    />
                  </div>
                  <span class="savings-bar-value" :style="{ color: gfc(fam.family).text }">~{{ fam.savings }}%</span>
                </div>
              </div>
            </div>

            <!-- Legend card -->
            <div class="legend-card">
              <div class="legend-header">
                <v-icon size="14" color="#9CA3AF">mdi-information-outline</v-icon>
                <span class="legend-title">{{ t('hiw.legendTitle') }}</span>
              </div>
              <div class="legend-body">
                <div class="legend-example">
                  <div class="legend-bar" />
                  <div class="legend-content">
                    <div class="legend-row">
                      <span class="legend-emoji">🏷️</span>
                      <span class="legend-name">{{ t('hiw.legendFamily') }}</span>
                      <span class="legend-savings-badge">~X% {{ t('hiw.savings') }}</span>
                      <span class="legend-chevron-demo">▾</span>
                    </div>
                    <div class="legend-desc-line">{{ t('hiw.legendDesc') }}</div>
                    <div class="legend-pills-row">
                      <span class="legend-pill">Option A</span>
                      <span class="legend-pill">Option B</span>
                      <span class="legend-pill">Option C</span>
                    </div>
                  </div>
                </div>
                <div class="legend-annotations">
                  <div class="legend-anno"><span class="anno-dot anno-dot--1" />{{ t('hiw.legendFamily') }}</div>
                  <div class="legend-anno"><span class="anno-dot anno-dot--2" />{{ t('hiw.legendSavings') }}</div>
                  <div class="legend-anno"><span class="anno-dot anno-dot--3" />{{ t('hiw.legendOptions') }}</div>
                </div>
              </div>
              <div class="legend-hint">
                <v-icon size="12" color="#9CA3AF">mdi-cursor-default-click</v-icon>
                {{ t('hiw.legendClick') }}
              </div>
            </div>

            <div class="families-list">
              <div class="families-gradient" />
              <div class="families-labels">
                <span class="fam-label fam-label--top">{{ t('hiw.mostPowerful') }}</span>
                <span class="fam-label fam-label--bottom">{{ t('hiw.simplest') }}</span>
              </div>

              <div class="families-cards">
                <div
                  v-for="fam in families"
                  :key="fam.key"
                  :id="`fam-card-${fam.key}`"
                  class="fam-card"
                  :style="famCardStyle(fam.family)"
                  @click="toggleFam(fam.key)"
                >
                  <div class="fam-bar" :style="barBg(fam.family)" />
                  <div class="fam-head">
                    <span class="fam-emoji">{{ fam.emoji }}</span>
                    <span class="fam-name" :style="famTextColor(fam.family)">{{ t(fam.nameKey) }}</span>
                    <span class="fam-savings" :style="famPillStyle(fam.family)">~{{ fam.savings }}% {{ t('hiw.savings') }}</span>
                    <span class="fam-chevron" :class="{ open: expandedFam === fam.key }">▾</span>
                  </div>
                  <div class="fam-short">{{ t(fam.shortKey) }}</div>
                  <div class="fam-pills">
                    <span
                      v-for="opt in fam.options"
                      :key="opt"
                      class="pill"
                      :style="famPillStyle(fam.family)"
                    >{{ opt }}</span>
                  </div>
                  <div class="fam-detail" :class="{ open: expandedFam === fam.key }">
                    <div class="fam-detail-inner" :class="{ 'fam-detail-visible': expandedFam === fam.key }">
                      <!-- Illustration: auction flow diagram -->
                      <div class="fam-illustration" :style="famIllustrationBg(fam.family)">
                        <div class="fam-illus-flow">
                          <span
                            v-for="(stepKey, si) in famFlowKeys[fam.key]"
                            :key="si"
                            class="fam-illus-step"
                          >
                            <span class="fam-illus-icon">{{ stepKey.icon }}</span>
                            <span class="fam-illus-label">{{ t(stepKey.labelKey) }}</span>
                            <span v-if="si < famFlowKeys[fam.key].length - 1" class="fam-illus-arrow">→</span>
                          </span>
                        </div>
                        <div class="fam-illus-caption">{{ t(fam.illustrationKey) }}</div>
                      </div>

                      <p class="fam-desc-text">{{ t(fam.descKey) }}</p>
                      <p class="fam-use-text">{{ t(fam.useKey) }}</p>
                      <p class="fam-example">{{ t(fam.exampleKey) }}</p>

                      <!-- Try this type button -->
                      <button
                        class="fam-try-btn"
                        :style="famTryBtnStyle(fam.family)"
                        @click.stop="$emit('start'); show = false"
                      >
                        <v-icon size="14">mdi-play-circle-outline</v-icon>
                        {{ t('hiw.tryThisType') }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-divider" />

          <!-- ═══════════ 4. SCORING ═══════════ -->
          <div id="section-scoring" class="hiw-section" data-section="scoring">
            <h3 class="section-title">{{ t('hiw.scoringTitle') }}</h3>
            <p class="section-desc">{{ t('hiw.scoringIntro') }}</p>

            <div class="dims-grid">
              <div v-for="d in 6" :key="d" class="dim-row">
                <div class="dim-icon">{{ dimIcons[d - 1] }}</div>
                <div class="dim-info">
                  <div class="dim-name">{{ t(`hiw.dim${d}`) }}</div>
                  <div class="dim-desc">{{ t(`hiw.dim${d}Desc`) }}</div>
                </div>
                <div class="dim-opts">
                  <span
                    v-for="(opt, i) in (t(`hiw.dim${d}Opts`) as unknown as string[])"
                    :key="i"
                    class="dim-opt"
                  >{{ opt }}</span>
                </div>
              </div>
            </div>

            <!-- Compatibility table -->
            <h4 class="compat-title">{{ t('hiw.scoringTableTitle') }}</h4>
            <p class="compat-intro">{{ t('hiw.scoringTableIntro') }}</p>
            <div class="compat-table-wrap">
              <table class="compat-table">
                <thead>
                  <tr>
                    <th class="compat-th-empty" />
                    <th v-for="fam in families" :key="fam.key" class="compat-th">
                      <span class="compat-th-emoji">{{ fam.emoji }}</span>
                      <span class="compat-th-name" :style="{ color: gfc(fam.family).text }">{{ fam.shortName }}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, ri) in compatRows" :key="ri">
                    <td class="compat-label">{{ t(row.labelKey) }}</td>
                    <td v-for="fam in families" :key="fam.key" class="compat-cell">
                      <span v-if="row.data[fam.key]" class="compat-check">
                        <v-icon size="14" color="#34D399">mdi-check</v-icon>
                      </span>
                      <span v-else class="compat-cross">
                        <v-icon size="14" color="#D1D5DB">mdi-minus</v-icon>
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="scoring-notes">
              <div class="scoring-note">
                <v-icon size="14" color="#34D399">mdi-check-circle</v-icon>
                <span>{{ t('hiw.scoringMatch') }}</span>
              </div>
              <div class="scoring-note">
                <v-icon size="14" color="#EF4444">mdi-close-circle</v-icon>
                <span>{{ t('hiw.scoringElimination') }}</span>
              </div>
            </div>
          </div>

          <div class="section-divider" />

          <!-- ═══════════ 5. CONCEPTS ═══════════ -->
          <div id="section-concepts" class="hiw-section" data-section="concepts">
            <h3 class="section-title">{{ t('hiw.conceptsTitle') }}</h3>

            <div class="concepts-list">
              <div v-for="c in concepts" :key="c" class="concept-item">
                <div class="concept-term">{{ t(`hiw.concept${c}`) }}</div>
                <div class="concept-def">{{ t(`hiw.concept${c}Desc`) }}</div>

                <!-- Levels for each concept -->
                <div v-if="conceptLevelKeys[c]" class="concept-levels">
                  <div
                    v-for="(lvl, li) in conceptLevelKeys[c]"
                    :key="li"
                    class="concept-level"
                  >
                    <!-- Intensity bar for Intensity concept -->
                    <div v-if="c === 'Intensity'" class="intensity-bar-wrap">
                      <div class="intensity-bar">
                        <div class="intensity-fill" :style="{ width: lvl.fill, background: lvl.color }" />
                      </div>
                    </div>
                    <span v-else class="concept-level-icon">{{ lvl.icon }}</span>
                    <span class="concept-level-label">{{ t(lvl.labelKey) }}</span>
                    <span class="concept-level-desc">{{ t(lvl.descKey) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-divider" />

          <!-- ═══════════ 6. FAQ ═══════════ -->
          <div id="section-faq" class="hiw-section" data-section="faq">
            <h3 class="section-title">{{ t('hiw.faqTitle') }}</h3>

            <div class="faq-list">
              <div
                v-for="n in 4"
                :key="n"
                class="faq-item"
                :class="{ open: expandedFaq === n }"
                @click="expandedFaq = expandedFaq === n ? null : n"
              >
                <div class="faq-question">
                  <v-icon size="16" :color="expandedFaq === n ? '#1D1D1B' : '#9CA3AF'">
                    {{ expandedFaq === n ? 'mdi-minus-circle-outline' : 'mdi-plus-circle-outline' }}
                  </v-icon>
                  <span>{{ t(`hiw.faq${n}Q`) }}</span>
                </div>
                <div class="faq-answer" :class="{ open: expandedFaq === n }">
                  <div class="faq-answer-inner">
                    {{ t(`hiw.faq${n}A`) }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- CTA -->
          <div class="hiw-cta">
            <v-btn
              color="#1D1D1B"
              variant="flat"
              block
              class="cta-btn"
              append-icon="mdi-arrow-right"
              @click="$emit('start'); show = false"
            >
              {{ t('page.startScenario') }}
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { gfc } from '~/utils/decisionTree/constants'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('decisiontree')
const show = defineModel<boolean>({ default: false })

const props = defineProps<{
  initialSection?: string
  initialFamily?: string
}>()

defineEmits<{ start: [] }>()

const scrollContainer = ref<HTMLElement | null>(null)
const activeSection = ref('overview')
const expandedFam = ref<string | null>(null)
const expandedFaq = ref<number | null>(null)
const isScrolling = ref(false)
const scrollProgress = ref(0)

const sectionIds = ['overview', 'phases', 'families', 'scoring', 'concepts', 'faq']

const sections = computed(() => [
  { id: 'overview', icon: '💡', label: t('hiw.navOverview') },
  { id: 'phases', icon: '⚙️', label: t('hiw.navPhases') },
  { id: 'families', icon: '🏷️', label: t('hiw.navFamilies') },
  { id: 'scoring', icon: '📊', label: t('hiw.navScoring') },
  { id: 'concepts', icon: '📖', label: t('hiw.navConcepts') },
  { id: 'faq', icon: '❓', label: t('hiw.navFaq') },
])

const families = [
  { key: 'ds', shortName: 'DS', family: 'Double Scenario', emoji: '🏆', nameKey: 'families.doubleScenario', shortKey: 'v5.dsShort', descKey: 'v5.dsDesc', useKey: 'v5.dsUse', exampleKey: 'hiw.exampleDs', illustrationKey: 'hiw.illustDs', savings: 15, options: ['Pre-bid', 'Preference', 'Award'] },
  { key: 'en', shortName: 'EN', family: 'English', emoji: '🥈', nameKey: 'families.english', shortKey: 'v5.enShort', descKey: 'v5.enDesc', useKey: 'v5.enUse', exampleKey: 'hiw.exampleEn', illustrationKey: 'hiw.illustEn', savings: 12, options: ['Pre-bid', 'Preference', 'Award', 'Rank'] },
  { key: 'du', shortName: 'DU', family: 'Dutch', emoji: '⏳', nameKey: 'families.dutch', shortKey: 'v5.duShort', descKey: 'v5.duDesc', useKey: 'v5.duUse', exampleKey: 'hiw.exampleDu', illustrationKey: 'hiw.illustDu', savings: 10, options: ['Pre-bid', 'Preference', 'Award'] },
  { key: 'jp', shortName: 'JP', family: 'Japanese', emoji: '🔺', nameKey: 'families.japanese', shortKey: 'v5.jpShort', descKey: 'v5.jpDesc', useKey: 'v5.jpUse', exampleKey: 'hiw.exampleJp', illustrationKey: 'hiw.illustJp', savings: 10, options: ['Pre-bid', 'Award', 'Rank', 'No Rank'] },
  { key: 'sb', shortName: 'SB', family: 'Sealed Bid', emoji: '📩', nameKey: 'families.sealedBid', shortKey: 'v5.sbShort', descKey: 'v5.sbDesc', useKey: 'v5.sbUse', exampleKey: 'hiw.exampleSb', illustrationKey: 'hiw.illustSb', savings: 7, options: ['Preference', 'Award', 'Rank', 'No Rank'] },
  { key: 'tr', shortName: 'TR', family: 'Traditional', emoji: '🤝', nameKey: 'families.traditional', shortKey: 'v5.trShort', descKey: 'v5.trDesc', useKey: 'v5.trUse', exampleKey: 'hiw.exampleTr', illustrationKey: 'hiw.illustTr', savings: 4, options: [] },
]

// Visual flow diagrams per auction family — translated via keys
const famFlowKeys: Record<string, { icon: string; labelKey: string }[]> = {
  ds: [
    { icon: '📋', labelKey: 'hiw.flowDsPreBid' },
    { icon: '📉', labelKey: 'hiw.flowDsEnglish' },
    { icon: '⏳', labelKey: 'hiw.flowDsDutch' },
    { icon: '🏆', labelKey: 'hiw.flowDsAward' },
  ],
  en: [
    { icon: '💰', labelKey: 'hiw.flowEnCeiling' },
    { icon: '📉', labelKey: 'hiw.flowEnBid1' },
    { icon: '📉', labelKey: 'hiw.flowEnBid2' },
    { icon: '🏆', labelKey: 'hiw.flowEnBest' },
  ],
  du: [
    { icon: '💰', labelKey: 'hiw.flowDuHigh' },
    { icon: '⏳', labelKey: 'hiw.flowDuAuto' },
    { icon: '✋', labelKey: 'hiw.flowDuAccept' },
    { icon: '🏆', labelKey: 'hiw.flowDuWinner' },
  ],
  jp: [
    { icon: '💰', labelKey: 'hiw.flowJpLow' },
    { icon: '📈', labelKey: 'hiw.flowJpRound' },
    { icon: '🚪', labelKey: 'hiw.flowJpExit' },
    { icon: '🏆', labelKey: 'hiw.flowJpLast' },
  ],
  sb: [
    { icon: '📩', labelKey: 'hiw.flowSbSubmit' },
    { icon: '🔒', labelKey: 'hiw.flowSbSealed' },
    { icon: '📊', labelKey: 'hiw.flowSbCompare' },
    { icon: '🏆', labelKey: 'hiw.flowSbBest' },
  ],
  tr: [
    { icon: '🤝', labelKey: 'hiw.flowTrContact' },
    { icon: '💬', labelKey: 'hiw.flowTrNegotiate' },
    { icon: '🏆', labelKey: 'hiw.flowTrAgree' },
  ],
}

// Compatibility matrix
const compatRows = [
  { labelKey: 'hiw.scoringTablePreBid', data: { ds: true, en: true, du: true, jp: true, sb: false, tr: false } },
  { labelKey: 'hiw.scoringTablePref', data: { ds: true, en: true, du: true, jp: false, sb: true, tr: false } },
  { labelKey: 'hiw.scoringTableAward', data: { ds: true, en: true, du: true, jp: true, sb: true, tr: false } },
  { labelKey: 'hiw.scoringTableRank', data: { ds: false, en: true, du: false, jp: true, sb: true, tr: false } },
  { labelKey: 'hiw.scoringTableNoRank', data: { ds: false, en: false, du: false, jp: true, sb: true, tr: false } },
]

const dimIcons = ['💰', '👥', '🏅', '⭐', '🔥', '📏']
const concepts = ['PreBid', 'Preference', 'Awarding', 'Intensity']

// Concept levels — translated via keys
const conceptLevelKeys: Record<string, { icon?: string; labelKey: string; descKey: string; fill?: string; color?: string }[]> = {
  PreBid: [
    { icon: '✅', labelKey: 'hiw.lvlPreBidEnabled', descKey: 'hiw.lvlPreBidEnabledDesc' },
    { icon: '⛔', labelKey: 'hiw.lvlPreBidDisabled', descKey: 'hiw.lvlPreBidDisabledDesc' },
  ],
  Preference: [
    { icon: '⚖️', labelKey: 'hiw.lvlPrefNone', descKey: 'hiw.lvlPrefNoneDesc' },
    { icon: '📝', labelKey: 'hiw.lvlPrefNonFin', descKey: 'hiw.lvlPrefNonFinDesc' },
    { icon: '💰', labelKey: 'hiw.lvlPrefFin', descKey: 'hiw.lvlPrefFinDesc' },
  ],
  Awarding: [
    { icon: '🏆', labelKey: 'hiw.lvlAwardAward', descKey: 'hiw.lvlAwardAwardDesc' },
    { icon: '📊', labelKey: 'hiw.lvlAwardRank', descKey: 'hiw.lvlAwardRankDesc' },
    { icon: '🔍', labelKey: 'hiw.lvlAwardNoRank', descKey: 'hiw.lvlAwardNoRankDesc' },
  ],
  Intensity: [
    { labelKey: 'hiw.lvlIntCollab', descKey: 'hiw.lvlIntCollabDesc', fill: '33%', color: '#34D399' },
    { labelKey: 'hiw.lvlIntCompet', descKey: 'hiw.lvlIntCompetDesc', fill: '66%', color: '#FBBF24' },
    { labelKey: 'hiw.lvlIntAggr', descKey: 'hiw.lvlIntAggrDesc', fill: '100%', color: '#EF4444' },
  ],
}

// Scroll spy: detect which section is visible
function onScroll() {
  const container = scrollContainer.value
  if (!container) return

  // Update progress bar
  const { scrollTop, scrollHeight, clientHeight } = container
  scrollProgress.value = scrollHeight <= clientHeight ? 100 : (scrollTop / (scrollHeight - clientHeight)) * 100

  if (isScrolling.value) return

  // If scrolled to bottom, activate the last section
  if (scrollTop + clientHeight >= scrollHeight - 20) {
    activeSection.value = sectionIds[sectionIds.length - 1]
    return
  }

  const containerRect = container.getBoundingClientRect()
  const threshold = containerRect.top + 100

  let found = sectionIds[0]
  for (const id of sectionIds) {
    const el = document.getElementById(`section-${id}`)
    if (el) {
      const rect = el.getBoundingClientRect()
      if (rect.top <= threshold) {
        found = id
      }
    }
  }
  activeSection.value = found
}

function scrollTo(id: string) {
  isScrolling.value = true
  activeSection.value = id
  const el = document.getElementById(`section-${id}`)
  if (el && scrollContainer.value) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => { isScrolling.value = false }, 600)
  } else {
    isScrolling.value = false
  }
}

// Keyboard navigation: arrow keys to navigate sections
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault()
    const idx = sectionIds.indexOf(activeSection.value)
    const next = e.key === 'ArrowDown'
      ? Math.min(idx + 1, sectionIds.length - 1)
      : Math.max(idx - 1, 0)
    scrollTo(sectionIds[next])
  }
}

// Expose scrollTo for external deep linking
defineExpose({ scrollTo, expandFamily })

function expandFamily(familyKey: string) {
  expandedFam.value = familyKey
  nextTick(() => {
    const el = document.getElementById(`fam-card-${familyKey}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  })
}

// Reset scroll position when dialog opens
watch(show, (val) => {
  if (val) {
    expandedFam.value = null
    expandedFaq.value = null
    scrollProgress.value = 0
    if (props.initialSection && sectionIds.includes(props.initialSection)) {
      activeSection.value = props.initialSection
      nextTick(() => {
        scrollTo(props.initialSection!)
        if (props.initialFamily) {
          setTimeout(() => expandFamily(props.initialFamily!), 650)
        }
      })
    } else {
      activeSection.value = 'overview'
      nextTick(() => {
        if (scrollContainer.value) scrollContainer.value.scrollTop = 0
      })
    }
  }
})

function toggleFam(key: string) {
  expandedFam.value = expandedFam.value === key ? null : key
}

function famCardStyle(f: string) {
  const c = gfc(f)
  return { borderColor: c.border, background: c.bg }
}
function barBg(f: string) { return { background: gfc(f).border } }
function famTextColor(f: string) { return { color: gfc(f).text } }
function famPillStyle(f: string) {
  const c = gfc(f)
  return { background: c.border + '20', color: c.text }
}
function famIllustrationBg(f: string) {
  const c = gfc(f)
  return { background: c.border + '10', borderColor: c.border + '30' }
}
function famTryBtnStyle(f: string) {
  const c = gfc(f)
  return { background: c.border, color: '#FFF' }
}
</script>

<style scoped>
.hiw-card { overflow: hidden; }

/* ═══ HEADER ═══ */
.hiw-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px; border-bottom: 1px solid #E9EAEC;
}
.hiw-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, #FBBF24, #F59E0B);
  display: flex; align-items: center; justify-content: center;
}
.hiw-title { font-size: 16px; font-weight: 700; color: #1D1D1B; }
.hiw-sub { font-size: 12px; color: #9CA3AF; margin-top: 1px; max-width: 420px; }

/* ═══ PROGRESS BAR ═══ */
.hiw-progress-track {
  height: 2px; background: #F3F4F6;
}
.hiw-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FBBF24, #34D399);
  transition: width 0.15s ease-out;
  border-radius: 0 1px 1px 0;
}

/* ═══ LAYOUT: sidebar + content ═══ */
.hiw-layout {
  display: flex;
  height: calc(80vh - 74px);
  min-height: 400px;
}

/* ═══ SIDEBAR ═══ */
.hiw-sidebar {
  width: 180px;
  flex-shrink: 0;
  border-right: 1px solid #E9EAEC;
  padding: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.sidebar-btn {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px;
  font-size: 12px; font-weight: 500;
  color: #9CA3AF;
  background: none; border: none;
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  white-space: nowrap;
}
.sidebar-btn:hover {
  color: #6B7280;
  background: #F9FAFB;
}
.sidebar-btn.active {
  color: #1D1D1B;
  font-weight: 600;
  border-left-color: #1D1D1B;
  background: #F3F4F6;
}
.sidebar-icon { font-size: 14px; flex-shrink: 0; }
.sidebar-label { overflow: hidden; text-overflow: ellipsis; }

/* ═══ BODY (scrollable content) ═══ */
.hiw-body {
  flex: 1;
  padding: 24px 28px 20px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* ═══ SECTIONS ═══ */
.hiw-section { margin-bottom: 4px; scroll-margin-top: 8px; }
.section-title {
  font-size: 16px; font-weight: 700; color: #1D1D1B;
  margin-bottom: 8px;
}
.section-desc {
  font-size: 13px; color: #6B7280; line-height: 1.6;
  margin-bottom: 16px;
}
.section-divider {
  height: 1px; background: #E9EAEC;
  margin: 20px 0;
}

/* ═══ PHASE FLOW DIAGRAM ═══ */
.phase-flow {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  margin-bottom: 20px;
  padding: 16px 0;
}
.phase-flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}
.phase-flow-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: #F3F4F6;
  border: 2px solid #E9EAEC;
  display: flex; align-items: center; justify-content: center;
}
.phase-flow-label {
  font-size: 11px; font-weight: 600; color: #6B7280;
  text-align: center;
}
.phase-flow-label--decision {
  color: #9CA3AF; font-weight: 500;
}
.phase-flow-icon { font-size: 20px; }

/* Decision (Yes/No) */
.phase-flow-decision {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 48px;
  padding: 0 12px;
  border-radius: 8px;
  border: 2px solid #E9EAEC;
  background: #FFFBEB;
}
.decision-yes {
  font-size: 12px; font-weight: 700; color: #34D399;
}
.decision-divider {
  font-size: 12px; color: #D1D5DB;
}
.decision-no {
  font-size: 12px; font-weight: 700; color: #EF4444;
}

/* Connector lines between steps */
.phase-flow-connector {
  display: flex;
  align-items: center;
  height: 48px;
  flex: 0 0 auto;
}
.connector-line {
  width: 24px; height: 2px;
  background: #D1D5DB;
}
.connector-arrow {
  width: 0; height: 0;
  border: 5px solid transparent;
  border-left: 6px solid #D1D5DB;
  margin-left: -1px;
}

/* ═══ PHASES ═══ */
.phases-list { display: flex; flex-direction: column; gap: 0; }
.phase-item { display: flex; gap: 14px; align-items: flex-start; padding: 10px 0; }
.phase-num {
  width: 28px; height: 28px; border-radius: 50%;
  background: #1D1D1B; color: #FFF;
  font-size: 12px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.phase-body { flex: 1; min-width: 0; }
.phase-title { font-size: 14px; font-weight: 600; color: #1D1D1B; margin-bottom: 2px; }
.phase-desc { font-size: 12px; color: #6B7280; line-height: 1.5; }

/* ═══ SAVINGS COMPARISON ═══ */
.savings-compare {
  background: #F9FAFB; border-radius: 8px;
  padding: 12px 16px; margin-bottom: 16px;
  border: 1px solid #E9EAEC;
}
.savings-compare-title {
  font-size: 11px; font-weight: 600; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.04em;
  margin-bottom: 10px;
}
.savings-bars { display: flex; flex-direction: column; gap: 6px; }
.savings-bar-row {
  display: flex; align-items: center; gap: 8px;
}
.savings-bar-label {
  font-size: 11px; font-weight: 600; color: #374151;
  width: 40px; flex-shrink: 0;
}
.savings-bar-track {
  flex: 1; height: 8px; border-radius: 4px;
  background: #E5E7EB; overflow: hidden;
}
.savings-bar-fill {
  height: 100%; border-radius: 4px;
  transition: width 0.5s ease-out;
}
.savings-bar-value {
  font-size: 11px; font-weight: 700;
  width: 36px; flex-shrink: 0; text-align: right;
}

/* ═══ LEGEND CARD ═══ */
.legend-card {
  background: #F9FAFB; border: 1px dashed #D1D5DB;
  border-radius: 8px; padding: 12px 16px;
  margin-bottom: 16px;
}
.legend-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 10px;
}
.legend-title {
  font-size: 11px; font-weight: 600; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.legend-body {
  display: flex; gap: 20px; align-items: flex-start;
}
.legend-example {
  flex: 1; background: #FFF; border: 1.5px solid #D1D5DB;
  border-radius: 8px; padding: 8px 10px 8px 14px;
  position: relative; overflow: hidden;
}
.legend-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background: #D1D5DB;
}
.legend-content { display: flex; flex-direction: column; gap: 4px; }
.legend-row {
  display: flex; align-items: center; gap: 6px;
}
.legend-emoji { font-size: 12px; }
.legend-name {
  font-size: 11px; font-weight: 700; color: #6B7280; flex: 1;
}
.legend-savings-badge {
  font-size: 9px; font-weight: 600; padding: 1px 6px;
  border-radius: 4px; background: #F3F4F6; color: #6B7280;
}
.legend-chevron-demo { font-size: 10px; color: #D1D5DB; }
.legend-desc-line {
  font-size: 10px; color: #9CA3AF; font-style: italic;
}
.legend-pills-row { display: flex; gap: 3px; }
.legend-pill {
  font-size: 9px; font-weight: 600; padding: 1px 6px;
  border-radius: 4px; background: #E5E7EB; color: #6B7280;
}
.legend-annotations {
  flex-shrink: 0; display: flex; flex-direction: column;
  gap: 8px; padding-top: 2px;
}
.legend-anno {
  display: flex; align-items: center; gap: 6px;
  font-size: 10px; color: #6B7280; white-space: nowrap;
}
.anno-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.anno-dot--1 { background: #6B7280; }
.anno-dot--2 { background: #9CA3AF; }
.anno-dot--3 { background: #D1D5DB; }
.legend-hint {
  display: flex; align-items: center; gap: 6px;
  margin-top: 8px; font-size: 10px; color: #9CA3AF;
}

/* ═══ FAMILIES ═══ */
.families-list {
  position: relative;
  padding-left: 40px;
  margin-top: 8px;
}
.families-gradient {
  position: absolute; left: 14px; top: 0; bottom: 0;
  width: 3px; border-radius: 2px;
  background: linear-gradient(to bottom, #34D399, #FBBF24, #FB923C);
}
.families-labels {
  position: absolute; left: 0; top: 0; bottom: 0;
  display: flex; flex-direction: column; justify-content: space-between;
  width: 36px;
}
.fam-label {
  font-size: 8px; font-weight: 700; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.05em;
  writing-mode: vertical-lr; transform: rotate(180deg);
  text-align: center;
}
.fam-label--top { color: #34D399; }
.fam-label--bottom { color: #FB923C; }
.families-cards { display: flex; flex-direction: column; gap: 8px; }

.fam-card {
  border-radius: 8px; border: 1.5px solid;
  padding: 10px 12px 10px 16px;
  position: relative; overflow: hidden;
  cursor: pointer; transition: box-shadow 0.2s, transform 0.15s;
}
.fam-card:hover {
  box-shadow: 0 3px 12px rgba(0,0,0,0.06);
  transform: translateY(-1px);
}
.fam-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
}
.fam-head {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 3px;
}
.fam-emoji { font-size: 14px; }
.fam-name { font-size: 13px; font-weight: 700; flex: 1; }
.fam-savings {
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px;
}
.fam-chevron {
  font-size: 12px; color: #9CA3AF;
  transition: transform 0.25s; flex-shrink: 0;
}
.fam-chevron.open { transform: rotate(180deg); }
.fam-short { font-size: 11px; color: #6B7280; line-height: 1.4; margin-bottom: 6px; }
.fam-pills { display: flex; flex-wrap: wrap; gap: 4px; }
.pill {
  font-size: 10px; font-weight: 600;
  padding: 2px 8px; border-radius: 4px;
  white-space: nowrap;
}

/* Expandable detail with fade-in animation */
.fam-detail {
  display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1);
}
.fam-detail.open { grid-template-rows: 1fr; }
.fam-detail-inner {
  overflow: hidden; min-height: 0;
  opacity: 0;
  transition: opacity 0.25s ease-in 0.1s;
}
.fam-detail-inner.fam-detail-visible {
  opacity: 1;
}
.fam-desc-text {
  font-size: 12px; color: #374151; line-height: 1.5;
  margin-top: 10px; padding-top: 8px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.fam-use-text {
  font-size: 11px; color: #6B7280; font-style: italic;
  margin-top: 4px; line-height: 1.4;
}

/* Illustration inside expanded card */
.fam-illustration {
  margin-top: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid;
}
.fam-illus-flow {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
}
.fam-illus-step {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.fam-illus-icon { font-size: 16px; }
.fam-illus-label {
  font-size: 11px; font-weight: 600; color: #374151;
}
.fam-illus-arrow {
  margin: 0 6px;
  font-size: 12px; color: #9CA3AF; font-weight: 400;
}
.fam-illus-caption {
  font-size: 10px; color: #9CA3AF; text-align: center;
  margin-top: 6px; line-height: 1.4;
}

.fam-example {
  font-size: 11px; color: #9CA3AF; line-height: 1.4;
  margin-top: 8px; padding: 6px 10px;
  background: rgba(0,0,0,0.02); border-radius: 4px;
  border-left: 2px solid #D1D5DB;
}

/* Try this type button */
.fam-try-btn {
  display: inline-flex; align-items: center; gap: 6px;
  margin-top: 10px; padding: 6px 14px;
  border: none; border-radius: 6px;
  font-size: 11px; font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;
}
.fam-try-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* ═══ SCORING DIMENSIONS ═══ */
.dims-grid { display: flex; flex-direction: column; gap: 0; }
.dim-row {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #F3F4F6;
}
.dim-row:last-child { border-bottom: none; }
.dim-icon { font-size: 16px; flex-shrink: 0; width: 24px; text-align: center; }
.dim-info { flex: 1; min-width: 0; }
.dim-name { font-size: 13px; font-weight: 600; color: #1D1D1B; }
.dim-desc { font-size: 11px; color: #9CA3AF; }
.dim-opts { display: flex; gap: 4px; flex-shrink: 0; }
.dim-opt {
  font-size: 10px; font-weight: 500;
  padding: 3px 8px; border-radius: 4px;
  background: #F3F4F6; color: #374151;
  white-space: nowrap;
}

/* ═══ COMPATIBILITY TABLE ═══ */
.compat-title {
  font-size: 14px; font-weight: 700; color: #1D1D1B;
  margin-top: 24px; margin-bottom: 4px;
}
.compat-intro {
  font-size: 12px; color: #9CA3AF; margin-bottom: 12px;
}
.compat-table-wrap {
  overflow-x: auto;
  margin-bottom: 16px;
}
.compat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
.compat-th-empty {
  width: 100px;
}
.compat-th {
  text-align: center;
  padding: 8px 4px;
  border-bottom: 2px solid #E9EAEC;
}
.compat-th-emoji { display: block; font-size: 16px; margin-bottom: 2px; }
.compat-th-name { font-size: 10px; font-weight: 700; }
.compat-label {
  font-size: 12px; font-weight: 500; color: #6B7280;
  padding: 8px 8px 8px 0;
  white-space: nowrap;
}
.compat-cell {
  text-align: center;
  padding: 8px 4px;
  border-bottom: 1px solid #F3F4F6;
}
.compat-check, .compat-cross {
  display: inline-flex; align-items: center; justify-content: center;
}

.scoring-notes { margin-top: 16px; display: flex; flex-direction: column; gap: 8px; }
.scoring-note {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: #6B7280; line-height: 1.5;
}

/* ═══ CONCEPTS ═══ */
.concepts-list { display: flex; flex-direction: column; gap: 0; }
.concept-item {
  padding: 10px 0;
  border-bottom: 1px solid #F3F4F6;
}
.concept-item:last-child { border-bottom: none; }
.concept-term { font-size: 13px; font-weight: 700; color: #1D1D1B; margin-bottom: 2px; }
.concept-def { font-size: 12px; color: #6B7280; line-height: 1.5; }

/* Concept levels */
.concept-levels {
  display: flex; flex-direction: column; gap: 6px;
  margin-top: 8px; padding: 8px 12px;
  background: #F9FAFB; border-radius: 6px;
}
.concept-level {
  display: flex; align-items: center; gap: 8px;
}
.concept-level-icon { font-size: 14px; flex-shrink: 0; width: 20px; text-align: center; }
.concept-level-label {
  font-size: 11px; font-weight: 700; color: #374151;
  flex-shrink: 0; min-width: 80px;
}
.concept-level-desc {
  font-size: 11px; color: #9CA3AF; line-height: 1.3;
}

/* Intensity bar */
.intensity-bar-wrap {
  flex-shrink: 0; width: 20px; display: flex; align-items: center;
}
.intensity-bar {
  width: 20px; height: 6px; border-radius: 3px;
  background: #E5E7EB; overflow: hidden;
}
.intensity-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.3s;
}

/* ═══ FAQ ═══ */
.faq-list { display: flex; flex-direction: column; gap: 0; }
.faq-item {
  border-bottom: 1px solid #F3F4F6;
  cursor: pointer;
  transition: background 0.15s;
}
.faq-item:hover { background: #FAFAFA; }
.faq-item:last-child { border-bottom: none; }
.faq-question {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 0;
  font-size: 13px; font-weight: 600; color: #374151;
}
.faq-item.open .faq-question { color: #1D1D1B; }
.faq-answer {
  display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}
.faq-answer.open { grid-template-rows: 1fr; }
.faq-answer-inner {
  overflow: hidden; min-height: 0;
  font-size: 12px; color: #6B7280; line-height: 1.6;
  padding: 0 0 0 26px;
}
.faq-answer.open .faq-answer-inner {
  padding-bottom: 12px;
}

/* ═══ CTA ═══ */
.hiw-cta { margin-top: 24px; }
.cta-btn {
  font-weight: 600; text-transform: none;
  border-radius: 8px; font-size: 14px;
  height: 44px !important; letter-spacing: 0.01em;
}

/* ═══ RESPONSIVE ═══ */
@media (max-width: 700px) {
  .hiw-layout { flex-direction: column; height: auto; max-height: 80vh; }
  .hiw-sidebar {
    width: 100%; flex-direction: row; border-right: none;
    border-bottom: 1px solid #E9EAEC;
    padding: 0; overflow-x: auto; gap: 0;
    position: relative;
    -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
    mask-image: linear-gradient(to right, black 85%, transparent 100%);
  }
  .sidebar-btn {
    border-left: none; border-bottom: 2px solid transparent;
    padding: 8px 12px; font-size: 11px;
  }
  .sidebar-btn.active {
    border-left-color: transparent;
    border-bottom-color: #1D1D1B;
  }
  .hiw-body { padding: 16px; max-height: 60vh; }
  .dim-row { flex-direction: column; align-items: flex-start; gap: 6px; }
  .dim-opts { flex-wrap: wrap; }
  .families-list { padding-left: 28px; }
  .families-gradient { left: 8px; }
  .phase-flow { gap: 0; flex-wrap: wrap; justify-content: center; }
  .phase-flow-step { flex: 0 0 auto; }
  .phase-flow-circle { width: 40px; height: 40px; }
  .phase-flow-icon { font-size: 16px; }
  .phase-flow-decision { padding: 0 8px; height: 40px; }
  .phase-flow-connector { height: 40px; }
  .connector-line { width: 12px; }
  .compat-table { font-size: 11px; }
  .savings-bar-label { width: 32px; font-size: 10px; }
  .legend-body { flex-direction: column; }
}
</style>
