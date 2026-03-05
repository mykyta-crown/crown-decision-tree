<template>
  <v-sheet rounded="md">
    <v-row v-if="item" class="rounded-lg" :class="item.color">
      <v-col cols="12" lg="3" class="rounded-left-lg pa-4 d-flex align-center justify-center">
        <v-img height="162" width="265" :src="item.img" />
        <div class="w-50 d-flex d-lg-none flex-column justify-space-between px-4 max-height">
          <div class="text-h5 text-truncate">{{ item.title }} - {{ auction.name }}</div>
          <div class="text-body-1 line-height-1">
            {{ item.description }}
          </div>
          <div class="d-flex ga-5">
            <v-btn
              height="40"
              variant="outlined"
              class="demo-btn-secondary"
              :disabled="!videoPath"
              @click="openVideoDialog"
            >
              {{ t('actions.videoCTA') }}
              <svg
                class="ml-2"
                width="13"
                height="14"
                viewBox="0 0 13 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.0755 7.45497C11.7809 8.57417 10.3889 9.36502 7.60479 10.9467C4.91337 12.4758 3.56767 13.2403 2.48319 12.933C2.03483 12.8059 1.62633 12.5646 1.29687 12.2322C0.5 11.4283 0.5 9.86883 0.5 6.75C0.5 3.63117 0.5 2.07175 1.29687 1.26777C1.62633 0.935372 2.03483 0.69407 2.48319 0.567017C3.56767 0.259707 4.91337 1.02423 7.60479 2.55327C10.3889 4.13497 11.7809 4.92583 12.0755 6.04502C12.1971 6.50699 12.1971 6.99301 12.0755 7.45497Z"
                  stroke="#1D1D1B"
                  stroke-linejoin="round"
                />
              </svg>
            </v-btn>
            <v-btn
              height="40"
              variant="flat"
              class="demo-btn-primary"
              @click="goToAuction(auction)"
            >
              {{ t('actions.tryNowCTA') }}
              <svg
                class="ml-2"
                width="15"
                height="10"
                viewBox="0 0 15 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5H14M14 5L10 1M14 5L10 9"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </v-btn>
          </div>
        </div>
      </v-col>
      <v-col cols="12" lg="9" class="border d-flex rounded-lg bg-white py-4">
        <div class="w-50 d-none d-lg-flex flex-column justify-space-between px-4 max-height">
          <div class="text-h5 text-truncate">
            {{ item.title }} - {{ auction.name }}
            <v-tooltip
              v-if="item.title?.length + auction.name?.length > 35"
              activator="parent"
              location="top start"
              content-class="bg-white text-black border text-body-2"
            >
              <span>{{ item.title }} - {{ auction.name }}</span>
            </v-tooltip>
          </div>
          <div class="text-body-1 line-height-1">
            {{ item.description }}
          </div>
          <div class="d-flex ga-5">
            <v-btn
              height="40"
              variant="outlined"
              class="demo-btn-secondary"
              :disabled="!videoPath"
              @click="openVideoDialog"
            >
              {{ t('actions.videoCTA') }}
              <svg
                class="ml-2"
                width="13"
                height="14"
                viewBox="0 0 13 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12.0755 7.45497C11.7809 8.57417 10.3889 9.36502 7.60479 10.9467C4.91337 12.4758 3.56767 13.2403 2.48319 12.933C2.03483 12.8059 1.62633 12.5646 1.29687 12.2322C0.5 11.4283 0.5 9.86883 0.5 6.75C0.5 3.63117 0.5 2.07175 1.29687 1.26777C1.62633 0.935372 2.03483 0.69407 2.48319 0.567017C3.56767 0.259707 4.91337 1.02423 7.60479 2.55327C10.3889 4.13497 11.7809 4.92583 12.0755 6.04502C12.1971 6.50699 12.1971 6.99301 12.0755 7.45497Z"
                  stroke="#1D1D1B"
                  stroke-linejoin="round"
                />
              </svg>
            </v-btn>
            <v-btn
              height="40"
              variant="flat"
              class="demo-btn-primary"
              @click="goToAuction(auction)"
            >
              {{ t('actions.tryNowCTA') }}
              <svg
                class="ml-2"
                width="15"
                height="10"
                viewBox="0 0 15 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M1 5H14M14 5L10 1M14 5L10 9"
                  stroke="white"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </v-btn>
          </div>
        </div>

        <v-divider vertical color="grey-ligthen-2" class="d-none d-lg-block" />

        <div
          class="w-100 w-lg-50 d-flex flex-column align-center ga-4 pl-4 pr-4 max-height position-relative"
        >
          <div class="text-grey-2 responsive-description w-100">
            {{
              t('auctionDescriptions.demoItemSharedText.description', {
                scenarioCount: scenarioCount
              })
            }}
          </div>
          <div class="d-flex align-start w-100 text-grey scenarios-row">
            <div class="scenarios-progress-container">
              <span class="responsive-scenarios-text">
                {{ t('auctionDescriptions.demoItemSharedText.scenarios') }}
                {{ validatedScenarios }}/{{ scenarioCount }}
              </span>
              <v-progress-linear
                :model-value="(validatedScenarios * 100) / scenarioCount"
                :striped="validatedScenarios < scenarioCount"
                rounded
                :color="'green'"
                bg-color="grey-ligthen-3"
                class="mt-2 responsive-progress-bar"
              />
            </div>
            <v-img :src="'/icons/logo_green_crown_only.svg'" class="responsive-crown" />
          </div>
          <div class="d-flex justify-center justify-lg-start w-100 scenario-container">
            <div v-for="scenario in scenarios" :key="scenario" class="scenario-item">
              <div class="d-flex flex-column justify-start align-start ga-2">
                <div
                  class="text-body-2 custom-chip pa-1"
                  :class="isScenarioValidated(scenario) ? 'bg-primary text-white' : ''"
                >
                  <v-icon v-if="isScenarioValidated(scenario)" color="white" size="15">
                    mdi-check
                  </v-icon>
                </div>
                <div class="text-body-1 scenario-text">
                  {{ scenario }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- Video Dialog Overlay -->
    <v-dialog v-model="showVideoDialog" max-width="1200" @click:outside="closeVideoDialog">
      <v-card class="pa-0">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h6">{{ item.title }} - {{ t('actions.videoCTA') }}</span>
          <v-btn icon variant="text" @click="closeVideoDialog">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text class="pa-0">
          <video
            v-if="videoPath"
            ref="videoRef"
            :src="videoPath"
            controls
            class="w-100"
            style="max-height: 80vh; background-color: black"
            @ended="closeVideoDialog"
          >
            Votre navigateur ne supporte pas la lecture de vidéos.
          </video>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-sheet>
</template>

<script setup>
import { computed, ref } from 'vue'

const { auction } = defineProps({
  auction: {
    type: Object,
    required: true
  }
})
const { t, locale } = useTranslations()
const router = useRouter()

// Video dialog state
const showVideoDialog = ref(false)
const videoRef = ref(null)

// Compute video path based on auction type and locale
const videoPath = computed(() => {
  const type = auction.type
  const lang = locale.value

  // Define all video paths explicitly
  const videoPaths = {
    english: {
      en: '/trainings/english/English _1min_EN.mp4',
      fr: '/trainings/english/English _1min_FR.mp4'
    },
    dutch: {
      en: '/trainings/dutch/Dutch _1min_EN.mp4',
      fr: '/trainings/dutch/Dutch _1min_FR.mp4'
    },
    japanese: {
      en: '/trainings/japanese/Japanese _1min_EN.mp4',
      fr: '/trainings/japanese/Japanese _1min_FR.mp4'
    }
  }

  return videoPaths[type]?.[lang] || null
})

// Open video dialog
const openVideoDialog = () => {
  if (videoPath.value) {
    showVideoDialog.value = true
  }
}

// Close video dialog and stop video
const closeVideoDialog = () => {
  showVideoDialog.value = false
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.currentTime = 0
  }
}

// Define the number of scenarios for this auction type
const scenarioCount = computed(() => {
  const scenarios = t(`scenarios.${auction.type}`)
  return Object.keys(scenarios || {}).length
})
const scenarioDbFieldsMapping = computed(() => {
  const type = auction.type
  if (type === 'english') {
    return {
      [t(`scenarios.${auction.type}.first`)]: 'trainings_losing',
      [t(`scenarios.${auction.type}.second`)]: 'trainings_live_win'
    }
  } else if (type.includes('dutch')) {
    return {
      [t(`scenarios.${auction.type}.first`)]: 'trainings_losing',
      [t(`scenarios.${auction.type}.second`)]: 'trainings_live_win',
      [t(`scenarios.${auction.type}.third`)]: 'trainings_prebid_win'
    }
  } else if (type.includes('japanese')) {
    return {
      [t(`scenarios.${auction.type}.first`)]: 'trainings_losing',
      [t(`scenarios.${auction.type}.second`)]: 'trainings_live_win',
      [t(`scenarios.${auction.type}.third`)]: 'trainings_prebid_win'
    }
  } else if (type === 'sealed-bid') {
    return {
      [t(`scenarios.${auction.type}.first`)]: 'trainings_losing',
      [t(`scenarios.${auction.type}.second`)]: 'trainings_live_win'
    }
  }
  return {}
})

const goToAuction = (auction) => {
  router.push(`/trainings/${auction.auctions_group_settings_id}?auctionId=${auction.auction_id}`)
}

// Helper function to get training data, handling empty arrays
const getTrainingData = () => {
  if (!auction.trainings || auction.trainings.length === 0) {
    // Return default structure with null values if trainings array is empty
    return {
      trainings_losing: null,
      trainings_live_win: null,
      trainings_prebid_win: null
    }
  }
  return auction.trainings[0]
}

const item = computed(() => {
  const colors = {
    english: 'bg-blue-light',
    dutch: 'bg-purple-light',
    'dutch-preferred': 'bg-purple-light',
    japanese: 'bg-yellow-lighten-2',
    'japanese-no-rank': 'bg-yellow-lighten-2',
    'sealed-bid': 'bg-orange-light'
  }
  const gotPrebid = auction.dutch_prebid_enabled && auction.type.includes('dutch')
  return {
    title:
      t(`auctionDescriptions.${auction.type}.demoItem.title`) +
      (gotPrebid ? '  ' + t('auctionDescriptions.demoItemSharedText.prebid') : ''),
    description: t(`auctionDescriptions.${auction.type}.demoItem.description`),
    color: colors[auction.type],
    img: `/trainings/${auction.type}/demo_item.png`
  }
})

const scenarios = computed(() => {
  const scenarioObj = t(`scenarios.${auction.type}`)
  return Object.values(scenarioObj) // Convert to array of values
})

const isScenarioValidated = (scenarioName) => {
  const fieldName = scenarioDbFieldsMapping.value[scenarioName]
  const trainingData = getTrainingData()
  return fieldName && trainingData[fieldName] !== null && trainingData[fieldName] !== undefined
}
const validatedScenarios = computed(() => {
  const validationFields = ['trainings_losing', 'trainings_live_win', 'trainings_prebid_win']
  let count = 0
  const trainingData = getTrainingData()

  validationFields.forEach((field) => {
    if (
      trainingData[field] !== undefined &&
      trainingData[field] !== null &&
      trainingData[field] !== false
    ) {
      count++
    }
  })

  return Math.min(count, 3)
})
</script>
<style scoped>
.line-height-1 {
  line-height: 150% !important;
}
:deep(.v-selection-control) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
}
:deep(.v-label) {
  font-size: 14px !important;
  margin-left: 10px !important;
  text-wrap: nowrap !important;
}
.max-height {
  min-height: 162px;
  height: auto;
}

.custom-chip {
  min-width: 20px;
  min-height: 20px;
  max-height: 20px;
  max-width: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  border: 1px solid rgba(29, 29, 27, 1) !important;
  justify-content: center;
}

/* Button styles matching Figma */
.demo-btn-secondary {
  border: 1px solid #1d1d1b !important;
  border-radius: 4px !important;
  padding: 8px 32px !important;
  color: #1d1d1b !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: 600 !important;
}
.demo-btn-primary {
  background-color: #1d1d1b !important;
  border-radius: 4px !important;
  padding: 8px 32px !important;
  color: white !important;
  text-transform: none !important;
  letter-spacing: normal !important;
  font-weight: 600 !important;
}

/* Scenario text wrapping */
.scenario-container {
  gap: 16px;
  width: 100%;
}
.scenario-item {
  flex: 1 1 0%;
  min-width: 0;
}
.scenario-text {
  white-space: normal;
  word-wrap: break-word;
  line-height: 1.5;
}

/* Responsive scaling */
.responsive-description {
  font-size: 14px;
  line-height: 1.5;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
}

.responsive-scenarios-text {
  font-size: clamp(12px, 0.9vw, 16px);
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: block;
}

.responsive-progress-bar {
  height: clamp(6px, 0.6vw, 10px) !important;
  width: 100%;
}

.responsive-crown {
  width: 20px !important;
  height: 19px !important;
  flex: 0 0 auto !important;
  min-width: 20px !important;
  max-width: 20px !important;
  margin-left: 8px;
  align-self: end !important;
}

.responsive-crown :deep(.v-responsive) {
  flex: 0 0 auto !important;
}

.responsive-crown :deep(.v-img__img) {
  width: 20px !important;
  height: 19px !important;
}

.scenarios-row {
  gap: 8px;
}

.scenarios-progress-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1 1 0%;
  min-width: 0;
}
</style>
