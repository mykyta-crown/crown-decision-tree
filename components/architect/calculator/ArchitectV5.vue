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
            <v-tab value="tree" prepend-icon="mdi-sitemap-outline">{{ t('v5.tabTree') }}</v-tab>
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
        <v-window-item value="tree">
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
                  <line x1="83.33" y1="142" x2="83.33" y2="166" />
                  <line x1="16.67" y1="166" x2="50" y2="166" />
                  <line x1="16.67" y1="166" x2="16.67" y2="180" />
                  <line x1="50" y1="166" x2="50" y2="180" />
                  <line x1="75" y1="166" x2="91.67" y2="166" />
                  <line x1="75" y1="166" x2="75" y2="400" />
                  <line x1="91.67" y1="166" x2="91.67" y2="400" />
                  <line x1="16.67" y1="180" x2="16.67" y2="184" />
                  <line x1="16.67" y1="214" x2="16.67" y2="224" />
                  <line x1="50" y1="180" x2="50" y2="184" />
                  <line x1="50" y1="202" x2="50" y2="224" />
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
              </svg>

              <div class="tree-content">
                <div class="tree-el" style="left: 50%; top: 2px">
                  <div class="q-bubble q-bubble--root">
                    <v-icon size="18" class="q-icon">mdi-cash-multiple</v-icon>
                    <span class="q-text">{{ t('v5.q1') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 33.33%; top: 80px">
                  <div class="badge badge--yes">{{ t('v5.yes') }}</div>
                </div>
                <div class="tree-el" style="left: 83.33%; top: 80px">
                  <div class="badge badge--no">{{ t('v5.no') }}</div>
                </div>
                <div class="tree-el" style="left: 33.33%; top: 112px">
                  <div class="q-bubble">
                    <v-icon size="18" class="q-icon">mdi-account-group-outline</v-icon>
                    <span class="q-text">{{ t('v5.q2') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 83.33%; top: 130px">
                  <div class="hint-label">{{ t('v5.simpleApproach') }}</div>
                </div>
                <div class="tree-el" style="left: 16.67%; top: 184px">
                  <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                </div>
                <div class="tree-el" style="left: 16.67%; top: 202px">
                  <div class="hint-label">{{ t('v5.bestPotential') }}</div>
                </div>
                <div class="tree-el" style="left: 50%; top: 184px">
                  <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                </div>
                <div class="tree-el" style="left: 16.67%; top: 224px">
                  <div class="q-bubble q-bubble--small">
                    <v-icon size="16" class="q-icon">mdi-gavel</v-icon>
                    <span class="q-text">{{ t('v5.q3a') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 50%; top: 224px">
                  <div class="q-bubble q-bubble--small">
                    <v-icon size="16" class="q-icon">mdi-format-list-numbered</v-icon>
                    <span class="q-text">{{ t('v5.q3') }}</span>
                  </div>
                </div>
                <div class="tree-el" style="left: 8.33%; top: 290px">
                  <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                </div>
                <div class="tree-el" style="left: 25%; top: 290px">
                  <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                </div>
                <div class="tree-el" style="left: 41.67%; top: 290px">
                  <div class="badge badge--yes badge--sm">{{ t('v5.yes') }}</div>
                </div>
                <div class="tree-el" style="left: 58.33%; top: 290px">
                  <div class="badge badge--no badge--sm">{{ t('v5.no') }}</div>
                </div>
              </div>
            </div>

            <!-- Cards grid -->
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
                  <v-icon size="15" class="card-icon" :style="cardColor(card.family)">{{ card.icon }}</v-icon>
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
        </v-window-item>

        <!-- ══════════════════════════════════════════
             TAB 2 — CARDS OVERVIEW (from V1)
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
import { ref, computed } from 'vue'
import { FC, gfc } from '~/utils/architect/constants'
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('architect')
const show = defineModel<boolean>({ default: false })
const tab = ref('tree')
const expanded = ref<string | null>(null)

function toggle(key: string) {
  expanded.value = expanded.value === key ? null : key
}

// ── Tab 1: Tree card helpers ──
function cardBorder(f: string) { const c = gfc(f); return { borderColor: c.border, background: c.bg } }
function barBg(f: string) { return { background: gfc(f).border } }
function cardColor(f: string) { return { color: gfc(f).text } }
function pillBg(f: string) { const c = gfc(f); return { background: c.border + '20', color: c.text } }

const cards = computed(() => [
  { key: 'ds', family: 'Double Scenario', icon: 'mdi-layers-outline',     name: t('families.doubleScenario'), short: t('v5.dsShort'), desc: t('v5.dsDesc'), use: t('v5.dsUse'), options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award'] },
  { key: 'en', family: 'English',         icon: 'mdi-trending-down',       name: t('families.english'),        short: t('v5.enShort'), desc: t('v5.enDesc'), use: t('v5.enUse'), options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award', 'Rank'] },
  { key: 'du', family: 'Dutch',           icon: 'mdi-timer-sand',          name: t('families.dutch'),          short: t('v5.duShort'), desc: t('v5.duDesc'), use: t('v5.duUse'), options: ['Pre-bid', 'No Pre-bid', 'Preference', 'Award'] },
  { key: 'jp', family: 'Japanese',        icon: 'mdi-trending-up',         name: t('families.japanese'),       short: t('v5.jpShort'), desc: t('v5.jpDesc'), use: t('v5.jpUse'), options: ['Pre-bid', 'No Pre-bid', 'Award', 'Rank', 'No Rank'] },
  { key: 'sb', family: 'Sealed Bid',      icon: 'mdi-lock-outline',        name: t('families.sealedBid'),      short: t('v5.sbShort'), desc: t('v5.sbDesc'), use: t('v5.sbUse'), options: ['Preference', 'Award', 'Rank', 'No Rank'] },
  { key: 'tr', family: 'Traditional',     icon: 'mdi-handshake-outline',   name: t('families.traditional'),   short: t('v5.trShort'), desc: t('v5.trDesc'), use: t('v5.trUse'), options: [] },
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
.q-bubble--root { background: #F3F4F6; border-color: #D1D5DB; padding: 12px 24px; }
.q-bubble--small { padding: 8px 14px; }
.q-icon { flex-shrink: 0; opacity: 0.75; }
.q-text { font-size: 13px; font-weight: 600; color: #374151; line-height: 1.4; }

.badge { font-size: 10px; font-weight: 700; padding: 3px 14px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.06em; display: inline-block; }
.badge--yes { background: #D1FAE5; color: #065F46; }
.badge--no  { background: #FEE2E2; color: #991B1B; }
.badge--sm  { padding: 2px 10px; font-size: 9px; }
.hint-label { font-size: 10px; font-weight: 700; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.07em; }

.cards-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 10px; align-items: stretch; }
.type-card { border-radius: 10px; border: 1.5px solid; padding: 12px 12px 12px 16px; position: relative; overflow: hidden; cursor: pointer; transition: box-shadow 0.2s, transform 0.15s; display: flex; flex-direction: column; }
.type-card:hover { box-shadow: 0 3px 14px rgba(0,0,0,0.07); transform: translateY(-1px); }
.card-bar { position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
.card-head { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
.card-icon { flex-shrink: 0; }
.card-title { font-size: 12px; font-weight: 700; flex: 1; }
.card-chevron { font-size: 12px; color: #9CA3AF; transition: transform 0.25s ease; flex-shrink: 0; }
.card-chevron.open { transform: rotate(180deg); }
.card-sub { font-size: 10px; color: #6B7280; line-height: 1.4; margin-bottom: 8px; flex: 1; }
.pills--always { display: flex; flex-wrap: wrap; gap: 4px; }
.pill { font-size: 9px; font-weight: 600; padding: 2px 7px; border-radius: 5px; white-space: nowrap; }
.card-detail { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s cubic-bezier(0.4,0,0.2,1); }
.card-detail.open { grid-template-rows: 1fr; }
.card-detail-inner { overflow: hidden; min-height: 0; }
.card-desc { font-size: 10px; color: #374151; line-height: 1.5; margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(0,0,0,0.06); }
.card-use { font-size: 10px; color: #6B7280; font-style: italic; margin-top: 6px; line-height: 1.4; }

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

/* ════ RESPONSIVE ════ */
@media (max-width: 1000px) {
  .cards-grid, .ov-cards { grid-template-columns: repeat(3, 1fr); }
  .tree-section { display: none; }
  .tab-body { padding: 16px 14px 24px; }
}
@media (max-width: 640px) {
  .cards-grid, .ov-cards { grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .cascade-pair { grid-template-columns: 1fr; }
}
</style>
