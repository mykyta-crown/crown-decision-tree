<template>
  <v-card>
    <v-card-text v-if="auction && rounds.length">
      <v-row>
        <v-col
          ref="chartView"
          cols="12"
          class="chart-view pl-4 pb-0"
          :class="scaleOption < rounds.length ? 'chart-view-scroll' : ''"
        >
          <svg :width="width" :height="height">
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#B1B1B166" />
              </filter>
            </defs>
            <g
              v-for="r in yAxisTicks"
              :key="r.price"
              class="y-axis"
              :class="r.index <= nbPassedRounds ? 'active' : ''"
              :transform="`translate(10, ${yScale(getDisplayPrice(r.price))})`"
              :opacity="isCollidingWithActive(r.price) ? 1 : 0"
            >
              <g transform="translate(0, 5)">
                <text class="round-number">{{ r.index + 1 }}</text>
                <text x="35">{{ formatNumber(getDisplayPrice(r.price)) }}</text>
              </g>
              <line
                :x1="marginLeft"
                :x2="width - marginRight * 2"
                :y1="0"
                :y2="0"
                :stroke="r.index === nbPassedRounds ? '#AEB0B2' : '#E9EAEC'"
                :stroke-dasharray="r.index === 0 ? '0' : '5'"
              />
            </g>
            <g
              class="y-axis active"
              :transform="`translate(10, ${yScale(getDisplayPrice(activeRound?.price))})`"
            >
              <g transform="translate(0, 5)">
                <text class="round-number">{{ nbPassedRounds + 1 }}</text>
                <text x="35">{{ formatNumber(getDisplayPrice(activeRound?.price)) }}</text>
              </g>
              <line
                :x1="marginLeft"
                :x2="width - marginRight * 2"
                :y1="0"
                :y2="0"
                :stroke="'#AEB0B2'"
                :stroke-dasharray="activeRound?.index === 0 ? '0' : '5'"
              />
            </g>
            <g
              v-for="seller in auction.auctions_sellers"
              :key="seller.seller_email"
              class="bids"
              :transform="`translate(${xScale(seller.seller_email)}, 0)`"
            >
              <line
                v-show="displayCeiling"
                :x1="0"
                :x2="xScale.bandwidth()"
                :y1="yScale(getDisplayPrice(ceilingPrices[seller.seller_email]))"
                :y2="yScale(getDisplayPrice(ceilingPrices[seller.seller_email]))"
                stroke="#F05252"
                :stroke-dasharray="activeRound?.index === 0 ? '0' : '5'"
              />
              <rect
                v-for="n in displayedPassedRounds"
                :key="`${seller.seller_email}-${n}`"
                :width="xScale.bandwidth()"
                :height="roundGap - 2"
                :y="yScale(getDisplayPrice(rounds[n - 1].price)) - roundGap + 1"
                :fill="colorsMap[seller.seller_email].ternary"
                rx="8"
              />
              <UseMouseInElement
                v-for="round in activeRounds[seller.seller_email]"
                :key="`${seller.seller_email}-${round.price}`"
                v-slot="{ isOutside }"
                class="active-round"
                as="g"
                :transform="`translate(0, ${yScale(getDisplayPrice(round.price))})`"
                @mouseenter="enterBid(round.price)"
              >
                <rect
                  :filter="!isOutside && lastMouseOveredPrice === round.price ? 'url(#shadow)' : ''"
                  :width="xScale.bandwidth()"
                  :height="roundGap - 2"
                  :y="-roundGap + 1"
                  :fill="
                    round.type.includes('bid') ? colorsMap[seller.seller_email].secondary : '#fff'
                  "
                  :stroke="colorsMap[seller.seller_email].secondary"
                  stroke-width="2"
                  rx="8"
                />
                <!-- Crown for the winner (only shown when auction is closed) -->
                <path
                  v-if="
                    status.label === 'closed' &&
                    round.type.includes('bid') &&
                    seller.seller_email === winnerEmail &&
                    round.price === winnerBid?.price
                  "
                  :transform="`translate(${xScale.bandwidth() / 2 - 9}, ${-roundGap - 16})`"
                  d="M1.73077 18L0 3.09278L5.32051 9.21649L10.0057 0L14.6795 9.21649L20 3.09278L18.2692 18H14.6795L10.0057 12.4159L5.32051 18H1.73077Z"
                  fill="#060606"
                />
                <g
                  v-if="
                    round.type === 'prebid' && !isOutside && lastMouseOveredPrice === round.price
                  "
                >
                  <rect
                    filter="url(#shadow)"
                    :width="xScale.bandwidth()"
                    :height="20"
                    fill="white"
                    rx="4"
                    :y="-roundGap - 22"
                    x="0"
                  />
                  <text text-anchor="middle" :x="xScale.bandwidth() / 2" :y="-roundGap - 7">
                    {{ round.date }} at {{ round.hour }}
                  </text>
                </g>

                <foreignObject
                  v-show="scaleOption <= 20 || (!isOutside && lastMouseOveredPrice === round.price)"
                  :x="0"
                  :y="-roundGap + 4"
                  :width="xScale.bandwidth()"
                  height="20"
                >
                  <div class="round-identifier-html">
                    {{ seller.identifier }}
                    <v-tooltip activator="parent" location="top">
                      {{ seller.identifier }}
                    </v-tooltip>
                  </div>
                </foreignObject>
                <text
                  v-show="
                    scaleOption === 10 || (!isOutside && lastMouseOveredPrice === round.price)
                  "
                  class="round-price"
                  :y="-roundGap + 34"
                  :x="xScale.bandwidth() / 2"
                  text-anchor="middle"
                >
                  {{ round.type === 'prebid' ? 'Pre-bid ' : ''
                  }}{{ formatNumber(getDisplayPrice(round.price)) }}
                </text>
              </UseMouseInElement>
            </g>
          </svg>
        </v-col>
        <v-col class="d-flex align-center chart-controls">
          <span>Round</span>
          <span class="ml-4">Price</span>
          <v-checkbox v-model="displayCeiling" hide-details density="compact" class="ml-8">
            <template #label>
              <span class="chart-controls">Ceiling price</span>
            </template>
          </v-checkbox>
          <v-spacer />
          <v-select
            v-model="scaleOption"
            :items="selectOptions"
            item-title="text"
            item-value="value"
            class="max-btn-height mr-4"
            color="black"
            dense
            outlined
            hide-details
          >
            <template #selection="{ item }">
              <span class="text-body-2">
                {{ item.title }}
              </span>
            </template>
          </v-select>
          <div>
            <v-btn
              value="#graph"
              size="small"
              class="text-grey max-height mr-2"
              :class="roundsDisplay === '#graph' ? 'active-btn' : ''"
            >
              <span class="text-body-2">Graph</span>
            </v-btn>
            <v-btn
              value="#blocks"
              size="small"
              class="text-grey max-height"
              @click="roundsDisplay = '#blocks'"
            >
              <span class="text-body-2">Blocks</span>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
    <v-card-text v-else>
      <v-row justify="center" align="center" class="fill-height chart-loader">
        <v-progress-circular indeterminate :size="128" color="grey" />
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import dayjs from 'dayjs'
import { ref } from 'vue'
import { useElementSize } from '@vueuse/core'
import { UseMouseInElement } from '@vueuse/components'
import { ticks } from 'd3'
import { scaleLinear, scaleBand } from 'd3-scale'
import useCeilingPrice from '../../composables/useCeilingPrice'

const props = defineProps({
  pricePerUnit: {
    type: Boolean,
    default: false
  }
})

const roundsDisplay = defineModel()

const displayCeiling = ref(true)
const route = useRoute()

const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })

const { nbPassedRounds, activeRound, rounds, startingPrice, endingPrice, status } =
  useDutchRounds(auction)

// Determine the single winner reactively from bids data (updates when new bids arrive via realtime)
// For Dutch: first check actual bids, then fall back to prebids (lowest price = winner)
const winnerBid = computed(() => {
  const bids = auction.value?.bids
  if (!bids?.length) return null

  const actualBid = bids
    .filter((b) => b.type === 'bid')
    .sort((a, b) => a.price - b.price || new Date(a.created_at) - new Date(b.created_at))[0]
  if (actualBid) return actualBid

  return (
    bids
      .filter((b) => b.type === 'prebid')
      .sort((a, b) => a.price - b.price || new Date(a.created_at) - new Date(b.created_at))[0] ||
    null
  )
})
const winnerEmail = computed(() => {
  return winnerBid.value?.profiles?.email || winnerBid.value?.seller_email || null
})

const getDisplayPrice = (price) => {
  if (!props.pricePerUnit || !price) return price
  return price / (auction.value?.supplies?.[0]?.quantity || 1)
}

const selectOptions = [
  {
    value: rounds.value.length,
    key: 'all',
    text: 'All rounds'
  },
  {
    value: 10,
    key: '10',
    text: '10 rounds'
  }
]
if (rounds.value.length > 20) {
  selectOptions.push({
    value: 20,
    key: '20',
    text: '20 rounds'
  })
}

const chartView = ref(null)

const scaleOption = ref(rounds.value.length)

const spaceByRound = computed(() => {
  const scaledSpace = 440 / scaleOption.value
  // return scaledSpace
  return scaledSpace > 44 ? 44 : scaledSpace
})

const { width } = useElementSize(chartView)
const height = computed(() => {
  const calculatedHeight = rounds.value.length * spaceByRound.value
  return calculatedHeight < 440 ? calculatedHeight + 30 : calculatedHeight
})
const marginTop = 45
const marginBottom = 10
const marginLeft = 100
const marginRight = 10

const xScale = computed(() => {
  if (!auction.value || !auction.value.auctions_sellers) return null
  return scaleBand(
    auction.value.auctions_sellers.map((s) => s.seller_email),
    [marginLeft, width.value - marginRight]
  )
    .paddingOuter(0.1)
    .paddingInner(0.2)
})

const yScale = computed(() => {
  return scaleLinear(
    [getDisplayPrice(endingPrice.value), getDisplayPrice(startingPrice.value)],
    [marginTop, height.value - marginBottom]
  )
})

const roundGap = computed(() => {
  if (rounds.value.length < 2) return spaceByRound.value
  return Math.abs(
    yScale.value(getDisplayPrice(rounds.value[1].price)) -
      yScale.value(getDisplayPrice(rounds.value[0].price))
  )
})

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const displayedPassedRounds = computed(() => {
  return nbPassedRounds.value > 0 ? nbPassedRounds.value : 0
})

const yAxisTicks = computed(() => {
  const nbTicks = scaleOption.value > 20 ? 10 : rounds.value.length
  // const nbTicks = 10
  const axisTicks = ticks(1, rounds.value.length, nbTicks)

  return axisTicks.map((roundIndex) => {
    return Object.assign(
      {
        index: roundIndex - 1
      },
      rounds.value[roundIndex - 1]
    )
  })
})

const activeRounds = computed(() => {
  const sellerMap = {}

  // Find the single winning bid to filter out race condition duplicates
  const winningBid = auction.value.bids
    .filter((b) => b.type === 'bid')
    .sort((a, b) => a.price - b.price || new Date(a.created_at) - new Date(b.created_at))[0]

  auction.value.auctions_sellers.forEach((seller) => {
    sellerMap[seller.seller_email] = []

    auction.value.bids.forEach((bid) => {
      if (bid.seller_id === seller.seller_profile?.id) {
        // Skip non-winning bids from race conditions
        if (bid.type === 'bid' && winningBid && bid.id !== winningBid.id) return

        sellerMap[seller.seller_email].push({
          date: dayjs(bid.created_at).format('DD MMM'),
          hour: dayjs(bid.created_at).format('HH:mm'),
          price: bid.price,
          type: bid.type,
          rank: bid.rank
        })
      }
    })

    const bid = sellerMap[seller.seller_email].find((b) => b.type === 'bid')
    if (bid) {
      const samePrebidIndex = sellerMap[seller.seller_email].findIndex((b) => {
        return b.type === 'prebid' && b.price === bid.price
      })

      if (samePrebidIndex >= 0) {
        sellerMap[seller.seller_email].splice(samePrebidIndex, 1)
      }
    }

    if (!bid) {
      sellerMap[seller.seller_email].push({
        price: activeRound.value
          ? activeRound.value.price
          : rounds.value[rounds.value.length - 1].price,
        type: 'activeRound'
      })
    }

    sellerMap[seller.seller_email].sort((a) => {
      return a.type !== 'bid' ? -1 : 1
    })
  })

  return sellerMap
})

const lastMouseOveredPrice = ref(null)

function enterBid(price) {
  lastMouseOveredPrice.value = price
}

const { ceilingSupplies } = useCeilingPrice(route.params.auctionId)

const ceilingPrices = computed(() => {
  const sellerMap = {}

  auction.value.auctions_sellers.forEach((seller) => {
    const totalCeiling = ceilingSupplies.value.reduce((price, supplie) => {
      const sellerUnitCeiling =
        supplie.supplies_sellers.find((s) => s.seller_email === seller.seller_email)?.ceiling || 0
      return price + supplie.quantity * sellerUnitCeiling
    }, 0)
    sellerMap[seller.seller_email] = totalCeiling
  })

  return sellerMap
})

function isCollidingWithActive(price) {
  const collidingObjectPos = yScale.value(getDisplayPrice(price))
  const activePricePos = yScale.value(getDisplayPrice(activeRound.value?.price))

  const textHeight = 12

  return (
    collidingObjectPos + textHeight < activePricePos || // g1 is above g2
    collidingObjectPos > activePricePos + textHeight
  ) // g1 is below g2
}
</script>

<style scoped>
.chart-loader {
  min-height: 458px;
}

.chart-view {
  max-height: 458px;
  font-size: 12px !important;
}

.chart-view-scroll {
  overflow-y: scroll;
}

.chart-controls,
.chart-controls label,
.chart-controls .v-btn {
  max-height: 42px;
  font-size: 12px !important;
}

.y-axis text {
  fill: #8e8e8e;
}

.y-axis.active text {
  fill: #363633 !important;
}

.y-axis.active text.round-number {
  font-weight: bold;
}

.round-identifier {
  font-size: 10px;
}

.round-identifier-html {
  font-size: 10px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
  box-sizing: border-box;
}

.round-price {
  font-size: 14px;
  font-weight: bold;
}

.active-round {
  cursor: pointer;
}

.hovered-round {
  box-shadow: 0px 4px 20px 0px #b1b1b166;
}
.max-btn-height {
  color: black !important;
  max-width: 130px;
}
.max-btn-height:deep(.v-field__overlay) {
  color: black !important;
  border: 1px solid black !important;
}
.max-btn-height:deep(.v-field, .v-field__input) {
  max-height: 30px !important;
  display: flex;
  align-items: center;
}
.max-height {
  max-height: 30px;
}
.active-btn {
  color: black !important;
  /* box-shadow: 1px 1px 0px 1px rgb(var(--v-theme-grey))!important; */
}
</style>
