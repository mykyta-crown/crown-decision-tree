<template>
  <div>
    <v-card-title class="d-flex flex-column align-start pb-0">
      <span class="font-weight-bold">
        {{ navigationArray[carouselStep].title }}
      </span>
      <span class="text-body-1 font-weight-regular text-wrap">
        {{ navigationArray[carouselStep].description }}
      </span>
    </v-card-title>
    <v-card-text class="py-0 mt-0">
      <v-stepper elevation="0" class="px-0 mx-0">
        <v-stepper-window :model-value="carouselStep" class="px-0 mx-0 my-4 pt-0">
          <v-stepper-window-item
            v-for="(image, index) in navigationArray"
            :key="index"
            class="custom-height"
          >
            <v-img cover :src="image.src" />
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-card-text>
    <v-card-actions class="mx-2 pt-2">
      <v-row>
        <v-col cols="3">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            width="169"
            min-width="169"
            height="40"
            type="button"
            @click.prevent="carouselStep === 0 ? handlePreviousStep() : carouselStep--"
          >
            {{ carouselStep === 0 ? t('buttons.previousStep') : t('buttons.previous') }}
          </v-btn>
        </v-col>
        <v-spacer />
        <v-col cols="3" class="d-flex justify-end">
          <v-btn-primary
            width="140"
            min-width="140"
            height="40"
            append-icon="mdi-arrow-right"
            type="button"
            @click.prevent.stop="onNextClick"
          >
            {{
              carouselStep === navigationArray.length - 1
                ? t('buttons.nextStep')
                : t('buttons.next')
            }}
          </v-btn-primary>
        </v-col>
      </v-row>
    </v-card-actions>
  </div>
</template>
<script setup>
import { ref, nextTick, computed } from 'vue'

defineProps({
  profileId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['previousStep', 'nextStep'])

const { t } = useTranslations()

const carouselStep = ref(0)

const navigationArray = computed(() => [
  {
    title: t('navigationForm.navigation.0.title'),
    description: t('navigationForm.navigation.0.description'),
    src: '/images/onboarding/second_step/1.png'
  },
  {
    title: t('navigationForm.navigation.1.title'),
    description: t('navigationForm.navigation.1.description'),
    src: '/images/onboarding/second_step/2.png'
  },
  {
    title: t('navigationForm.navigation.2.title'),
    description: t('navigationForm.navigation.2.description'),
    src: '/images/onboarding/second_step/3.png'
  },
  {
    title: t('navigationForm.navigation.3.title'),
    description: t('navigationForm.navigation.3.description'),
    src: '/images/onboarding/second_step/4.png'
  },
  {
    title: t('navigationForm.navigation.4.title'),
    description: t('navigationForm.navigation.4.description'),
    src: '/images/onboarding/second_step/5.png'
  },
  {
    title: t('navigationForm.navigation.5.title'),
    description: t('navigationForm.navigation.5.description'),
    src: '/images/onboarding/6.png'
  }
])

const handlePreviousStep = () => {
  emit('previousStep')
}

// const handleNextStep = () => {
//   emit('nextStep')
// }

const onNextClick = () => {
  const currentY = window.scrollY
  if (carouselStep.value === navigationArray.value.length - 1) {
    handleNextStep()
  } else {
    carouselStep.value++
  }
  nextTick(() => {
    window.scrollTo({ top: currentY, behavior: 'auto' })
  })
}
</script>
<style scoped>
.custom-height {
  min-height: 100%;
}
</style>
