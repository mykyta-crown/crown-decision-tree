<template>
  <v-card class="d-flex flex-column flex-grow-1 px-1">
    <v-card-text class="px-5">
      <v-row class="pt-4 pb-2">
        <v-col
          v-for="(round, i) in rounds"
          :key="i"
          cols="12"
          sm="6"
          md="4"
          lg="auto"
          class="five-column-grid pb-0"
        >
          <v-chip
            v-if="round.price === currentPrebid?.price"
            variant="flat"
            :color="statusColorMap[round.status]"
            size="large"
            class="d-flex justify-center rounded-lg price-tag text-body-2 cursor-pointer prebid-chip-border"
          >
            <v-tooltip
              activator="parent"
              location="top"
              content-class="bg-white elevation-2 text-caption"
              location-strategy="connected"
              offset="0"
            >
              <span>
                {{ dayjs(currentPrebid.createdAt).format('DD MMM') }} at
                {{ dayjs(currentPrebid.createdAt).format('HH:mm') }}
              </span>
            </v-tooltip>
            <div class="d-flex flex-column text-center prebid-text">
              <span>
                {{ t('dutch.dutchRoundsChart.preBid').trim() }}
              </span>
              <span class="font-weight-bold prebid-price-text">
                {{ priceTextFormat(round) }}
              </span>
            </div>
          </v-chip>
          <v-chip
            v-else
            variant="flat"
            :color="statusColorMap[round.status]"
            size="large"
            class="rounded-lg price-tag d-flex justify-center chip-border"
          >
            <span :class="round.status === 'active' ? 'text-primary' : 'text-grey'">
              {{ priceTextFormat(round) }}
            </span>
          </v-chip>
        </v-col>
      </v-row>
      <v-row class="py-1 mt-0">
        <v-spacer />
        <v-col cols="auto">
          <div class="border-custom">
            <v-btn
              value="#graph"
              size="small"
              class="text-grey max-height border-none"
              @click="roundsDisplay = '#graph'"
            >
              <span class="text-body-2">{{ t('dutch.dutchRoundsChart.graph') }}</span>
            </v-btn>
            <v-btn
              value="#blocks"
              size="small"
              class="text-grey max-height extended-left-inactive-border"
              :class="roundsDisplay === '#blocks' ? 'active-btn' : ''"
            >
              <span class="text-body-2">{{ t('dutch.dutchRoundsChart.blocks') }}</span>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup>
import dayjs from 'dayjs'

const props = defineProps({
  pricePerUnit: {
    type: Boolean,
    default: false
  }
})
const { t } = useTranslations()
const roundsDisplay = defineModel()
const route = useRoute()
const { auction } = await useUserAuctionBids({ auctionId: route.params.auctionId })
const { rounds } = useDutchRounds(auction)

function priceTextFormat(round) {
  return props.pricePerUnit ? formatNumber(round.priceByUnit) : formatNumber(round.price)
}

const statusColorMap = {
  passed: 'green-light-2',
  active: 'green-forest',
  inactive: 'grey-ligthen-3'
}
const currentPrebid = computed(() => {
  if (auction?.value) {
    if (auction.value.bids?.length > 0) {
      return auction.value.bids.find((e) => e.type === 'prebid') || { price: 0, createdAt: null }
    } else {
      return { price: 0, createdAt: null }
    }
  } else {
    return { price: null, createdAt: null }
  }
})
</script>

<style scoped>
.price-tag {
  width: 102px !important;
  height: 37px !important;
  font-size: 14px !important;
}
.prebid-text {
  font-size: 10px !important;
}
.prebid-price-text {
  font-size: 12px !important;
}
.chip-border {
  border: 1px solid #e0e0e0;
  border-radius: 4px !important;
}
.prebid-chip-border {
  border: 1px solid rgb(var(--v-theme-green));
  border-radius: 4px !important;
}
.max-height {
  max-height: 30px;
}
.active-btn {
  color: black !important;
}
.border-custom {
  display: flex;
  border: 1px solid #ffffff;
  box-shadow: 0px 0px 0px 1px #e0e0e0 inset;
  border-radius: 4px;
  overflow: hidden;
}

.extended-left-inactive-border {
  border: 1px solid #000 !important; /* Thicker border to overlap container */
  border-radius: 4px !important;
}

.five-column-grid {
  flex: 0 0 20% !important;
  max-width: 20% !important;
}
</style>
