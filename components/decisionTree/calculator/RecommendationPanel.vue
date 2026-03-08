<script setup lang="ts">
import { computed } from 'vue'
import { useCalculatorStore } from '~/stores/decisionTree/calculator'
import { useProjectsStore } from '~/stores/decisionTree/projects'
import { FC, gfc, noFC } from '~/utils/decisionTree/constants'

const store = useCalculatorStore()
const projectsStore = useProjectsStore()

const engC = FC['English']
const dutC = FC['Dutch']

interface LotCard {
  lotId: number
  index: number
  family: string | null
  displayName: string
  ok: boolean
  isDouble: boolean
  subtitle: string
  bg: string
  borderCol: string
  borderImage: string | null
  outlineCol: string
  titleCol: string
}

function strategyDisplayName(rec: { family: string; tf: string; aw: string } | null): string {
  if (!rec) return 'No suggestion'
  const familyNames: Record<string, string> = {
    English: 'English',
    Dutch: 'Dutch',
    'Sealed Bid': 'Sealed Bid',
    Japanese: 'Japanese',
    'Double Scenario': 'Double Scenario',
    Traditional: 'Traditional Negotiation',
  }
  const base = familyNames[rec.family] || rec.family
  if (rec.family === 'Traditional' || rec.family === 'Double Scenario') return base

  const tfLabels: Record<string, string> = {
    'Fixed+Dynamic': 'Transfo',
    Ceiling: 'Ceiling',
    Preference: 'Preferred',
    'Ceiling+Pref': 'Ceiling + Preferred',
  }

  const parts = [base]
  if (rec.tf && rec.tf !== 'None' && rec.tf !== '—') {
    parts.push(tfLabels[rec.tf] || rec.tf)
  }
  if (rec.aw && rec.aw !== '—') {
    parts.push(rec.aw)
  }
  return parts.join(' - ')
}

const lotCards = computed<LotCard[]>(() => {
  return store.lots.map((lot, li) => {
    const top = store.lotTop3[li] || []
    const ti = top[0]
    const f = ti ? ti.family : null
    const c = f ? gfc(f) : noFC
    const ok = store.lotSc[li] !== null
    const oc = Math.max(0, top.length - 1)
    const isDouble = f === 'Double Scenario'

    // In guided mode, warn if filled prices < nSup
    const filledCount = lot.prices.filter((p, i) => p > 0 && !lot.excl[i]).length
    const supMismatch = store.mode === 'guided' && ok && filledCount < store.nSup

    const subtitle = !ok
      ? 'Complete inputs'
      : supMismatch
        ? `${filledCount}/${store.nSup} suppliers filled`
        : isDouble
          ? 'English and Dutch eAuctions'
          : oc > 0
            ? `${oc} other option${oc > 1 ? 's' : ''} available`
            : 'Best match'

    const bg = ok
      ? isDouble
        ? `linear-gradient(135deg, ${engC.bg} 0%, ${dutC.bg} 100%)`
        : c.bg
      : store.selLot === li
        ? '#F5F5F5'
        : '#F8F8F8'

    const borderCol = ok
      ? isDouble
        ? 'transparent'
        : c.border
      : '#E9EAEC'

    const outlineCol = ok
      ? isDouble
        ? dutC.border
        : c.border
      : '#D0D0D0'

    const titleCol = ok
      ? isDouble
        ? '#1D1D1B'
        : c.text
      : '#8E8E8E'

    const borderImage = ok && isDouble
      ? `linear-gradient(180deg, ${engC.border} 0%, ${dutC.border} 100%) 1`
      : null

    return {
      lotId: lot.id,
      index: li,
      family: f,
      displayName: ok ? strategyDisplayName(ti) : 'No suggestion',
      ok,
      isDouble,
      subtitle,
      bg,
      borderCol,
      borderImage,
      outlineCol,
      titleCol,
    }
  })
})

function selectLot(li: number) {
  store.selLot = li
}

function seeDetails() {
  let hasErr = false
  if (!store.evName.trim()) {
    store.evNameErr = true
    hasErr = true
  }
  if (!projectsStore.userName.trim()) {
    store.userNameErr = true
    hasErr = true
  }
  if (hasErr) {
    // Force Phase 2 open so the user can see the error fields
    store.phase = 2
    return
  }
  store.phase = 3
  store.expLot = 0
}
</script>

<template>
  <v-card variant="outlined" class="rec-panel pa-4">
    <div class="rec-header" :style="{ height: store.lotHeaderH ? (store.lotHeaderH - 17) + 'px' : 'auto' }">
      <div class="rec-title">AI Recommendation</div>
      <p class="rec-subtitle">Best fit strategy based on your lot inputs</p>
    </div>

    <div class="rec-cards">
      <div
        v-for="card in lotCards"
        :key="card.lotId"
        class="rec-card"
        :class="{ active: store.selLot === card.index, dimmed: store.selLot !== card.index }"
        :style="{
          background: card.bg,
          borderLeftColor: card.borderCol,
          borderImage: card.borderImage,
          outlineColor: store.selLot === card.index ? card.outlineCol : 'transparent',
        }"
        @click="selectLot(card.index)"
      >
        <div class="rec-card-title" :style="{ color: card.titleCol }">
          {{ card.displayName }}
        </div>
        <div class="rec-card-sub text-caption text-grey-darken-1">{{ card.subtitle }}</div>
      </div>
    </div>

    <v-btn
      color="primary"
      variant="flat"
      block
      class="mt-4"
      append-icon="mdi-arrow-right"
      @click="seeDetails"
    >
      See details
    </v-btn>
  </v-card>
</template>

<style scoped>
.rec-panel {
  position: sticky;
  top: 32px;
  align-self: flex-start;
  max-height: calc(100vh - 80px);
  display: flex;
  flex-direction: column;
}
.rec-header {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.rec-cards {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
  scrollbar-width: thin;
  scrollbar-color: #D0D0D0 transparent;
}
.rec-cards::-webkit-scrollbar {
  width: 3px;
}
.rec-cards::-webkit-scrollbar-thumb {
  background: #D0D0D0;
  border-radius: 2px;
}
.rec-card {
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #E9EAEC;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
  flex-shrink: 0;
  height: 52px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  outline: 1.5px solid transparent;
  outline-offset: -1px;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}
.rec-card.active {
  opacity: 1;
}
.rec-card.dimmed {
  opacity: 0.65;
}
.rec-title {
  font-size: 14px;
  font-weight: 700;
  color: #1D1D1B;
  margin-bottom: 2px;
}
.rec-subtitle {
  font-size: 11px;
  color: #8E8E8E;
  margin: 0;
  line-height: 1.3;
}
.rec-card-title {
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}
.rec-card-sub {
  font-size: 10px;
  color: #61615F;
  font-weight: 500;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}
</style>
