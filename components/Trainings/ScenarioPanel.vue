<template>
  <div class="cursor-pointer" @click="emit('click')">
    <v-card
      class="pa-6 bg-white card-transition text-primary"
      :class="open ? 'card-expanded ' : 'border card-collapsed '"
      elevation="0"
    >
      <v-row>
        <v-col cols="9">
          <div class="text-h6 font-weight-bold">
            {{ title }}
          </div>
        </v-col>
        <Transition name="image-slide" mode="out-in">
          <v-col v-if="open" key="image-col" cols="12" class="d-flex justify-center align-center">
            <v-row>
              <v-col
                v-for="(scenario, index) in scenariosArray"
                :key="index"
                :cols="scenariosArray.length === 3 ? 4 : scenariosArray.length === 2 ? 6 : 12"
                :class="
                  scenariosArray.length <= 2
                    ? 'd-flex ga-2 justify-start align-start g'
                    : 'd-flex flex-column justify-space-between align-start ga-8'
                "
              >
                <div
                  class="text-body-1 text-left max-text-width"
                  v-html="parseMarkdown(scenario.title)"
                />
                <v-img
                  :key="index"
                  :src="scenario.img"
                  :width="scenariosArray.length === 2 ? '50%' : '100%'"
                  :max-width="scenariosArray.length === 2 ? 310 : 350"
                  :max-height="scenariosArray.length === 2 ? 200 : 260"
                  :alt="title"
                  class="image-fade-in custom-shadow"
                />
              </v-col>
            </v-row>
          </v-col>
        </Transition>
      </v-row>
    </v-card>
    <Transition name="image-slide" mode="out-in">
      <v-row v-if="open" class="mt-5">
        <v-col class="d-flex justify-center align-center">
          <slot />
        </v-col>
      </v-row>
    </Transition>
  </div>
</template>
<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
const { auctionType, open, gotPrebid } = defineProps({
  auctionType: {
    type: String,
    required: true
  },
  open: {
    type: Boolean,
    required: true
  },
  gotPrebid: {
    type: Boolean,
    required: true
  }
})
const emit = defineEmits(['click'])
const { t } = useTranslations()
const parseMarkdown = (text) => {
  return marked.parse(text)
}
const title = computed(() => {
  return t(`auctionDescriptions.${auctionType}.scenarioPanel.title`, {
    scenarioCount: scenariosArray.value.length
  })
})

const scenariosArray = computed(() => {
  const returnArray = []
  if (auctionType === 'sealed-bid' || auctionType === 'english') {
    returnArray.push({
      img: `/trainings/${auctionType}/scenario_win.png`,
      title: t(`auctionDescriptions.${auctionType}.scenarioPanel.firstScenario`)
    })
    returnArray.push({
      img: `/trainings/${auctionType}/scenario_lose.png`,
      title: t(`auctionDescriptions.${auctionType}.scenarioPanel.secondScenario`)
    })
  } else if (auctionType === 'dutch' || auctionType === 'dutch-preferred') {
    const imgFolder = auctionType === 'dutch-preferred' ? 'dutch-preferred' : 'dutch'
    if (gotPrebid) {
      returnArray.push({
        img: '/trainings/dutch/scenario_prebid.png',
        title: t(`auctionDescriptions.${auctionType}.scenarioPanel.firstScenario`)
      })
      returnArray.push({
        img: '/trainings/dutch/scenario_win.png',
        title: t(`auctionDescriptions.${auctionType}.scenarioPanel.secondScenario`)
      })
      returnArray.push({
        img: `/trainings/${imgFolder}/scenario_lose.png`,
        title: t(`auctionDescriptions.${auctionType}.scenarioPanel.thirdScenario`)
      })
    } else {
      returnArray.push({
        img: '/trainings/dutch/scenario_win.png',
        title: t(`auctionDescriptions.${auctionType}.scenarioPanel.fourthScenario`)
      })
      returnArray.push({
        img: `/trainings/${imgFolder}/scenario_lose.png`,
        title: t(`auctionDescriptions.${auctionType}.scenarioPanel.thirdScenario`)
      })
    }
  } else if (auctionType === 'japanese') {
    returnArray.push({
      img: '/trainings/japanese/scenario_prebid.png',
      title: t(`auctionDescriptions.${auctionType}.scenarioPanel.firstScenario`)
    })
    returnArray.push({
      img: '/trainings/japanese/scenario_win.png',
      title: t(`auctionDescriptions.${auctionType}.scenarioPanel.secondScenario`)
    })
  } else if (auctionType === 'japanese-no-rank') {
    returnArray.push({
      img: '/trainings/japanese-no-rank/scenario_exit.png',
      title: t(`auctionDescriptions.${auctionType}.scenarioPanel.firstScenario`)
    })
  }
  return returnArray
})
</script>
<style scoped>
.custom-br-height {
  line-height: 100% !important;
}

/* Card transition animations */
.card-transition {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.card-expanded {
  /* No shadow - matches other panels */
}

.card-collapsed {
  /* transform: scale(1); */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Content fade animations */
.content-fade-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.1s;
}

.content-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.content-fade-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.content-fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

/* Image slide animations */
.image-slide-enter-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transition-delay: 0.2s;
}

.image-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1);
}

.image-slide-enter-from {
  opacity: 0;
  transform: translateX(30px) scale(0.95);
}

.image-slide-leave-to {
  opacity: 0;
  transform: translateX(20px) scale(0.95);
}

.image-fade-in {
  animation: imageAppear 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes imageAppear {
  0% {
    opacity: 0;
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
.negative-margin {
  margin-top: -10px;
}
.custom-shadow {
  flex-grow: 0;
}
.custom-shadow :deep(.v-responsive__sizer) {
  padding-bottom: 0 !important;
}
.custom-shadow :deep(.v-img__img) {
  position: relative;
  object-fit: contain;
}
.max-text-width {
  max-width: 347px;
}
</style>
