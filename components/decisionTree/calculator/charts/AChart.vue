<template>
  <component :is="chartComponent" :color="color" :ccy="ccy" :animated="animated" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import ChartEnglish from './ChartEnglish.vue'
import ChartDutch from './ChartDutch.vue'
import ChartSealedBid from './ChartSealedBid.vue'
import ChartJapanese from './ChartJapanese.vue'
import ChartDoubleScenario from './ChartDoubleScenario.vue'
import ChartTraditional from './ChartTraditional.vue'

const props = withDefaults(defineProps<{
  family: string
  color: string
  ccy?: string
  animated?: boolean
}>(), {
  ccy: 'EUR',
  animated: false,
})

const chartComponent = computed(() => {
  switch (props.family) {
    case 'English':
      return ChartEnglish
    case 'Dutch':
      return ChartDutch
    case 'Sealed Bid':
      return ChartSealedBid
    case 'Japanese':
      return ChartJapanese
    case 'Double Scenario':
      return ChartDoubleScenario
    case 'Traditional':
      return ChartTraditional
    default:
      return ChartTraditional
  }
})
</script>
