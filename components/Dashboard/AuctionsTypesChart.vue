<template>
  <v-row class="fill-height pb-8" align="center" justify="center">
    <v-col ref="chartView" cols="12" class="chart-view">
      <svg :width="width" :height="height">
        <g :transform="`translate(${width / 2}, ${height / 2})`">
          <!-- Donut chart arcs -->
          <path
            v-for="(arc, i) in arcs"
            :key="i"
            :d="arc.path"
            :fill="colors[i].fill"
            :stroke="colors[i].border"
            :stroke-width="1"
            class="donut-segment"
            @mouseover="handleMouseOver($event, arc.data)"
            @mousemove="handleMouseMove($event, arc.data)"
            @mouseleave="handleMouseLeave"
          />
          <!-- Center text -->
          <g>
            <text
              text-anchor="middle"
              dominant-baseline="middle"
              y="-10"
              font-size="20"
              font-weight="bold"
              fill="#333"
            >
              {{ totalCount }}
            </text>
            <text y="20" text-anchor="middle" font-size="14" fill="grey">
              {{ t('cards.allAuctions') }}
            </text>
          </g>
        </g>
      </svg>
      <div
        v-if="tooltipData"
        class="tooltip-container"
        :style="{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`
        }"
      >
        <div class="tooltip-content">
          <div class="tooltip-title">
            {{ formatLabel(tooltipData.key) }}
          </div>
          <div class="tooltip-value">
            {{ tooltipData.value }}
          </div>
        </div>
      </div>
    </v-col>
    <v-col cols="12">
      <!-- Legend -->
      <v-row>
        <v-col v-for="(value, key) in eAuctionsCount" :key="key" cols="6" class="custom-pa">
          <div class="d-flex align-center max-width-column">
            <div class="d-flex align-center flex-grow-1 flex-shrink-0">
              <v-badge
                :color="getColorForType(key).fill"
                class="mr-1"
                :class="`badge-${key}`"
                inline
                dot
              />
              <span>{{ formatLabel(key) }}</span>
            </div>
            <v-divider
              class="border-dashed text-grey-ligthen-2 mx-2 flex-grow-0 flex-shrink-1"
              thickness="0.15em"
            />
            <span class="flex-grow-1">{{ value }}</span>
          </div>
        </v-col>
      </v-row>
    </v-col>
  </v-row>
</template>

<script setup>
import { uniqBy, groupBy, mapValues, mapKeys } from 'lodash'
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'
import * as d3 from 'd3'
import dayjs from 'dayjs'
const route = useRoute()
const supabase = useSupabaseClient()
const { t } = useTranslations()

const chartView = ref(null)
const { width, height } = useElementSize(chartView)
const model = defineModel()
const eAuctionsCount = ref({
  english: 0,
  dutch: 0,
  japanese: 0,
  long: 0
})

watch(
  [route, model],
  async () => {
    let auctionQuery = supabase
      .from('auctions')
      .select('type, auctions_group_settings_id)')
      .eq('deleted', false)
      .eq('published', true)
      .eq('usage', 'real')

    if (route.query.company) {
      auctionQuery = auctionQuery.eq('company_id', route.query.company)
    }

    if (model.value) {
      const currentViewDate = dayjs().month(model.value - 1)
      const startOfMonth = currentViewDate.startOf('month').format('YYYY-MM-DD')
      const endOfMonth = currentViewDate.endOf('month').format('YYYY-MM-DD')
      auctionQuery = auctionQuery.lt('start_at', endOfMonth).gt('start_at', startOfMonth)
    }

    const { data: auctions } = await auctionQuery

    const groupedAuctions = groupBy(uniqBy(auctions, 'auctions_group_settings_id'), 'type')
    const typesCounts = mapValues(groupedAuctions, (auctionsGroup) => auctionsGroup.length)

    const typesLabels = {
      reverse: 'english',
      'sealed-bid': 'sealedBid'
    }

    eAuctionsCount.value = mapKeys(typesCounts, (_, typeKey) => {
      return typesLabels[typeKey] || typeKey
    })
  },
  { immediate: true }
)

// Colors for each auction type
const colors = ref([
  { fill: '#EDEBFE', border: '#CABFFD' },
  { fill: '#FDFFD2', border: '#FCE96A' },
  { fill: '#DFF0FF', border: '#A4CAFE' },
  { fill: '#FFF1E3', border: '#FFA878' }
])

// Tooltip data
const tooltipData = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

// Configuration for the donut chart
const cornerRadius = 5 // Adjust this value to change the roundness
const padAngle = 0.015 // Space between segments

// Computed total count
const totalCount = computed(() => {
  return Object.values(eAuctionsCount.value).reduce((sum, count) => sum + count, 0)
})

// Format key as label
const formatLabel = (key) => {
  const translationKey = `components.auctionsDatatable.auctionTypes.${key}`
  const translated = t(translationKey)

  // If translation exists, use it, otherwise fallback to capitalized key
  return translated !== translationKey ? translated : key.charAt(0).toUpperCase() + key.slice(1)
}

// Get color for auction type
const getColorForType = (type) => {
  const types = Object.keys(eAuctionsCount.value)
  const index = types.indexOf(type)
  return colors.value[index]
}

// Create arcs for the donut chart
const arcs = computed(() => {
  if (!width.value || !height.value) return []

  const radius = (Math.min(width.value, height.value) / 2) * 1
  const innerRadius = radius * 0.55

  const pie = d3
    .pie()
    .value((d) => d.value)
    .sort(null)
    .padAngle(padAngle)

  const arcGenerator = d3
    .arc()
    .innerRadius(innerRadius)
    .outerRadius(radius)
    .cornerRadius(cornerRadius)

  const data = Object.entries(eAuctionsCount.value)
    .map(([key, value]) => ({ key, value }))
    .filter((d) => d.value > 0)

  return pie(data).map((d) => ({
    data: d.data,
    path: arcGenerator(d)
  }))
})

// Handle mouse over event
const handleMouseOver = (event, data) => {
  tooltipData.value = data
  updateTooltipPosition(event)
}

// Handle mouse move event to update tooltip position
const handleMouseMove = (event, data) => {
  if (tooltipData.value) {
    updateTooltipPosition(event)
  }
}

// Update tooltip position based on mouse coordinates
const updateTooltipPosition = (event) => {
  // Get the chart container's position
  const chartRect = chartView.value.$el.getBoundingClientRect()

  // Calculate the position relative to the chart container
  const mouseX = event.clientX - chartRect.left
  const mouseY = event.clientY - chartRect.top

  // Add a small offset so the tooltip doesn't cover the cursor
  tooltipPosition.value = {
    x: mouseX,
    y: mouseY - 15
  }
}

// Handle mouse leave event
const handleMouseLeave = () => {
  tooltipData.value = null
}
</script>

<style scoped>
.chart-view {
  min-height: 230px;
  max-height: 230px;
  font-size: 12px !important;
  position: relative;
}

.donut-segment {
  transition: opacity 0.2s ease;
  cursor: pointer;
}

.donut-segment:hover {
  opacity: 0.7;
  filter: blur(0.5px);
}

.tooltip-container {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
  transition:
    left 0.1s ease,
    top 0.1s ease;
}

.tooltip-content {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  min-width: 80px;
  text-align: center;
}

.tooltip-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.tooltip-value {
  font-weight: bold;
}

.badge-english:deep(.v-badge__badge) {
  border: 1px solid #e8c482 !important;
  width: 12px !important;
  height: 12px !important;
  border-radius: 100%;
}
.badge-dutch:deep(.v-badge__badge) {
  border: 1px solid #cabffd !important;
  width: 12px !important;
  height: 12px !important;
  border-radius: 100%;
}
.badge-japanese:deep(.v-badge__badge) {
  width: 12px !important;
  height: 12px !important;
  border: 1px solid #ffa878 !important;
  border-radius: 100%;
}
.badge-sealedBid:deep(.v-badge__badge) {
  width: 12px !important;
  height: 12px !important;
  border: 1px solid #7886ff !important;
  border-radius: 100%;
}
.custom-pa {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}
.max-width-column {
  max-width: 140px;
}
</style>
