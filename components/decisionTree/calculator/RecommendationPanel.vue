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
  ok: boolean
  isDouble: boolean
  subtitle: string
  bg: string
  borderCol: string
  outlineCol: string
  titleCol: string
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

    const subtitle = !ok
      ? 'Complete inputs'
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

    return {
      lotId: lot.id,
      index: li,
      family: f,
      ok,
      isDouble,
      subtitle,
      bg,
      borderCol,
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
  if (hasErr) return
  store.phase = 3
  store.expLot = 0
}
</script>

<template>
  <v-card variant="outlined" class="rec-panel pa-5">
    <div class="text-subtitle-1 font-weight-bold mb-1">AI Recommendation</div>
    <p class="text-caption text-grey-darken-1 mb-4">Best fit strategy based on your lot inputs</p>

    <div class="rec-cards">
      <div
        v-for="card in lotCards"
        :key="card.lotId"
        class="rec-card"
        :class="{ active: store.selLot === card.index, dimmed: store.selLot !== card.index }"
        :style="{
          background: card.bg,
          borderLeftColor: card.borderCol,
          outlineColor: store.selLot === card.index ? card.outlineCol : 'transparent',
        }"
        @click="selectLot(card.index)"
      >
        <div
          v-if="card.isDouble && card.ok"
          class="double-accent"
          :style="{
            background: `linear-gradient(180deg, ${engC.border} 0%, ${dutC.border} 100%)`,
          }"
        />
        <div class="rec-card-title" :style="{ color: card.titleCol }">
          {{ card.ok ? card.family : 'No suggestion' }}
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
.rec-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
  margin-right: -4px;
}
.rec-card {
  padding: 12px 14px;
  border-radius: 4px;
  border-left: 3px solid #E9EAEC;
  cursor: pointer;
  transition: opacity 0.15s, background 0.15s;
  flex-shrink: 0;
  outline: 1.5px solid transparent;
  outline-offset: -1px;
  position: relative;
  overflow: hidden;
}
.rec-card.active {
  opacity: 1;
}
.rec-card.dimmed {
  opacity: 0.65;
}
.double-accent {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
}
.rec-card-title {
  font-size: 13px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}
.rec-card-sub {
  font-size: 11px;
  color: #61615F;
  font-weight: 500;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
}
</style>
