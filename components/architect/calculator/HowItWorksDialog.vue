<template>
  <v-dialog v-model="show" max-width="1100" scrollable @keydown="onKeydown">
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
            <v-icon :icon="s.icon" size="15" class="sidebar-icon" />
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
                  <span class="savings-bar-label"><v-icon :icon="fam.icon" size="14" :color="gfc(fam.family).text" style="margin-right:4px" />{{ fam.shortName }}</span>
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

            <!-- Legend hint -->
            <div class="legend-hint-row">
              <v-icon size="14" color="#9CA3AF">mdi-cursor-default-click</v-icon>
              {{ t('hiw.legendClick') }}
            </div>

            <div class="families-list">
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
                    <v-icon :icon="fam.icon" size="18" :color="gfc(fam.family).text" class="fam-icon" />
                    <span class="fam-name" :style="famTextColor(fam.family)">{{ t(fam.nameKey) }}</span>
                    <span class="fam-savings" :style="famPillStyle(fam.family)">{{ fam.savingsLabel }} {{ t('hiw.savings') }}</span>
                    <span class="fam-chevron" :class="{ open: expandedFam === fam.key }">▾</span>
                  </div>
                  <div class="fam-short">{{ t(fam.shortKey) }}</div>
                  <div class="fam-detail" :class="{ open: expandedFam === fam.key }">
                    <div class="fam-detail-inner" :class="{ 'fam-detail-visible': expandedFam === fam.key }">
                      <div class="fam-detail-cols">

                      <!-- LEFT: chart + flow + description -->
                      <div class="fam-detail-left">
                        <div class="fam-illustration" :style="famIllustrationBg(fam.family)">
                          <div class="fam-chart-wrap">
                            <AChart :family="fam.family" :color="gfc(fam.family).border" ccy="EUR" :animated="animatedFams.has(fam.key)" />
                          </div>
                        </div>

                        <!-- Flow steps -->
                        <div class="fam-flow-steps" :style="{ background: gfc(fam.family).bg, borderColor: gfc(fam.family).border + '44' }">
                          <template v-for="(step, si) in famFlowKeys[fam.key]" :key="si">
                            <div class="fam-flow-step">
                              <v-icon :icon="step.icon" size="12" :color="gfc(fam.family).text" />
                              <span class="fam-flow-label">{{ t(step.labelKey) }}</span>
                            </div>
                            <span v-if="si < famFlowKeys[fam.key].length - 1" class="fam-flow-arrow">
                              <svg width="20" height="10" viewBox="0 0 20 10" fill="none">
                                <path d="M1 5h16M13 1l4 4-4 4" :stroke="gfc(fam.family).border" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                              </svg>
                            </span>
                          </template>
                        </div>

                        <p class="fam-desc-text">{{ t(fam.descKey) }}</p>
                        <div class="fam-tip">
                          <v-icon size="13" color="#6B7280">mdi-lightbulb-outline</v-icon>
                          <span>{{ t(fam.useKey) }}</span>
                        </div>
                        <button
                          class="fam-try-btn"
                          :style="famTryBtnStyle(fam.family)"
                          @click.stop="$emit('start'); show = false"
                        >
                          <v-icon size="14">mdi-play-circle-outline</v-icon>
                          {{ t('hiw.tryThisType') }}
                        </button>
                      </div><!-- /fam-detail-left -->

                      <!-- RIGHT: options -->
                      <div class="fam-detail-right">
                      <!-- Options: 4 sections, each with sub-option rows -->
                      <div v-if="famOptionDetails[fam.key].preBid || famOptionDetails[fam.key].pref || famOptionDetails[fam.key].awardModes.length" class="fam-opt-list" :style="{ '--fam-accent': gfc(fam.family).border }">

                        <!-- ① Security / Pre-bid -->
                        <div class="opt-section">
                          <div class="opt-section-hdr">
                            <v-icon size="11" color="#9CA3AF">mdi-clock-fast</v-icon>
                            {{ t('hiw.optSecurityTitle') }}
                          </div>
                          <!-- No pre-bid — always available -->
                          <div class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlPreBidDisabled') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlPreBidDisabledDesc') }}</span>
                          </div>
                          <!-- Pre-bid — only when supported -->
                          <div v-if="famOptionDetails[fam.key].preBid" class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlPreBidEnabled') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlPreBidEnabledDesc') }}</span>
                          </div>
                        </div>

                        <!-- ② Preference — only when supported -->
                        <div v-if="famOptionDetails[fam.key].pref" class="opt-section">
                          <div class="opt-section-hdr">
                            <v-icon size="11" color="#9CA3AF">mdi-scale-balance</v-icon>
                            {{ t('hiw.optPrefTitle') }}
                          </div>
                          <div class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlPrefNone') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlPrefNoneDesc') }}</span>
                          </div>
                          <div v-if="famOptionDetails[fam.key].prefNonFin !== false" class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlPrefNonFin') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlPrefNonFinDesc') }}</span>
                          </div>
                          <div class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlPrefFin') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlPrefFinDesc') }}</span>
                          </div>
                        </div>

                        <!-- ③ Award mode — only when supported -->
                        <div v-if="famOptionDetails[fam.key].awardModes.length" class="opt-section">
                          <div class="opt-section-hdr">
                            <v-icon size="11" color="#9CA3AF">mdi-trophy-outline</v-icon>
                            {{ t('hiw.optAwardTitle') }}
                          </div>
                          <div v-if="famOptionDetails[fam.key].awardModes.includes('award')" class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlAwardAward') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlAwardAwardDesc') }}</span>
                          </div>
                          <div v-if="famOptionDetails[fam.key].awardModes.includes('rank')" class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlAwardRank') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlAwardRankDesc') }}</span>
                          </div>
                          <div v-if="famOptionDetails[fam.key].awardModes.includes('norank')" class="opt-sub-row">
                            <span class="opt-sub-name">{{ t('hiw.lvlAwardNoRank') }}</span>
                            <span class="opt-sub-desc">{{ t('hiw.lvlAwardNoRankDesc') }}</span>
                          </div>
                        </div>

                        <!-- ④ Intensity -->
                        <div class="opt-section">
                          <div class="opt-section-hdr">
                            <v-icon size="11" color="#9CA3AF">mdi-fire</v-icon>
                            {{ t('hiw.optIntensityTitle') }}
                          </div>
                          <div class="opt-sub-row opt-sub-row--intensity">
                            <div class="opt-int-track">
                              <div class="opt-int-fill" :style="{ width: famOptionDetails[fam.key].intensity.fill, background: famOptionDetails[fam.key].intensity.color }" />
                            </div>
                            <span class="opt-int-label" :style="{ color: famOptionDetails[fam.key].intensity.color }">{{ t(famOptionDetails[fam.key].intensity.labelKey, {}, famOptionDetails[fam.key].intensity.labelFb) }}</span>
                            <span class="opt-sep">—</span>
                            <span class="opt-sub-desc">{{ t(famOptionDetails[fam.key].intensity.descKey, {}, famOptionDetails[fam.key].intensity.descFb) }}</span>
                          </div>
                        </div>

                      </div>
                      <!-- No configurable options (Traditional) -->
                      <div v-else class="fam-no-options">
                        <v-icon size="16" color="#9CA3AF">mdi-tune-off</v-icon>
                        <span>{{ t('hiw.noOptions', {}, 'No configurable parameters — fully managed off-platform') }}</span>
                      </div>
                      </div><!-- /fam-detail-right -->

                      </div><!-- /fam-detail-cols -->
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
                <div class="dim-icon"><v-icon :icon="dimIcons[d - 1]" size="18" color="#9CA3AF" /></div>
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
                      <v-icon :icon="fam.icon" size="16" :color="gfc(fam.family).text" class="compat-th-icon" />
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
                    <v-icon v-else :icon="lvl.icon" size="14" color="#9CA3AF" class="concept-level-icon" />
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
import { gfc } from '~/utils/architect/constants'
import useTranslations from '~/composables/useTranslations'
import AChart from '~/components/architect/calculator/charts/AChart.vue'

const { t } = useTranslations('architect')
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
// Track which families have been animated (one-shot: only fires on first open)
const animatedFams = ref(new Set<string>())

const sectionIds = ['overview', 'phases', 'families', 'scoring', 'concepts', 'faq']

const sections = computed(() => [
  { id: 'overview', icon: 'mdi-lightbulb-outline',      label: t('hiw.navOverview') },
  { id: 'phases',   icon: 'mdi-cog-outline',            label: t('hiw.navPhases') },
  { id: 'families', icon: 'mdi-tag-multiple-outline',   label: t('hiw.navFamilies') },
  { id: 'scoring',  icon: 'mdi-chart-bar',              label: t('hiw.navScoring') },
  { id: 'concepts', icon: 'mdi-book-open-outline',      label: t('hiw.navConcepts') },
  { id: 'faq',      icon: 'mdi-help-circle-outline',    label: t('hiw.navFaq') },
])

const families = [
  { key: 'ds', shortName: 'Double Scenario', family: 'Double Scenario', icon: 'mdi-layers-outline',       nameKey: 'families.doubleScenario', shortKey: 'v5.dsShort', descKey: 'v5.dsDesc', useKey: 'v5.dsUse', illustrationKey: 'hiw.illustDs', savings: 15, savingsLabel: '12–18%', options: ['Pre-bid', 'Preference', 'Award'] },
  { key: 'en', shortName: 'English',         family: 'English',          icon: 'mdi-gavel',                nameKey: 'families.english',        shortKey: 'v5.enShort', descKey: 'v5.enDesc', useKey: 'v5.enUse', illustrationKey: 'hiw.illustEn', savings: 12, savingsLabel: '10–15%', options: ['Pre-bid', 'Preference', 'Award', 'Rank'] },
  { key: 'du', shortName: 'Dutch',           family: 'Dutch',            icon: 'mdi-trending-up',           nameKey: 'families.dutch',          shortKey: 'v5.duShort', descKey: 'v5.duDesc', useKey: 'v5.duUse', illustrationKey: 'hiw.illustDu', savings: 10, savingsLabel: '8–12%',  options: ['Pre-bid', 'Preference', 'Award'] },
  { key: 'jp', shortName: 'Japanese',        family: 'Japanese',         icon: 'mdi-trending-down',         nameKey: 'families.japanese',       shortKey: 'v5.jpShort', descKey: 'v5.jpDesc', useKey: 'v5.jpUse', illustrationKey: 'hiw.illustJp', savings: 10, savingsLabel: '8–12%',  options: ['Pre-bid', 'Preference', 'Award', 'Rank', 'No Rank'] },
  { key: 'sb', shortName: 'Sealed Bid',      family: 'Sealed Bid',       icon: 'mdi-email-lock-outline',    nameKey: 'families.sealedBid',      shortKey: 'v5.sbShort', descKey: 'v5.sbDesc', useKey: 'v5.sbUse', illustrationKey: 'hiw.illustSb', savings: 7,  savingsLabel: '5–8%',   options: ['Preference', 'Award', 'Rank', 'No Rank'] },
  { key: 'tr', shortName: 'Traditional',     family: 'Traditional',      icon: 'mdi-handshake-outline',     nameKey: 'families.traditional',    shortKey: 'v5.trShort', descKey: 'v5.trDesc', useKey: 'v5.trUse', illustrationKey: 'hiw.illustTr', savings: 4,  savingsLabel: '2–5%',   options: [] },
]

// Visual flow diagrams per auction family — translated via keys
const famFlowKeys: Record<string, { icon: string; labelKey: string }[]> = {
  ds: [
    { icon: 'mdi-clock-outline',        labelKey: 'hiw.flowDsPreBid' },
    { icon: 'mdi-trending-down',        labelKey: 'hiw.flowDsEnglish' },
    { icon: 'mdi-trending-up',          labelKey: 'hiw.flowDsDutch' },
    { icon: 'mdi-check-circle-outline', labelKey: 'hiw.flowDsAward' },
  ],
  en: [
    { icon: 'mdi-currency-usd',         labelKey: 'hiw.flowEnCeiling' },
    { icon: 'mdi-trending-down',        labelKey: 'hiw.flowEnBid1' },
    { icon: 'mdi-trending-down',        labelKey: 'hiw.flowEnBid2' },
    { icon: 'mdi-check-circle-outline', labelKey: 'hiw.flowEnBest' },
  ],
  du: [
    { icon: 'mdi-currency-usd',         labelKey: 'hiw.flowDuHigh' },
    { icon: 'mdi-trending-up',          labelKey: 'hiw.flowDuAuto' },
    { icon: 'mdi-hand-back-right-outline', labelKey: 'hiw.flowDuAccept' },
    { icon: 'mdi-check-circle-outline', labelKey: 'hiw.flowDuWinner' },
  ],
  jp: [
    { icon: 'mdi-currency-usd',         labelKey: 'hiw.flowJpLow' },
    { icon: 'mdi-trending-down',        labelKey: 'hiw.flowJpRound' },
    { icon: 'mdi-exit-to-app',          labelKey: 'hiw.flowJpExit' },
    { icon: 'mdi-check-circle-outline', labelKey: 'hiw.flowJpLast' },
  ],
  sb: [
    { icon: 'mdi-email-outline',        labelKey: 'hiw.flowSbSubmit' },
    { icon: 'mdi-lock-outline',         labelKey: 'hiw.flowSbSealed' },
    { icon: 'mdi-chart-bar',            labelKey: 'hiw.flowSbCompare' },
    { icon: 'mdi-check-circle-outline', labelKey: 'hiw.flowSbBest' },
  ],
  tr: [
    { icon: 'mdi-handshake-outline',    labelKey: 'hiw.flowTrContact' },
    { icon: 'mdi-chat-outline',         labelKey: 'hiw.flowTrNegotiate' },
    { icon: 'mdi-check-circle-outline', labelKey: 'hiw.flowTrAgree' },
  ],
}

// Per-family configurable options metadata
const famOptionDetails: Record<string, {
  preBid: boolean
  pref: boolean
  prefNonFin?: boolean
  awardModes: ('award' | 'rank' | 'norank')[]
  intensity: { labelKey: string; labelFb: string; fill: string; color: string; descKey: string; descFb: string }
}> = {
  ds: { preBid: true,  pref: true,                  awardModes: ['award'],                   intensity: { labelKey: 'hiw.lvlIntAggr',   labelFb: 'Intense',      fill: '100%', color: '#EF4444', descKey: 'hiw.lvlIntAggrDesc',   descFb: 'Full competitive pressure — maximises savings potential'  } },
  en: { preBid: true,  pref: true,                  awardModes: ['award', 'rank'],            intensity: { labelKey: 'hiw.lvlIntHigh',   labelFb: 'High',         fill: '75%',  color: '#F59E0B', descKey: 'hiw.lvlIntHighDesc',   descFb: 'Strong pressure — real-time bidding drives prices down'   } },
  du: { preBid: true,  pref: true,                  awardModes: ['award'],                   intensity: { labelKey: 'hiw.lvlIntCompet', labelFb: 'Competitive',  fill: '50%',  color: '#FBBF24', descKey: 'hiw.lvlIntCompetDesc', descFb: 'Balanced competition — works with most market configurations' } },
  jp: { preBid: true,  pref: true, prefNonFin: false, awardModes: ['award', 'rank', 'norank'], intensity: { labelKey: 'hiw.lvlIntCompet', labelFb: 'Competitive',  fill: '50%',  color: '#FBBF24', descKey: 'hiw.lvlIntCompetDesc', descFb: 'Balanced competition — works with most market configurations' } },
  sb: { preBid: false, pref: true,                  awardModes: ['award', 'rank', 'norank'], intensity: { labelKey: 'hiw.lvlIntCollab', labelFb: 'Collaborative', fill: '25%',  color: '#34D399', descKey: 'hiw.lvlIntCollabDesc', descFb: 'Light pressure — suited for strategic partnerships'         } },
  tr: { preBid: false, pref: false,                 awardModes: [],                          intensity: { labelKey: 'hiw.lvlIntCollab', labelFb: 'Collaborative', fill: '25%',  color: '#34D399', descKey: 'hiw.lvlIntCollabDesc', descFb: 'Light pressure — suited for strategic partnerships'         } },
}

// Compatibility matrix
const compatRows = [
  { labelKey: 'hiw.scoringTablePreBid', data: { ds: true, en: true, du: true, jp: true, sb: false, tr: false } },
  { labelKey: 'hiw.scoringTablePref', data: { ds: true, en: true, du: true, jp: true, sb: true, tr: false } },
  { labelKey: 'hiw.scoringTableAward', data: { ds: true, en: true, du: true, jp: true, sb: true, tr: false } },
  { labelKey: 'hiw.scoringTableRank', data: { ds: false, en: true, du: false, jp: true, sb: true, tr: false } },
  { labelKey: 'hiw.scoringTableNoRank', data: { ds: false, en: false, du: false, jp: true, sb: true, tr: false } },
]

const dimIcons = ['mdi-cash-multiple', 'mdi-account-group-outline', 'mdi-medal-outline', 'mdi-star-outline', 'mdi-fire', 'mdi-ruler']
const concepts = ['PreBid', 'Preference', 'Awarding', 'Intensity']

// Concept levels — translated via keys
const conceptLevelKeys: Record<string, { icon?: string; labelKey: string; descKey: string; fill?: string; color?: string }[]> = {
  PreBid: [
    { icon: 'mdi-clock-check-outline',  labelKey: 'hiw.lvlPreBidEnabled',  descKey: 'hiw.lvlPreBidEnabledDesc' },
    { icon: 'mdi-clock-remove-outline', labelKey: 'hiw.lvlPreBidDisabled', descKey: 'hiw.lvlPreBidDisabledDesc' },
  ],
  Preference: [
    { icon: 'mdi-equal',              labelKey: 'hiw.lvlPrefNone',    descKey: 'hiw.lvlPrefNoneDesc' },
    { icon: 'mdi-text-box-outline',   labelKey: 'hiw.lvlPrefNonFin',  descKey: 'hiw.lvlPrefNonFinDesc' },
    { icon: 'mdi-currency-eur',       labelKey: 'hiw.lvlPrefFin',     descKey: 'hiw.lvlPrefFinDesc' },
  ],
  Awarding: [
    { icon: 'mdi-trophy-outline',     labelKey: 'hiw.lvlAwardAward',  descKey: 'hiw.lvlAwardAwardDesc' },
    { icon: 'mdi-format-list-numbered', labelKey: 'hiw.lvlAwardRank', descKey: 'hiw.lvlAwardRankDesc' },
    { icon: 'mdi-eye-outline',        labelKey: 'hiw.lvlAwardNoRank', descKey: 'hiw.lvlAwardNoRankDesc' },
  ],
  Intensity: [
    { labelKey: 'hiw.lvlIntCollab', descKey: 'hiw.lvlIntCollabDesc', fill: '25%',  color: '#34D399' },
    { labelKey: 'hiw.lvlIntCompet', descKey: 'hiw.lvlIntCompetDesc', fill: '50%',  color: '#FBBF24' },
    { labelKey: 'hiw.lvlIntHigh',   descKey: 'hiw.lvlIntHighDesc',   fill: '75%',  color: '#F59E0B' },
    { labelKey: 'hiw.lvlIntAggr',   descKey: 'hiw.lvlIntAggrDesc',   fill: '100%', color: '#EF4444' },
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
  // Always reset then re-trigger to replay animation
  animatedFams.value = new Set([...animatedFams.value].filter(k => k !== familyKey))
  nextTick(() => {
    animatedFams.value = new Set([...animatedFams.value, familyKey])
    nextTick(() => {
      const el = document.getElementById(`fam-card-${familyKey}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  })
}

// Reset scroll position when dialog opens
watch(show, (val) => {
  if (val) {
    expandedFam.value = null
    expandedFaq.value = null
    scrollProgress.value = 0
    animatedFams.value = new Set()
    if (props.initialSection && sectionIds.includes(props.initialSection)) {
      activeSection.value = props.initialSection
      nextTick(() => {
        if (props.initialFamily) {
          // Jump directly to the family card — short delay for dialog to fully render
          setTimeout(() => expandFamily(props.initialFamily!), 150)
        } else {
          scrollTo(props.initialSection!)
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
  if (expandedFam.value === key) {
    expandedFam.value = null
    // Reset so animation replays on next open
    animatedFams.value = new Set([...animatedFams.value].filter(k => k !== key))
  } else {
    expandedFam.value = key
    // Remove first (force animated=false), then add back after DOM flush to restart animation
    animatedFams.value = new Set([...animatedFams.value].filter(k => k !== key))
    nextTick(() => {
      animatedFams.value = new Set([...animatedFams.value, key])
    })
  }
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
  return { background: c.bg, color: c.text, border: `1px solid ${c.border}` }
}
</script>

<style scoped>
.hiw-card { overflow: hidden; }

/* ═══ HEADER ═══ */
.hiw-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 28px; border-bottom: 1px solid #E9EAEC;
}
.hiw-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #FBBF24, #F59E0B);
  display: flex; align-items: center; justify-content: center;
}
.hiw-title { font-size: 18px; font-weight: 700; color: #1D1D1B; }
.hiw-sub { font-size: 14px; color: #9CA3AF; margin-top: 2px; max-width: 520px; }

/* ═══ PROGRESS BAR ═══ */
.hiw-progress-track {
  height: 3px; background: #F3F4F6;
}
.hiw-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FBBF24, #34D399);
  transition: width 0.15s ease-out;
  border-radius: 0 2px 2px 0;
}

/* ═══ LAYOUT: sidebar + content ═══ */
.hiw-layout {
  display: flex;
  height: calc(88vh - 90px);
  min-height: 500px;
}

/* ═══ SIDEBAR ═══ */
.hiw-sidebar {
  width: 210px;
  flex-shrink: 0;
  border-right: 1px solid #E9EAEC;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.sidebar-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 20px;
  font-size: 13px; font-weight: 500;
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
.sidebar-icon { flex-shrink: 0; opacity: 0.7; }
.sidebar-label { overflow: hidden; text-overflow: ellipsis; }

/* ═══ BODY (scrollable content) ═══ */
.hiw-body {
  flex: 1;
  padding: 36px 44px 32px;
  overflow-y: auto;
  scroll-behavior: smooth;
}

/* ═══ SECTIONS ═══ */
.hiw-section { margin-bottom: 8px; scroll-margin-top: 16px; }
.section-title {
  font-size: 20px; font-weight: 700; color: #1D1D1B;
  margin-bottom: 12px;
}
.section-desc {
  font-size: 14px; color: #6B7280; line-height: 1.75;
  margin-bottom: 20px;
}
.section-divider {
  height: 1px; background: #E9EAEC;
  margin: 36px 0;
}

/* ═══ PHASE FLOW DIAGRAM ═══ */
.phase-flow {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  margin-bottom: 28px;
  padding: 24px 0;
}
.phase-flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  flex: 0 0 auto;
}
.phase-flow-circle {
  width: 64px; height: 64px;
  border-radius: 50%;
  background: #F3F4F6;
  border: 2px solid #E9EAEC;
  display: flex; align-items: center; justify-content: center;
}
.phase-flow-label {
  font-size: 13px; font-weight: 600; color: #6B7280;
  text-align: center;
}
.phase-flow-label--decision {
  color: #9CA3AF; font-weight: 500;
}
.phase-flow-icon { font-size: 26px; }

/* Decision (Yes/No) */
.phase-flow-decision {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 64px;
  padding: 0 16px;
  border-radius: 10px;
  border: 2px solid #E9EAEC;
  background: #FFFBEB;
}
.decision-yes {
  font-size: 13px; font-weight: 700; color: #34D399;
}
.decision-divider {
  font-size: 13px; color: #D1D5DB;
}
.decision-no {
  font-size: 13px; font-weight: 700; color: #EF4444;
}

/* Connector lines between steps */
.phase-flow-connector {
  display: flex;
  align-items: center;
  height: 64px;
  flex: 0 0 auto;
}
.connector-line {
  width: 32px; height: 2px;
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
.phase-item { display: flex; gap: 16px; align-items: flex-start; padding: 14px 0; }
.phase-num {
  width: 32px; height: 32px; border-radius: 50%;
  background: #1D1D1B; color: #FFF;
  font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 2px;
}
.phase-body { flex: 1; min-width: 0; }
.phase-title { font-size: 15px; font-weight: 600; color: #1D1D1B; margin-bottom: 4px; }
.phase-desc { font-size: 13px; color: #6B7280; line-height: 1.6; }

/* ═══ SAVINGS COMPARISON ═══ */
.savings-compare {
  background: #F9FAFB; border-radius: 8px;
  padding: 16px 20px; margin-bottom: 20px;
  border: 1px solid #E9EAEC;
  max-width: 520px;
}
.savings-compare-title {
  font-size: 12px; font-weight: 600; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.04em;
  margin-bottom: 12px;
}
.savings-bars { display: flex; flex-direction: column; gap: 8px; }
.savings-bar-row {
  display: flex; align-items: center; gap: 10px;
}
.savings-bar-label {
  font-size: 12px; font-weight: 600; color: #374151;
  width: 120px; flex-shrink: 0;
}
.savings-bar-track {
  flex: 1; height: 6px; border-radius: 3px;
  background: #E5E7EB; overflow: hidden;
}
.savings-bar-fill {
  height: 100%; border-radius: 3px;
  transition: width 0.5s ease-out;
}
.savings-bar-value {
  font-size: 12px; font-weight: 700;
  width: 36px; flex-shrink: 0; text-align: right;
}

/* ═══ LEGEND CARD ═══ */
.legend-card {
  background: #F9FAFB; border: 1px dashed #D1D5DB;
  border-radius: 8px; padding: 16px 20px;
  margin-bottom: 20px;
}
.legend-header {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 12px;
}
.legend-title {
  font-size: 12px; font-weight: 600; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.04em;
}
.legend-body {
  display: flex; gap: 24px; align-items: flex-start;
}
.legend-example {
  flex: 1; background: #FFF; border: 1.5px solid #D1D5DB;
  border-radius: 8px; padding: 10px 12px 10px 16px;
  position: relative; overflow: hidden;
}
.legend-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
  background: #D1D5DB;
}
.legend-content { display: flex; flex-direction: column; gap: 5px; }
.legend-row {
  display: flex; align-items: center; gap: 6px;
}
.legend-name {
  font-size: 12px; font-weight: 700; color: #6B7280; flex: 1;
}
.legend-savings-badge {
  font-size: 10px; font-weight: 600; padding: 2px 7px;
  border-radius: 4px; background: #F3F4F6; color: #6B7280;
}
.legend-chevron-demo { font-size: 11px; color: #D1D5DB; }
.legend-desc-line {
  font-size: 11px; color: #9CA3AF; font-style: italic;
}
.legend-pills-row { display: flex; gap: 4px; }
.legend-pill {
  font-size: 10px; font-weight: 600; padding: 2px 7px;
  border-radius: 4px; background: #E5E7EB; color: #6B7280;
}
.legend-annotations {
  flex-shrink: 0; display: flex; flex-direction: column;
  gap: 10px; padding-top: 2px;
}
.legend-anno {
  display: flex; align-items: center; gap: 8px;
  font-size: 11px; color: #6B7280; white-space: nowrap;
}
.anno-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.anno-dot--1 { background: #6B7280; }
.anno-dot--2 { background: #9CA3AF; }
.anno-dot--3 { background: #D1D5DB; }
.legend-hint {
  display: flex; align-items: center; gap: 6px;
  margin-top: 10px; font-size: 11px; color: #9CA3AF;
}

/* ═══ LEGEND HINT ROW ═══ */
.legend-hint-row {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 16px;
  font-size: 13px; color: #9CA3AF;
}

/* ═══ FAMILIES ═══ */
.families-list {
  margin-top: 12px;
}
.families-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fam-card {
  border-radius: 8px; border: 1.5px solid;
  padding: 14px 20px 14px 24px;
  position: relative; overflow: hidden;
  cursor: pointer; transition: box-shadow 0.2s, transform 0.15s, border-color 0.2s;
  user-select: none;
}
.fam-card:hover {
  box-shadow: 0 6px 20px rgba(0,0,0,0.10);
  transform: translateY(-2px);
}
.fam-card:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.fam-bar {
  position: absolute; left: 0; top: 0; bottom: 0; width: 4px;
}
.fam-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 5px;
}
.fam-icon { flex-shrink: 0; }
.fam-name { font-size: 14px; font-weight: 700; flex: 1; }
.fam-savings {
  font-size: 11px; font-weight: 600;
  padding: 3px 9px; border-radius: 4px;
}
.fam-chevron {
  font-size: 16px; color: #9CA3AF;
  transition: transform 0.25s, color 0.2s; flex-shrink: 0;
  width: 22px; height: 22px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%; background: rgba(0,0,0,0.04);
}
.fam-card:hover .fam-chevron { color: #6B7280; background: rgba(0,0,0,0.08); }
.fam-chevron.open { transform: rotate(180deg); }
.fam-short { font-size: 12px; color: #6B7280; line-height: 1.5; margin-bottom: 8px; }

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
.fam-detail-cols {
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  gap: 16px;
  align-items: start;
  padding-top: 10px;
}
.fam-detail-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}
.fam-detail-right {
  min-width: 0;
}
/* ═══ OPTIONS LIST ═══ */
.fam-opt-list {
  display: flex; flex-direction: column;
  gap: 4px; margin-top: 0;
}

/* One card per criterion */
.opt-section {
  background: #FFF;
  border: 1px solid #E9EAEC;
  border-left: 3px solid var(--fam-accent, #E9EAEC);
  border-radius: 8px;
  padding: 7px 12px 7px 10px;
  display: flex; flex-direction: column; gap: 0;
}
.opt-section-hdr {
  display: flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.07em; color: #A0A0A0;
  margin-bottom: 5px;
}

/* Each option: badge left, description right */
.opt-sub-row {
  display: grid;
  grid-template-columns: 100px 1fr;
  gap: 8px;
  align-items: center;
  padding: 3px 0;
  border-top: 1px solid #F3F4F6;
}
.opt-sub-row--rec {
  grid-template-columns: 100px 1fr auto;
}
.opt-sub-row:first-of-type {
  border-top: none;
}
.opt-sub-name {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #374151;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 5px;
  padding: 2px 8px;
  white-space: nowrap;
  width: fit-content;
}
.opt-rec-tag {
  display: inline-flex; align-items: center;
  font-size: 9px; font-weight: 600;
  color: #065F46; background: #D1FAE5;
  border-radius: 3px; padding: 1px 5px;
  text-transform: none; letter-spacing: 0;
  white-space: nowrap;
}
.opt-sub-desc {
  font-size: 11px; color: #6B7280; line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.opt-sep { color: #C5C7C9; font-size: 12px; }
.opt-pref-note {
  display: flex; align-items: flex-start; gap: 5px;
  font-size: 10px; color: #92400E; line-height: 1.4;
  background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 4px;
  padding: 5px 7px; margin-top: 4px;
}

/* Intensity row — full-width flex (no grid split) */
.opt-sub-row--intensity {
  display: flex; align-items: center; gap: 8px;
  grid-template-columns: none;
  border-top: none;
  padding: 0;
}
.opt-int-track {
  width: 44px; height: 4px; border-radius: 2px;
  background: #E9EAEC; overflow: hidden; flex-shrink: 0;
}
.opt-int-fill { height: 100%; border-radius: 2px; }
.opt-int-label { font-size: 12px; font-weight: 600; flex-shrink: 0; }

/* Flow steps */
.fam-flow-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid;
}
.fam-flow-step {
  display: flex;
  align-items: center;
  gap: 5px;
  flex: 0 0 auto;
}
.fam-flow-label {
  font-size: 10px; font-weight: 600; color: #374151;
  white-space: nowrap;
}
.fam-flow-arrow {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
}

.fam-desc-text {
  font-size: 12px; color: #374151; line-height: 1.6;
  margin-top: 10px;
}

/* "Best when" tip */
.fam-tip {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin-top: 6px;
  padding: 6px 10px;
  background: rgba(0,0,0,0.025);
  border-radius: 5px;
  border-left: 2px solid #D1D5DB;
  font-size: 11px; color: #6B7280; line-height: 1.45;
}
.fam-tip .v-icon { flex-shrink: 0; margin-top: 1px; }

/* Traditional: no options placeholder */
.fam-no-options {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  background: #FAFAFA;
  border: 1px solid #F0F0F0;
  border-radius: 8px;
  font-size: 12px; color: #9CA3AF; line-height: 1.5;
}

/* Illustration inside expanded card */
.fam-illustration {
  margin-top: 0;
  padding: 0 0 6px;
  border-radius: 8px;
  border: 1px solid;
  overflow: hidden;
}
.fam-chart-wrap {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  pointer-events: none;
}
.fam-chart-wrap :deep(.chart-container) {
  height: 220px;
  border: none;
  border-radius: 0;
}

.fam-example {
  font-size: 11px; color: #B0B0B0; line-height: 1.5;
  margin-top: 6px; padding: 6px 10px;
  background: rgba(0,0,0,0.02); border-radius: 4px;
  border-left: 2px solid #E5E7EB;
}

/* Try this type button */
.fam-try-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  margin-top: 12px; padding: 8px 0;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 6px;
  font-size: 12px; font-weight: 600;
  cursor: pointer; width: 100%;
  transition: opacity 0.2s, transform 0.15s;
}
.fam-try-btn:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* ═══ SCORING DIMENSIONS ═══ */
.dims-grid { display: flex; flex-direction: column; gap: 0; }
.dim-row {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid #F3F4F6;
}
.dim-row:last-child { border-bottom: none; }
.dim-icon { font-size: 18px; flex-shrink: 0; width: 26px; text-align: center; }
.dim-info { flex: 1; min-width: 0; }
.dim-name { font-size: 14px; font-weight: 600; color: #1D1D1B; }
.dim-desc { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
.dim-opts { display: flex; gap: 5px; flex-shrink: 0; }
.dim-opt {
  font-size: 11px; font-weight: 500;
  padding: 4px 10px; border-radius: 4px;
  background: #F3F4F6; color: #374151;
  white-space: nowrap;
}

/* ═══ COMPATIBILITY TABLE ═══ */
.compat-title {
  font-size: 15px; font-weight: 700; color: #1D1D1B;
  margin-top: 28px; margin-bottom: 6px;
}
.compat-intro {
  font-size: 13px; color: #9CA3AF; margin-bottom: 14px;
}
.compat-table-wrap {
  overflow-x: auto;
  margin-bottom: 20px;
}
.compat-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.compat-th-empty {
  width: 110px;
}
.compat-th {
  text-align: center;
  padding: 10px 6px;
  border-bottom: 2px solid #E9EAEC;
}
.compat-th-icon { display: block; margin-bottom: 3px; }
.compat-th-name { font-size: 11px; font-weight: 700; }
.compat-label {
  font-size: 13px; font-weight: 500; color: #6B7280;
  padding: 10px 10px 10px 0;
  white-space: nowrap;
}
.compat-table tbody tr:nth-child(even) td {
  background: #F9FAFB;
}
.compat-cell {
  text-align: center;
  padding: 10px 6px;
  border-bottom: 1px solid #F3F4F6;
}
.compat-check, .compat-cross {
  display: inline-flex; align-items: center; justify-content: center;
}

.scoring-notes { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
.scoring-note {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 13px; color: #6B7280; line-height: 1.6;
}

/* ═══ CONCEPTS ═══ */
.concepts-list { display: flex; flex-direction: column; gap: 0; }
.concept-item {
  padding: 14px 0;
  border-bottom: 1px solid #F3F4F6;
}
.concept-item:last-child { border-bottom: none; }
.concept-term { font-size: 14px; font-weight: 700; color: #1D1D1B; margin-bottom: 4px; }
.concept-def { font-size: 13px; color: #6B7280; line-height: 1.6; }

/* Concept levels */
.concept-levels {
  display: flex; flex-direction: column; gap: 8px;
  margin-top: 10px; padding: 10px 14px;
  background: #F9FAFB; border-radius: 6px;
}
.concept-level {
  display: flex; align-items: center; gap: 10px;
}
.concept-level-icon { flex-shrink: 0; width: 22px; }
.concept-level-label {
  font-size: 12px; font-weight: 700; color: #374151;
  flex-shrink: 0; min-width: 88px;
}
.concept-level-desc {
  font-size: 12px; color: #9CA3AF; line-height: 1.4;
}

/* Intensity bar */
.intensity-bar-wrap {
  flex-shrink: 0; width: 22px; display: flex; align-items: center;
}
.intensity-bar {
  width: 22px; height: 6px; border-radius: 3px;
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
  padding: 16px 0;
  font-size: 14px; font-weight: 600; color: #374151;
}
.faq-item.open .faq-question { color: #1D1D1B; }
.faq-answer {
  display: grid; grid-template-rows: 0fr;
  transition: grid-template-rows 0.25s ease;
}
.faq-answer.open { grid-template-rows: 1fr; }
.faq-answer-inner {
  overflow: hidden; min-height: 0;
  font-size: 13px; color: #6B7280; line-height: 1.7;
  padding: 0 0 0 26px;
}
.faq-answer.open .faq-answer-inner {
  padding-bottom: 16px;
}

/* ═══ CTA ═══ */
.hiw-cta { margin-top: 32px; display: flex; justify-content: center; }
.cta-btn {
  font-weight: 600; text-transform: none;
  border-radius: 8px; font-size: 15px;
  height: 48px !important; letter-spacing: 0.01em;
}

/* ═══ RESPONSIVE ═══ */
@media (max-width: 700px) {
  .fam-detail-cols {
    grid-template-columns: 1fr;
  }
  .fam-detail-right {
    position: static;
  }
  .hiw-layout { flex-direction: column; height: auto; max-height: 88vh; }
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
    padding: 8px 12px; font-size: 12px;
  }
  .sidebar-btn.active {
    border-left-color: transparent;
    border-bottom-color: #1D1D1B;
  }
  .hiw-body { padding: 20px; max-height: 60vh; }
  .dim-row { flex-direction: column; align-items: flex-start; gap: 6px; }
  .dim-opts { flex-wrap: wrap; }
  .phase-flow { gap: 0; flex-wrap: wrap; justify-content: center; }
  .phase-flow-step { flex: 0 0 auto; }
  .phase-flow-circle { width: 48px; height: 48px; }
  .phase-flow-icon { font-size: 20px; }
  .phase-flow-decision { padding: 0 10px; height: 48px; }
  .phase-flow-connector { height: 48px; }
  .connector-line { width: 16px; }
  .compat-table { font-size: 12px; }
  .savings-bar-label { width: 100px; font-size: 11px; }
  .legend-body { flex-direction: column; }
}
</style>
