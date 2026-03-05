<template>
  <div>
    <v-card-title class="d-flex flex-column align-start pb-0">
      <span class="mb-1 font-weight-bold"> {{ t('readyForm.title') }} </span>
      <span class="text-body-1 font-weight-regular mb-4 text-wrap">
        {{ t('readyForm.description') }}
      </span>
    </v-card-title>
    <v-card-text class="pb-0">
      <v-img :src="'/images/onboarding/second_step/5.png'" width="836" max-height="569" />
    </v-card-text>
    <v-card-actions class="mx-2 mt-3">
      <v-row>
        <v-col cols="3">
          <v-btn
            variant="outlined"
            prepend-icon="mdi-arrow-left"
            width="169"
            min-width="169"
            height="40"
            @click="handlePreviousStep()"
          >
            {{ t('buttons.previous') }}
          </v-btn>
        </v-col>
        <v-spacer />
        <v-col cols="3" class="d-flex justify-end">
          <v-btn-primary width="209" min-width="209" height="40" @click="handleNextStep()">
            {{ t('readyForm.finishOnboarding') }}
          </v-btn-primary>
        </v-col>
      </v-row>
    </v-card-actions>
  </div>
</template>
<script setup>
defineProps({
  profileId: {
    type: String,
    required: true
  },
  step: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['previousStep', 'nextStep'])

const { t } = useTranslations()

const handlePreviousStep = () => {
  emit('previousStep')
}

const handleNextStep = () => {
  emit('nextStep')
  navigateTo('/dashboard')
}
</script>
<style scoped>
/* Don't work, but it's a good example of how to style the svg */
/* .iframe-class:deep(button > svg > path:nth-child(3)) {
  fill: red !important;
  stroke: red !important;
} */
</style>
