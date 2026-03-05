<template>
  <v-card class="mx-auto fill-height max-height-chart">
    <v-container>
      <LineChart
        v-if="mounted"
        ref="line"
        :options="chartOptions"
        :data="chartData"
        class="crown-chart"
      />
    </v-container>
  </v-card>
</template>

<script>
import _ from 'lodash'
import { Line } from 'vue-chartjs'
import 'chart.js/auto'
// import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, TimeSeriesScale } from 'chart.js'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'

// ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, CategoryScale, LinearScale, TimeSeriesScale)

// 1711645459227

export default {
  components: { LineChart: Line },
  props: {
    endDate: { type: String, required: true },
    startDate: { type: String, required: true },
    timeUnit: { type: String, default: 'minute' },
    bidsTotalValue: { type: Array, required: true },
    suppliers: { type: Array, required: true },
    aggregatePrebids: { type: Boolean, default: true }
  },
  data() {
    return {
      mounted: false,
      colorsMap: {}
    }
  },
  computed: {
    // Truncate text to fit within a max character limit
    truncateText() {
      return (text, maxChars = 15) => {
        if (!text || text.length <= maxChars) return text
        return text.substring(0, maxChars) + '...'
      }
    },
    chartData() {
      const colorsMap = this.colorsMap
      const bidsByComp = _.groupBy(this.bidsTotalValue, (totalValue) => {
        return totalValue.seller.email
      })

      // console.log('bids in line chart', this.bidsTotalValue)

      const start = +new Date(this.startDate)

      const datasets = _.map(bidsByComp, (companyBids, sellerEmail) => {
        let points = companyBids
          ? companyBids
              .filter((b) => b.bid.type !== 'ceiling')
              .map((totalValue) => {
                const pDate = +new Date(totalValue.bid.created_at)
                const xValue =
                  this.aggregatePrebids && pDate < start
                    ? this.startDate
                    : totalValue.bid.created_at
                return {
                  x: xValue,
                  y: totalValue.totalBidPriceWithHandicaps
                }
              })
          : []

        if (this.aggregatePrebids) {
          const preBids = points.filter((p) => +new Date(p.x) <= start).sort((a, b) => b.y - a.y)
          const bids = points.filter((p) => {
            return +new Date(p.x) > start
          })
          points = preBids.length ? [...preBids, ...bids] : [...bids]
        }

        points = points.filter((point) => {
          const date = +new Date(point.x)
          const previousLowerBid = points.find((p) => {
            return +new Date(p.x) < date && p.y <= point.y
          })

          return !previousLowerBid && point.y > 0
        })

        const company =
          this.suppliers.find((s) => s.email === sellerEmail)?.companies?.name || sellerEmail

        return {
          label: company,
          data: points.sort((a, b) => new Date(a.x) - new Date(b.x)),
          borderWidth: 1,
          fill: false,
          backgroundColor: colorsMap[sellerEmail].chartLine,
          borderColor: colorsMap[sellerEmail].chartLine,
          tension: 0.1
        }
      })

      return {
        type: 'line',
        datasets
      }
    },
    chartOptions() {
      const truncateText = this.truncateText
      return {
        responsive: true,
        animation: {
          // duration: 0
        },
        plugins: {
          legend: {
            labels: {
              boxWidth: 20,
              boxHeight: 8,
              usePointStyle: false,
              padding: 16,
              font: {
                family: 'Poppins',
                size: 12,
                weight: 400
              },
              color: '#787878',
              generateLabels: (chart) => {
                const datasets = chart.data.datasets
                return datasets.map((dataset, i) => ({
                  text: truncateText(dataset.label, 20),
                  fillStyle: dataset.borderColor,
                  strokeStyle: dataset.borderColor,
                  hidden: !chart.isDatasetVisible(i),
                  datasetIndex: i,
                  borderRadius: 4
                }))
              }
            }
          },
          tooltip: {
            callbacks: {
              title: (items) => items[0]?.dataset?.label || ''
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            min: this.startDate,
            max: this.endDate,
            time: {
              unit: this.timeUnit,
              displayFormats: {
                minute: 'HH:mm',
                second: 'HH:mm'
              },
              tooltipFormat: 'HH:mm:ss'
            }
          }
        }
      }
    }
  },
  watch: {
    bidsTotalValue: {
      handler() {
        // console.log('bids in line chart', this.bidsTotalValue)
        if (this.$refs.line && this.$refs.line.chart) {
          this.$refs.line.chart.update()
        }
      },
      deep: true
    },
    startDate() {
      if (this.$refs.line && this.$refs.line.chart) {
        this.$refs.line.chart.update()
      }
    },
    endDate() {
      if (this.$refs.line && this.$refs.line.chart) {
        this.$refs.line.chart.update()
      }
    }
  },
  async mounted() {
    const { getColors } = useColorSchema()
    this.colorsMap = await getColors()
    this.mounted = true
    // console.log('ismounted with', this.colorsMap)
  },
  beforeUnmount() {
    this.$refs.line.chart.destroy()
  }
}
</script>

<style>
.crown-chart {
  max-height: 260px !important;
}
.max-height-chart {
  max-height: 300px !important;
  height: 300px !important;
}
</style>
