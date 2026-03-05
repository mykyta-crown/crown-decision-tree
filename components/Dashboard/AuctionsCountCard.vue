<template>
  <v-card class="bg-primary max-height">
    <v-card-text class="fill-height d-flex flex-column justify-space-between px-3">
      <v-row>
        <v-col class="d-flex align-start justify-start justify-lg-center mt-1">
          <div
            class="d-flex align-center justify-center rounded px-auto bg-primary-ligthen-1"
            style="width: 32px; height: 32px"
          >
            <v-img
              src="@/assets/icons/dashboard/Savings.svg"
              style="filter: brightness(100)"
              :width="20"
              :height="20"
            />
          </div>
          <div class="ml-4 w-75">
            <div class="d-flex flex-column ga-1 text-container">
              <span style="color: #aeb0b2" class="text-body-1">{{ t('cards.totalSavings') }}</span>
              <div>
                <span class="text-h6 text-lg-h4 font-weight-bold"
                  >{{ formatNumber(Math.round(totalSavings))
                  }}<span class="text-body-1"> EUR</span></span
                >

                <v-chip
                  color="green"
                  size="small"
                  class="ml-5 align-self-center text-lg-h6 text-body-2 custom-chip"
                  label
                >
                  <v-img
                    src="@/assets/icons/activity-log/Trending_Up.svg"
                    style="
                      filter: invert(67%) sepia(93%) saturate(380%) hue-rotate(95deg)
                        brightness(92%) contrast(98%);
                    "
                    :width="20"
                    :height="20"
                  />
                  <span style="color: #00ce7c">{{ avgSavingsPercent.toFixed(1) }}%</span>
                </v-chip>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
      <v-row v-if="!hideSparkline">
        <v-col class="d-flex justify-end py-0">
          <v-sparkline
            :model-value="eAuctionsSavings"
            color="#00CE7C"
            fill
            :gradient="['rgba(0, 206, 124, 0.2)', 'rgba(29, 29, 27, 0.4)']"
            line-width="2"
            height="120"
            padding="10"
            smooth
          />
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
<script setup>
const props = defineProps({
  companyId: {
    type: String,
    default: null
  },
  hideSparkline: {
    type: Boolean,
    default: false
  }
})

// Use translations
const { t } = useTranslations()

const eAuctionsSavings = ref([])
const totalSavings = ref(0)
const avgSavingsPercent = ref(0)
const avgSavingsAbsolute = ref(0)

const supabase = useSupabaseClient()

watch(
  () => props.companyId,
  async () => {
    totalSavings.value = 0
    eAuctionsSavings.value = []
    avgSavingsPercent.value = 0
    avgSavingsAbsolute.value = 0

    const { data: auctionsSavings } = await supabase.rpc('get_auctions_savings_data', {
      p_date: null,
      p_company_id: props.companyId
    })

    eAuctionsSavings.value = [0]

    if (auctionsSavings && auctionsSavings.length > 0) {
      auctionsSavings.forEach((a) => {
        totalSavings.value += a.baseline_price - a.lowest_price
        eAuctionsSavings.value.push(totalSavings.value)
      })

      // Calculate savings arrays
      let percentSavings = auctionsSavings
        .map((a) => {
          if (a.baseline_price && a.baseline_price !== 0) {
            return ((a.baseline_price - a.lowest_price) / a.baseline_price) * 100
          }
          return 0
        })
        .filter((a) => a !== 100)

      if (percentSavings.length === 0 || percentSavings.length === 1) {
        percentSavings = [0, percentSavings[0]]
      }

      const absoluteSavings = auctionsSavings.map((a) => a.baseline_price - a.lowest_price)

      const percentSavingsFiltered = percentSavings.filter((a) => a !== 0)

      // Calculate averages
      avgSavingsPercent.value =
        percentSavingsFiltered.reduce((a, b) => a + b, 0) / percentSavingsFiltered.length
      avgSavingsAbsolute.value = absoluteSavings.reduce((a, b) => a + b, 0) / absoluteSavings.length
    } else {
      eAuctionsSavings.value = []
      avgSavingsPercent.value = 0
      avgSavingsAbsolute.value = 0
    }
  },
  { immediate: true }
)
</script>
<style scoped>
.text-container {
  position: relative;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.custom-chip:deep() {
  padding-left: 2px !important;
  padding-right: 5px !important;
}
.max-height {
  height: 100%;
}
@media (min-width: 1440px) {
  .max-height {
    max-height: 240px;
  }
}
</style>
