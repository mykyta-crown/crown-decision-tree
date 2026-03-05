<template>
  <v-container v-if="profile" class="px-5 pb-10" :fluid="width < 1440">
    <v-row align="center" justify="center" class="pb-0">
      <v-col cols="12" class="pb-0">
        <span class="text-h4 d-flex align-center" style="height: 40px">
          {{ t('title') }}
        </span>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="auto" class="sticky-col hidden-sm-and-down pl-0 h-100 w-auto">
        <div class="d-flex flex-column align-start pt-6">
          <OnboardingStepperItem
            v-model="currentStep"
            :title="t('steps.step1.title')"
            :description="t('steps.step1.description')"
            number="1"
            :step-validated="currentStep > 1"
            :is-step-accessible="isStepAccessible(1)"
            @click="handleStepClick(1)"
          />
          <OnboardingStepperItem
            v-model="currentStep"
            :title="t('steps.step2.title')"
            :description="t('steps.step2.description')"
            number="2"
            :step-validated="currentStep > 2"
            :is-step-accessible="isStepAccessible(2)"
            @click="handleStepClick(2)"
          />
          <OnboardingStepperItem
            v-model="currentStep"
            :title="t('steps.step3.title')"
            :description="t('steps.step3.description')"
            number="3"
            :step-validated="currentStep > 3"
            :is-step-accessible="isStepAccessible(3)"
            @click="handleStepClick(3)"
          />
          <OnboardingStepperItem
            v-model="currentStep"
            :title="t('steps.step4.title')"
            :description="t('steps.step4.description')"
            number="4"
            :step-validated="currentStep > 4"
            :is-step-accessible="isStepAccessible(4)"
            @click="handleStepClick(4)"
          />
          <!--
            <OnboardingStepperItem
            v-model="currentStep"
            :title="t('steps.step5.title')"
            :description="t('steps.step5.description')"
            number="5"
            :step-validated="currentStep >= 5"
            :is-step-accessible="isStepAccessible(5)"
            @click="handleStepClick(5)"
            />
          -->
        </div>
      </v-col>
      <v-col cols="12" md="">
        <v-card class="pt-6 px-10 pb-0 max-card-width">
          <v-card-title class="d-flex flex-column align-center text-center text-grey ga-2 pl-0">
            <div style="width: 100%" class="d-flex ga-2">
              <v-progress-linear
                :model-value="currentStep * 25"
                :striped="highestCompletedStep < 3"
                rounded
                :color="'green'"
                width="500"
                height="8"
                bg-color="grey-ligthen-3"
                class="d-flex align-end justify-end mt-3"
              />
              <v-img :src="'/icons/logo_green_crown_only.svg'" height="24" width="22" />
            </div>
            <span class="text-body-2">
              {{ t('progress.completion') }}
            </span>
          </v-card-title>
          <v-card-text class="px-0 pb-0">
            <v-stepper v-model="currentStep" elevation="0">
              <v-stepper-window class="mx-0 mt-3 mb-0" :model-value="currentStep">
                <v-stepper-window-item class="step-size" :value="1">
                  <OnboardingLanguageForm :step="currentStep" />
                </v-stepper-window-item>
                <v-stepper-window-item class="step-size" :value="2">
                  <OnboardingProfileForm v-model:is-form-valid="isFormValid" :step="currentStep" />
                </v-stepper-window-item>
                <v-stepper-window-item class="step-size" :value="3">
                  <OnboardingVideoForm
                    :profile-id="profile.id"
                    :step="currentStep"
                    @previous-step="handlePreviousStep"
                  />
                </v-stepper-window-item>
                <v-stepper-window-item class="step-size" :value="4">
                  <OnboardingFinalForm :step="currentStep" @previous-step="handlePreviousStep" />
                </v-stepper-window-item>
              </v-stepper-window>
            </v-stepper>
          </v-card-text>
          <div class="d-flex mb-8">
            <v-btn
              v-show="currentStep > 1"
              variant="outlined"
              prepend-icon="mdi-arrow-left"
              width="169"
              min-width="169"
              height="40"
              type="button"
              @click.prevent="handlePreviousStep()"
            >
              {{ t('buttons.previousStep') }}
            </v-btn>
            <v-spacer />
            <v-btn-primary
              min-width="140"
              height="40"
              append-icon="mdi-arrow-right"
              type="button"
              :disabled="currentStep === 2 && !isFormValid"
              @click.prevent.stop="handleNextStep"
            >
              {{ nextBtnText }}
            </v-btn-primary>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useUser } from '#imports'
import { useDisplay } from 'vuetify'

const supabase = useSupabaseClient()
const { t } = useTranslations()

const { width } = useDisplay()
const { profile } = useUser()
const currentStep = ref(1)
const isUpdatingStep = ref(false) // Flag to prevent watcher interference

// Computed property to determine the highest completed step
const highestCompletedStep = computed(() => {
  // console.log('profile.value?.onboarding_step HIGHTEST', profile.value?.onboarding_step)
  return profile.value?.onboarding_step || 0
})

const isFormValid = ref(false)

watch(isFormValid, (newValue) => {
  console.log('isFormValid', isFormValid)
})

// Initialize step from profile
const initializeStepFromProfile = (step) => {
  if (step == null) return
  // Set current step to the next step after the completed one, or stay at 5 if completed
  currentStep.value = Math.min(step + 1, 4)
}

const nextBtnText = computed(() => {
  if (currentStep.value === 2) {
    return t('profileForm.saveAndContinue')
  }

  return currentStep.value === 4 ? t('buttons.finish') : t('buttons.nextStep')
})

// Handle next step
const handleNextStep = async () => {
  // console.log('handleNextStep', currentStep.value)

  if (currentStep.value <= 3) {
    if (currentStep.value < 4) {
      currentStep.value++
    }

    if (profile.value && currentStep.value > highestCompletedStep.value) {
      try {
        isUpdatingStep.value = true // Prevent watcher from interfering
        const supabase = useSupabaseClient()

        // The onboarding_step in the database should represent the completed step
        const completedStep = currentStep.value === 4 ? 4 : currentStep.value - 1

        await supabase
          .from('profiles')
          .update({ onboarding_step: completedStep })
          .eq('id', profile.value.id)

        profile.value.onboarding_step = completedStep

        isUpdatingStep.value = false // Re-enable watcher
      } catch (error) {
        console.error('Error updating onboarding step:', error)
        isUpdatingStep.value = false // Re-enable watcher even on error
      }
    }
  } else {
    supabase
      .from('profiles')
      .update({
        onboarding_date: new Date()
      })
      .eq('id', profile.value.id)
      .then(() => {
        // console.log('onboarding date updated')
      })

    navigateTo('/dashboard')
  }
}

// Handle previous step
const handlePreviousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Handle step click from stepper
const handleStepClick = (step) => {
  // Only allow navigation to completed steps or the next available step
  if (step <= highestCompletedStep.value + 1) {
    currentStep.value = step
  }
}

// Check if a step is accessible (completed or next available)
const isStepAccessible = (step) => {
  return step <= highestCompletedStep.value + 1
}

// Watch for profile changes and initialize step
watch(
  () => profile.value?.onboarding_step,
  (step) => {
    // Don't update currentStep if we're in the middle of updating the profile
    if (!isUpdatingStep.value) {
      initializeStepFromProfile(step)
    }
  },
  { immediate: true }
)

// Watch current step changes to update profile when advancing
watch(
  currentStep,
  (newStep) => {
    // Only update profile if we're advancing to a new step
    if (profile.value && newStep > highestCompletedStep.value + 1) {
      // This shouldn't happen with our logic, but as a safeguard
      currentStep.value = highestCompletedStep.value + 1
    }
  },
  { immediate: true }
)

// Expose the accessibility function for use in components
defineExpose({
  isStepAccessible
})
</script>

<style scoped>
.step-size {
  min-height: 473px !important;
  max-height: 473px !important;
}

.max-card-width {
  max-width: 916px;
}
.sticky-col {
  position: sticky !important;
  top: 0 !important;
}
.custom-left-padding {
  padding-left: 40px !important;
}
@media (max-width: 1360px) {
  .custom-left-padding {
    padding-left: 10px !important;
  }
}
@media (max-width: 1260px) {
  .custom-left-padding {
    padding-left: 0 !important;
  }
  .custom-left-padding :deep(span) {
    text-wrap: wrap !important;
    line-height: 1 !important;
  }
}
.position-image {
  margin-top: -11px;
}
</style>
