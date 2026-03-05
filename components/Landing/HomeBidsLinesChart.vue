<template>
  <div class="outer-border" style="margin-bottom: -100px">
    <div class="inner-border">
      <v-card class="rounded-xl card-border">
        <v-container class="px-10">
          <LineChart
            :id="Date.now()"
            ref="line"
            :options="chartOptions"
            :data="chartData"
            class="crown-chart"
          />
        </v-container>
      </v-card>
    </div>
  </div>
</template>
<script>
import _ from 'lodash'
import { Line } from 'vue-chartjs'
import 'chart.js/auto'
import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'

function generateColor(labels) {
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

export default {
  components: { LineChart: Line },
  data() {
    return {
      NEWBids: [],
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
    chartData() {
      const bidsByComp = _.groupBy(this.NEWBids, (e) => e.profiles.companies.name)
      const colorsMap = generateColor(Object.keys(bidsByComp))
      const datasets = _.map(bidsByComp, (companyBids, company) => {
        const points = companyBids
          ? companyBids.map((bid) => {
              return {
                x: bid.created_at,
                y: bid.price
              }
            })
          : []

        return {
          label: company,
          data: points,
          fill: false,
          borderColor: colorsMap[company].secondary,
          tension: 0.1,
          pointBackgroundColor: colorsMap[company].secondary
        }
      })
      return {
        type: 'line',
        datasets
      }
    },
    chartOptions() {
      return {
        responsive: true,
        scales: {
          x: {
            type: 'time',
            min: this.startDate,
            max: this.endDate,
            time: {
              unit: 'minute',
              displayFormats: {
                minute: 'HH:mm',
                second: 'HH:mm'
              },
              tooltipFormat: 'HH:mm:ss'
            }
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
        },
        animations: {
          radius: {
            duration: 400,
            easing: 'linear',
            loop: (context) => context.active
          }
        }
      }
    }
  },
  mounted() {
    const globalFruitData = this.bidsChart.find((item) => item.name === 'GlobalFruit')
    const orcharFreshData = this.bidsChart.find((item) => item.name === 'OrchardFresh')
    const berryBlendData = this.bidsChart.find((item) => item.name === 'BerryBlend')
    const tropicalTasteData = this.bidsChart.find((item) => item.name === 'TropicalTaste')
    this.startAnimation(globalFruitData.price, 'GlobalFruit')
    this.startAnimation(orcharFreshData.price, 'OrchardFresh')
    this.startAnimation(berryBlendData.price, 'BerryBlend')
    this.startAnimation(tropicalTasteData.price, 'TropicalTaste')
  },

  methods: {
    updateChart(data, time, company) {
      this.NEWBids.push({
        created_at: time,
        price: data,
        profiles: { companies: { name: company } }
      })
    },
    startAnimation(priceData, company) {
      priceData.forEach((point) => {
        setTimeout(
          () => {
            this.updateChart(
              point.value,
              new Date(new Date().getTime() + parseFloat(point.time) * 1000).toISOString(),
              company
            )
          },
          parseFloat(point.time) * 1000
        )
      })
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
