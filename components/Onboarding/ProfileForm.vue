<template>
  <v-card-title class="font-weight-bold pl-0">
    {{ t('profileForm.title') }}
  </v-card-title>
  <div class="label-style pb-6">
    <AuthProfileForm2
      ref="submitForm"
      :loading="loading"
      :is-form-valid="isFormValid"
      :is-onboarding="true"
      @update:loading="loading = $event"
      @update:is-form-valid="handleIsFormValid"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  step: {
    type: Number,
    required: true
  }
})

const { getSession } = useUser()

watch(
  () => props.step,
  () => {
    if (props.step === 3) {
      console.log('handleSubmit step 3')
      handleSubmit()
    }
  }
)

const { t } = useTranslations()

const submitForm = ref(null)
const loading = ref(false)

const isFormValid = defineModel('isFormValid', {
  type: Boolean,
  default: false
})

const handleIsFormValid = (newValue) => {
  isFormValid.value = newValue
}

const handleSubmit = async () => {
  console.log('handleSubmit step')
  await submitForm.value.handleSubmit()
  // Fetch the user profile with the newly created company
  getSession(true)

  // if (!loading.value && isFormValid.value) {
  //   const visitorId = getVisitorId()
  //   console.log('visitorId', visitorId)

  //   // Retrieve Intercom contact custom attribute for onboarding edit profile
  //   try {
  //     const { data } = await useFetch('/api/v1/intercom/contact', {
  //       method: 'GET',
  //       query: { visitorId }
  //     })
  //     console.log('data', data)

  //     const tourFlag = data.value?.TOUR_onboarding_edit_profil
  //     console.log('TOUR_onboarding_edit_profil', tourFlag)
  //   } catch (e) {
  //     console.error('Failed to fetch Intercom contact', e)
  //   }

  //   startTour('631181', {
  //     visitorId: visitorId
  //   })
  // }
}
</script>
<style scoped>
.label-style:deep(.v-label) {
  font-size: 14px;
  color: #8e8e8e;
}
</style>
