<template>
  <v-container
    class="bg-white border rounded-lg mb-2 px-10 py-8"
    :data-auction-id="props.auction?.id || ''"
  >
    <v-row>
      <v-col cols="12" class="text-h6 font-weight-bold pb-2">
        {{ t('termsPage.lotRules') }}
      </v-col>
    </v-row>
    <v-row>
      <v-col v-for="item in auctionContent" :key="item.title" cols="6" :md="item.cols" class="pt-2">
        <div class="mb-2 cols-title d-flex align-center ga-2">
          {{ item.title }}
          <v-tooltip
            v-if="item.title.includes('decrement')"
            :text="item.title.includes('Min') ? tooltipText.min : tooltipText.max"
            content-class="bg-white text-black border"
            location="top left"
          >
            <template #activator="{ props: tooltipProps }">
              <v-icon
                inline
                v-bind="tooltipProps"
                color="grey"
                size="small"
                icon="mdi-information-outline"
              />
            </template>
          </v-tooltip>
        </div>
        <div>
          {{ item.description }}
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed } from 'vue'
import dayjs from 'dayjs'
import durationPlugin from 'dayjs/plugin/duration'

const props = defineProps({
  auction: {
    type: Object,
    required: true
  }
})
const { t } = useTranslations()

dayjs.extend(durationPlugin)

const { startingPrice, endingPrice } = useDutchRounds(toRef(props.auction))

const durationRange = computed(() => {
  if (props.auction.overtime_range >= 1) {
    return `${dayjs.duration(props.auction.overtime_range, 'minute').minutes()} min ${dayjs.duration(props.auction.overtime_range, 'minute').seconds() > 0 ? dayjs.duration(props.auction.overtime_range, 'minute').seconds() + ' sec' : ''}`
  } else {
    return `${dayjs.duration(props.auction.overtime_range, 'minute').seconds()} sec`
  }
})

const decrementType = computed(() => {
  if (props.auction.min_bid_decr_type === '%') {
    return '%'
  } else {
    return props.auction.currency
  }
})

const { duration } = useAuctionTimer(toRef(props.auction))

const auctionContent = computed(() => {
  if (props.auction.type === 'sealed-bid') {
    return [
      {
        title: t('termsPage.durationOfCompetition'),
        description: duration.value.humanize(),
        cols: 3
      },
      {
        title: t('termsPage.maxBidDecrement'),
        description: formatNumber(props.auction.max_bid_decr) + decrementType.value,
        cols: 3
      }
    ]
  }
  if (props.auction.type === 'reverse') {
    return [
      {
        title: t('termsPage.durationOfCompetition'),
        description: props.auction.duration + ' min',
        cols: 3
      },
      {
        title: t('termsPage.overtime'),
        description: durationRange.value,
        cols: 3
      },
      {
        title: t('termsPage.minBidDecrement'),
        description: formatNumber(props.auction.min_bid_decr) + decrementType.value,
        cols: 3
      },
      {
        title: t('termsPage.maxBidDecrement'),
        description: formatNumber(props.auction.max_bid_decr) + decrementType.value,
        cols: 3
      }
    ]
  } else if (props.auction.type === 'dutch') {
    return [
      {
        title: t('termsPage.durationOfCompetition'),
        description: props.auction.duration + ' min',
        cols: 3
      },
      {
        title: t('termsPage.roundDuration'),
        description: durationRange.value,
        cols: 3
      },
      {
        title: t('termsPage.roundIncrement'),
        description: formatNumber(props.auction.min_bid_decr) + ' ' + decrementType.value,
        cols: 3
      },
      {
        title: t('termsPage.startingPrice'),
        description: formatNumber(startingPrice.value) + props.auction.currency,
        cols: 3
      }
    ]
  } else if (props.auction.type === 'japanese') {
    return [
      {
        title: t('termsPage.durationOfCompetition'),
        description: props.auction.duration + ' min',
        cols: 3
      },
      {
        title: t('termsPage.roundDuration'),
        description: durationRange.value,
        cols: 3
      },
      {
        title: t('termsPage.roundDecrement'),
        description: formatNumber(props.auction.min_bid_decr) + ' ' + decrementType.value,
        cols: 3
      },
      {
        title: t('termsPage.startingPrice'),
        description: formatNumber(endingPrice.value) + props.auction.currency,
        cols: 3
      }
    ]
  } else return []
})

const tooltipText = {
  min: 'Minimum reduction required from prior bid.',
  max: 'Maximum decrease possible from prior bid.'
}
</script>
