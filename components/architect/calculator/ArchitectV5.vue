<template>
  <v-dialog v-model="show" max-width="1300" scrollable>
    <v-card class="v5-card" rounded="lg">
      <!-- ── Header ── -->
      <div class="v5-header">
        <div class="d-flex align-center ga-3">
          <div class="v5-icon">
            <v-icon size="20" color="white">mdi-sitemap-outline</v-icon>
          </div>
          <div>
            <div class="v5-title">{{ t('v5.title') }}</div>
            <div class="v5-sub">{{ t('v5.subtitle') }}</div>
          </div>
        </div>
        <div class="d-flex align-center ga-4">
          <v-tabs v-model="tab" density="compact" color="#1D1D1B" class="v5-tabs">
            <v-tab value="tree" prepend-icon="mdi-cursor-default-click-outline">{{ t('v5.tabTree') }}</v-tab>
            <v-tab value="tree2" prepend-icon="mdi-sitemap-outline">{{ t('v5.tabTree2') }}</v-tab>
            <v-tab value="cards" prepend-icon="mdi-card-multiple-outline">{{ t('v5.tabCards') }}</v-tab>
            <v-tab value="cascade" prepend-icon="mdi-waterfall">{{ t('v5.tabCascade') }}</v-tab>
            <v-tab value="matrix" prepend-icon="mdi-table-check">{{ t('v5.tabMatrix') }}</v-tab>
          </v-tabs>
          <v-btn icon variant="text" size="small" @click="show = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
      </div>

      <v-window v-model="tab" class="v5-window">

        <!-- ══════════════════════════════════════════
             TAB 1 — DECISION TREE (original V5)
             ══════════════════════════════════════════ -->
        <!-- ══════════════════════════════════════════
             TAB 1 — INTERACTIVE DECISION TREE
             ══════════════════════════════════════════ -->
        <v-window-item value="tree">
          <div class="tab-body">
            <!-- Reset / status bar -->
            <div class="itree-bar">
              <div class="itree-status">
                <template v-if="iActive === 'done'">
                  <v-icon size="14" color="#059669">mdi-check-circle-outline</v-icon>
                  <span>{{ t('v5.iDone') }}</span>
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
                <!-- Grey connector lines -->
                <g fill="none" stroke="#D1D5DB" stroke-width="1.5">
                  <line x1="50" y1="46" x2="50" y2="60" />
                  <line x1="33.33" y1="60" x2="83.33" y2="60" />
                  <line x1="33.33" y1="60" x2="33.33" y2="76" />
                  <line x1="83.33" y1="60" x2="83.33" y2="76" />
                  <line x1="33.33" y1="98" x2="33.33" y2="112" />
                  <line x1="83.33" y1="98" x2="83.33" y2="128" />
                  <line x1="33.33" y1="152" x2="33.33" y2="166" />
                  <!-- Simple approach branch: extends to new question node -->
                  <line x1="83.33" y1="142" x2="83.33" y2="194" />
                  <line x1="16.67" y1="166" x2="50" y2="166" />
                  <line x1="16.67" y1="166" x2="16.67" y2="180" />
                  <line x1="50" y1="166" x2="50" y2="180" />
                  <line x1="16.67" y1="180" x2="16.67" y2="184" />
                  <line x1="16.67" y1="214" x2="16.67" y2="224" />
                  <line x1="50" y1="180" x2="50" y2="184" />
                  <line x1="50" y1="202" x2="50" y2="224" />
                  <!-- Simple approach: from question down to split -->
                  <line x1="83.33" y1="232" x2="83.33" y2="248" />
                  <line x1="75" y1="248" x2="91.67" y2="248" />
                  <line x1="75" y1="248" x2="75" y2="264" />
                  <line x1="75" y1="282" x2="75" y2="400" />
                  <line x1="91.67" y1="248" x2="91.67" y2="264" />
                  <line x1="91.67" y1="282" x2="91.67" y2="400" />
                  <!-- Left branches (Q3a / Q3) -->
                  <line x1="16.67" y1="258" x2="16.67" y2="272" />
                  <line x1="8.33" y1="272" x2="25" y2="272" />
                  <line x1="8.33" y1="272" x2="8.33" y2="286" />
                  <line x1="25" y1="272" x2="25" y2="286" />
                  <line x1="50" y1="258" x2="50" y2="272" />
                  <line x1="41.67" y1="272" x2="58.33" y2="272" />
                  <line x1="41.67" y1="272" x2="41.67" y2="286" />
                  <line x1="58.33" y1="272" x2="58.33" y2="286" />
                  <line x1="8.33" y1="286" x2="8.33" y2="290" />
                  <line x1="8.33" y1="308" x2="8.33" y2="400" />
                  <line x1="25" y1="286" x2="25" y2="290" />
                  <line x1="25" y1="308" x2="25" y2="400" />
                  <line x1="41.67" y1="286" x2="41.67" y2="290" />
                  <line x1="41.67" y1="308" x2="41.67" y2="400" />
                  <line x1="58.33" y1="286" x2="58.33" y2="290" />
                  <line x1="58.33" y1="308" x2="58.33" y2="400" />
                </g>
                <!-- Colored anchor dots — align with card tops -->
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
                    <span class="q-text">{{ t('v5.q1') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 33.33%; top: 80px">
                  <button class="ibadge" :class="ib('q1','yes')" @click="ia('q1','yes')">
                    <div class="badge badge--yes">{{ t('v5.yes') }}</div>
                  </button>
                </div>
                <div class="tree-el" style="left: 83.33%; top: 80px">
                  <button class="ibadge" :class="ib('q1','no')" @click="ia('q1','no')">
                    <div class="badge badge--no">{{ t('v5.no') }}</div>
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
                    <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                  </button>
                </div>
                <div class="tree-el" style="left: 91.67%; top: 264px">
                  <button class="ibadge" :class="ib('q4','no')" @click="ia('q4','no')">
                    <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                  </button>
                </div>
                <!-- Q2 YES / NO -->
                <div class="tree-el" style="left: 16.67%; top: 184px">
                  <button class="ibadge" :class="ib('q2','yes')" @click="ia('q2','yes')">
                    <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                  </button>
                </div>
                <div class="tree-el" style="left: 16.67%; top: 202px">
                  <div class="badge-best">{{ t('v5.bestPotential') }}</div>
                </div>
                <div class="tree-el" style="left: 50%; top: 184px">
                  <button class="ibadge" :class="ib('q2','no')" @click="ia('q2','no')">
                    <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
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
                    <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintDS') }}</div>
                </div>
                <div class="tree-el" style="left: 25%; top: 290px">
                  <button class="ibadge" :class="ib('q3a','no')" @click="ia('q3a','no')">
                    <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintEN') }}</div>
                </div>
                <!-- Q3 YES → DU / NO → JP -->
                <div class="tree-el" style="left: 41.67%; top: 290px">
                  <button class="ibadge" :class="ib('q3','yes')" @click="ia('q3','yes')">
                    <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintDU') }}</div>
                </div>
                <div class="tree-el" style="left: 58.33%; top: 290px">
                  <button class="ibadge" :class="ib('q3','no')" @click="ia('q3','no')">
                    <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                  </button>
                  <div class="hint-label">{{ t('v5.hintJP') }}</div>
                </div>
              </div>
            </div>

            <!-- Family cards — state driven by answers -->
            <div class="fam-grid">
              <div v-for="card in cards" :key="card.key" class="fam-card" :class="iCard(card.key)" :style="{ borderTop: `3px solid ${gfc(card.family).border}` }">

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

                  <!-- Flow steps -->
                  <div class="fam-flow">
                    <template v-for="(step, si) in famFlowKeys[card.key]" :key="si">
                      <div class="fam-step">
                        <v-icon :icon="step.icon" size="9" :color="gfc(card.family).border" />
                        <span>{{ t(step.labelKey) }}</span>
                      </div>
                      <span v-if="si < famFlowKeys[card.key].length - 1" class="fam-sep" :style="{ color: gfc(card.family).border }">›</span>
                    </template>
                  </div>

                  <!-- Option chips -->
                  <div class="fam-chips">
                    <span v-if="famOptionDetails[card.key].preBid" class="fam-chip">
                      <v-icon size="8" color="#6B7280">mdi-clock-fast</v-icon>
                      {{ t('v1.preBid') }}
                    </span>
                    <span v-if="famOptionDetails[card.key].pref" class="fam-chip">
                      <v-icon size="8" color="#6B7280">mdi-scale-balance</v-icon>
                      {{ t('v1.preference') }}
                    </span>
                    <span v-for="mode in famOptionDetails[card.key].awardModes" :key="mode" class="fam-chip">
                      <v-icon size="8" color="#6B7280">{{ mode === 'award' ? 'mdi-trophy-outline' : mode === 'rank' ? 'mdi-format-list-numbered' : 'mdi-eye-outline' }}</v-icon>
                      {{ mode === 'award' ? t('hiw.lvlAwardAward') : mode === 'rank' ? t('hiw.lvlAwardRank') : t('hiw.lvlAwardNoRank') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- ══════════════════════════════════════════
             TAB 2 — REFERENCE TREE (static copy)
             ══════════════════════════════════════════ -->
        <v-window-item value="tree2">
          <div class="tab-body">
            <div class="tree-section">
              <svg class="tree-svg" viewBox="0 0 100 400" preserveAspectRatio="none">
                <g fill="none" stroke="#D1D5DB" stroke-width="1.5">
                  <line x1="50" y1="46" x2="50" y2="60" />
                  <line x1="33.33" y1="60" x2="83.33" y2="60" />
                  <line x1="33.33" y1="60" x2="33.33" y2="76" />
                  <line x1="83.33" y1="60" x2="83.33" y2="76" />
                  <line x1="33.33" y1="98" x2="33.33" y2="112" />
                  <line x1="83.33" y1="98" x2="83.33" y2="128" />
                  <line x1="33.33" y1="152" x2="33.33" y2="166" />
                  <line x1="83.33" y1="142" x2="83.33" y2="194" />
                  <line x1="16.67" y1="166" x2="50" y2="166" />
                  <line x1="16.67" y1="166" x2="16.67" y2="180" />
                  <line x1="50" y1="166" x2="50" y2="180" />
                  <line x1="16.67" y1="180" x2="16.67" y2="184" />
                  <line x1="16.67" y1="214" x2="16.67" y2="224" />
                  <line x1="50" y1="180" x2="50" y2="184" />
                  <line x1="50" y1="202" x2="50" y2="224" />
                  <line x1="83.33" y1="232" x2="83.33" y2="248" />
                  <line x1="75" y1="248" x2="91.67" y2="248" />
                  <line x1="75" y1="248" x2="75" y2="264" />
                  <line x1="75" y1="282" x2="75" y2="400" />
                  <line x1="91.67" y1="248" x2="91.67" y2="264" />
                  <line x1="91.67" y1="282" x2="91.67" y2="400" />
                  <line x1="16.67" y1="258" x2="16.67" y2="272" />
                  <line x1="8.33" y1="272" x2="25" y2="272" />
                  <line x1="8.33" y1="272" x2="8.33" y2="286" />
                  <line x1="25" y1="272" x2="25" y2="286" />
                  <line x1="50" y1="258" x2="50" y2="272" />
                  <line x1="41.67" y1="272" x2="58.33" y2="272" />
                  <line x1="41.67" y1="272" x2="41.67" y2="286" />
                  <line x1="58.33" y1="272" x2="58.33" y2="286" />
                  <line x1="8.33" y1="286" x2="8.33" y2="290" />
                  <line x1="8.33" y1="308" x2="8.33" y2="400" />
                  <line x1="25" y1="286" x2="25" y2="290" />
                  <line x1="25" y1="308" x2="25" y2="400" />
                  <line x1="41.67" y1="286" x2="41.67" y2="290" />
                  <line x1="41.67" y1="308" x2="41.67" y2="400" />
                  <line x1="58.33" y1="286" x2="58.33" y2="290" />
                  <line x1="58.33" y1="308" x2="58.33" y2="400" />
                </g>
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
                <div class="tree-el" style="left: 50%; top: 2px">
                  <div class="q-bubble q-bubble--root">
                    <v-icon size="18" class="q-icon">mdi-cash-multiple</v-icon>
                    <span class="q-text">{{ t('v5.q1') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 33.33%; top: 80px"><div class="badge badge--yes">{{ t('v5.yes') }}</div></div>
                <div class="tree-el" style="left: 83.33%; top: 80px"><div class="badge badge--no">{{ t('v5.no') }}</div></div>
                <div class="tree-el" style="left: 33.33%; top: 112px">
                  <div class="q-bubble">
                    <v-icon size="18" class="q-icon">mdi-account-group-outline</v-icon>
                    <span class="q-text">{{ t('v5.q2') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 83.33%; top: 130px"><div class="hint-label">{{ t('v5.simpleApproach') }}</div></div>
                <div class="tree-el" style="left: 83.33%; top: 194px">
                  <div class="q-bubble q-bubble--small">
                    <v-icon size="16" class="q-icon">mdi-lock-outline</v-icon>
                    <span class="q-text">{{ t('v5.q4') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 75%; top: 264px"><div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div></div>
                <div class="tree-el" style="left: 91.67%; top: 264px"><div class="badge badge--no badge--sm">{{ t('v5.no') }}</div></div>
                <div class="tree-el" style="left: 16.67%; top: 184px"><div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div></div>
                <div class="tree-el" style="left: 16.67%; top: 202px"><div class="badge-best">{{ t('v5.bestPotential') }}</div></div>
                <div class="tree-el" style="left: 50%; top: 184px"><div class="badge badge--no badge--sm">{{ t('v5.no') }}</div></div>
                <div class="tree-el" style="left: 16.67%; top: 224px">
                  <div class="q-bubble q-bubble--small">
                    <v-icon size="16" class="q-icon">mdi-layers-triple-outline</v-icon>
                    <span class="q-text">{{ t('v5.q3a') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 50%; top: 224px">
                  <div class="q-bubble q-bubble--small">
                    <v-icon size="16" class="q-icon">mdi-trophy-outline</v-icon>
                    <span class="q-text">{{ t('v5.q3') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 8.33%; top: 290px">
                  <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                  <div class="hint-label">{{ t('v5.hintDS') }}</div>
                </div>
                <div class="tree-el" style="left: 25%; top: 290px">
                  <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                  <div class="hint-label">{{ t('v5.hintEN') }}</div>
                </div>
                <div class="tree-el" style="left: 41.67%; top: 290px">
                  <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                  <div class="hint-label">{{ t('v5.hintDU') }}</div>
                </div>
                <div class="tree-el" style="left: 58.33%; top: 290px">
                  <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                  <div class="hint-label">{{ t('v5.hintJP') }}</div>
                </div>
              </div>
            </div>
            <div class="fam-grid">
              <div v-for="card in cards" :key="card.key" class="fam-card" :style="{ borderTop: `3px solid ${gfc(card.family).border}` }">
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
                      <div v-for="i in 4" :key="i" class="fam-pip" :style="{ background: i <= card.intensityLevel ? gfc(card.family).border : '#E5E7EB' }" />
                    </div>
                  </div>
                </div>
                <div class="fam-chart" :style="{ background: gfc(card.family).bg }">
                  <ArchitectCalculatorChartsAChart :family="card.family" :color="gfc(card.family).border" ccy="EUR" />
                </div>
                <div class="fam-body">
                  <p class="fam-desc">{{ card.short }}</p>
                  <div class="fam-flow">
                    <template v-for="(step, si) in famFlowKeys[card.key]" :key="si">
                      <div class="fam-step">
                        <v-icon :icon="step.icon" size="9" :color="gfc(card.family).border" />
                        <span>{{ t(step.labelKey) }}</span>
                      </div>
                      <span v-if="si < famFlowKeys[card.key].length - 1" class="fam-sep" :style="{ color: gfc(card.family).border }">›</span>
                    </template>
                  </div>
                  <div class="fam-chips">
                    <span v-if="famOptionDetails[card.key].preBid" class="fam-chip">
                      <v-icon size="8" color="#6B7280">mdi-clock-fast</v-icon> {{ t('v1.preBid') }}
                    </span>
                    <span v-if="famOptionDetails[card.key].pref" class="fam-chip">
                      <v-icon size="8" color="#6B7280">mdi-scale-balance</v-icon> {{ t('v1.preference') }}
                    </span>
                    <span v-for="mode in famOptionDetails[card.key].awardModes" :key="mode" class="fam-chip">
                      <v-icon size="8" color="#6B7280">{{ mode === 'award' ? 'mdi-trophy-outline' : mode === 'rank' ? 'mdi-format-list-numbered' : 'mdi-eye-outline' }}</v-icon>
                      {{ mode === 'award' ? t('hiw.lvlAwardAward') : mode === 'rank' ? t('hiw.lvlAwardRank') : t('hiw.lvlAwardNoRank') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- ══════════════════════════════════════════
             TAB 3 — CARDS OVERVIEW (from V1)
             ══════════════════════════════════════════ -->
        <v-window-item value="cards">
          <div class="tab-body tab-body--canvas">
            <!-- Group labels -->
            <div class="ov-groups">
              <div class="ov-group-label">{{ t('v1.veryHighCompetition') }}</div>
              <div class="ov-group-label">{{ t('v1.highCompetition') }}</div>
              <div class="ov-group-label">{{ t('v1.lowNoCompetition') }}</div>
            </div>

            <!-- Cards row -->
            <div class="ov-cards">
              <div v-for="oc in overviewCards" :key="oc.key" class="ov-card">
                <div class="ov-card-top" :style="{ borderColor: oc.color.border, background: oc.color.bg }">
                  <ArchitectCalculatorChartsAChart :family="oc.family" :color="oc.color.border" ccy="EUR" />
                </div>
                <div class="ov-card-body">
                  <div class="ov-name" :style="{ color: oc.color.text }">
                    <span class="ov-dot" :style="{ background: oc.color.border }" />
                    {{ oc.name }}
                  </div>
                  <div class="ov-savings">{{ oc.savings }} {{ t('v1.savings') }}</div>
                  <div class="ov-comp">
                    <span
                      v-for="i in 5"
                      :key="i"
                      class="ov-pip"
                      :style="i <= oc.compLevel ? { background: oc.color.border } : {}"
                    />
                    <span class="ov-comp-label">{{ oc.compLabel }}</span>
                  </div>
                  <div class="ov-pills">
                    <span
                      v-for="p in oc.pills"
                      :key="p.label"
                      class="ov-pill"
                      :class="p.variant"
                    >{{ p.label }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Note Dutch vs Japanese -->
            <div class="ov-note">
              {{ t('v1.awardBindingNote') }} <strong>Dutch</strong>
              <span class="ov-sep">|</span>
              {{ t('v1.noAwardNote') }} <strong>Japanese</strong>
            </div>
          </div>
        </v-window-item>

        <!-- ══════════════════════════════════════════
             TAB 3 — CASCADE (from V2)
             ══════════════════════════════════════════ -->
        <v-window-item value="cascade">
          <div class="tab-body cascade-canvas">
            <p class="text-body-2 text-grey-darken-1 mb-5">{{ t('v2.intro') }}</p>

            <div class="cascade-tier tier-double">
              <div class="tier-rank">1</div>
              <div class="tier-left">
                <div class="tier-badge badge-double">{{ t('v2.bestSavings') }}</div>
                <div class="tier-name">{{ t('families.doubleScenario') }}</div>
                <div class="tier-desc">{{ t('v2.dsDesc') }}</div>
              </div>
              <div class="tier-conditions">
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.cond5Suppliers') }}</span></div>
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condSimpleSpecs') }}</span></div>
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condMultipleLots') }}</span></div>
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condRealTimeBidding') }}</span></div>
              </div>
              <div class="tier-savings">
                <div class="savings-bar"><div class="savings-fill fill-double" style="width:95%" /></div>
                <span class="savings-label">~15-25%</span>
              </div>
            </div>

            <div class="cascade-arrow">
              <div class="arrow-line" /><div class="arrow-tag">{{ t('v2.conditionsNotMet') }}</div><div class="arrow-line" />
            </div>

            <div class="cascade-tier tier-english">
              <div class="tier-rank">2</div>
              <div class="tier-left">
                <div class="tier-badge badge-english">{{ t('v2.mostFlexible') }}</div>
                <div class="tier-name">{{ t('families.english') }}</div>
                <div class="tier-desc">{{ t('v2.enDesc') }}</div>
              </div>
              <div class="tier-conditions">
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.cond3Suppliers') }}</span></div>
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condRealTimeBidding') }}</span></div>
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condAllOptions') }}</span></div>
              </div>
              <div class="tier-savings">
                <div class="savings-bar"><div class="savings-fill fill-english" style="width:75%" /></div>
                <span class="savings-label">~10-18%</span>
              </div>
            </div>

            <div class="cascade-arrow">
              <div class="arrow-line" /><div class="arrow-tag">{{ t('v2.needDifferent') }}</div><div class="arrow-line" />
            </div>

            <div class="cascade-pair">
              <div class="cascade-tier tier-dutch">
                <div class="tier-rank">3</div>
                <div class="tier-left">
                  <div class="tier-name">{{ t('families.dutch') }}</div>
                  <div class="tier-desc">{{ t('v2.duDesc') }}</div>
                </div>
                <div class="tier-conditions">
                  <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condBindingAward') }}</span></div>
                  <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condKnownPrice') }}</span></div>
                  <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condSuppliersAvailable') }}</span></div>
                </div>
                <div class="tier-savings">
                  <div class="savings-bar"><div class="savings-fill fill-dutch" style="width:60%" /></div>
                  <span class="savings-label">~8-15%</span>
                </div>
              </div>
              <div class="cascade-tier tier-japanese">
                <div class="tier-rank">3</div>
                <div class="tier-left">
                  <div class="tier-name">{{ t('families.japanese') }}</div>
                  <div class="tier-desc">{{ t('v2.jpDesc') }}</div>
                </div>
                <div class="tier-conditions">
                  <div class="condition"><v-icon size="16" color="warning">mdi-alert-circle</v-icon><span>{{ t('v2.condNoBinding') }}</span></div>
                  <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condRanking') }}</span></div>
                  <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condSuppliersAvailable') }}</span></div>
                </div>
                <div class="tier-savings">
                  <div class="savings-bar"><div class="savings-fill fill-japanese" style="width:58%" /></div>
                  <span class="savings-label">~8-14%</span>
                </div>
              </div>
            </div>

            <div class="cascade-arrow">
              <div class="arrow-line" /><div class="arrow-tag">{{ t('v2.realTimeNotPossible') }}</div><div class="arrow-line" />
            </div>

            <div class="cascade-tier tier-sealed">
              <div class="tier-rank">4</div>
              <div class="tier-left">
                <div class="tier-name">{{ t('families.sealedBid') }}</div>
                <div class="tier-desc">{{ t('v2.sbDesc') }}</div>
              </div>
              <div class="tier-conditions">
                <div class="condition"><v-icon size="16" color="success">mdi-check-circle</v-icon><span>{{ t('v2.condSuppliersAvailable') }}</span></div>
                <div class="condition"><v-icon size="16" color="warning">mdi-alert-circle</v-icon><span>{{ t('v2.condRefuseLive') }}</span></div>
              </div>
              <div class="tier-savings">
                <div class="savings-bar"><div class="savings-fill fill-sealed" style="width:35%" /></div>
                <span class="savings-label">~3-8%</span>
              </div>
            </div>

            <div class="cascade-arrow">
              <div class="arrow-line" /><div class="arrow-tag">{{ t('v2.notEnoughSuppliers') }}</div><div class="arrow-line" />
            </div>

            <div class="cascade-tier tier-nego">
              <div class="tier-rank">5</div>
              <div class="tier-left">
                <div class="tier-name">{{ t('families.traditional') }}</div>
                <div class="tier-desc">{{ t('v2.trDesc') }}</div>
              </div>
              <div class="tier-conditions">
                <div class="condition"><v-icon size="16" color="grey-lighten-1">mdi-minus-circle</v-icon><span class="text-grey">{{ t('v2.condFewer3') }}</span></div>
                <div class="condition"><v-icon size="16" color="grey-lighten-1">mdi-minus-circle</v-icon><span class="text-grey">{{ t('v2.condNoCompetition') }}</span></div>
              </div>
              <div class="tier-savings">
                <div class="savings-bar"><div class="savings-fill fill-nego" style="width:15%" /></div>
                <span class="savings-label">~1-5%</span>
              </div>
            </div>
          </div>
        </v-window-item>

        <!-- ══════════════════════════════════════════
             TAB 4 — MATRIX (from V3)
             ══════════════════════════════════════════ -->
        <v-window-item value="matrix">
          <div class="tab-body matrix-canvas">
            <p class="text-body-2 text-grey-darken-1 mb-5">{{ t('v3.intro') }}</p>
            <div class="matrix-table">
              <div class="matrix-row matrix-header">
                <div class="matrix-cell cell-param">{{ t('v3.parameters') }}</div>
                <div class="matrix-cell cell-type cell-double"><div class="type-dot dot-double" /><span>{{ t('families.doubleScenario') }}</span></div>
                <div class="matrix-cell cell-type cell-english"><div class="type-dot dot-english" /><span>{{ t('families.english') }}</span></div>
                <div class="matrix-cell cell-type cell-dutch"><div class="type-dot dot-dutch" /><span>{{ t('families.dutch') }}</span></div>
                <div class="matrix-cell cell-type cell-japanese"><div class="type-dot dot-japanese" /><span>{{ t('families.japanese') }}</span></div>
                <div class="matrix-cell cell-type cell-sealed"><div class="type-dot dot-sealed" /><span>{{ t('families.sealedBid') }}</span></div>
                <div class="matrix-cell cell-type cell-nego"><div class="type-dot dot-nego" /><span>{{ t('families.traditional') }}</span></div>
              </div>

              <div class="matrix-row">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-account-group-outline</v-icon><span>{{ t('v3.suppliersNeeded') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-chip val-high">5+</span></div>
                <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
                <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
                <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
                <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
                <div class="matrix-cell cell-val"><span class="val-chip val-low">1+</span></div>
              </div>

              <div class="matrix-row row-alt">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-cog-outline</v-icon><span>{{ t('v3.specComplexity') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.simple') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.any') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.simple') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.any') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.complexOk') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.complexOk') }}</span></div>
              </div>

              <div class="matrix-row">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-timer-outline</v-icon><span>{{ t('v3.realTimeBidding') }}</span></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="error">mdi-close</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="error">mdi-close</v-icon></div>
              </div>

              <div class="matrix-row row-alt">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-view-grid-outline</v-icon><span>{{ t('v3.multipleLots') }}</span></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.optional') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.optional') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.optional') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.optional') }}</span></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="grey-lighten-1">mdi-minus</v-icon></div>
              </div>

              <div class="matrix-row">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-gavel</v-icon><span>{{ t('v3.bindingAward') }}</span></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="error">mdi-close</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="grey-lighten-1">mdi-minus</v-icon></div>
              </div>

              <div class="matrix-row row-alt">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-tag-outline</v-icon><span>{{ t('v3.startingPriceKnown') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.preferred') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.optional') }}</span></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="error">mdi-close</v-icon></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.optional') }}</span></div>
                <div class="matrix-cell cell-val"><v-icon size="18" color="grey-lighten-1">mdi-minus</v-icon></div>
              </div>

              <div class="matrix-row">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-lightning-bolt-outline</v-icon><span>{{ t('v3.speed') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v1.medium') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v1.medium') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.fast') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.slow') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.fast') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.variable') }}</span></div>
              </div>

              <div class="matrix-row row-alt">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-eye-outline</v-icon><span>{{ t('v3.priceTransparency') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.full') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.full') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.partial') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.full') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.none') }}</span></div>
                <div class="matrix-cell cell-val"><span class="val-text">{{ t('v3.none') }}</span></div>
              </div>

              <div class="matrix-row matrix-footer">
                <div class="matrix-cell cell-param"><v-icon size="16" class="mr-2" color="grey-darken-1">mdi-trending-down</v-icon><strong>{{ t('v3.estSavings') }}</strong></div>
                <div class="matrix-cell cell-val">
                  <div class="savings-meter"><div class="meter-fill fill-double" /><div class="meter-fill fill-double" /><div class="meter-fill fill-double" /><div class="meter-fill fill-double" /><div class="meter-fill fill-double" /></div>
                  <span class="savings-pct pct-double">15-25%</span>
                </div>
                <div class="matrix-cell cell-val">
                  <div class="savings-meter"><div class="meter-fill fill-english" /><div class="meter-fill fill-english" /><div class="meter-fill fill-english" /><div class="meter-fill fill-english" /><div class="meter-empty" /></div>
                  <span class="savings-pct pct-english">10-18%</span>
                </div>
                <div class="matrix-cell cell-val">
                  <div class="savings-meter"><div class="meter-fill fill-dutch" /><div class="meter-fill fill-dutch" /><div class="meter-fill fill-dutch" /><div class="meter-empty" /><div class="meter-empty" /></div>
                  <span class="savings-pct pct-dutch">8-15%</span>
                </div>
                <div class="matrix-cell cell-val">
                  <div class="savings-meter"><div class="meter-fill fill-japanese" /><div class="meter-fill fill-japanese" /><div class="meter-fill fill-japanese" /><div class="meter-empty" /><div class="meter-empty" /></div>
                  <span class="savings-pct pct-japanese">8-14%</span>
                </div>
                <div class="matrix-cell cell-val">
                  <div class="savings-meter"><div class="meter-fill fill-sealed" /><div class="meter-fill fill-sealed" /><div class="meter-empty" /><div class="meter-empty" /><div class="meter-empty" /></div>
                  <span class="savings-pct pct-sealed">3-8%</span>
                </div>
                <div class="matrix-cell cell-val">
                  <div class="savings-meter"><div class="meter-fill fill-nego" /><div class="meter-empty" /><div class="meter-empty" /><div class="meter-empty" /><div class="meter-empty" /></div>
                  <span class="savings-pct pct-nego">1-5%</span>
                </div>
              </div>
            </div>
          </div>
        </v-window-item>

      </v-window>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { FC, gfc } from '~/utils/architect/constants'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('architect')
const show = defineModel<boolean>({ default: false })
const tab = ref('tree')

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

function ia(q: string, v: 'yes'|'no') { iAns[q] = v }
function iReset() { Object.keys(iAns).forEach(k => { iAns[k] = null }) }

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

const famOptionDetails: Record<string, { preBid: boolean; pref: boolean; awardModes: ('award' | 'rank' | 'norank')[] }> = {
  ds: { preBid: true,  pref: true,  awardModes: ['award'] },
  en: { preBid: true,  pref: true,  awardModes: ['award', 'rank'] },
  du: { preBid: true,  pref: true,  awardModes: ['award'] },
  jp: { preBid: true,  pref: true,  awardModes: ['award', 'rank', 'norank'] },
  sb: { preBid: false, pref: true,  awardModes: ['award', 'rank', 'norank'] },
  tr: { preBid: false, pref: false, awardModes: [] },
}

const cards = computed(() => [
  { key: 'ds', family: 'Double Scenario', icon: 'mdi-layers-outline',   name: t('families.doubleScenario'), short: t('v5.dsShort'), desc: t('v5.dsDesc'), use: t('v5.dsUse'), options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award'],               savingsLabel: '12–18%', intensityLevel: 4 },
  { key: 'en', family: 'English',         icon: 'mdi-trending-down',     name: t('families.english'),        short: t('v5.enShort'), desc: t('v5.enDesc'), use: t('v5.enUse'), options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award', 'Rank'],        savingsLabel: '10–15%', intensityLevel: 3 },
  { key: 'du', family: 'Dutch',           icon: 'mdi-timer-sand',        name: t('families.dutch'),          short: t('v5.duShort'), desc: t('v5.duDesc'), use: t('v5.duUse'), options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award'],               savingsLabel: '8–12%',  intensityLevel: 2 },
  { key: 'jp', family: 'Japanese',        icon: 'mdi-trending-up',       name: t('families.japanese'),       short: t('v5.jpShort'), desc: t('v5.jpDesc'), use: t('v5.jpUse'), options: ['Pre-bid', 'No Pre-bid', 'Award', 'Rank', 'No Rank'],          savingsLabel: '8–12%',  intensityLevel: 2 },
  { key: 'sb', family: 'Sealed Bid',      icon: 'mdi-lock-outline',      name: t('families.sealedBid'),      short: t('v5.sbShort'), desc: t('v5.sbDesc'), use: t('v5.sbUse'), options: ['Preference', 'Award', 'Rank', 'No Rank'],                      savingsLabel: '5–8%',   intensityLevel: 1 },
  { key: 'tr', family: 'Traditional',     icon: 'mdi-handshake-outline', name: t('families.traditional'),    short: t('v5.trShort'), desc: t('v5.trDesc'), use: t('v5.trUse'), options: [],                                                              savingsLabel: '2–5%',   intensityLevel: 1 },
])

// ── Tab 2: Overview cards (V1 style) ──
const overviewCards = computed(() => [
  {
    key: 'ds', family: 'Double Scenario', color: FC['Double Scenario'],
    name: t('families.doubleScenario'), savings: '~15-25%', compLevel: 5, compLabel: t('v1.veryHigh'),
    pills: [
      { label: t('v1.preBid'), variant: '' },
      { label: t('v1.preference'), variant: '' },
      { label: t('v1.competition') + ' +++++', variant: 'pill--y' },
      { label: t('v1.awardPostAward'), variant: '' },
    ],
  },
  {
    key: 'en', family: 'English', color: FC['English'],
    name: t('families.english'), savings: '~10-18%', compLevel: 4, compLabel: t('v1.high'),
    pills: [
      { label: t('v1.preBid'), variant: '' },
      { label: t('v1.preference'), variant: '' },
      { label: t('v1.ceiling'), variant: '' },
      { label: t('v1.mostOptions'), variant: 'pill--y' },
      { label: t('v1.awardPostAward'), variant: '' },
    ],
  },
  {
    key: 'du', family: 'Dutch', color: FC['Dutch'],
    name: t('families.dutch'), savings: '~8-15%', compLevel: 3, compLabel: t('v1.high'),
    pills: [
      { label: t('v1.preBid'), variant: '' },
      { label: t('v1.preference'), variant: '' },
      { label: t('v1.competition') + ' +++', variant: 'pill--y' },
      { label: t('v1.awardBinding'), variant: 'pill--g' },
    ],
  },
  {
    key: 'jp', family: 'Japanese', color: FC['Japanese'],
    name: t('families.japanese'), savings: '~8-15%', compLevel: 3, compLabel: t('v1.high'),
    pills: [
      { label: t('v1.preBid'), variant: '' },
      { label: t('v1.preference'), variant: '' },
      { label: t('v1.competition') + ' +++', variant: 'pill--y' },
      { label: t('v1.rankingOnly'), variant: 'pill--w' },
    ],
  },
  {
    key: 'sb', family: 'Sealed Bid', color: FC['Sealed Bid'],
    name: t('families.sealedBid'), savings: '~3-8%', compLevel: 2, compLabel: t('v1.medium'),
    pills: [
      { label: t('v1.preference'), variant: '' },
      { label: t('v1.competition') + ' ++', variant: 'pill--y' },
      { label: t('v1.awardPostAward'), variant: '' },
    ],
  },
  {
    key: 'tr', family: 'Traditional', color: FC['Traditional'],
    name: t('families.traditional'), savings: '~0-3%', compLevel: 1, compLabel: t('v1.low'),
    pills: [
      { label: t('v1.preference'), variant: '' },
      { label: t('v1.competition') + ' +', variant: 'pill--y' },
      { label: t('v1.postAward'), variant: '' },
    ],
  },
])
</script>

<style scoped>
/* ════ DIALOG ════ */
.v5-card { overflow: hidden; display: flex; flex-direction: column; max-height: 92vh; }

/* ════ HEADER ════ */
.v5-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; border-bottom: 1px solid #E9EAEC; flex-shrink: 0;
  gap: 16px;
}
.v5-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  background: linear-gradient(135deg, #6366F1, #4F46E5);
  display: flex; align-items: center; justify-content: center;
}
.v5-title { font-size: 15px; font-weight: 700; color: #1D1D1B; }
.v5-sub   { font-size: 11px; color: #9CA3AF; margin-top: 1px; }

.v5-tabs { min-height: 36px; }
.v5-tabs :deep(.v-tab) { font-size: 12px; font-weight: 600; min-width: 0; padding: 0 14px; min-height: 36px; text-transform: none; letter-spacing: 0; }

/* ════ WINDOW ════ */
.v5-window { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.v5-window :deep(.v-window__container) { flex: 1; overflow: hidden; }
.v5-window :deep(.v-window-item) { height: 100%; overflow-y: auto; }

/* ════ COMMON TAB BODY ════ */
.tab-body { padding: 24px 28px 32px; }
.tab-body--canvas { padding: 20px 28px; }

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

.badge { font-size: 10px; font-weight: 700; padding: 3px 14px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.06em; display: inline-block; }
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
.fam-desc { font-size: 10px; color: #374151; line-height: 1.45; margin: 0; }

/* Flow */
.fam-flow { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; }
.fam-step { display: inline-flex; align-items: center; gap: 2px; font-size: 9px; font-weight: 500; color: #4B5563; background: #F9FAFB; border: 1px solid #E9EAEC; border-radius: 3px; padding: 2px 4px; white-space: nowrap; }
.fam-sep { font-size: 10px; font-weight: 700; line-height: 1; }

/* Chips */
.fam-chips { display: flex; flex-wrap: wrap; gap: 3px; }
.fam-chip { display: inline-flex; align-items: center; gap: 2px; font-size: 9px; font-weight: 500; color: #6B7280; background: #F3F4F6; border: 1px solid #E5E7EB; border-radius: 20px; padding: 2px 6px; white-space: nowrap; }

/* ════════════════════════════════════
   TAB 2 — OVERVIEW CARDS (V1 style)
   ════════════════════════════════════ */
.ov-groups { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.ov-group-label { text-align: center; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #9CA3AF; padding: 4px 0; border-bottom: 1.5px solid #F3F4F6; }
.ov-cards { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; margin-bottom: 16px; }
.ov-card { border-radius: 10px; overflow: hidden; background: #FFF; border: 1px solid #E5E7EB; box-shadow: 0 1px 4px rgba(0,0,0,0.05); transition: box-shadow 0.2s, transform 0.2s; }
.ov-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.08); transform: translateY(-2px); }
.ov-card-top { height: 72px; padding: 6px 10px 0; overflow: hidden; border-bottom: 2px solid; }
.ov-card-top :deep(.chart-container) { height: 64px; border: none; background: transparent; padding: 0; }
.ov-card-body { padding: 10px 12px 12px; }
.ov-name { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; margin-bottom: 2px; }
.ov-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.ov-savings { font-size: 11px; font-weight: 600; color: #059669; margin-bottom: 6px; padding-left: 14px; }
.ov-comp { display: flex; align-items: center; gap: 2px; margin-bottom: 8px; }
.ov-pip { width: 14px; height: 4px; border-radius: 2px; background: #E5E7EB; }
.ov-comp-label { font-size: 10px; font-weight: 500; color: #9CA3AF; margin-left: 4px; }
.ov-pills { display: flex; flex-direction: column; gap: 3px; }
.ov-pill { display: block; background: #FFF; border: 1.5px solid #E9EAEC; border-radius: 6px; padding: 4px 8px; font-size: 10.5px; font-weight: 500; color: #374151; text-align: center; white-space: nowrap; }
.pill--y { background: #FFFBEB; border-color: #FDE68A; font-weight: 600; color: #1D1D1B; }
.pill--w { background: #FEF2F2; border-color: #FECACA; font-weight: 600; color: #991B1B; }
.pill--g { background: #ECFDF5; border-color: #A7F3D0; font-weight: 600; color: #065F46; }
.ov-note { text-align: center; font-size: 11.5px; color: #6B7280; }
.ov-note strong { color: #374151; }
.ov-sep { margin: 0 10px; color: #D1D5DB; }

/* ════════════════════════════════════
   TAB 3 — CASCADE (V2 style)
   ════════════════════════════════════ */
.cascade-canvas { background: #FAFAFA; }
.cascade-tier { display: grid; grid-template-columns: 36px 1fr 1fr 140px; gap: 16px; align-items: center; padding: 18px 20px; border-radius: 10px; border: 1.5px solid; background: #FFF; position: relative; }
.tier-rank { width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: #FFF; flex-shrink: 0; }
.tier-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 1px 8px; border-radius: 4px; display: inline-block; margin-bottom: 4px; }
.badge-double { background: #F59E0B; color: #FFF; }
.badge-english { background: #3B82F6; color: #FFF; }
.tier-name { font-size: 16px; font-weight: 700; color: #1D1D1B; line-height: 1.3; }
.tier-desc { font-size: 12px; color: #6B7280; margin-top: 2px; }
.tier-conditions { display: flex; flex-direction: column; gap: 5px; }
.condition { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #374151; }
.tier-savings { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }
.savings-bar { width: 100%; height: 6px; background: #F3F4F6; border-radius: 3px; overflow: hidden; }
.savings-fill { height: 100%; border-radius: 3px; }
.savings-label { font-size: 12px; font-weight: 600; color: #6B7280; }

.tier-double { border-color: #3B82F6; } .tier-double .tier-rank { background: linear-gradient(135deg, #3B82F6, #10B981); } .tier-double .tier-name { color: #1E40AF; } .fill-double { background: linear-gradient(90deg, #3B82F6, #10B981); }
.tier-english { border-color: #60A5FA; } .tier-english .tier-rank { background: #3B82F6; } .tier-english .tier-name { color: #1E40AF; } .fill-english { background: #60A5FA; }
.tier-dutch { border-color: #FB923C; } .tier-dutch .tier-rank { background: #F97316; } .tier-dutch .tier-name { color: #9A3412; } .fill-dutch { background: #FB923C; }
.tier-japanese { border-color: #A78BFA; } .tier-japanese .tier-rank { background: #8B5CF6; } .tier-japanese .tier-name { color: #5B21B6; } .fill-japanese { background: #A78BFA; }
.tier-sealed { border-color: #2DD4BF; } .tier-sealed .tier-rank { background: #14B8A6; } .tier-sealed .tier-name { color: #115E59; } .fill-sealed { background: #2DD4BF; }
.tier-nego { border-color: #D1D5DB; } .tier-nego .tier-rank { background: #9CA3AF; } .tier-nego .tier-name { color: #374151; } .fill-nego { background: #D1D5DB; }

.cascade-arrow { display: flex; align-items: center; gap: 10px; padding: 6px 0; justify-content: center; }
.arrow-line { flex: 1; height: 1px; background: #E5E7EB; max-width: 80px; }
.arrow-tag { font-size: 11px; color: #9CA3AF; font-weight: 500; font-style: italic; white-space: nowrap; }
.cascade-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cascade-pair .cascade-tier { grid-template-columns: 30px 1fr; grid-template-rows: auto auto auto; gap: 8px 12px; }
.cascade-pair .tier-rank { grid-row: 1/3; align-self: start; margin-top: 2px; }
.cascade-pair .tier-left { grid-column: 2; }
.cascade-pair .tier-conditions { grid-column: 2; }
.cascade-pair .tier-savings { grid-column: 1/-1; flex-direction: row; align-items: center; gap: 10px; }
.cascade-pair .savings-bar { flex: 1; }

/* ════════════════════════════════════
   TAB 4 — MATRIX (V3 style)
   ════════════════════════════════════ */
.matrix-canvas { background: #FAFAFA; overflow-x: auto; }
.matrix-table { min-width: 700px; }
.matrix-row { display: grid; grid-template-columns: 190px repeat(6, 1fr); border-bottom: 1px solid #F3F4F6; }
.row-alt { background: #FCFCFC; }
.matrix-header { background: #FFF; border-bottom: 2px solid #E5E7EB; position: sticky; top: 0; z-index: 1; }
.matrix-footer { background: #FFF; border-top: 2px solid #E5E7EB; border-bottom: none; }
.matrix-cell { padding: 12px 10px; display: flex; align-items: center; font-size: 13px; color: #374151; min-height: 44px; }
.cell-param { font-weight: 500; color: #1D1D1B; padding-left: 14px; }
.cell-val { justify-content: center; flex-direction: column; gap: 4px; }
.cell-type { flex-direction: column; gap: 4px; font-size: 11px; font-weight: 600; text-align: center; padding: 10px 4px; }
.type-dot { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.dot-double { background: linear-gradient(135deg, #3B82F6, #10B981); }
.dot-english { background: #60A5FA; } .dot-dutch { background: #FB923C; } .dot-japanese { background: #A78BFA; } .dot-sealed { background: #2DD4BF; } .dot-nego { background: #D1D5DB; }
.cell-double { color: #1E40AF; } .cell-english { color: #1E40AF; } .cell-dutch { color: #9A3412; } .cell-japanese { color: #5B21B6; } .cell-sealed { color: #115E59; } .cell-nego { color: #374151; }
.val-chip { display: inline-flex; align-items: center; justify-content: center; padding: 2px 10px; border-radius: 10px; font-size: 11px; font-weight: 600; }
.val-high { background: #DBEAFE; color: #1E40AF; } .val-mid { background: #F3F4F6; color: #374151; } .val-low { background: #FEE2E2; color: #991B1B; }
.val-text { font-size: 12px; color: #6B7280; }
.savings-meter { display: flex; gap: 3px; }
.meter-fill, .meter-empty { width: 12px; height: 12px; border-radius: 2px; }
.meter-empty { background: #F3F4F6; }
.fill-double { background: linear-gradient(135deg, #3B82F6, #10B981); } .fill-english { background: #60A5FA; } .fill-dutch { background: #FB923C; } .fill-japanese { background: #A78BFA; } .fill-sealed { background: #2DD4BF; } .fill-nego { background: #D1D5DB; }
.savings-pct { font-size: 11px; font-weight: 700; }
.pct-double { color: #1E40AF; } .pct-english { color: #2563EB; } .pct-dutch { color: #EA580C; } .pct-japanese { color: #7C3AED; } .pct-sealed { color: #0D9488; } .pct-nego { color: #6B7280; }

/* ════════════════════════════════════
   INTERACTIVE TREE — control bar
   ════════════════════════════════════ */
.itree-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 12px; margin-bottom: 12px;
  background: #F9FAFB; border: 1px solid #E9EAEC; border-radius: 8px;
}
.itree-status {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 500; color: #6B7280;
}
.itree-reset {
  display: inline-flex; align-items: center; gap-4px;
  font-size: 11px; font-weight: 600; color: #4F46E5;
  background: transparent; border: 1px solid #C7D2FE; border-radius: 6px;
  padding: 3px 10px; cursor: pointer; transition: background 0.15s;
  gap: 4px;
}
.itree-reset:hover { background: #EEF2FF; }

/* ════════════════════════════════════
   INTERACTIVE TREE — question bubble states
   ════════════════════════════════════ */
.q-bubble { transition: all 0.2s ease; }

/* Active — pulsing indigo ring */
.iq--on {
  background: #EEF2FF !important; border-color: #6366F1 !important;
  box-shadow: 0 0 0 3px rgba(99,102,241,0.2);
}
.iq--on .q-icon { opacity: 1 !important; color: #4F46E5 !important; }
.iq--on .q-text { color: #1D1D1B !important; }

/* Done — answered, muted green */
.iq--done {
  background: #F0FDF4 !important; border-color: #86EFAC !important;
}
.iq--done .q-icon { opacity: 0.5 !important; color: #16A34A !important; }
.iq--done .q-text { color: #6B7280 !important; }

/* Waiting — reachable but not yet active */
.iq--wait {
  background: #FAFAFA !important; border-color: #D1D5DB !important;
  opacity: 0.7;
}

/* Off — unreachable branch */
.iq--off {
  opacity: 0.3;
  pointer-events: none;
}

/* ════════════════════════════════════
   INTERACTIVE TREE — badge button states
   ════════════════════════════════════ */
.ibadge {
  background: transparent; border: none; padding: 0; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  transition: transform 0.15s;
}
.ibadge:hover { transform: scale(1.05); }

/* Active question — badge glows */
.ib--on .badge { box-shadow: 0 0 0 2px rgba(99,102,241,0.4); cursor: pointer; }
.ib--on .badge--yes { background: #A7F3D0; color: #065F46; }
.ib--on .badge--no  { background: #FECACA; color: #991B1B; }

/* Chosen answer */
.ib--chosen .badge { opacity: 1; font-weight: 800; }
.ib--chosen .badge--yes { background: #059669; color: #FFF; }
.ib--chosen .badge--no  { background: #DC2626; color: #FFF; }

/* Unchosen (other answer was picked) */
.ib--fade .badge { opacity: 0.25; }

/* Not yet reachable */
.ib--off .badge { opacity: 0.35; cursor: default; }
.ib--off { pointer-events: none; }

/* ════════════════════════════════════
   INTERACTIVE TREE — family card states
   ════════════════════════════════════ */
.fam-card { transition: filter 0.3s ease, opacity 0.3s ease, transform 0.25s ease, box-shadow 0.25s ease; }

/* No answer yet — all cards neutral (full color) */
.ic--neutral { filter: none; opacity: 1; }

/* Eliminated — strong grey out */
.ic--out {
  filter: grayscale(100%) opacity(0.35);
  transform: scale(0.97);
}

/* Still in the running — slight grey */
.ic--maybe {
  filter: grayscale(30%);
  opacity: 0.75;
}

/* Winner — pop it */
.ic--win {
  filter: none;
  opacity: 1;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
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
