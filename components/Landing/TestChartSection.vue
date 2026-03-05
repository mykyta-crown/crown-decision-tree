<template>
  <div class="outer-border">
    <div class="inner-border">
      <v-card class="rounded-xl card-border">
        <v-container class="px-10">
          <canvas ref="myChartCanvas" />
        </v-container>
        <v-btn @click="addData"> Add Data </v-btn>
      </v-card>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import Chart from 'chart.js/auto'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'

export default {
  data() {
    return {
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + 60 * 800).toISOString(),
      bidsChart: [
        {
          name: 'OrchardFresh',
          price: [
            { time: '0', value: 2120000 },
            { time: '1.5', value: 2040000 },
            { time: '2.5', value: 1950000 },
            { time: '8.4', value: 1890000 },
            { time: '8.5', value: 1800000 },
            { time: '11.5', value: 1760000 },
            { time: '13.8', value: 1740000 },
            { time: '17.5', value: 1690000 }
          ]
        },
        {
          name: 'BerryBlend',
          price: [
            { time: '0', value: 2000000 },
            { time: '5', value: 1980000 },
            { time: '8', value: 1910000 },
            { time: '8.4', value: 1800000 },
            { time: '13', value: 1770000 }
          ]
        },
        {
          name: 'GlobalFruit',
          price: [
            { time: '0', value: 2080000 },
            { time: '1.9', value: 2070000 },
            { time: '4.8', value: 2050000 },
            { time: '6', value: 2020000 },
            { time: '6.5', value: 2010000 },
            { time: '7', value: 1995000 },
            { time: '7.5', value: 1990000 },
            { time: '9.5', value: 1910000 },
            { time: '11.8', value: 1805000 },
            { time: '16', value: 1700000 }
          ]
        },
        {
          name: 'TropicalTaste',
          price: [
            { time: '0', value: 2210000 },
            { time: '2.2', value: 2180000 },
            { time: '6', value: 2145000 },
            { time: '8.2', value: 1950000 },
            { time: '11.2', value: 1920000 }
          ]
        }
      ]
    }
  },
  computed: {
    NEWBids() {
      return this.bidsChart.flatMap((e) => {
        return e.price.map((f) => ({
          created_at: new Date(new Date().getTime() + parseFloat(f.time) * 1000).toISOString(),
          price: f.value,
          profiles: { companies: { name: e.name } }
        }))
      })
    },
    chartData() {
      const bidsByComp = _.groupBy(this.NEWBids, (e) => e.profiles.companies.name)
      const colorsMap = this.generateColor(Object.keys(bidsByComp))
      return _.map(bidsByComp, (companyBids, company) => {
        const points = companyBids.map((bid) => ({
          x: bid.created_at,
          y: bid.price
        }))

        return {
          label: company,
          data: points,
          fill: false,
          borderColor: colorsMap[company].secondary,
          tension: 0.1,
          pointBackgroundColor: colorsMap[company].secondary
        }
      })
    }
  },
  mounted() {
    this.createChart()
  },
  methods: {
    createChart() {
      const totalDuration = 5000
      const ctx = this.$refs.myChartCanvas.getContext('2d')
      const delayBetweenPoints = totalDuration / this.chartData[0].data.length

      const animation = {
        x: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: NaN,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.xStarted) {
              return 0
            }
            ctx.xStarted = true
            return ctx.index * delayBetweenPoints
          }
        },
        y: {
          type: 'number',
          easing: 'linear',
          duration: delayBetweenPoints,
          from: (ctx) =>
            ctx.index === 0
              ? ctx.chart.scales.y.getPixelForValue(1500000)
              : ctx.chart.getDatasetMeta(ctx.datasetIndex).data[ctx.index - 1].getProps(['y'], true)
                  .y,
          delay(ctx) {
            if (ctx.type !== 'data' || ctx.yStarted) {
              return 0
            }
            ctx.yStarted = true
            return ctx.index * delayBetweenPoints
          }
        }
      }

      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: this.chartData
        },
        options: {
          responsive: true,
          scales: {
            x: {
              type: 'time'
            },
            y: {
              min: 1500000,
              max: 2220200
            }
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
                color: '#787878'
              }
            },
            title: {
              display: true,
              text: 'Price (EUR)',
              align: 'start',
              padding: { top: 30, bottom: -40 }
            }
          },
          animation,
          elements: {
            point: {
              zIndex: 10000,
              radius: 3,
              pointStyle: 'circle'
            }
          },
          interaction: {
            mode: 'nearest',
            intersect: false,
            axis: 'x'
          }
        }
      })
    },
    addData() {
      this.chartInstance.data.datasets.forEach((dataset) => {
        dataset.data.push({
          x: new Date().toISOString(),
          y: 2000000
        })
      })
      this.chartInstance.update()
    },
    generateColor(labels) {
      const colors = [
        'RGBA(4, 176, 100, 1)',
        'RGBA(64, 116, 162, 1)',
        'RGBA(173, 109, 232, 1)',
        'RGBA(237, 135, 19, 1)'
      ]
      return labels.reduce((acc, label, index) => {
        acc[label] = {
          primary: colors[index],
          secondary: colors[index].slice(0, -2) + '0.5)'
        }
        return acc
      }, {})
    }
  }
}
</script>

<style scoped>
#chartjs-tooltip {
  opacity: 1;
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  border-radius: 3px;
  box-shadow: 0px 3px 6px rgba(0, 0, 0, 0.1);
  padding: 10px;
  pointer-events: none;
  z-index: 1000;
}
.card-border.v-card {
  border: 0px;
}
.inner-border {
  border: 10px solid rgb(255, 255, 255, 0.3);
  border-radius: 25px;
}
.outer-border {
  border: 1px solid rgb(255, 255, 255);
  border-radius: 25px;
}
</style>
