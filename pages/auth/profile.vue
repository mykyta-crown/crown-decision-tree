<template>
  <v-container class="px-5 pb-10" :fluid="width < 1440">
    <v-row align="center" justify="center" class="pb-0">
      <v-col cols="12" class="pb-1">
        <span class="text-h4 d-flex align-center" style="height: 40px"> Edit your profile </span>
      </v-col>
    </v-row>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-text class="pa-10">
            <v-row>
              <v-col cols="12">
                <AuthProfileForm2
                  ref="submitForm"
                  :loading="loading"
                  :is-form-valid="isFormValid"
                  @update:loading="loading = $event"
                  @update:is-form-valid="isFormValid = $event"
                />
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-btn-primary
                  height="40"
                  width="181"
                  :loading="loading"
                  :disabled="!isFormValid || loading"
                  @click="handleSubmit"
                >
                  Save changes
                </v-btn-primary>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
        <v-dialog v-model="dialog" width="366" height="220">
          <v-card>
            <v-card-text class="d-flex flex-column align-center justify-center px-14">
              <v-img src="/images/profile-validation.png" width="78" max-height="78" />

              <span class="text-body-1 text-wrap text-center">
                Changes saved! Your profile information has been updated.
              </span>
            </v-card-text>
          </v-card>
        </v-dialog>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useDisplay } from 'vuetify'

const { width } = useDisplay()
const loading = ref(false)
const isFormValid = ref(false)
const submitForm = ref(null)
const dialog = ref(false)

const handleSubmit = async () => {
  await submitForm.value.handleSubmit()
  if (!loading.value && isFormValid.value) {
    dialog.value = true
  }
}
</script>
