<template>
  <div>
    <v-card-title class="d-flex flex-column align-start pb-0 font-weight-bold">
      <span class="mb-2">
        {{ understandArray[carouselStep].title }}
      </span>
      <span
        class="text-body-1 font-weight-regular text-wrap"
        v-html="understandArray[carouselStep].description"
      />
    </v-card-title>
    <v-card-text class="py-0 mt-0">
      <v-stepper elevation="0" class="px-0 mx-0">
        <v-stepper-window :model-value="carouselStep" class="px-0 mx-0 my-4 pt-0">
          <v-stepper-window-item
            v-for="(item, index) in understandArray"
            :key="index"
            class="custom-height"
          >
            <v-img cover :src="item.src" />
          </v-stepper-window-item>
        </v-stepper-window>
      </v-stepper>
    </v-card-text>
    <v-card-actions class="mx-2">
      <v-row>
        <v-col cols="3">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            width="169"
            min-width="169"
            height="40"
            @click="carouselStep === 0 ? handlePreviousStep() : carouselStep--"
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
            @click="onNextClick"
          >
            {{
              carouselStep === understandArray.length - 1
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

const understandArray = computed(() => [
  {
    title: t('understandForm.understand.0.title'),
    description: t('understandForm.understand.0.description'),
    src: '/images/onboarding/fourth_step/1.png',
    width: 836,
    height: 444
  },
  {
    title: t('understandForm.understand.1.title'),
    description: t('understandForm.understand.1.description'),
    src: '/images/onboarding/fourth_step/2.png',
    width: 836,
    height: 444
  },
  {
    title: t('understandForm.understand.2.title'),
    description: t('understandForm.understand.2.description'),
    src: '/images/onboarding/fourth_step/3.png',
    width: 836,
    height: 444
  },
  {
    title: t('understandForm.understand.3.title'),
    description: t('understandForm.understand.3.description'),
    src: '/images/onboarding/fourth_step/4.png',
    width: 836,
    height: 444
  },
  {
    title: t('understandForm.understand.4.title'),
    description: t('understandForm.understand.4.description'),
    src: '/images/onboarding/fourth_step/5.png',
    width: 569,
    height: 576
  }
])

const handlePreviousStep = () => {
  emit('previousStep')
}

const handleNextStep = () => {
  emit('nextStep')
}

const onNextClick = () => {
  const currentY = window.scrollY
  if (carouselStep.value === understandArray.value.length - 1) {
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
:deep(.text-body-1 ul) {
  padding-left: 28px; /* shift marker and text to the right */
  margin: 8px 0;
  list-style-type: disc;
}

:deep(.text-body-1 li) {
  padding-left: 0;
}
:deep(p) {
  margin-bottom: 8px;
}
.custom-height {
  min-height: 100%;
}
</style>
