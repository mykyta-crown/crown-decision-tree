<template>
  <v-card>
    <v-card-text v-if="auction && rounds.length">
      <v-row>
        <v-col ref="chartView" cols="12" class="chart-view pl-4 pb-0">
          <svg :width="width" :height="height">
            <mask
              id="mask0_4551_13531"
              style="mask-type: alpha"
              maskUnits="userSpaceOnUse"
              x="0"
              y="0"
              width="20"
              height="18"
            >
              <path
                d="M1.73077 18L0 3.09278L5.32051 9.21649L10.0057 0L14.6795 9.21649L20 3.09278L18.2692 18H14.6795L10.0057 12.4159L5.32051 18H1.73077Z"
                fill="#727272"
              />
            </mask>
            <defs>
              <filter id="shadow">
                <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="#B1B1B166" />
              </filter>
            </defs>
            <g
              v-for="r in yAxisTicks"
              :key="r.price"
              class="y-axis"
              :class="r.index <= displayedTrueRound ? 'active' : ''"
              :transform="`translate(10, ${yScale(getDisplayPrice(r.price))})`"
              :opacity="isCollidingWithActive(r.price) ? 1 : 0"
            >
              <g transform="translate(0, -5)">
                <text class="round-number">{{ r.index }}</text>
                <text x="35">{{ formatNumber(getDisplayPrice(r.price)) }}</text>
              </g>
              <line
                :x1="marginLeft"
                :x2="width - marginRight * 2"
                :y1="0"
                :y2="0"
                :stroke="'#E9EAEC'"
                :stroke-dasharray="r.index === 0 ? '0' : '5'"
              />
            </g>
            <g
              class="y-axis active"
              :transform="`translate(10, ${yScale(getDisplayPrice(status.label === 'closed' ? lowestRound?.price : activeRound?.price))})`"
            >
              <g transform="translate(0, -5)">
                <text class="round-number">{{ displayedTrueRound + 1 }}</text>
                <text x="35">
                  {{
                    formatNumber(
                      getDisplayPrice(
                        status.label === 'closed' ? lowestRound?.price : activeRound?.price
                      )
                    )
                  }}
                </text>
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
              <rect
                v-for="(n, i) in displayedPassedRounds"
                :key="`${seller.seller_email}-${n}`"
                :width="xScale.bandwidth()"
                :height="spaceByRound - 4"
                :y="yScale(getDisplayPrice(rounds[i].price)) - spaceByRound + 2"
                :fill="
                  isOutsideSupplierBids(seller.seller_email, rounds[i].price)
                    ? colorsMap[seller.seller_email].ternary
                    : '#F8F8F8'
                "
                rx="8"
              />
              <!-- Rectangle for active/current round (hidden when auction is closed) -->
              <rect
                v-if="status.label !== 'closed'"
                :width="xScale.bandwidth()"
                :height="spaceByRound - 4"
                :y="yScale(getDisplayPrice(activeRound?.price)) - spaceByRound + 2"
                fill="#F8F8F8"
                rx="8"
              />
              <line
                v-show="displayCeiling"
                :x1="0"
                :x2="xScale.bandwidth()"
                :y1="yScale(getDisplayPrice(ceilingPrices[seller.seller_email]))"
                :y2="yScale(getDisplayPrice(ceilingPrices[seller.seller_email]))"
                stroke="#F05252"
                :stroke-dasharray="activeRound?.index === 0 ? '0' : '5'"
              />
              <UseMouseInElement
                v-for="round in activeRounds[seller.seller_email]"
                :key="`${seller.seller_email}-${round.price}`"
                v-slot="{ isOutside }"
                class="active-round"
                as="g"
                :transform="`translate(0, ${yScale(getDisplayPrice(round.price)) - spaceByRound + 1})`"
                @mouseenter="enterBid(round.price)"
              >
                <template v-if="!round.hidePrebid">
                  <rect
                    v-if="round.type.includes('bid') && (round.lowestBid || round.lowestPrebid)"
                    :filter="
                      !isOutside && lastMouseOveredPrice === round.price ? 'url(#shadow)' : ''
                    "
                    :width="xScale.bandwidth()"
                    :height="
                      !isOutside && lastMouseOveredPrice === round.price ? 40 : spaceByRound - 5
                    "
                    y="1"
                    :fill="
                      round.type.includes('bid') && (round.lowestBid || round.lowestPrebid)
                        ? colorsMap[seller.seller_email].secondary
                        : '#fff'
                    "
                    :stroke="
                      round.type.includes('bid') && (round.lowestBid || round.lowestPrebid)
                        ? colorsMap[seller.seller_email].secondary
                        : null
                    "
                    stroke-width="2"
                    rx="8"
                  />
                  <!-- Crown for the winner -->
                  <g
                    v-if="round.winnerBid && status.label === 'closed' && bestBid?.id"
                    :transform="`translate(${xScale.bandwidth() / 2 - 9}, -16)`"
                    mask="url(#mask0_4551_13531)"
                  >
                    <path
                      d="M5.95494 20.0835C0.561117 17.808 -7.68652 13.4404 -7.68652 -14.8105L13.7143 -9.94672C14.7569 -2.05674 10.3721 10.5842 5.95494 20.0835C8.57561 21.189 10.5226 21.8007 10.5226 24.418C10.5226 31.3598 4.14672 30.0271 0.447764 30.3041C-0.997953 32.487 -1.99476 33.4179 -2.1074 32.46C-2.29531 30.8619 -1.18436 30.4263 0.447764 30.3041C1.95877 28.0226 3.96014 24.3734 5.95494 20.0835Z"
                      fill="#060606"
                    />
                    <path
                      d="M9.75493 0.924033C12.0241 8.50439 2.38842 21.2107 6.31348 22.4826C6.31348 22.4826 23.8948 22.9618 24.7798 9.44234C25.4807 -1.26502 15.1638 -12.4318 15.1638 -12.4318C9.57983 -20.4922 6.31348 -18.5057 6.31348 -16.3399C6.31348 -11.9153 7.55339 -6.4304 9.75493 0.924033Z"
                      fill="#060606"
                    />
                  </g>

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
                      y="-22"
                      x="0"
                    />
                    <text text-anchor="middle" :x="xScale.bandwidth() / 2" y="-7">
                      {{ round.date }} at {{ round.hour }}
                    </text>
                  </g>
                  <template
                    v-if="round.type.includes('bid') && (round.lowestBid || round.lowestPrebid)"
                  >
                    <template v-if="round.type.includes('prebid')">
                      <text
                        v-show="
                          scaleOption <= 20 || (!isOutside && lastMouseOveredPrice === round.price)
                        "
                        class="round-prebid"
                        :y="!isOutside || scaleOption > 10 ? 13 : 22"
                        :x="xScale.bandwidth() / 2"
                        text-anchor="middle"
                      >
                        Pre-bid
                      </text>
                    </template>
                    <template v-else>
                      <foreignObject
                        v-if="props.isBuyer"
                        v-show="
                          scaleOption <= 20 || (!isOutside && lastMouseOveredPrice === round.price)
                        "
                        :x="0"
                        :y="!isOutside || scaleOption > 10 ? 2 : 11"
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
                        v-else
                        v-show="
                          scaleOption <= 20 || (!isOutside && lastMouseOveredPrice === round.price)
                        "
                        class="round-identifier"
                        :y="!isOutside || scaleOption > 10 ? 13 : 22"
                        :x="xScale.bandwidth() / 2"
                        text-anchor="middle"
                      >
                        {{
                          isOutside
                            ? formatNumber(getDisplayPrice(round.price))
                            : 'Last accepted price'
                        }}
                      </text>
                    </template>
                    <text
                      v-show="!isOutside && lastMouseOveredPrice === round.price"
                      class="round-price"
                      y="34"
                      :x="xScale.bandwidth() / 2"
                      text-anchor="middle"
                    >
                      <br />
                      {{ formatNumber(getDisplayPrice(round.price)) }}
                    </text>
                  </template>
                </template>
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
  isBuyer: {
    type: Boolean,
    default: false
  },
  pricePerUnit: {
    type: Boolean,
    default: false
  }
})

const roundsDisplay = defineModel()

const displayCeiling = ref(true)
const route = useRoute()
const { auction, rank } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { status } = useAuctionTimer(auction)

const { getColors } = useColorSchema()
const colorsMap = await getColors()

const { nbPassedRounds, activeRound, rounds, startingPrice, endingPrice, bestBid } =
  useJapaneseRounds(auction)

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
  const scaledSpace = 420 / scaleOption.value
  // return scaledSpace
  return scaledSpace > 42 ? 42 : scaledSpace
})

const { width } = useElementSize(chartView)
const height = computed(() => {
  const calculatedHeight = rounds.value.length * spaceByRound.value
  return calculatedHeight < 420 ? calculatedHeight + 30 : calculatedHeight
})
const marginTop = 40
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
    [getDisplayPrice(startingPrice.value), getDisplayPrice(endingPrice.value)],
    [marginTop, height.value - marginBottom]
  )
})

const displayedTrueRound = ref(0)
const lowestRound = ref(activeRound.value)
watch(
  [nbPassedRounds, status],
  async () => {
    if (status.value.label === 'closed') {
      const { data } = await $fetch('/api/v1/last_bid', {
        method: 'POST',
        body: {
          auctionId: route.params.auctionId
        }
      })
      if (data.lowestBid) {
        displayedTrueRound.value = rounds.value.findIndex((e) => e.price === data.lowestBid.price)
        lowestRound.value = data.lowestBid
        // console.log('lowestRound', lowestRound.value)
      } else {
        lowestRound.value = activeRound.value
        // console.log('lowestRound', lowestRound.value)
        displayedTrueRound.value = nbPassedRounds.value
      }
    } else {
      lowestRound.value = activeRound.value
      displayedTrueRound.value = nbPassedRounds.value
    }
  },
  { immediate: true }
)
const displayedPassedRounds = computed(() => {
  const n = nbPassedRounds.value > 0 ? nbPassedRounds.value : 0
  return Math.min(n, rounds.value.length - 1)
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
  let globalLowestBid = null

  // Helper function to format bids
  const formatBid = (bid) => ({
    id: bid.id,
    date: dayjs(bid.created_at).format('DD.MM'),
    hour: dayjs(bid.created_at).format('hh:mm'),
    checkingDate: bid.created_at, // for sorting
    price: bid.price,
    type: bid.type,
    lowestBid: false,
    lowestPrebid: false
  })
  // Process each seller
  auction.value.auctions_sellers.forEach((seller) => {
    const sellerEmail = seller.seller_email
    sellerMap[sellerEmail] = []

    // Collect bids for the current seller
    auction.value.bids.forEach((bid) => {
      if (bid.seller_id === seller.seller_profile?.id) {
        sellerMap[sellerEmail].push(formatBid(bid))
      }
    })
    const bids = sellerMap[sellerEmail]
    const bid = bids.find((b) => b.type === 'bid')
    const prebid = bids.find((b) => b.type === 'prebid')

    // Remove duplicate prebids matching a bid price
    if (bid) {
      const samePrebidIndex = bids.findIndex((b) => b.type === 'prebid' && b.price === bid.price)
      if (samePrebidIndex >= 0) {
        bids.splice(samePrebidIndex, 1)
      }
    }

    // Add a default bid if none exist
    if (!bid && !prebid) {
      bids.push({
        price: rounds.value[0].price,
        type: 'bid',
        lowestPrebid: true
      })
    }

    // Determine the lowest bid for this seller
    bids.forEach((b) => {
      if (
        !globalLowestBid ||
        (b.id === bestBid.value.id && (rank.value === 1 || props.isBuyer)) ||
        b.price < globalLowestBid.price
      ) {
        globalLowestBid = { price: b.price, seller_email: sellerEmail }
      }
    })

    // Sort bids to prioritize bids over prebids
    bids.sort((a) => (a.type !== 'bid' ? -1 : 1))

    // Determine the lowest prebid
    let lowestPrebid = null
    bids.forEach((b) => {
      if (b.type === 'prebid' && (!lowestPrebid || b.price < lowestPrebid.price)) {
        lowestPrebid = b
      }
    })

    // Tag prebids for visibility and highlight the lowest prebid
    bids.forEach((b, i) => {
      if (b.type === 'prebid') {
        sellerMap[sellerEmail][i].hidePrebid = b.price > lowestPrebid.price
        sellerMap[sellerEmail][i].lowestPrebid = b.price === lowestPrebid.price
      }
    })
  })

  // Tag the global lowest bid
  if (globalLowestBid && (rank.value === 1 || props.isBuyer)) {
    const { seller_email, price } = globalLowestBid
    sellerMap[seller_email].forEach((b) => {
      if (b.price === price) {
        b.lowestBid = true
        if (b.id === bestBid.value.id) {
          b.winnerBid = true
        } else {
          b.winnerBid = props.isBuyer || (rank.value === 1 && !props.isBuyer)
        }
      }
    })
  }

  // Tag the lowest bid for each seller
  Object.keys(sellerMap).forEach((sellerEmail) => {
    let localLowestBid = null
    sellerMap[sellerEmail].forEach((b) => {
      if (!localLowestBid || b.price < localLowestBid.price) {
        localLowestBid = b
      }
    })

    sellerMap[sellerEmail].forEach((b) => {
      if (b.price === localLowestBid.price) {
        b.lowestBid = true
      }
    })
  })

  return sellerMap
})

const lastMouseOveredPrice = ref(null)

function enterBid(price) {
  lastMouseOveredPrice.value = price
}
function isOutsideSupplierBids(sellerEmail, price) {
  return activeRounds.value[sellerEmail].find((b) => b.price === price)
}
const { ceilingSupplies } = useCeilingPrice(route.params.auctionId)

const ceilingPrices = computed(() => {
  const sellerTestMap = {}
  auction.value?.auctions_sellers.forEach((seller) => {
    sellerTestMap[seller.seller_email] = ceilingSupplies.value.reduce((price, supplie) => {
      const sellerUnitCeiling =
        supplie.supplies_sellers.find((s) => s.seller_email === seller.seller_email)?.ceiling || 0
      return price + supplie.quantity * sellerUnitCeiling
    }, 0)
  })
  return sellerTestMap
})
function isCollidingWithActive(price) {
  const collidingObjectPos = yScale.value(getDisplayPrice(price))
  const activePricePos = yScale.value(
    getDisplayPrice(
      status.value.label === 'closed' ? lowestRound.value?.price : activeRound.value?.price
    )
  )

  const textHeight = 12

  return (
    collidingObjectPos + textHeight < activePricePos || // g1 is above g2
    collidingObjectPos > activePricePos + textHeight
  ) // g1 is below g2
}
</script>

<style scoped>
.chart-loader {
  min-height: 440px;
}

.chart-view {
  max-height: 440px;
  overflow-y: scroll;
  font-size: 12px !important;
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

.round-prebid {
  font-size: 10px;
}
.round-identifier {
  font-size: 10px;
  font-weight: bold;
}

.round-identifier-html {
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding: 0 4px;
  box-sizing: border-box;
}

.round-price {
  font-size: 10px;
  font-weight: bold;
}

.active-round {
  cursor: pointer;
}

.hovered-round {
  box-shadow: 0px 4px 20px 0px #b1b1b166;
}
.align-vertically {
  display: table;
  vertical-align: middle;
}
.align-vertically-content {
  display: table-cell;
  vertical-align: middle;
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
