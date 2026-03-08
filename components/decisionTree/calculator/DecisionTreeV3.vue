<template>
  <v-dialog v-model="show" max-width="960" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pa-5">
        <v-icon class="mr-2" size="22">mdi-table-check</v-icon>
        <span class="text-h6 font-weight-bold">Auction Compatibility Matrix</span>
        <v-spacer />
        <v-btn icon variant="text" size="small" @click="show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>
      <v-divider />

      <v-card-text class="matrix-canvas pa-6">
        <p class="text-body-2 text-grey-darken-1 mb-5">
          Match your situation against each column. The auction type with the most matches is your best fit.
        </p>

        <div class="matrix-table">
          <!-- Header row -->
          <div class="matrix-row matrix-header">
            <div class="matrix-cell cell-param">Parameters</div>
            <div class="matrix-cell cell-type cell-double">
              <div class="type-dot dot-double" />
              <span>Double Scenario</span>
            </div>
            <div class="matrix-cell cell-type cell-english">
              <div class="type-dot dot-english" />
              <span>English Reverse</span>
            </div>
            <div class="matrix-cell cell-type cell-dutch">
              <div class="type-dot dot-dutch" />
              <span>Dutch</span>
            </div>
            <div class="matrix-cell cell-type cell-japanese">
              <div class="type-dot dot-japanese" />
              <span>Japanese</span>
            </div>
            <div class="matrix-cell cell-type cell-sealed">
              <div class="type-dot dot-sealed" />
              <span>Sealed Bid</span>
            </div>
            <div class="matrix-cell cell-type cell-nego">
              <div class="type-dot dot-nego" />
              <span>Negotiation</span>
            </div>
          </div>

          <!-- Row: Number of suppliers -->
          <div class="matrix-row">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-account-group-outline</v-icon>
              <span>Suppliers needed</span>
            </div>
            <div class="matrix-cell cell-val"><span class="val-chip val-high">5+</span></div>
            <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
            <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
            <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
            <div class="matrix-cell cell-val"><span class="val-chip val-mid">3+</span></div>
            <div class="matrix-cell cell-val"><span class="val-chip val-low">1+</span></div>
          </div>

          <!-- Row: Spec complexity -->
          <div class="matrix-row row-alt">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-cog-outline</v-icon>
              <span>Spec complexity</span>
            </div>
            <div class="matrix-cell cell-val"><span class="val-text">Simple</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Any</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Simple</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Any</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Complex OK</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Complex OK</span></div>
          </div>

          <!-- Row: Real-time bidding -->
          <div class="matrix-row">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-timer-outline</v-icon>
              <span>Real-time bidding</span>
            </div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="error">mdi-close</v-icon></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="error">mdi-close</v-icon></div>
          </div>

          <!-- Row: Multiple lots -->
          <div class="matrix-row row-alt">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-view-grid-outline</v-icon>
              <span>Multiple lots</span>
            </div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
            <div class="matrix-cell cell-val"><span class="val-text">Optional</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Optional</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Optional</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Optional</span></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="grey-lighten-1">mdi-minus</v-icon></div>
          </div>

          <!-- Row: Price knowledge -->
          <div class="matrix-row">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-tag-outline</v-icon>
              <span>Starting price known</span>
            </div>
            <div class="matrix-cell cell-val"><span class="val-text">Preferred</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Optional</span></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="success">mdi-check-bold</v-icon></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="error">mdi-close</v-icon></div>
            <div class="matrix-cell cell-val"><span class="val-text">Optional</span></div>
            <div class="matrix-cell cell-val"><v-icon size="18" color="grey-lighten-1">mdi-minus</v-icon></div>
          </div>

          <!-- Row: Speed -->
          <div class="matrix-row row-alt">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-lightning-bolt-outline</v-icon>
              <span>Speed</span>
            </div>
            <div class="matrix-cell cell-val"><span class="val-text">Medium</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Medium</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Fast</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Slow</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Fast</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Variable</span></div>
          </div>

          <!-- Row: Price transparency -->
          <div class="matrix-row">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-eye-outline</v-icon>
              <span>Price transparency</span>
            </div>
            <div class="matrix-cell cell-val"><span class="val-text">Full</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Full</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Partial</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">Full</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">None</span></div>
            <div class="matrix-cell cell-val"><span class="val-text">None</span></div>
          </div>

          <!-- Footer: Savings potential -->
          <div class="matrix-row matrix-footer">
            <div class="matrix-cell cell-param">
              <v-icon size="16" class="mr-2" color="grey-darken-1">mdi-trending-down</v-icon>
              <strong>Est. savings</strong>
            </div>
            <div class="matrix-cell cell-val">
              <div class="savings-meter">
                <div class="meter-fill fill-double" />
                <div class="meter-fill fill-double" />
                <div class="meter-fill fill-double" />
                <div class="meter-fill fill-double" />
                <div class="meter-fill fill-double" />
              </div>
              <span class="savings-pct pct-double">15-25%</span>
            </div>
            <div class="matrix-cell cell-val">
              <div class="savings-meter">
                <div class="meter-fill fill-english" />
                <div class="meter-fill fill-english" />
                <div class="meter-fill fill-english" />
                <div class="meter-fill fill-english" />
                <div class="meter-empty" />
              </div>
              <span class="savings-pct pct-english">10-18%</span>
            </div>
            <div class="matrix-cell cell-val">
              <div class="savings-meter">
                <div class="meter-fill fill-dutch" />
                <div class="meter-fill fill-dutch" />
                <div class="meter-fill fill-dutch" />
                <div class="meter-empty" />
                <div class="meter-empty" />
              </div>
              <span class="savings-pct pct-dutch">8-15%</span>
            </div>
            <div class="matrix-cell cell-val">
              <div class="savings-meter">
                <div class="meter-fill fill-japanese" />
                <div class="meter-fill fill-japanese" />
                <div class="meter-fill fill-japanese" />
                <div class="meter-empty" />
                <div class="meter-empty" />
              </div>
              <span class="savings-pct pct-japanese">8-14%</span>
            </div>
            <div class="matrix-cell cell-val">
              <div class="savings-meter">
                <div class="meter-fill fill-sealed" />
                <div class="meter-fill fill-sealed" />
                <div class="meter-empty" />
                <div class="meter-empty" />
                <div class="meter-empty" />
              </div>
              <span class="savings-pct pct-sealed">3-8%</span>
            </div>
            <div class="matrix-cell cell-val">
              <div class="savings-meter">
                <div class="meter-fill fill-nego" />
                <div class="meter-empty" />
                <div class="meter-empty" />
                <div class="meter-empty" />
                <div class="meter-empty" />
              </div>
              <span class="savings-pct pct-nego">1-5%</span>
            </div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const show = defineModel<boolean>({ default: false })
</script>

<style scoped>
.matrix-canvas {
  background: #FAFAFA;
  overflow-x: auto;
}

/* ── Table grid ── */
.matrix-table {
  min-width: 700px;
}

.matrix-row {
  display: grid;
  grid-template-columns: 190px repeat(6, 1fr);
  border-bottom: 1px solid #F3F4F6;
}

.row-alt {
  background: #FCFCFC;
}

.matrix-header {
  background: #FFF;
  border-bottom: 2px solid #E5E7EB;
  position: sticky;
  top: 0;
  z-index: 1;
}

.matrix-footer {
  background: #FFF;
  border-top: 2px solid #E5E7EB;
  border-bottom: none;
}

.matrix-cell {
  padding: 12px 10px;
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #374151;
  min-height: 44px;
}

.cell-param {
  font-weight: 500;
  color: #1D1D1B;
  padding-left: 14px;
}

.cell-val {
  justify-content: center;
  flex-direction: column;
  gap: 4px;
}

.cell-type {
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  padding: 10px 4px;
}

/* ── Type header dots ── */
.type-dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  flex-shrink: 0;
}

.dot-double { background: linear-gradient(135deg, #3B82F6, #10B981); }
.dot-english { background: #60A5FA; }
.dot-dutch { background: #FB923C; }
.dot-japanese { background: #A78BFA; }
.dot-sealed { background: #2DD4BF; }
.dot-nego { background: #D1D5DB; }

.cell-double { color: #1E40AF; }
.cell-english { color: #1E40AF; }
.cell-dutch { color: #9A3412; }
.cell-japanese { color: #5B21B6; }
.cell-sealed { color: #115E59; }
.cell-nego { color: #374151; }

/* ── Value chips ── */
.val-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
}

.val-high { background: #DBEAFE; color: #1E40AF; }
.val-mid { background: #F3F4F6; color: #374151; }
.val-low { background: #FEE2E2; color: #991B1B; }

.val-text {
  font-size: 12px;
  color: #6B7280;
}

/* ── Savings meter (footer) ── */
.savings-meter {
  display: flex;
  gap: 3px;
}

.meter-fill,
.meter-empty {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.meter-empty {
  background: #F3F4F6;
}

.fill-double { background: linear-gradient(135deg, #3B82F6, #10B981); }
.fill-english { background: #60A5FA; }
.fill-dutch { background: #FB923C; }
.fill-japanese { background: #A78BFA; }
.fill-sealed { background: #2DD4BF; }
.fill-nego { background: #D1D5DB; }

.savings-pct {
  font-size: 11px;
  font-weight: 700;
}

.pct-double { color: #1E40AF; }
.pct-english { color: #2563EB; }
.pct-dutch { color: #EA580C; }
.pct-japanese { color: #7C3AED; }
.pct-sealed { color: #0D9488; }
.pct-nego { color: #6B7280; }
</style>
