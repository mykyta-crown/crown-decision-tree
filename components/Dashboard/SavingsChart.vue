<template>
  <v-row align="start">
    <v-col ref="chartView" cols="12" class="chart-view">
      <svg :width="width" :height="height">
        <g :transform="`translate(${margin.left}, ${margin.top})`">
          <!-- Y Axis Grid Lines -->
          <g class="grid-lines">
            <line
              v-for="(tick, index) in yTicks"
              :key="tick"
              x1="0"
              :x2="chartWidth"
              :y1="yScale(tick)"
              :y2="yScale(tick)"
              stroke="#e5e5e5"
              :stroke-dasharray="index === 0 ? '0' : '5.5'"
            />
          </g>

          <!-- Y Axis -->
          <g class="y-axis">
            <g v-for="tick in yTicks" :key="tick" :transform="`translate(-12, ${yScale(tick)})`">
              <text
                text-anchor="end"
                dominant-baseline="middle"
                font-size="14"
                fill="rgba(120, 120, 120, 1)"
              >
                {{ formatYAxisLabel(tick) }}
              </text>
            </g>
          </g>

          <!-- Bars -->
          <g class="bars">
            <rect
              v-for="(category, i) in categories"
              :key="category"
              :x="xScale(category)"
              :y="yScale(Math.max(0, values[i]))"
              :width="xScale.bandwidth()"
              :height="Math.max(0, chartHeight - yScale(values[i]))"
              :fill="colors[i]"
              rx="4"
              class="bar-hover"
              @mouseover="handleMouseOver(category, values[i], i)"
              @mouseleave="handleMouseLeave"
            />
          </g>

          <!-- Legend -->
          <g class="legend" :transform="`translate(${chartWidth / 2 - 100}, ${chartHeight + 56})`">
            <g
              v-for="(category, i) in categories"
              :key="category"
              :transform="`translate(${i * 120}, 0)`"
            >
              <circle :fill="colors[i]" r="6" />
              <text x="12" y="4" font-size="14" fill="#333">{{ category }}</text>
            </g>
          </g>
          <g v-if="!savings" class="no-savings-overlay">
            <rect
              :x="chartWidth / 2 - 100"
              :y="chartHeight / 2 - 30"
              rx="16"
              ry="16"
              width="200"
              height="60"
              fill="#f5f5f5"
              stroke="#bdbdbd"
              stroke-width="2"
              opacity="0.95"
            />
            <text
              :x="chartWidth / 2"
              :y="chartHeight / 2 + 6"
              text-anchor="middle"
              font-size="14"
              font-weight="bold"
              fill="#888"
            >
              {{ t('cards.noSavingsYet') }}
            </text>
          </g>
        </g>
      </svg>

      <!-- Custom Tooltip -->
      <div
        v-if="tooltipData"
        class="tooltip-container"
        :style="{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`
        }"
      >
        <div class="tooltip-content text-body-1">
          <span class="font-weight-bold">
            {{ formatNumber(tooltipData.value) }}
          </span>
          <span>EUR</span>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useElementSize } from '@vueuse/core'
import { scaleLinear, scaleBand } from 'd3-scale'
import formatNumber from '@/utils/formatNumber.js'
import dayjs from 'dayjs'

const props = defineProps({
  companyId: {
    type: String,
    default: null
  },
  companies: {
    type: Array,
    default: () => []
  }
})
// Use translations
const { t } = useTranslations()

const model = defineModel()
const supabase = useSupabaseClient()
const chartView = ref(null)
const { width, height } = useElementSize(chartView)

const selectedDate = computed(() => {
  if (model.value) {
    return dayjs()
      .month(model.value - 1)
      .format('YYYY-MM-DD')
  } else {
    return null
  }
})

// const startDate = computed(() => {
//   if (model.value) {
//     return dayjs().month(model.value - 1).startOf('month')
//   }
//   return dayjs('2020-01-01').startOf('month')
// })

// const endDate = computed(() => {
//   if (model.value) {
//     return dayjs().month(model.value - 1).endOf('month')
//   }
//   return dayjs().endOf('month')
// })

const savings = ref(0)
const spend = ref(0)

// const fetchTotalSavings = async(date, companyId) => {
//   const { data } = await supabase.rpc('get_total_savings', {
//     p_date: date,
//     p_company_id: companyId
//   })

//   savings.value = data || 0
// }
// // Data
// const spend = ref(0)

// async function fetchTotalBaselines() {
//   // console.log({
//   //   p_start_date: startDate.value.format('YYYY-MM-DD'),
//   //   p_end_date: endDate.value.format('YYYY-MM-DD'),
//   // })
//   const companyIds = props.companyId ? [props.companyId] : props.companies.map((c) => c.id)
//   const { data: totalBaseline } = await supabase
//     .rpc('get_total_baseline_v2', {
//       p_start_date: startDate.value.format('YYYY-MM-DD'),
//       p_end_date: endDate.value.format('YYYY-MM-DD'),
//       p_company_ids: companyIds
//     })

//   // console.log('error', error, props.companyId)

//   spend.value = totalBaseline || 0
// }

watch(
  [() => props.companyId, model],
  async () => {
    savings.value = 0
    spend.value = 0

    const { data: auctionsSavings } = await supabase.rpc('get_auctions_savings_data', {
      p_date: selectedDate.value || null,
      p_company_id: props.companyId || null
    })

    auctionsSavings.forEach((a) => {
      if (a.baseline_price != null && a.lowest_price != null && a.baseline_price > a.lowest_price) {
        savings.value += a.baseline_price - a.lowest_price
      }
      if (a.baseline_price != null) {
        spend.value += a.baseline_price
      }
    })
  },
  { immediate: true }
)
// const savings = 550000

// Tooltip data
const tooltipData = ref(null)
const tooltipPosition = ref({ x: 0, y: 0 })

const categories = computed(() => [t('cards.spend'), t('cards.savings')])
const values = computed(() => [spend.value, savings.value])
const colors = ['rgba(190, 245, 223, 1)', '#4aca77'] // Light green for Spend, Dark green for Savings

// Chart dimensions
const margin = { top: 5, right: 0, bottom: 80, left: 65 }

const chartWidth = computed(() => width.value - margin.left - margin.right)
const chartHeight = computed(() => height.value - margin.top - margin.bottom)

// Scales
const xScale = computed(() =>
  scaleBand().domain(categories.value).range([0, chartWidth.value]).padding(0.3)
)
// Calcule savings = baseline et best avec handicap
const yScale = computed(() =>
  scaleLinear()
    .domain([0, Math.max(spend.value, savings.value) * 1.05]) // Add 5% padding at top
    .range([chartHeight.value, 0])
)

// Y-axis ticks
const yTicks = computed(() => {
  return yScale.value.ticks(6)
})

// Format Y-axis labels (0, 100k, 200k, etc.)
const formatYAxisLabel = (value) => {
  if (value === 0) return '0'
  if (value < 1000) return value
  return `${Math.floor(value / 1000)}k`
}

const handleMouseOver = (category, value) => {
  // Set tooltip data
  tooltipData.value = {
    category,
    value
  }

  // Position tooltip above the bar
  // Calculate position based on the bar's position in the chart
  const barX = xScale.value(category) + xScale.value.bandwidth() / 2 + margin.left
  const barY = yScale.value(value) + margin.top - 10 // Offset to position above the bar

  tooltipPosition.value = {
    x: barX,
    y: barY
  }
}

const handleMouseLeave = () => {
  tooltipData.value = null
}
</script>

<style scoped>
.chart-view {
  min-height: 344px;
  max-height: 344px;
  font-size: 12px !important;
  position: relative;
}

.bar-hover {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.bar-hover:hover {
  opacity: 0.8;
}

.tooltip-container {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
  transform: translate(-50%, -100%);
}

.tooltip-content {
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  padding: 8px 12px;
  min-width: 80px;
  text-align: center;
}

.tooltip-content:after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  /* margin-left: -8px; */
  border-width: 8px;
  border-style: solid;
  border-color: white transparent transparent transparent;
}

.tooltip-value {
  font-weight: bold;
  color: #4aca77;
}
</style>
