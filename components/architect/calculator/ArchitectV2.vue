<template>
  <v-dialog v-model="show" max-width="860" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pa-5">
        <v-icon class="mr-2" size="22">mdi-waterfall</v-icon>
        <span class="text-h6 font-weight-bold">{{ t('v2.title') }}</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />

      <v-card-text class="cascade-canvas pa-6">
        <div class="cascade-intro mb-5">
          <p class="text-body-2 text-grey-darken-1">
            {{ t('v2.intro') }}
          </p>
        </div>

        <!-- Level 1: Double Scenario -->
        <div class="cascade-tier tier-double">
          <div class="tier-rank">1</div>
          <div class="tier-left">
            <div class="tier-badge badge-double">{{ t('v2.bestSavings') }}</div>
            <div class="tier-name">{{ t('families.doubleScenario') }}</div>
            <div class="tier-desc">{{ t('v2.dsDesc') }}</div>
          </div>
          <div class="tier-conditions">
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.cond5Suppliers') }}</span>
            </div>
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.condSimpleSpecs') }}</span>
            </div>
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.condMultipleLots') }}</span>
            </div>
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.condRealTimeBidding') }}</span>
            </div>
          </div>
          <div class="tier-savings">
            <div class="savings-bar">
              <div class="savings-fill fill-double" style="width: 95%" />
            </div>
            <span class="savings-label">~15-25%</span>
          </div>
        </div>

        <div class="cascade-arrow">
          <div class="arrow-line" />
          <div class="arrow-tag">{{ t('v2.conditionsNotMet') }}</div>
          <div class="arrow-line" />
        </div>

        <!-- Level 2: English Reverse -->
        <div class="cascade-tier tier-english">
          <div class="tier-rank">2</div>
          <div class="tier-left">
            <div class="tier-badge badge-english">{{ t('v2.mostFlexible') }}</div>
            <div class="tier-name">{{ t('families.english') }}</div>
            <div class="tier-desc">{{ t('v2.enDesc') }}</div>
          </div>
          <div class="tier-conditions">
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.cond3Suppliers') }}</span>
            </div>
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.condRealTimeBidding') }}</span>
            </div>
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.condAllOptions') }}</span>
            </div>
          </div>
          <div class="tier-savings">
            <div class="savings-bar">
              <div class="savings-fill fill-english" style="width: 75%" />
            </div>
            <span class="savings-label">~10-18%</span>
          </div>
        </div>

        <div class="cascade-arrow">
          <div class="arrow-line" />
          <div class="arrow-tag">{{ t('v2.needDifferent') }}</div>
          <div class="arrow-line" />
        </div>

        <!-- Level 3a & 3b: Dutch & Japanese (side by side) -->
        <div class="cascade-pair">
          <div class="cascade-tier tier-dutch">
            <div class="tier-rank">3</div>
            <div class="tier-left">
              <div class="tier-name">{{ t('families.dutch') }}</div>
              <div class="tier-desc">{{ t('v2.duDesc') }}</div>
            </div>
            <div class="tier-conditions">
              <div class="condition">
                <v-icon size="16" color="success">mdi-check-circle</v-icon>
                <span>{{ t('v2.condBindingAward') }}</span>
              </div>
              <div class="condition">
                <v-icon size="16" color="success">mdi-check-circle</v-icon>
                <span>{{ t('v2.condKnownPrice') }}</span>
              </div>
              <div class="condition">
                <v-icon size="16" color="success">mdi-check-circle</v-icon>
                <span>{{ t('v2.condSuppliersAvailable') }}</span>
              </div>
            </div>
            <div class="tier-savings">
              <div class="savings-bar">
                <div class="savings-fill fill-dutch" style="width: 60%" />
              </div>
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
              <div class="condition">
                <v-icon size="16" color="warning">mdi-alert-circle</v-icon>
                <span>{{ t('v2.condNoBinding') }}</span>
              </div>
              <div class="condition">
                <v-icon size="16" color="success">mdi-check-circle</v-icon>
                <span>{{ t('v2.condRanking') }}</span>
              </div>
              <div class="condition">
                <v-icon size="16" color="success">mdi-check-circle</v-icon>
                <span>{{ t('v2.condSuppliersAvailable') }}</span>
              </div>
            </div>
            <div class="tier-savings">
              <div class="savings-bar">
                <div class="savings-fill fill-japanese" style="width: 58%" />
              </div>
              <span class="savings-label">~8-14%</span>
            </div>
          </div>
        </div>

        <div class="cascade-arrow">
          <div class="arrow-line" />
          <div class="arrow-tag">{{ t('v2.realTimeNotPossible') }}</div>
          <div class="arrow-line" />
        </div>

        <!-- Level 4: Sealed Bid -->
        <div class="cascade-tier tier-sealed">
          <div class="tier-rank">4</div>
          <div class="tier-left">
            <div class="tier-name">{{ t('families.sealedBid') }}</div>
            <div class="tier-desc">{{ t('v2.sbDesc') }}</div>
          </div>
          <div class="tier-conditions">
            <div class="condition">
              <v-icon size="16" color="success">mdi-check-circle</v-icon>
              <span>{{ t('v2.condSuppliersAvailable') }}</span>
            </div>
            <div class="condition">
              <v-icon size="16" color="warning">mdi-alert-circle</v-icon>
              <span>{{ t('v2.condRefuseLive') }}</span>
            </div>
          </div>
          <div class="tier-savings">
            <div class="savings-bar">
              <div class="savings-fill fill-sealed" style="width: 35%" />
            </div>
            <span class="savings-label">~3-8%</span>
          </div>
        </div>

        <div class="cascade-arrow">
          <div class="arrow-line" />
          <div class="arrow-tag">{{ t('v2.notEnoughSuppliers') }}</div>
          <div class="arrow-line" />
        </div>

        <!-- Level 5: Traditional Negotiation -->
        <div class="cascade-tier tier-nego">
          <div class="tier-rank">5</div>
          <div class="tier-left">
            <div class="tier-name">{{ t('families.traditional') }}</div>
            <div class="tier-desc">{{ t('v2.trDesc') }}</div>
          </div>
          <div class="tier-conditions">
            <div class="condition">
              <v-icon size="16" color="grey-lighten-1">mdi-minus-circle</v-icon>
              <span class="text-grey">{{ t('v2.condFewer3') }}</span>
            </div>
            <div class="condition">
              <v-icon size="16" color="grey-lighten-1">mdi-minus-circle</v-icon>
              <span class="text-grey">{{ t('v2.condNoCompetition') }}</span>
            </div>
          </div>
          <div class="tier-savings">
            <div class="savings-bar">
              <div class="savings-fill fill-nego" style="width: 15%" />
            </div>
            <span class="savings-label">~1-5%</span>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import useTranslations from '~/composables/useTranslations'

const { t } = useTranslations('decisiontree')
const show = defineModel<boolean>({ default: false })
</script>

<style scoped>
.cascade-canvas {
  background: #FAFAFA;
}

.cascade-intro p {
  line-height: 1.5;
}

/* ── Tier card ── */
.cascade-tier {
  display: grid;
  grid-template-columns: 36px 1fr 1fr 140px;
  gap: 16px;
  align-items: center;
  padding: 18px 20px;
  border-radius: 10px;
  border: 1.5px solid;
  background: #FFF;
  position: relative;
}

.tier-rank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #FFF;
  flex-shrink: 0;
}

.tier-badge {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 1px 8px;
  border-radius: 4px;
  display: inline-block;
  margin-bottom: 4px;
}

.badge-double {
  background: #F59E0B;
  color: #FFF;
}

.badge-english {
  background: #3B82F6;
  color: #FFF;
}

.tier-name {
  font-size: 16px;
  font-weight: 700;
  color: #1D1D1B;
  line-height: 1.3;
}

.tier-desc {
  font-size: 12px;
  color: #6B7280;
  margin-top: 2px;
}

.tier-conditions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.condition {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #374151;
}

/* Savings bar */
.tier-savings {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.savings-bar {
  width: 100%;
  height: 6px;
  background: #F3F4F6;
  border-radius: 3px;
  overflow: hidden;
}

.savings-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.savings-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
}

/* ── Tier colors ── */
.tier-double { border-color: #3B82F6; }
.tier-double .tier-rank { background: linear-gradient(135deg, #3B82F6, #10B981); }
.tier-double .tier-name { color: #1E40AF; }
.fill-double { background: linear-gradient(90deg, #3B82F6, #10B981); }

.tier-english { border-color: #60A5FA; }
.tier-english .tier-rank { background: #3B82F6; }
.tier-english .tier-name { color: #1E40AF; }
.fill-english { background: #60A5FA; }

.tier-dutch { border-color: #FB923C; }
.tier-dutch .tier-rank { background: #F97316; }
.tier-dutch .tier-name { color: #9A3412; }
.fill-dutch { background: #FB923C; }

.tier-japanese { border-color: #A78BFA; }
.tier-japanese .tier-rank { background: #8B5CF6; }
.tier-japanese .tier-name { color: #5B21B6; }
.fill-japanese { background: #A78BFA; }

.tier-sealed { border-color: #2DD4BF; }
.tier-sealed .tier-rank { background: #14B8A6; }
.tier-sealed .tier-name { color: #115E59; }
.fill-sealed { background: #2DD4BF; }

.tier-nego { border-color: #D1D5DB; }
.tier-nego .tier-rank { background: #9CA3AF; }
.tier-nego .tier-name { color: #374151; }
.fill-nego { background: #D1D5DB; }

/* ── Cascade arrow ── */
.cascade-arrow {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  justify-content: center;
}

.arrow-line {
  flex: 1;
  height: 1px;
  background: #E5E7EB;
  max-width: 80px;
}

.arrow-tag {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
  font-style: italic;
  white-space: nowrap;
}

/* ── Side-by-side pair ── */
.cascade-pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.cascade-pair .cascade-tier {
  grid-template-columns: 30px 1fr;
  grid-template-rows: auto auto auto;
  gap: 8px 12px;
}

.cascade-pair .tier-rank {
  grid-row: 1 / 3;
  align-self: start;
  margin-top: 2px;
}

.cascade-pair .tier-left {
  grid-column: 2;
}

.cascade-pair .tier-conditions {
  grid-column: 2;
}

.cascade-pair .tier-savings {
  grid-column: 1 / -1;
  flex-direction: row;
  align-items: center;
  gap: 10px;
}

.cascade-pair .savings-bar {
  flex: 1;
}

/* ── Responsive ── */
@media (max-width: 700px) {
  .cascade-canvas {
    padding: 16px !important;
  }

  .cascade-tier {
    grid-template-columns: 30px 1fr;
    grid-template-rows: auto auto auto;
    gap: 8px 12px;
    padding: 14px 14px;
  }

  .tier-rank {
    grid-row: 1 / 3;
    align-self: start;
    margin-top: 2px;
  }

  .tier-left {
    grid-column: 2;
  }

  .tier-conditions {
    grid-column: 1 / -1;
  }

  .tier-savings {
    grid-column: 1 / -1;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  .tier-savings .savings-bar {
    flex: 1;
  }

  .cascade-pair {
    grid-template-columns: 1fr;
  }

  .arrow-tag {
    white-space: normal;
    text-align: center;
    font-size: 10px;
  }

  .arrow-line {
    max-width: 40px;
  }
}

@media (max-width: 400px) {
  .tier-name {
    font-size: 14px;
  }

  .tier-desc,
  .condition {
    font-size: 11px;
  }
}
</style>
