<template>
  <v-container
    v-if="props.auction"
    id="basic-info-capture"
    :class="[isBuyer || !isTermsPage ? 'custom-border-radius' : ' rounded-lg']"
    class="bg-white border mb-2 px-10 py-8"
  >
    <v-row>
      <v-col
        v-for="(item, index) in auctionContent"
        :key="item.title"
        :cols="index > 1 ? 6 : 12"
        :md="item.cols"
        class="mb-4"
      >
        <div class="mb-2 cols-title">
          {{ item.title }}
        </div>
        <div>
          {{ item.description }}
        </div>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <div class="mb-2 cols-title">
          {{ t('termsPage.eAuctionType') }}
        </div>
        <v-sheet rounded="lg" :class="alertContent.class">
          <v-row align="center">
            <v-col cols="12" md="8" class="d-flex flex-column ga-4 justify-start">
              <span class="text-subtitle-2 font-weight-bold">
                {{ alertContent.title }}
              </span>
              <div class="text-primary-ligthen-1" v-html="parseMarkdown(alertContent.text)" />
            </v-col>
            <v-col cols="12" md="4">
              <v-img height="206" :src="alertContent.img" />
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import useTranslations from '~/composables/useTranslations'
import useAuctionsDescriptions from '~/composables/useAuctionsDescriptions'

const props = defineProps({
  auction: {
    type: Object,
    required: true
  },
  isBuyer: {
    type: Boolean,
    required: true
  }
})

dayjs.extend(localizedFormat)
dayjs.extend(advancedFormat)

const route = useRoute()

const { t } = useTranslations()
const { descriptions: alert, parseMarkdown } = useAuctionsDescriptions()

const alertContent = computed(() => {
  const defaultContent = {
    title: '',
    text: '',
    class: 'pa-5',
    img: ''
  }
  if (!alert.value || !Array.isArray(alert.value) || alert.value.length === 0) {
    return defaultContent
  }
  if (!props.auction || !props.auction.type) {
    return alert.value[0] || defaultContent
  }

  if (props.auction.type === 'reverse') {
    return alert.value[0] || defaultContent
  }

  if (props.auction.type === 'sealed-bid') {
    return alert.value[3] || defaultContent
  }

  if (props.auction.type === 'dutch') {
    if (
      props.auction.auctions_sellers &&
      props.auction.auctions_sellers.find((seller) => seller.time_per_round)
    ) {
      return alert.value[4] || defaultContent
    } else {
      return alert.value[1] || defaultContent
    }
  }

  if (props.auction.type === 'japanese') {
    if (props.auction.max_rank_displayed === 0) {
      return alert.value[5] || defaultContent
    } else {
      return alert.value[2] || defaultContent
    }
  }

  // Fallback case
  return alert.value[0] || defaultContent
})
const isTermsPage = computed(() => {
  return route.name === 'auctions-auctionGroupId-lots-auctionId-terms'
})
const startDate = computed(() => {
  return dayjs(props.auction.start_at).format('LL')
})

const startTime = computed(() => {
  return dayjs(props.auction.start_at).format('LT')
})

const auctionContent = [
  {
    title: t('termsPage.eAuctionName'),
    description: props.auction.name,
    cols: 3
  },
  {
    title: props.auction.description ? t('termsPage.description') : '',
    description: props.auction.description,
    cols: 9
  },
  {
    title: props.auction.type === 'sealed-bid' ? t('termsPage.endDate') : t('termsPage.startDate'),
    description: startDate.value,
    cols: 3
  },
  {
    title: t('termsPage.time'),
    description: startTime.value,
    cols: 3
  },
  {
    title: t('termsPage.timeZone'),
    description: props.auction.timezone,
    cols: 3
  },
  {
    title: t('termsPage.currency'),
    description: props.auction.currency,
    cols: 3
  }
]
</script>
<style>
.text-grey-darken-1 {
  white-space: pre-line;
}

.text-grey-darken-1 :deep(strong) {
  color: inherit;
}

.custom-border-radius {
  border-radius: 0 0 4px 4px !important;
}
</style>
