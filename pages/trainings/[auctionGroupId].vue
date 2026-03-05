<template>
  <v-container class="px-5 pb-8 mt-1" :fluid="width < 1440">
    <v-row class="mb-0">
      <v-col v-if="auctionType">
        <TrainingsStepper />
      </v-col>
    </v-row>
    <!-- How it works -->
    <v-row dense class="mt-0">
      <v-col>
        <TrainingsDescriptionPanel
          v-if="auctionType"
          :open="currentStepKey === 'howItWork'"
          :auction-type="auctionType"
          :panel="'howItWorkPanel'"
          :img-name="'description_chart'"
          :max-img-height="280"
          @click="goTo('howItWork')"
        />
      </v-col>
      <TrainingsContinueBtnColumn v-if="currentStepKey === 'howItWork'" @click="nextStep()" />
    </v-row>

    <!-- How to win -->
    <v-row dense>
      <v-col>
        <TrainingsDescriptionPanel
          v-if="auctionType"
          :open="currentStepKey === 'howToWin'"
          :panel="'howToWinPanel'"
          :auction-type="auctionType"
          :img-name="'win_mechanics'"
          :max-img-height="190"
          @click="goTo('howToWin')"
        />
      </v-col>
      <TrainingsContinueBtnColumn v-if="currentStepKey === 'howToWin'" @click="nextStep()" />
    </v-row>

    <!-- Timing -->
    <v-row dense>
      <v-col>
        <TrainingsDescriptionPanel
          v-if="auctionType"
          :open="currentStepKey === 'timing'"
          :panel="'timingPanel'"
          :auction-type="auctionType"
          :img-name="'timer'"
          :max-img-height="170"
          @click="goTo('timing')"
        />
      </v-col>
      <TrainingsContinueBtnColumn v-if="currentStepKey === 'timing'" @click="nextStep()" />
    </v-row>
    <!-- Option : prebid -->
    <v-row v-if="isPrebid" dense>
      <v-col>
        <TrainingsDescriptionPanel
          v-if="auctionType"
          :open="currentStepKey === 'prebid'"
          :panel="'prebidPanel'"
          :auction-type="auctionType"
          :img-name="'prebid'"
          :max-img-height="200"
          @click="goTo('prebid')"
        />
      </v-col>
      <TrainingsContinueBtnColumn v-if="currentStepKey === 'prebid'" @click="nextStep()" />
    </v-row>
    <!-- Option : multilot -->
    <v-row v-if="isMultilot" dense>
      <v-col>
        <TrainingsDescriptionPanel
          v-if="auctionType"
          :open="currentStepKey === 'multilot'"
          :panel="'multilotPanel'"
          :auction-type="auctionType"
          :img-name="'multilot'"
          :max-img-height="200"
          @click="goTo('multilot')"
        />
      </v-col>
      <TrainingsContinueBtnColumn v-if="currentStepKey === 'multilot'" @click="nextStep()" />
    </v-row>
    <!-- Option : handicap -->
    <v-row v-if="isHandicaps.length > 0" dense>
      <v-col>
        <TrainingsDescriptionPanel
          v-if="auctionType"
          :open="currentStepKey === 'handicap'"
          :panel="'handicapPanel'"
          :auction-type="auctionType"
          :img-name="'handicap'"
          :max-img-height="300"
          @click="goTo('handicap')"
        />
      </v-col>
      <TrainingsContinueBtnColumn v-if="currentStepKey === 'handicap'" @click="nextStep()" />
    </v-row>

    <!-- scenarios -->
    <v-row dense>
      <v-col>
        <TrainingsScenarioPanel
          v-if="auctionType"
          :open="currentStepKey === 'scenarios'"
          :auction-type="auctionType"
          :got-prebid="isPrebid"
          @click="goTo('scenarios')"
        >
          <v-btn-primary width="184" height="40" @click="() => goToAuction()">
            <template #append>
              <v-img
                src="@/assets/img/auth/arrow_left.svg"
                width="20"
                height="20"
                style="filter: brightness(20); transform: rotate(180deg)"
              />
            </template>
            <div class="font-weight-bold">
              {{ t('actions.endButton') }}
            </div>
          </v-btn-primary>
        </TrainingsScenarioPanel>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useTranslations, useUser, useTrainingType } from '#imports'
const { width } = useDisplay()
const route = useRoute()
const { isBuyer } = useUser()
const router = useRouter()
const { auctionGroupId } = route.params
const auctionId = route.query.auctionId
const { t } = useTranslations()
const { auctionType, isHandicaps, isMultilot, isPrebid } = await useTrainingType({ auctionId })

const currentStep = ref(0)

const optionalPanels = computed(() => {
  const panels = []
  if (isPrebid.value) panels.push('prebid')
  if (isMultilot.value) panels.push('multilot')
  if ((isHandicaps.value || []).length > 0) panels.push('handicap')
  return panels
})

const steps = computed(() => {
  return ['howItWork', 'howToWin', 'timing', ...optionalPanels.value, 'scenarios']
})

const currentStepKey = computed(() => {
  return steps.value[currentStep.value] || 'howItWork'
})

const goTo = (key) => {
  const index = steps.value.indexOf(key)
  if (index !== -1) currentStep.value = index
}

const nextStep = () => {
  if (currentStep.value < steps.value.length - 1) {
    currentStep.value += 1
  }
}

const goToAuction = () => {
  const toRoute = `/auctions/${auctionGroupId}/lots/${auctionId}/terms${'?type=' + auctionType.value}${isMultilot.value ? '&multilot=true' : ''}`
  router.push(toRoute)
}
</script>
