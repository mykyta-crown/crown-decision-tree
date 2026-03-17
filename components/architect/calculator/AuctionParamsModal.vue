<template>
  <v-dialog v-model="show" max-width="1100" scrollable>
    <v-card class="ap-card" rounded="lg">

      <!-- ── Hero header ──────────────────────────────────────────────────── -->
      <div class="ap-hero" :style="heroStyle">
        <div class="ap-hero-body">
          <div class="ap-family-name">
            <template v-if="params?.type === 'DoubleScenario'">
              <span style="color:#059669">{{ t('families.english') }}</span>
              <span class="ap-family-sep">→</span>
              <span style="color:#7C3AED">{{ t('families.dutch') }}</span>
            </template>
            <template v-else>
              <span :style="{ color: fc.text }">{{ familyLabel }}</span>
            </template>
          </div>
          <div class="ap-hero-lot">{{ props.lot.name || 'Lot' }}</div>
        </div>
        <v-btn icon variant="text" size="small" class="ap-close-btn" @click="show = false">
          <v-icon size="18" :style="{ color: fc.text }">mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- ── Body ─────────────────────────────────────────────────────────── -->
      <div class="ap-body">

        <!-- ── LEFT COLUMN ─────────────────────────────────────────────── -->
        <div class="ap-col ap-col--left">

        <!-- ── SECTION 1 : Enchère ─────────────────────────────────────── -->
        <div class="ap-section">
          <div class="ap-section-title" :style="{ color: fc.text }">
            <v-icon size="13">mdi-lightning-bolt</v-icon>
            {{ t('calc.auctionParams.sectionAuction') }}
          </div>

          <!-- Editable: name -->
          <div class="ap-field">
            <label class="ap-field-label">{{ t('calc.auctionParams.auctionName') }}</label>
            <input v-model="editName" type="text" class="ap-input ap-input--full" />
          </div>

          <!-- Editable: date + time + currency -->
          <div class="ap-row-3">
            <div class="ap-field">
              <label class="ap-field-label">{{ t('calc.auctionParams.auctionDate') }}</label>
              <input v-model="editDate" type="date" class="ap-input ap-input--full" />
            </div>
            <div class="ap-field">
              <label class="ap-field-label">{{ t('calc.auctionParams.auctionTime') }}</label>
              <input v-model="editTime" type="time" class="ap-input ap-input--full" />
            </div>
            <div class="ap-field">
              <label class="ap-field-label">{{ locale === 'fr' ? 'Devise' : 'Currency' }}</label>
              <select v-model="editCcy" class="ap-input ap-input--full ap-select ap-select--arrow">
                <option value="EUR">EUR €</option>
                <option value="USD">USD $</option>
                <option value="GBP">GBP £</option>
                <option value="CHF">CHF</option>
              </select>
            </div>
          </div>

          <!-- Lot details (editable) -->
          <div class="ap-lot-details">
            <div class="ap-lot-detail ap-lot-detail--wide">
              <label class="ap-lot-detail-lbl">{{ t('calc.auctionParams.lotItem', {}, locale === 'fr' ? 'Nom du lot' : 'Lot name') }}</label>
              <input v-model="editLotName" type="text" class="ap-lot-input" />
            </div>
            <div class="ap-lot-detail ap-lot-detail--sm">
              <label class="ap-lot-detail-lbl">{{ t('calc.auctionParams.lotUnit', {}, locale === 'fr' ? 'Unité' : 'Unit') }}</label>
              <input v-model="editLotUnit" type="text" class="ap-lot-input" />
            </div>
            <div class="ap-lot-detail ap-lot-detail--sm">
              <label class="ap-lot-detail-lbl">{{ t('calc.auctionParams.lotQty', {}, locale === 'fr' ? 'Qté' : 'Qty') }}</label>
              <input v-model.number="editLotQty" type="number" class="ap-lot-input" :min="1" step="1" />
            </div>
            <div class="ap-lot-detail ap-lot-detail--baseline">
              <label class="ap-lot-detail-lbl">
                {{ t('calc.auctionParams.baselinePrice', {}, 'Baseline') }}
                <v-tooltip location="top" max-width="220" content-class="bg-white text-black border">
                  <template #activator="{ props: tip }">
                    <span v-bind="tip" class="ap-ceil-info">ⓘ</span>
                  </template>
                  <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Prix de référence (budget actuel). Utilisé pour calculer les économies estimées.' : 'Reference price (current spend). Used to calculate estimated savings.' }}</span>
                </v-tooltip>
              </label>
              <input v-model.number="editBaseline" type="number" class="ap-lot-input ap-lot-input--num" :min="0" step="any" />
            </div>
          </div>

          <!-- Read-only technical params ──────────────────────────────── -->

          <!-- ENGLISH -->
          <template v-if="params?.type === 'English'">
            <div class="ap-price-arc ap-price-arc--english ap-english-card">
              <!-- Left: timing selects stacked -->
              <div class="ap-english-timing">
                <div class="ap-arc-ctrl">
                  <span class="ap-arc-ctrl-lbl">{{ t('calc.auctionParams.duration', {}, 'Total duration') }}</span>
                  <select v-model.number="editDuration" class="ap-arc-ctrl-sel">
                    <option v-for="d in [5,10,15,20,25,30,35,40]" :key="d" :value="d">{{ d }}m</option>
                  </select>
                </div>
                <div class="ap-arc-ctrl">
                  <span class="ap-arc-ctrl-lbl">Overtime</span>
                  <select v-model.number="editRoundDuration" class="ap-arc-ctrl-sel">
                    <option :value="0.5">30s</option>
                    <option :value="1">1m</option>
                    <option :value="2">2m</option>
                    <option :value="3">3m</option>
                    <option :value="4">4m</option>
                    <option :value="5">5m</option>
                  </select>
                </div>
              </div>
              <!-- Divider -->
              <div class="ap-english-sep" />
              <!-- Right: min + max decrement side by side -->
              <div class="ap-english-decr">
                <div class="ap-english-decr-item">
                  <span class="ap-arc-ctrl-lbl">
                    {{ t('calc.auctionParams.minDecrement', {}, 'Min /bid') }}
                    <v-tooltip location="top" max-width="200" content-class="bg-white text-black border">
                      <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                      <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Réduction minimale requise par offre.' : 'Minimum required price reduction per bid.' }}</span>
                    </v-tooltip>
                  </span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#059669">−</span>
                    <input v-model.number="editMinDecr" type="number" class="ap-step-input" step="any" :min="0" />
                  </div>
                  <div v-if="editLotQty > 1" class="ap-step-sub">× {{ editLotQty }} = {{ fmtN(Math.round(editMinDecr * editLotQty)) }}</div>
                </div>
                <div class="ap-english-decr-item">
                  <span class="ap-arc-ctrl-lbl">
                    {{ t('calc.auctionParams.maxDecrement', {}, 'Max /bid') }}
                    <v-tooltip location="top" max-width="200" content-class="bg-white text-black border">
                      <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                      <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Réduction maximale autorisée par offre.' : 'Maximum allowed price reduction per bid.' }}</span>
                    </v-tooltip>
                  </span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#059669">−</span>
                    <input v-model.number="editMaxDecr" type="number" class="ap-step-input" step="any" :min="0" />
                  </div>
                  <div v-if="editLotQty > 1" class="ap-step-sub">× {{ editLotQty }} = {{ fmtN(Math.round(editMaxDecr * editLotQty)) }}</div>
                </div>
              </div>
            </div>
          </template>

          <!-- DUTCH -->
          <template v-else-if="params?.type === 'Dutch' || params?.type === 'DutchPreferred'">
            <div v-if="params.type === 'DutchPreferred'" class="ap-alert">
              <v-icon size="14" color="#D97706">mdi-star-outline</v-icon>
              {{ t('calc.auctionParams.dutchPreferredNote') }}
            </div>
            <div class="ap-prebid-toggle">
              <span class="ap-prebid-toggle-label">
                Pre-bid
                <v-tooltip location="top" max-width="240" content-class="bg-white text-black border">
                  <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                  <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Le fournisseur définit un seuil à l\'avance. Le système accepte automatiquement quand le prix atteint ce seuil — garantit une offre le jour J.' : 'Supplier sets a threshold in advance. The system auto-accepts when the price reaches it — guarantees an offer on auction day.' }}</span>
                </v-tooltip>
              </span>
              <button
                class="ap-toggle-track"
                :class="editPrebid ? 'ap-toggle-track--on' : 'ap-toggle-track--off'"
                type="button"
                @click="editPrebid = !editPrebid"
              >
                <span class="ap-toggle-thumb" />
              </button>
              <span class="ap-toggle-state" :class="editPrebid ? 'ap-toggle-state--on' : ''">
                {{ editPrebid ? 'ON' : 'OFF' }}
              </span>
              <span v-if="editPrebid" class="ap-prebid-hint">— {{ t('calc.auctionParams.prebidRecommended', {}, 'guarantees an offer on auction day') }}</span>
            </div>
            <div class="ap-price-arc ap-price-arc--dutch">
              <!-- Left: computed starting price (auto-updates) -->
              <div class="ap-price-arc-node">
                <div class="ap-price-arc-lbl">{{ t('calc.auctionParams.startingPrice') }}</div>
                <div class="ap-price-arc-val ap-price-arc-val--muted">{{ fmtN(dutchStarting) }}</div>
                <div v-if="lot.qty > 1" class="ap-price-arc-total">× {{ lot.qty }} = {{ fmtN(tot(dutchStarting)) }}</div>
              </div>
              <!-- Middle: timing controls + incr -->
              <div class="ap-price-arc-mid ap-price-arc-mid--wide">
                <div class="ap-arc-timing">
                  <div class="ap-arc-ctrl">
                    <span class="ap-arc-ctrl-lbl">{{ t('calc.auctionParams.duration') }}</span>
                    <select v-model.number="editDuration" class="ap-arc-ctrl-sel">
                      <option v-for="d in [5,10,15,20,25,30,35,40]" :key="d" :value="d">{{ d }}m</option>
                    </select>
                  </div>
                  <span class="ap-arc-ctrl-sep">·</span>
                  <div class="ap-arc-ctrl">
                    <span class="ap-arc-ctrl-lbl">Round</span>
                    <select v-model.number="editRoundDuration" class="ap-arc-ctrl-sel">
                      <option :value="0.25">15s</option>
                      <option :value="0.5">30s</option>
                      <option :value="1">1m</option>
                    </select>
                  </div>
                  <span class="ap-arc-ctrl-sep">·</span>
                  <div class="ap-arc-ctrl">
                    <span class="ap-arc-ctrl-lbl">Rounds</span>
                    <span class="ap-arc-ctrl-val" style="color:#A78BFA">{{ nbRounds }}</span>
                  </div>
                </div>
                <div class="ap-price-arc-connector">
                  <div class="ap-price-arc-line" />
                  <v-icon size="14" color="#A78BFA">mdi-arrow-right</v-icon>
                </div>
                <div class="ap-step-labeled">
                  <span class="ap-arc-ctrl-lbl">Increment</span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#A78BFA">+</span>
                    <input v-model.number="editIncr" type="number" class="ap-step-input" step="any" :min="0" />
                    <span class="ap-price-arc-step-unit">/round</span>
                  </div>
                </div>
              </div>
              <!-- Right: editable ending price (ceiling) -->
              <div class="ap-price-arc-node ap-price-arc-node--end">
                <div class="ap-price-arc-lbl">{{ t('calc.auctionParams.endingPrice') }}</div>
                <input v-model.number="editEnding" type="number" class="ap-arc-price-input ap-arc-price-input--dutch" step="any" :min="0" />
                <div v-if="lot.qty > 1" class="ap-price-arc-total">× {{ lot.qty }} = {{ fmtN(tot(editEnding)) }}</div>
              </div>
            </div>
          </template>

          <!-- JAPANESE -->
          <template v-else-if="params?.type === 'Japanese'">
            <div class="ap-prebid-toggle">
              <span class="ap-prebid-toggle-label">
                Pre-bid
                <v-tooltip location="top" max-width="240" content-class="bg-white text-black border">
                  <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                  <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Le fournisseur définit un seuil à l\'avance. Le système accepte automatiquement quand le prix atteint ce seuil — garantit une offre le jour J.' : 'Supplier sets a threshold in advance. The system auto-accepts when the price reaches it — guarantees an offer on auction day.' }}</span>
                </v-tooltip>
              </span>
              <button
                class="ap-toggle-track"
                :class="editPrebid ? 'ap-toggle-track--on' : 'ap-toggle-track--off'"
                type="button"
                @click="editPrebid = !editPrebid"
              >
                <span class="ap-toggle-thumb" />
              </button>
              <span class="ap-toggle-state" :class="editPrebid ? 'ap-toggle-state--on' : ''">
                {{ editPrebid ? 'ON' : 'OFF' }}
              </span>
              <span v-if="editPrebid" class="ap-prebid-hint">— {{ t('calc.auctionParams.prebidRecommended', {}, 'guarantees an offer on auction day') }}</span>
            </div>
            <div class="ap-price-arc ap-price-arc--japanese">
              <!-- Left: editable starting price -->
              <div class="ap-price-arc-node">
                <div class="ap-price-arc-lbl">{{ t('calc.auctionParams.startingPrice') }}</div>
                <input v-model.number="editStarting" type="number" class="ap-arc-price-input ap-arc-price-input--japanese" step="any" :min="0" />
                <div v-if="lot.qty > 1" class="ap-price-arc-total">× {{ lot.qty }} = {{ fmtN(tot(editStarting)) }}</div>
              </div>
              <!-- Middle: timing controls + decr -->
              <div class="ap-price-arc-mid ap-price-arc-mid--wide">
                <div class="ap-arc-timing">
                  <div class="ap-arc-ctrl">
                    <span class="ap-arc-ctrl-lbl">{{ t('calc.auctionParams.duration') }}</span>
                    <select v-model.number="editDuration" class="ap-arc-ctrl-sel">
                      <option v-for="d in [5,10,15,20,25,30,35,40]" :key="d" :value="d">{{ d }}m</option>
                    </select>
                  </div>
                  <span class="ap-arc-ctrl-sep">·</span>
                  <div class="ap-arc-ctrl">
                    <span class="ap-arc-ctrl-lbl">Round</span>
                    <select v-model.number="editRoundDuration" class="ap-arc-ctrl-sel">
                      <option :value="0.25">15s</option>
                      <option :value="0.5">30s</option>
                      <option :value="1">1m</option>
                    </select>
                  </div>
                  <span class="ap-arc-ctrl-sep">·</span>
                  <div class="ap-arc-ctrl">
                    <span class="ap-arc-ctrl-lbl">Rounds</span>
                    <span class="ap-arc-ctrl-val" style="color:#FBBF24">{{ nbRounds }}</span>
                  </div>
                </div>
                <div class="ap-price-arc-connector">
                  <div class="ap-price-arc-line" />
                  <v-icon size="14" color="#FBBF24">mdi-arrow-right</v-icon>
                </div>
                <div class="ap-step-labeled">
                  <span class="ap-arc-ctrl-lbl">Decrement</span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#FBBF24">−</span>
                    <input v-model.number="editDecr" type="number" class="ap-step-input" step="any" :min="0" />
                    <span class="ap-price-arc-step-unit">/round</span>
                  </div>
                </div>
              </div>
              <!-- Right: computed floor (auto-updates) -->
              <div class="ap-price-arc-node ap-price-arc-node--end">
                <div class="ap-price-arc-lbl">{{ t('calc.auctionParams.floorPrice') }}</div>
                <div class="ap-price-arc-val ap-price-arc-val--muted">{{ fmtN(japaneseFloor) }}</div>
                <div v-if="lot.qty > 1" class="ap-price-arc-total">× {{ lot.qty }} = {{ fmtN(tot(japaneseFloor)) }}</div>
              </div>
            </div>
          </template>

          <!-- SEALED BID -->
          <template v-else-if="params?.type === 'SealedBid'">
            <div class="ap-price-arc ap-price-arc--english ap-english-card">
              <!-- Left: timing selects stacked -->
              <div class="ap-english-timing">
                <div class="ap-arc-ctrl">
                  <span class="ap-arc-ctrl-lbl">{{ t('calc.auctionParams.duration', {}, 'Total duration') }}</span>
                  <select v-model.number="editDuration" class="ap-arc-ctrl-sel">
                    <option v-for="d in [5,10,15,20,25,30,35,40]" :key="d" :value="d">{{ d }}m</option>
                  </select>
                </div>
                <div class="ap-arc-ctrl">
                  <span class="ap-arc-ctrl-lbl">Overtime</span>
                  <select v-model.number="editRoundDuration" class="ap-arc-ctrl-sel">
                    <option :value="0.5">30s</option>
                    <option :value="1">1m</option>
                    <option :value="2">2m</option>
                    <option :value="3">3m</option>
                    <option :value="4">4m</option>
                    <option :value="5">5m</option>
                  </select>
                </div>
              </div>
              <!-- Divider -->
              <div class="ap-english-sep" />
              <!-- Right: min + max decrement side by side -->
              <div class="ap-english-decr">
                <div class="ap-english-decr-item">
                  <span class="ap-arc-ctrl-lbl">
                    {{ t('calc.auctionParams.minDecrement', {}, 'Min /bid') }}
                    <v-tooltip location="top" max-width="200" content-class="bg-white text-black border">
                      <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                      <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Réduction minimale requise par offre.' : 'Minimum required price reduction per bid.' }}</span>
                    </v-tooltip>
                  </span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#67E8F9">−</span>
                    <input v-model.number="editMinDecr" type="number" class="ap-step-input" step="any" :min="0" />
                  </div>
                  <div v-if="editLotQty > 1" class="ap-step-sub">× {{ editLotQty }} = {{ fmtN(Math.round(editMinDecr * editLotQty)) }}</div>
                </div>
                <div class="ap-english-decr-item">
                  <span class="ap-arc-ctrl-lbl">
                    {{ t('calc.auctionParams.maxDecrement', {}, 'Max /bid') }}
                    <v-tooltip location="top" max-width="200" content-class="bg-white text-black border">
                      <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                      <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Réduction maximale autorisée par offre.' : 'Maximum allowed price reduction per bid.' }}</span>
                    </v-tooltip>
                  </span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#67E8F9">−</span>
                    <input v-model.number="editMaxDecr" type="number" class="ap-step-input" step="any" :min="0" />
                  </div>
                  <div v-if="editLotQty > 1" class="ap-step-sub">× {{ editLotQty }} = {{ fmtN(Math.round(editMaxDecr * editLotQty)) }}</div>
                </div>
              </div>
            </div>
          </template>

          <!-- DOUBLE SCENARIO -->
          <template v-else-if="params?.type === 'DoubleScenario'">
            <div class="ap-phase-label ap-phase-label--english">
              <div class="ap-phase-dot" style="background:#34D399" />
              {{ t('calc.auctionParams.phaseEnglish') }}
            </div>
            <div class="ap-price-arc ap-price-arc--english ap-english-card">
              <!-- Left: timing selects stacked -->
              <div class="ap-english-timing">
                <div class="ap-arc-ctrl">
                  <span class="ap-arc-ctrl-lbl">{{ t('calc.auctionParams.duration', {}, 'Total duration') }}</span>
                  <select v-model.number="editDuration" class="ap-arc-ctrl-sel">
                    <option v-for="d in [5,10,15,20,25,30,35,40]" :key="d" :value="d">{{ d }}m</option>
                  </select>
                </div>
                <div class="ap-arc-ctrl">
                  <span class="ap-arc-ctrl-lbl">Overtime</span>
                  <select v-model.number="editRoundDuration" class="ap-arc-ctrl-sel">
                    <option :value="0.5">30s</option>
                    <option :value="1">1m</option>
                    <option :value="2">2m</option>
                    <option :value="3">3m</option>
                    <option :value="4">4m</option>
                    <option :value="5">5m</option>
                  </select>
                </div>
              </div>
              <!-- Divider -->
              <div class="ap-english-sep" />
              <!-- Right: min + max decrement side by side -->
              <div class="ap-english-decr">
                <div class="ap-english-decr-item">
                  <span class="ap-arc-ctrl-lbl">
                    {{ t('calc.auctionParams.minDecrement', {}, 'Min /bid') }}
                    <v-tooltip location="top" max-width="200" content-class="bg-white text-black border">
                      <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                      <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Réduction minimale requise par offre.' : 'Minimum required price reduction per bid.' }}</span>
                    </v-tooltip>
                  </span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#059669">−</span>
                    <input v-model.number="editMinDecr" type="number" class="ap-step-input" step="any" :min="0" />
                  </div>
                  <div v-if="editLotQty > 1" class="ap-step-sub">× {{ editLotQty }} = {{ fmtN(Math.round(editMinDecr * editLotQty)) }}</div>
                </div>
                <div class="ap-english-decr-item">
                  <span class="ap-arc-ctrl-lbl">
                    {{ t('calc.auctionParams.maxDecrement', {}, 'Max /bid') }}
                    <v-tooltip location="top" max-width="200" content-class="bg-white text-black border">
                      <template #activator="{ props: tip }"><span v-bind="tip" class="ap-ceil-info">ⓘ</span></template>
                      <span style="font-size:12px;line-height:1.5">{{ locale === 'fr' ? 'Réduction maximale autorisée par offre.' : 'Maximum allowed price reduction per bid.' }}</span>
                    </v-tooltip>
                  </span>
                  <div class="ap-price-arc-step">
                    <span class="ap-price-arc-step-sign" style="color:#059669">−</span>
                    <input v-model.number="editMaxDecr" type="number" class="ap-step-input" step="any" :min="0" />
                  </div>
                  <div v-if="editLotQty > 1" class="ap-step-sub">× {{ editLotQty }} = {{ fmtN(Math.round(editMaxDecr * editLotQty)) }}</div>
                </div>
              </div>
            </div>
            <div class="ap-phase-label ap-phase-label--dutch">
              <div class="ap-phase-dot" style="background:#A78BFA" />
              {{ t('calc.auctionParams.phaseDutch') }}
            </div>
            <div class="ap-phase-body">
              <div class="ap-ds-note">
                <v-icon size="13" color="#A78BFA">mdi-information-outline</v-icon>
                <span>{{ t('calc.auctionParams.dsParamsAfterEnglish') }}</span>
              </div>
            </div>
          </template>
        </div>

        <!-- ── SECTION 2 : Fournisseurs ────────────────────────────────── -->
        <div class="ap-section">
          <div class="ap-section-title" :style="{ color: fc.text }">
            <v-icon size="13">mdi-account-group-outline</v-icon>
            {{ t('calc.auctionParams.sectionSuppliers') }}
          </div>

          <div class="ap-sup-table ap-sup-table--ceil" :class="{ 'ap-sup-table--pref': params?.type === 'DutchPreferred' }">
            <!-- Header -->
            <div class="ap-sup-row ap-sup-row--head">
              <span />
              <div class="ap-sup-col-init ap-sup-col-init--head">
                {{ t('calc.auctionParams.initialOffer') }}
              </div>
              <div class="ap-sup-col-prop ap-sup-col-prop--head">
                {{ t('calc.auctionParams.proposedCeiling') }}
                <v-tooltip
                  location="top"
                  max-width="260"
                  content-class="bg-white text-black border"
                >
                  <template #activator="{ props: tip }">
                    <span v-bind="tip" class="ap-ceil-info">ⓘ</span>
                  </template>
                  <span style="font-size:12px;line-height:1.5">{{ t('calc.auctionParams.proposedCeilingTooltip') }}</span>
                </v-tooltip>
              </div>
              <div v-if="params?.type === 'DutchPreferred'" class="ap-sup-col-pref ap-sup-col-pref--head">
                {{ locale === 'fr' ? 'Préféré' : 'Preferred' }}
              </div>
            </div>
            <!-- Sub-header -->
            <div class="ap-sup-row ap-sup-row--sub">
              <span />
              <div class="ap-sup-col-init ap-sup-col-init--sub">
                <span class="ap-sup-sub">{{ t('calc.auctionParams.perUnit') }}</span>
                <span class="ap-sup-sub">{{ t('calc.auctionParams.total') }}</span>
              </div>
              <div class="ap-sup-col-prop ap-sup-col-prop--sub">
                <span class="ap-sup-sub">{{ t('calc.auctionParams.perUnit') }}</span>
                <span class="ap-sup-sub">{{ t('calc.auctionParams.total') }}</span>
              </div>
              <span v-if="params?.type === 'DutchPreferred'" />
            </div>
            <!-- Rows -->
            <template v-for="(s, i) in editCeilings" :key="s.name">
              <div class="ap-sup-row">
                <span class="ap-sup-name">{{ s.name }}</span>
                <div class="ap-sup-col-init">
                  <span class="ap-sup-price">{{ fmtN(s.originalPrice) }}</span>
                  <span class="ap-sup-total">{{ fmtN(supTot(s.originalPrice)) }}</span>
                </div>
                <div class="ap-sup-col-prop" :class="{ 'ap-sup-col-prop--warn': ((params?.type === 'Dutch' || params?.type === 'DutchPreferred') && s.proposedPrice > editEnding) || (params?.type === 'Japanese' && s.proposedPrice > editStarting) }">
                  <div class="ap-sup-input-wrap">
                    <input
                      v-model.number="editCeilings[i].proposedPrice"
                      type="number"
                      class="ap-sup-input"
                      :min="0"
                      step="any"
                    />
                  </div>
                  <div class="ap-sup-prop-total">
                    <span>{{ fmtN(supTot(s.proposedPrice)) }}</span>
                    <span class="ap-sup-delta" :class="deltaClass(s)">{{ deltaText(s) }}</span>
                  </div>
                </div>
                <!-- Preferred radio (DutchPreferred only) -->
                <div v-if="params?.type === 'DutchPreferred'" class="ap-sup-col-pref">
                  <input
                    type="radio"
                    :name="'pref-sup'"
                    :checked="editPreferredIdx === i"
                    class="ap-pref-radio"
                    @change="editPreferredIdx = i"
                  />
                </div>
              </div>
              <!-- Dutch ceiling warning -->
              <div
                v-if="(params?.type === 'Dutch' || params?.type === 'DutchPreferred') && s.proposedPrice > editEnding"
                class="ap-sup-warn-row"
              >
                <v-icon size="12" color="#DC2626">mdi-alert-circle-outline</v-icon>
                {{ t('calc.auctionParams.aboveAuctionCeiling', {}, locale === 'fr' ? "Ce prix dépasse le plafond de l'enchère" : 'This price exceeds the auction ceiling') }}
              </div>
              <!-- Japanese starting price warning -->
              <div
                v-if="params?.type === 'Japanese' && s.proposedPrice > editStarting"
                class="ap-sup-warn-row"
              >
                <v-icon size="12" color="#DC2626">mdi-alert-circle-outline</v-icon>
                {{ t('calc.auctionParams.aboveStartingPrice', {}, locale === 'fr' ? "Ce prix dépasse le prix de départ — aucun round disponible" : 'This price exceeds the starting price — no rounds available') }}
              </div>
            </template>
            <div v-if="!editCeilings.length" class="ap-sup-empty">—</div>
          </div>
          <!-- DutchPreferred: preferred window note -->
          <div v-if="params?.type === 'DutchPreferred' && editPreferredIdx >= 0 && editCeilings[editPreferredIdx]" class="ap-pref-note">
            <v-icon size="12" color="#6D28D9">mdi-star</v-icon>
            <span><strong>{{ editCeilings[editPreferredIdx].name }}</strong> — {{ locale === 'fr' ? '30 secondes d\'accès exclusif par round' : '30 seconds exclusive access per round' }}</span>
          </div>

        </div>

        </div><!-- /ap-col--left -->

        <!-- ── RIGHT COLUMN ────────────────────────────────────────────── -->
        <div class="ap-col ap-col--right">

        <!-- ── SECTION 3 : Termes ──────────────────────────────────────── -->
        <div v-if="termsPreview" class="ap-section">
          <div class="ap-section-title" :style="{ color: fc.text }">
            <v-icon size="13">mdi-file-document-outline</v-icon>
            {{ t('calc.auctionParams.sectionTerms') }}
          </div>

          <div v-if="termsPreview.awarding_principles" class="ap-term-block">
            <div class="ap-term-label">{{ t('calc.bp.awardingPrinciples') }}</div>
            <div ref="apRef" class="ap-term-content ap-term-editable" contenteditable="true" />
          </div>

          <div v-if="termsPreview.commercials_terms" class="ap-term-block">
            <div class="ap-term-label">{{ t('calc.bp.commercialTerms') }}</div>
            <div ref="ctRef" class="ap-term-content ap-term-editable" contenteditable="true" />
          </div>

          <div class="ap-term-block">
            <div class="ap-term-label">{{ t('calc.auctionParams.generalTerms') }}</div>
            <div ref="gtRef" class="ap-term-content ap-term-editable" contenteditable="true" />
          </div>
        </div>

        <!-- ── Build button ──────────────────────────────────────────── -->
        <button class="ap-btn-primary" @click="buildAuction">
          <span class="ap-btn-label">{{ t('calc.auctionParams.build') }}</span>
          <span class="ap-btn-arrow-wrap">
            <v-icon size="15">mdi-arrow-right</v-icon>
          </span>
        </button>

        </div><!-- /ap-col--right -->
      </div>

    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import type { Lot } from '~/stores/architect/calculator'
import { useCalculatorStore } from '~/stores/architect/calculator'
import { fmtE, fmtN } from '~/utils/architect/formatting'
import useTranslations from '~/composables/useTranslations'
import { useArchitectBuildState } from '~/composables/useArchitectBuildState'

const STORAGE_KEY = 'crown_architect_build_state'

const props = defineProps<{
  family: string
  lot: Lot
  lotBaseline: number
  ccy: string
  supNames: string[]
  evName: string
}>()

const show = defineModel<boolean>({ default: false })
const { t, locale } = useTranslations('architect')
const store = useCalculatorStore()
const { saveArchitectState } = useArchitectBuildState()


// ── Buyer name ────────────────────────────────────────────────────────────────

const supabase = useSupabaseClient()
const supabaseUser = useSupabaseUser()
const buyerName = ref('')

onMounted(async () => {
  const user = supabaseUser.value
  if (!user) return
  const { data } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single()
  if (data) {
    const full = [data.first_name, data.last_name].filter(Boolean).join(' ')
    buyerName.value = full || user.email || ''
  } else {
    buyerName.value = user.email || ''
  }

  // If show is already true on mount (v-if + show set simultaneously),
  // watch(show) won't fire — call initEditable directly
  if (show.value) {
    await nextTick()
    initEditable()
  }
})

// ── Editable state ────────────────────────────────────────────────────────────

const editName          = ref('')
const editDate          = ref('')
const editTime          = ref('10:00')
const editLotName       = ref('')
const editLotUnit       = ref('')
const editLotQty        = ref<number>(1)
const editCcy           = ref('EUR')
const editPreferredIdx  = ref(-1)  // index in editCeilings of the preferred supplier (DutchPreferred)
const editDuration      = ref(0)
const editRoundDuration = ref(0)  // overtime for English, round duration for Dutch/Japanese
const editIncr          = ref(0)     // Dutch round increment
const editDecr          = ref(0)     // Japanese round decrement
const editEnding        = ref(0)     // Dutch ceiling price (ending)
const editStarting      = ref(0)     // Japanese starting price
const editPrebid        = ref(true)  // Dutch/Japanese prebid enabled
const editBaseline      = ref(0)     // Reference/baseline price (all types)
const editMinDecr       = ref(0)     // English min decrement per bid
const editMaxDecr       = ref(0)     // English max decrement per bid

interface EditCeiling { name: string; originalPrice: number; proposedPrice: number }
const editCeilings = ref<EditCeiling[]>([])

// Refs for contenteditable terms
const apRef = ref<HTMLElement | null>(null)
const ctRef = ref<HTMLElement | null>(null)
const gtRef = ref<HTMLElement | null>(null)

function initEditable() {
  if (!params.value) return

  editName.value    = params.value.name
  editDate.value    = dayjs().add(7, 'day').format('YYYY-MM-DD')
  editTime.value    = '10:00'
  editLotName.value    = props.lot.name || ''
  editLotUnit.value    = props.lot.unit || ''
  editLotQty.value     = props.lot.qty || 1
  editCcy.value        = props.ccy || 'EUR'
  editPreferredIdx.value = 0  // default first supplier as preferred for DutchPreferred

  // Duration
  const p = params.value as any
  editDuration.value = p.duration ?? 15
  if (p.type === 'Dutch' || p.type === 'DutchPreferred' || p.type === 'Japanese') {
    editRoundDuration.value = p.roundDuration ?? 0.5
  } else {
    editRoundDuration.value = p.overtimeRange ?? (p.type === 'DoubleScenario' ? p.english?.overtimeRange ?? 3 : 3)
  }

  // Incr/decr + price anchors
  editIncr.value     = p.incr ?? 0
  editDecr.value     = p.decr ?? 0
  editEnding.value   = p.ending ?? 0
  editStarting.value = p.starting ?? 0
  editPrebid.value   = p.prebid !== false  // default ON
  editBaseline.value = Math.round(props.lotBaseline)
  // Store per-unit values so the UI shows unit price; multiply by qty when saving
  const _qty = editLotQty.value || 1
  const _rawMin = p.type === 'DoubleScenario' ? (p.english?.minDecr ?? 0) : (p.minDecr ?? 0)
  const _rawMax = p.type === 'DoubleScenario' ? (p.english?.maxDecr ?? 0) : (p.maxDecr ?? 0)
  editMinDecr.value = _qty > 1 ? Math.round(_rawMin / _qty * 100) / 100 : _rawMin
  editMaxDecr.value = _qty > 1 ? Math.round(_rawMax / _qty * 100) / 100 : _rawMax

  // Proposed prices — per supplier for English/SealedBid/DS; global auction price for Dutch/Japanese
  const globalProposed =
    p.type === 'Dutch' || p.type === 'DutchPreferred' ? p.ending :
    p.type === 'Japanese' ? p.starting : null

  editCeilings.value = activeSuppliers.value.map(s => ({
    name: s.name,
    originalPrice: s.price,
    proposedPrice: globalProposed != null ? globalProposed : Math.round(s.price * 0.97),
  }))

  nextTick(() => {
    const tp = termsPreview.value
    if (!tp) return
    if (apRef.value && tp.awarding_principles)
      apRef.value.innerHTML = tp.awarding_principles
    if (ctRef.value && tp.commercials_terms)
      ctRef.value.innerHTML = tp.commercials_terms
    if (gtRef.value)
      gtRef.value.innerHTML = tp.general_terms
  })
}

watch(show, async (val) => {
  if (val) {
    await nextTick()
    initEditable()
  }
})

// ── Dutch / Japanese reactive price computations ───────────────────────────

const nbRounds = computed(() =>
  editRoundDuration.value > 0 ? Math.round(editDuration.value / editRoundDuration.value) : 0
)

// Dutch: starting = ending − (rounds − 1) × incr
// Round 1 shows `starting`, round N shows `starting + (N-1)×incr = ending`
const dutchStarting = computed(() =>
  softRound(editEnding.value - (nbRounds.value - 1) * editIncr.value)
)

// Japanese: floor = starting − (rounds − 1) × decr
// Round 1 shows `starting`, round N shows `starting − (N-1)×decr = floor`
const japaneseFloor = computed(() =>
  softRound(editStarting.value - (nbRounds.value - 1) * editDecr.value)
)

// ── Delta helpers ─────────────────────────────────────────────────────────────

function deltaText(s: EditCeiling): string {
  if (!s.originalPrice) return '—'
  const pct = ((s.proposedPrice - s.originalPrice) / s.originalPrice) * 100
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%'
}

function deltaClass(s: EditCeiling): string {
  if (!s.originalPrice) return ''
  const pct = (s.proposedPrice - s.originalPrice) / s.originalPrice
  return pct < 0 ? 'ap-delta--neg' : pct > 0 ? 'ap-delta--pos' : ''
}

// ── Build auction ─────────────────────────────────────────────────────────────

async function buildAuction() {
  if (!params.value) return

  const ceilingsData = editCeilings.value.map(s => ({ name: s.name, price: s.proposedPrice }))
  const qty = editLotQty.value || 1

  let p: any = { ...params.value, name: editName.value, time: editTime.value, currency: editCcy.value }

  // Apply edited durations (editMinDecr/editMaxDecr are per-unit → multiply by qty for total)
  if (p.type === 'English' || p.type === 'SealedBid') {
    p = { ...p, duration: editDuration.value, overtimeRange: editRoundDuration.value, minDecr: editMinDecr.value * qty, maxDecr: editMaxDecr.value * qty, supplierCeilings: ceilingsData }
  } else if (p.type === 'Dutch' || p.type === 'DutchPreferred') {
    p = { ...p, duration: editDuration.value, roundDuration: editRoundDuration.value, overtimeRange: editRoundDuration.value, incr: editIncr.value, ending: editEnding.value, starting: dutchStarting.value, nbRounds: nbRounds.value, prebid: editPrebid.value }
  } else if (p.type === 'Japanese') {
    p = { ...p, duration: editDuration.value, roundDuration: editRoundDuration.value, overtimeRange: editRoundDuration.value, decr: editDecr.value, starting: editStarting.value, floor: japaneseFloor.value, nbRounds: nbRounds.value, prebid: editPrebid.value }
  } else if (p.type === 'DoubleScenario') {
    p = { ...p, english: { ...p.english, duration: editDuration.value, overtimeRange: editRoundDuration.value, minDecr: editMinDecr.value * qty, maxDecr: editMaxDecr.value * qty, supplierCeilings: ceilingsData } }
  }

  const state = saveArchitectState(p, props.lot, editBaseline.value, editCcy.value, locale.value, store.supNames)

  if (state) {
    // Override basics with edited values
    state.basics.name = editName.value
    state.basics.date = editDate.value
    state.basics.time = editTime.value

    // Override lot details + terms
    if (state.lots?.[0]) {
      state.lots[0].name = editLotName.value
      state.lots[0].unit = editLotUnit.value
      state.lots[0].qty  = editLotQty.value
      state.lots[0].dutch_prebid_enabled = editPrebid.value
      if (p.type === 'English' || p.type === 'SealedBid') {
        state.lots[0].baseline     = editBaseline.value
        state.lots[0].min_bid_decr = editMinDecr.value * qty
        state.lots[0].max_bid_decr = editMaxDecr.value * qty
      }
      if (state.lots[0].items?.[0]) {
        state.lots[0].items[0].line_item = editLotName.value
        state.lots[0].items[0].unit      = editLotUnit.value
        state.lots[0].items[0].quantity  = editLotQty.value
      }
      // DutchPreferred: set preferred supplier window to 30s
      if (p.type === 'DutchPreferred' && editPreferredIdx.value >= 0 && state.lots[0].suppliersTimePerRound) {
        state.lots[0].suppliersTimePerRound = state.lots[0].suppliersTimePerRound.map(
          (s: any, i: number) => ({ ...s, time_per_round: i === editPreferredIdx.value ? 30 : null })
        )
      }
      if (apRef.value?.innerHTML)
        state.lots[0].awarding_principles = apRef.value.innerHTML
      if (ctRef.value?.innerHTML)
        state.lots[0].commercials_terms = ctRef.value.innerHTML
      if (gtRef.value?.innerHTML)
        state.lots[0].general_terms = gtRef.value.innerHTML
    }

    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      console.warn('[Architect] sessionStorage write failed')
    }
  }

  window.location.href = '/builder?mode=architect'
}

// ── Family colors ────────────────────────────────────────────────────────────

const FAMILY_COLORS: Record<string, { bg: string; text: string; accent: string }> = {
  'English':         { bg: '#EBFFF7', text: '#059669', accent: '#34D399' },
  'Dutch':           { bg: '#F5F3FF', text: '#6D28D9', accent: '#A78BFA' },
  'DutchPreferred':  { bg: '#F5F3FF', text: '#6D28D9', accent: '#A78BFA' },
  'Japanese':        { bg: '#FFFBEB', text: '#B45309', accent: '#FBBF24' },
  'Sealed Bid':      { bg: '#ECFEFF', text: '#0E7490', accent: '#67E8F9' },
  'Double Scenario': { bg: '#FFF1F2', text: '#BE123C', accent: '#F472B6' },
}

const fc = computed(() =>
  FAMILY_COLORS[props.family] ?? { bg: '#F9FAFB', text: '#6B7280', accent: '#9CA3AF' }
)

const heroStyle = computed(() => ({
  background: props.family === 'Double Scenario'
    ? 'linear-gradient(135deg, #EBFFF7 0%, #F5F3FF 100%)'
    : fc.value.bg,
  borderBottom: `3px solid ${fc.value.accent}`,
}))

// ── Helpers ──────────────────────────────────────────────────────────────────

function bestOffer(): number {
  const valid = props.lot.prices.filter((p, i) => !props.lot.excl[i] && p > 0)
  return valid.length > 0 ? Math.min(...valid) : 0
}

function niceRound(val: number): number {
  if (val <= 0) return 0
  if (val < 1)       return Math.round(val * 100) / 100
  if (val < 5)       return Math.round(val * 4) / 4
  if (val < 20)      return Math.round(val * 2) / 2
  if (val < 100)     return Math.round(val)
  if (val < 500)     return Math.round(val / 10) * 10
  if (val < 2000)    return Math.round(val / 50) * 50
  if (val < 10000)   return Math.round(val / 1000) * 1000
  if (val < 50000)   return Math.round(val / 5000) * 5000
  if (val < 200000)  return Math.round(val / 10000) * 10000
  return Math.round(val / 50000) * 50000
}

function roundIncrement(val: number): number {
  if (val <= 0) return 0
  if (val < 1)     return Math.round(val * 10) / 10
  if (val < 5)     return Math.round(val)
  if (val < 50)    return Math.round(val / 5) * 5
  if (val < 500)   return Math.round(val / 25) * 25
  if (val < 2000)  return Math.round(val / 100) * 100
  if (val < 10000) return Math.round(val / 500) * 500
  return Math.round(val / 2000) * 2000
}

function softRound(val: number): number {
  if (val <= 0) return 0
  if (val < 10)      return Math.round(val * 10) / 10
  if (val < 100)     return Math.round(val)
  if (val < 1000)    return Math.round(val / 5) * 5
  if (val < 10000)   return Math.round(val / 50) * 50
  if (val < 100000)  return Math.round(val / 100) * 100
  return Math.round(val / 1000) * 1000
}

function tot(unitVal: number): number {
  return softRound(unitVal * props.lot.qty)
}

function supTot(unitVal: number): number {
  return softRound(unitVal * props.lot.qty)
}

function activeCeilingsData() {
  return props.supNames
    .map((name, i) => ({ name, price: props.lot.prices[i] || 0 }))
    .filter((_, i) => !props.lot.excl[i] && props.lot.prices[i] > 0)
}

// ── Active suppliers ──────────────────────────────────────────────────────────

const activeSuppliers = computed(() =>
  props.supNames
    .map((name, i) => ({ name, price: props.lot.prices[i] || 0 }))
    .filter((_, i) => !props.lot.excl[i] && props.lot.prices[i] > 0)
)

// ── Editable per-supplier ceilings (English / SealedBid / DoubleScenario only) ─
const ceilingsEditable = computed(() => {
  const type = params.value?.type
  return type === 'English' || type === 'SealedBid' || type === 'DoubleScenario'
})

// ── Terms preview ─────────────────────────────────────────────────────────────

const _GT: Record<string, string> = {
  fr: '<ul><li>Toute offre placée durant l\'eAuction doit refléter les spécifications, termes et conditions énoncés ci-dessus.</li><li>Toute offre placée durant l\'eAuction est contractuellement contraignante et traitée comme une proposition formelle.</li><li>La renégociation n\'est pas possible après l\'eAuction.</li><li>Les offres et lots gagnants doivent être formalisés dans un contrat avec le client dans les trente (30) jours ouvrables suivant l\'eAuction.</li></ul>',
  en: '<ul><li>Any bid placed during the eAuction must reflect the specifications, terms and conditions stated above.</li><li>Any bid placed during the eAuction is contractually binding and treated as a formal proposal.</li><li>Renegotiation is not possible post eAuction.</li><li>Winning bids and lots must be formalized in a contract with the client within thirty (30) business days post eAuction.</li></ul>',
}

const _BPK: Record<string, string> = {
  English: 'english', SealedBid: 'sealedBid', Dutch: 'dutch',
  DutchPreferred: 'dutchPreferred', Japanese: 'japanese', DoubleScenario: 'doubleScenario',
}

function _applyTpl(tpl: string, vars: Record<string, string | number>): string {
  return tpl
    .replace(/\{\{lotName\}\}/g, String(vars.lotName || ''))
    .replace(/\{\{qty\}\}/g, String(vars.qty || ''))
    .replace(/\{\{unit\}\}/g, String(vars.unit || ''))
    .replace(/\{\{baseline\}\}/g, String(vars.baseline || ''))
    .replace(/\{\{currency\}\}/g, String(vars.currency || ''))
}

const termsPreview = computed(() => {
  if (!params.value) return null
  const lang = locale.value === 'en' ? 'en' : 'fr'
  const bpKey = _BPK[params.value.type]
  const tplSet = bpKey ? store.builderParams?.[bpKey]?.templates?.[lang] : null
  const vars = {
    lotName:  props.lot.name || 'Lot',
    qty:      props.lot.qty || 1,
    unit:     props.lot.unit || '',
    baseline: props.lotBaseline > 0 ? Math.round(props.lotBaseline).toLocaleString('fr-FR') : '—',
    currency: props.ccy,
  }
  return {
    general_terms:        _GT[lang],
    awarding_principles:  tplSet?.awarding_principles ? _applyTpl(tplSet.awarding_principles, vars) : '',
    commercials_terms:    tplSet?.commercials_terms    ? _applyTpl(tplSet.commercials_terms, vars)    : '',
  }
})

// ── Params computed ───────────────────────────────────────────────────────────

const params = computed(() => {
  const best = bestOffer()

  const buildDefaults = {
    usage: 'test' as const,
    status: 'published' as const,
    time: '10:00',
    timezone: 'Europe/Paris',
    currency: props.ccy,
    name: `${props.evName}${props.lot.name ? ' – ' + props.lot.name : ''}`,
    overtimeRule: 'all' as const,
  }

  if (props.family === 'English') {
    const bp = store.builderParams.english
    return {
      ...buildDefaults,
      type: 'English' as const,
      builderType: 'reverse' as const,
      duration: bp.duration ?? 15, overtimeRange: bp.overtime_range ?? 3,
      maxRankDisplayed: activeSuppliers.value.length,
      minDecr: niceRound(props.lotBaseline * (bp.min_decr_factor ?? 0.25) / 100),
      maxDecr: niceRound(props.lotBaseline * (bp.max_decr_factor ?? 20) / 100),
      supplierCeilings: activeCeilingsData(),
    }
  }

  if (props.family === 'Dutch') {
    const isDutchPreferred = props.lot.pref === 2
    const bp = isDutchPreferred ? store.builderParams.dutchPreferred : store.builderParams.dutch
    const ending   = softRound(best * (bp.ending_factor ?? 95) / 100)
    const incr     = roundIncrement((ending * (bp.range_percent ?? 35) / 100) / (bp.steps ?? 19))
    const starting = softRound(ending - (bp.steps ?? 19) * incr)
    if (isDutchPreferred) {
      return { ...buildDefaults, type: 'DutchPreferred' as const, builderType: 'dutch' as const,
        duration: bp.duration ?? 20, roundDuration: bp.round_duration ?? 1, nbRounds: bp.nb_rounds ?? 20, overtimeRange: bp.round_duration ?? 1,
        maxRankDisplayed: 1, prebid: true, timePerRound: bp.time_per_round ?? 30, ending, starting, incr }
    }
    return { ...buildDefaults, type: 'Dutch' as const, builderType: 'dutch' as const,
      duration: bp.duration ?? 10, roundDuration: bp.round_duration ?? 0.5, nbRounds: bp.nb_rounds ?? 20, overtimeRange: bp.round_duration ?? 0.5,
      maxRankDisplayed: 1, prebid: true, ending, starting, incr }
  }

  if (props.family === 'Japanese') {
    const bp = store.builderParams.japanese
    const starting = softRound(best * (bp.starting_factor ?? 95) / 100)
    const floor    = softRound(best * (bp.floor_factor ?? 65) / 100)
    const decr     = niceRound((starting - floor) / (bp.steps ?? 19))
    return { ...buildDefaults, type: 'Japanese' as const, builderType: 'japanese' as const,
      duration: bp.duration ?? 10, roundDuration: bp.round_duration ?? 0.5, nbRounds: bp.nb_rounds ?? 20, overtimeRange: bp.round_duration ?? 0.5,
      maxRankDisplayed: props.lot.award === 1 ? 1 : props.lot.award === 2 ? activeSuppliers.value.length : 0, prebid: true, starting, floor, decr }
  }

  if (props.family === 'Sealed Bid') {
    const bp = store.builderParams.sealedBid
    return { ...buildDefaults, type: 'SealedBid' as const, builderType: 'sealed-bid' as const,
      maxRankDisplayed: 2,
      minDecr: niceRound(props.lotBaseline * (bp.min_decr_factor ?? 0.25) / 100),
      maxDecr: niceRound(props.lotBaseline * (bp.max_decr_factor ?? 20) / 100),
      supplierCeilings: activeCeilingsData() }
  }

  if (props.family === 'Double Scenario') {
    const bp = store.builderParams.doubleScenario
    const enMinDecr = niceRound(props.lotBaseline * (bp.min_decr_factor ?? 0.25) / 100)
    const enMaxDecr = niceRound(props.lotBaseline * (bp.max_decr_factor ?? 20) / 100)
    return {
      ...buildDefaults,
      type: 'DoubleScenario' as const,
      english: {
        builderType: 'reverse' as const,
        duration: bp.duration ?? 15, overtimeRange: bp.overtime_range ?? 3,
        maxRankDisplayed: bp.max_rank_displayed ?? 3,
        minDecr: enMinDecr, maxDecr: enMaxDecr,
        supplierCeilings: activeCeilingsData(),
      },
      dutch: {
        builderType: 'dutch' as const,
        duration: 10, overtimeRange: 0.5,
        maxRankDisplayed: 1, prebid: true,
      },
    }
  }

  return null
})

// Re-init when params become available (async store load) while modal is already open
watch(params, (val) => {
  if (val && show.value) initEditable()
})

const familyI18nKey: Record<string, string> = {
  'English':         'families.english',
  'Dutch':           'families.dutch',
  'Japanese':        'families.japanese',
  'Sealed Bid':      'families.sealedBid',
  'Double Scenario': 'families.doubleScenario',
  'Traditional':     'families.traditional',
}

const familyLabel = computed(() =>
  familyI18nKey[props.family] ? t(familyI18nKey[props.family]) : props.family
)
</script>

<style scoped>
.ap-card { overflow: hidden; display: flex; flex-direction: column; max-height: 90vh; }

/* ── Hero header ─────────────────────────────────────────────────────────── */
.ap-hero {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 14px 16px 12px;
  flex-shrink: 0;
}
.ap-hero-body { flex: 1; }
.ap-family-name {
  font-size: 18px; font-weight: 800; line-height: 1.1;
  letter-spacing: -0.02em; margin-bottom: 4px;
}
.ap-family-sep { color: #9CA3AF; margin: 0 6px; font-weight: 400; }
.ap-hero-lot {
  font-size: 13px; font-weight: 500; color: #6B7280;
}
.ap-close-btn { margin-top: -4px; margin-right: -6px; }

/* ── Body — two-column grid ─────────────────────────────────────────────── */
.ap-body {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  align-items: stretch;
  overflow-y: auto; flex: 1;
}

.ap-col {
  padding: 0 16px 16px;
  display: flex; flex-direction: column;
}
.ap-col--left  { border-right: 1px solid #F3F4F6; }
.ap-col--right {
  position: sticky; top: 0;
  height: 100%; max-height: 90vh;
  display: flex; flex-direction: column;
  overflow: hidden; gap: 0;
  padding-bottom: 16px;
}
.ap-col--right .ap-section {
  flex: 1; overflow-y: auto; min-height: 0;
  border-bottom: none;
}

/* ── Sections ───────────────────────────────────────────────────────────── */
.ap-section {
  padding: 12px 0;
  border-bottom: 1px solid #F3F4F6;
  display: flex; flex-direction: column; gap: 8px;
}
.ap-section:last-child { border-bottom: none; }

.ap-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  margin-bottom: 0;
}


/* ── Editable fields ─────────────────────────────────────────────────────── */
.ap-field { display: flex; flex-direction: column; gap: 3px; }
.ap-field-label {
  font-size: 11px; font-weight: 600; color: #6B7280;
  letter-spacing: 0.02em;
}
.ap-input {
  height: 32px; padding: 0 10px;
  border: 1px solid #E9EAEC; border-radius: 4px;
  font-size: 13px; color: #1D1D1B; background: #fff;
  outline: none; transition: border-color 0.15s;
  font-family: inherit; box-sizing: border-box;
}
.ap-input:focus { border-color: #9CA3AF; }
.ap-input--full { width: 100%; }
.ap-input--readonly {
  display: flex; align-items: center;
  background: #F9FAFB; color: #6B7280; cursor: default;
  user-select: none;
}

.ap-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ap-row-3 { display: grid; grid-template-columns: 1fr 1fr 88px; gap: 8px; }

/* ── Lot details strip ──────────────────────────────────────────────────── */
.ap-lot-details {
  display: grid;
  grid-template-columns: 2fr 0.7fr 0.7fr 1.3fr;
  gap: 8px;
}
.ap-lot-detail {
  display: flex; flex-direction: column; gap: 3px;
}
.ap-lot-detail--wide,
.ap-lot-detail--sm,
.ap-lot-detail--baseline { /* proportions handled by grid-template-columns */ }
.ap-lot-detail-lbl {
  font-size: 11px; font-weight: 600; color: #6B7280;
  letter-spacing: 0.02em;
}
.ap-lot-input {
  width: 100%; height: 32px; padding: 0 10px;
  border: 1px solid #E9EAEC; border-radius: 4px;
  font-size: 13px; color: #1D1D1B; background: #fff;
  font-family: inherit; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;
}
.ap-lot-input:focus { border-color: #9CA3AF; }
.ap-lot-input--num  { text-align: right; font-variant-numeric: tabular-nums; }
.ap-lot-input::-webkit-outer-spin-button,
.ap-lot-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ap-lot-input[type=number] { -moz-appearance: textfield; }

/* ── Params banner ──────────────────────────────────────────────────────── */
.ap-banner {
  display: flex; align-items: stretch;
  border-radius: 8px; overflow: hidden;
  background: linear-gradient(135deg, #1D1D1B 0%, #2A2A28 100%);
}
.ap-banner--sm {
  background: linear-gradient(135deg, #374151 0%, #4B5563 100%);
}
.ap-param { flex: 1; padding: 12px 14px; display: flex; flex-direction: column; gap: 4px; }
.ap-param--primary { flex: 1.3; }
.ap-param-div { width: 1px; background: rgba(255,255,255,0.1); margin: 8px 0; }
.ap-param-label {
  font-size: 10px; font-weight: 600; color: rgba(255,255,255,0.45);
  text-transform: uppercase; letter-spacing: 0.07em;
}
.ap-param-value { font-size: 18px; font-weight: 700; color: #fff; line-height: 1.1; }
.ap-param-value--sm { font-size: 15px; font-weight: 600; color: rgba(255,255,255,0.8); }
.ap-param-total { font-size: 11px; color: rgba(255,255,255,0.4); margin-top: 1px; }

/* ── Timing editable row ────────────────────────────────────────────────── */
.ap-timing-edit {
  display: flex; align-items: flex-end; gap: 10px; flex-wrap: wrap;
}
.ap-field-inline {
  display: flex; flex-direction: column; gap: 4px;
}
.ap-num-wrap {
  display: flex; align-items: center; gap: 6px;
}
.ap-input--sm {
  width: 64px; height: 30px; text-align: center;
}
.ap-select {
  width: 80px; height: 30px; cursor: pointer;
}
.ap-select--arrow {
  padding-right: 28px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 10px 6px;
  -webkit-appearance: none; -moz-appearance: none; appearance: none;
}
.ap-unit {
  font-size: 12px; color: #6B7280; white-space: nowrap;
}
.ap-dot { color: #D1D5DB; font-size: 10px; }

/* ── Prebid toggle ──────────────────────────────────────────────────────── */
.ap-prebid-toggle {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 10px; border-radius: 6px;
  background: #F9FAFB; border: 1px solid #E9EAEC;
}
.ap-prebid-toggle-label {
  font-size: 12px; font-weight: 600; color: #374151;
  flex: 1;
}
.ap-toggle-track {
  position: relative; width: 36px; height: 20px;
  border-radius: 10px; border: none; cursor: pointer;
  transition: background 0.2s; flex-shrink: 0; padding: 0;
}
.ap-toggle-track--on  { background: #1D1D1B; }
.ap-toggle-track--off { background: #D1D5DB; }
.ap-toggle-thumb {
  position: absolute; top: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: left 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.ap-toggle-track--on  .ap-toggle-thumb { left: 18px; }
.ap-toggle-track--off .ap-toggle-thumb { left: 2px; }
.ap-toggle-state {
  font-size: 11px; font-weight: 700; color: #9CA3AF; letter-spacing: 0.04em;
}
.ap-toggle-state--on { color: #1D1D1B; }
.ap-prebid-hint {
  font-size: 11px; color: #6B7280;
}

/* ── Alert ──────────────────────────────────────────────────────────────── */
.ap-alert {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 12px; border-radius: 6px;
  background: #FFFBEB; border: 1px solid #FDE68A;
  font-size: 11px; font-weight: 500; color: #92400E;
}

/* ── Phase labels (Double Scenario) ─────────────────────────────────────── */
.ap-phase-label {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 10px; border-radius: 6px;
  font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
}
.ap-phase-label--english { background: #F0FDF4; color: #065F46; }
.ap-phase-label--dutch   { background: #F5F3FF; color: #4C1D95; }
.ap-phase-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.ap-phase-body {
  display: flex; flex-direction: column; gap: 8px;
  padding-left: 14px; border-left: 2px solid #E9EAEC;
}
.ap-ds-note {
  display: flex; align-items: flex-start; gap: 6px;
  padding: 7px 10px; border-radius: 6px;
  background: #F5F3FF; border: 1px solid #DDD6FE;
  font-size: 11px; color: #5B21B6; line-height: 1.5;
}

/* ── Price arc (Dutch / Japanese visual) ────────────────────────────────── */
.ap-price-arc {
  display: flex; align-items: center; gap: 0;
  border-radius: 10px; overflow: hidden;
  border: 1px solid #E9EAEC;
}
.ap-price-arc--english  { background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border-color: #BBF7D0; }
.ap-price-arc--dutch    { background: linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%); border-color: #DDD6FE; }
.ap-price-arc--japanese { background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border-color: #FDE68A; }

.ap-price-arc-node {
  flex: 1; padding: 8px 12px;
  display: flex; flex-direction: column; gap: 2px;
}
.ap-price-arc-node--end { text-align: right; align-items: flex-end; }

.ap-price-arc-lbl {
  font-size: 10px; font-weight: 700; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.07em;
}
.ap-price-arc-val {
  font-size: 18px; font-weight: 800; color: #1D1D1B; line-height: 1.1;
}
.ap-price-arc-val--muted { font-size: 16px; font-weight: 600; color: #6B7280; }
.ap-price-arc-total { font-size: 10px; color: #9CA3AF; margin-top: 1px; }

.ap-price-arc-mid {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 6px; flex-shrink: 0;
}
.ap-price-arc-mid--wide { flex: 1.2; padding: 8px 10px; }

/* ── Arc timing controls (inside the arc card) ──────────────────────────── */
.ap-arc-timing {
  display: flex; align-items: flex-end; gap: 4px;
  white-space: nowrap;
}
.ap-arc-ctrl {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.ap-arc-ctrl-lbl {
  font-size: 9px; font-weight: 700; color: rgba(0,0,0,0.35);
  text-transform: uppercase; letter-spacing: 0.06em;
}
.ap-arc-ctrl-sel {
  height: 26px; padding: 0 20px 0 6px;
  border: 1px solid rgba(0,0,0,0.15); border-radius: 4px;
  font-size: 11px; font-weight: 600; color: #1D1D1B;
  background: rgba(255,255,255,0.7)
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B7280' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")
    no-repeat right 5px center;
  background-size: 10px 6px;
  -webkit-appearance: none; -moz-appearance: none; appearance: none;
  cursor: pointer; outline: none; font-family: inherit;
}
.ap-arc-ctrl-sel:focus { border-color: rgba(0,0,0,0.3); background-color: #fff; }
.ap-arc-ctrl-val {
  font-size: 15px; font-weight: 800; line-height: 1;
  height: 24px; display: flex; align-items: center;
}
.ap-arc-ctrl-sep {
  font-size: 12px; color: rgba(0,0,0,0.2); margin-top: 14px;
}
.ap-price-arc-connector {
  display: flex; align-items: center; gap: 4px; width: 100%;
}
.ap-price-arc-line {
  flex: 1; height: 1px;
  background: linear-gradient(to right, transparent, #D1D5DB);
}
.ap-price-arc-step {
  display: flex; align-items: center; gap: 4px;
  white-space: nowrap;
}
.ap-price-arc-step-sign {
  font-size: 14px; font-weight: 700; line-height: 1;
}
.ap-price-arc-step-unit {
  font-size: 10px; color: #9CA3AF; white-space: nowrap;
}

/* ── Arc price input (editable ending / starting) ───────────────────────── */
.ap-arc-price-input {
  width: 100%; max-width: 110px; height: 28px; padding: 0 8px;
  border: 1.5px solid transparent; border-radius: 6px;
  font-size: 17px; font-weight: 800; line-height: 1.1;
  text-align: right; background: rgba(255,255,255,0.6);
  outline: none; font-family: inherit; box-sizing: border-box;
  transition: border-color 0.15s, background 0.15s;
}
.ap-arc-price-input--english  { color: #059669; }
.ap-arc-price-input--english:focus { border-color: #34D399; background: #fff; }

/* ── English card layout ────────────────────────────────────────────────── */
.ap-english-card {
  padding: 10px 14px; gap: 0; align-items: stretch;
}
.ap-english-timing {
  display: flex; flex-direction: column; gap: 8px;
  padding-right: 14px; justify-content: center;
}
.ap-english-sep {
  width: 1px; background: rgba(0,0,0,0.08);
  margin: 4px 0; flex-shrink: 0;
}
.ap-english-decr {
  display: flex; gap: 12px; align-items: center;
  padding-left: 14px; flex: 1;
}
.ap-english-decr-item {
  display: flex; flex-direction: column; gap: 4px;
}
.ap-step-sub {
  font-size: 10px; color: #9CA3AF; text-align: center; margin-top: 1px;
}
.ap-step-labeled {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.ap-arc-price-input--dutch    { color: #6D28D9; }
.ap-arc-price-input--dutch:focus { border-color: #A78BFA; background: #fff; }
.ap-arc-price-input--japanese { color: #B45309; }
.ap-arc-price-input--japanese:focus { border-color: #FBBF24; background: #fff; }
.ap-arc-price-input::-webkit-outer-spin-button,
.ap-arc-price-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ap-arc-price-input[type=number] { -moz-appearance: textfield; }

/* ── Step input (incr / decr) ────────────────────────────────────────────── */
.ap-step-input {
  width: 62px; height: 28px; padding: 0 6px;
  border: 1px solid #E9EAEC; border-radius: 4px;
  font-size: 12px; font-weight: 600; color: #1D1D1B;
  text-align: center; background: #fff; outline: none;
  font-family: inherit; box-sizing: border-box;
  transition: border-color 0.15s;
}
.ap-step-input:focus { border-color: #9CA3AF; }
.ap-step-input::-webkit-outer-spin-button,
.ap-step-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ap-step-input[type=number] { -moz-appearance: textfield; }

/* ── Hint ───────────────────────────────────────────────────────────────── */
.ap-hint { font-size: 11px; color: #9CA3AF; font-style: italic; }

/* ── Supplier table ─────────────────────────────────────────────────────── */
.ap-sup-table { display: flex; flex-direction: column; }

/* 3-col grid: name | initial-group | proposed-group */
.ap-sup-table--ceil .ap-sup-row {
  display: grid;
  grid-template-columns: 1fr 160px 175px;
  align-items: center; gap: 0;
  padding: 3px 0; border-bottom: 1px solid #F3F4F6;
  font-size: 13px;
}
.ap-sup-row:last-child { border-bottom: none; }

.ap-sup-row--head {
  font-size: 10px; font-weight: 700; color: #6B7280;
  text-transform: uppercase; letter-spacing: 0.06em;
  padding-bottom: 0; border-bottom: none;
}
.ap-sup-row--sub {
  font-size: 10px; color: #9CA3AF;
  padding-bottom: 4px; border-bottom: 1px solid #E9EAEC;
}

/* ── Column group containers ─────────────────────────────────────────────── */
.ap-sup-col-init {
  display: grid; grid-template-columns: 1fr 1fr;
  align-items: center; gap: 4px;
  padding: 4px 8px; background: #F9FAFB;
  border-radius: 6px 0 0 6px; margin: 1px 0;
}
.ap-sup-col-prop {
  display: grid; grid-template-columns: 1fr 1fr;
  align-items: center; gap: 4px;
  padding: 4px 8px; background: #F5F6FF;
  border-radius: 0 6px 6px 0; margin: 1px 2px 1px 0;
  transition: background 0.15s;
}
.ap-sup-col-prop--warn { background: #FEF2F2; }

/* Head/sub-header group labels */
.ap-sup-col-init--head,
.ap-sup-col-prop--head {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  padding: 4px 8px; background: transparent;
  font-size: 10px; font-weight: 700; color: #6B7280;
  letter-spacing: 0.06em; text-transform: uppercase;
  border-radius: 0; margin: 0;
}
.ap-ceil-info {
  font-size: 11px; color: #9CA3AF; cursor: help;
  font-style: normal; text-transform: none; letter-spacing: 0;
  transition: color 0.15s;
  line-height: 1;
}
.ap-ceil-info:hover { color: #6B7280; }
.ap-sup-col-init--sub,
.ap-sup-col-prop--sub {
  background: transparent; padding: 2px 8px; margin: 0; border-radius: 0;
}

.ap-sup-name     { color: #374151; font-weight: 500; padding-right: 4px; }
.ap-sup-price    { font-weight: 700; color: #1D1D1B; text-align: right; }
.ap-sup-total    { font-size: 12px; color: #6B7280; text-align: right; }
.ap-sup-sub      { font-style: normal; font-weight: 400; text-align: right; display: block; }
.ap-sup-empty    { color: #9CA3AF; font-size: 13px; padding: 6px 0; }

/* Proposed total cell: stacks value + delta */
.ap-sup-prop-total {
  display: flex; flex-direction: column; align-items: flex-end; gap: 1px;
  font-size: 12px; color: #6B7280;
}

/* ── Supplier ceiling input ──────────────────────────────────────────────── */
.ap-sup-input-wrap { display: flex; align-items: center; }
.ap-sup-input {
  width: 100%; height: 26px; padding: 0 6px;
  border: 1px solid #DDD6FE; border-radius: 4px;
  font-size: 12px; font-weight: 600; color: #1D1D1B;
  text-align: right; background: #fff; outline: none;
  font-family: inherit; transition: border-color 0.15s;
  box-sizing: border-box;
}
.ap-sup-input:focus { border-color: #A78BFA; }
.ap-sup-input::-webkit-outer-spin-button,
.ap-sup-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.ap-sup-input[type=number] { -moz-appearance: textfield; }

/* ── DutchPreferred: Preferred column ───────────────────────────────────── */
.ap-sup-table--pref .ap-sup-row {
  grid-template-columns: 1fr 160px 175px 48px;
}
.ap-sup-col-pref {
  display: flex; align-items: center; justify-content: center;
}
.ap-sup-col-pref--head {
  font-size: 10px; font-weight: 700; color: #6D28D9;
  text-transform: uppercase; letter-spacing: 0.06em;
  text-align: center;
}
.ap-pref-radio {
  width: 16px; height: 16px; cursor: pointer;
  accent-color: #6D28D9;
}
.ap-pref-note {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 10px; border-radius: 6px;
  background: #F5F3FF; border: 1px solid #DDD6FE;
  font-size: 11px; color: #5B21B6;
}

/* ── Ceiling warning row ────────────────────────────────────────────────── */
.ap-sup-warn-row {
  display: flex; align-items: center; gap: 5px;
  padding: 3px 4px 5px;
  font-size: 11px; font-weight: 500; color: #DC2626;
  background: #FEF2F2; border-radius: 4px;
  margin-top: -4px; margin-bottom: 2px;
}

/* ── Delta badge ─────────────────────────────────────────────────────────── */
.ap-sup-delta {
  font-size: 10px; font-weight: 600;
  color: #9CA3AF;
}
.ap-delta--neg { color: #6366F1; }  /* indigo — proposed limit, not a result */
.ap-delta--pos { color: #DC2626; }

/* ── Terms ──────────────────────────────────────────────────────────────── */
.ap-term-block { display: flex; flex-direction: column; gap: 4px; }
.ap-term-label {
  font-size: 10px; font-weight: 700; color: #9CA3AF;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.ap-term-content {
  font-size: 12px; color: #374151; line-height: 1.6;
  padding: 10px 12px; border-radius: 6px;
  background: #F9FAFB; border: 1px solid #E9EAEC;
}
.ap-term-editable {
  cursor: text; outline: none;
  transition: border-color 0.15s, background 0.15s;
}
.ap-term-editable:focus {
  border-color: #9CA3AF;
  background: #fff;
}
.ap-term-content :deep(ul) { margin: 0; padding-left: 16px; }
.ap-term-content :deep(li) { margin-bottom: 4px; }
.ap-term-content :deep(li:last-child) { margin-bottom: 0; }

@keyframes ap-shimmer {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}

.ap-btn-primary {
  width: 100%; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 10px 10px 20px; border-radius: 6px; border: none;
  background: linear-gradient(110deg, #1D1D1B 30%, #3a3a38 50%, #1D1D1B 70%);
  background-size: 250% 100%;
  animation: ap-shimmer 4s linear infinite;
  font-size: 14px; font-weight: 600; color: white;
  cursor: pointer; flex-shrink: 0;
  transition: transform 0.15s, box-shadow 0.15s;
}
.ap-btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 14px rgba(0,0,0,0.28);
}
.ap-btn-primary:active { transform: translateY(0); box-shadow: none; }

.ap-btn-label { white-space: nowrap; }

.ap-btn-arrow-wrap {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 4px;
  background: rgba(255,255,255,0.12);
  transition: background 0.15s, transform 0.2s;
  flex-shrink: 0;
}
.ap-btn-primary:hover .ap-btn-arrow-wrap {
  background: rgba(255,255,255,0.22);
  transform: translateX(3px);
}
</style>
