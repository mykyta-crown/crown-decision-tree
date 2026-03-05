<template>
  <v-container class="fill-height pa-0 ma-0" fluid>
    <v-row class="fill-height pa-0 ma-0 bg-orange-light">
      <v-col cols="12" lg="6" class="fill-height pa-0 ma-0">
        <v-sheet class="fill-height" rounded="xl">
          <v-row justify="center" align="center" class="fill-height pa-0 ma-0 relative">
            <v-btn variant="text" to="/auth/signin" class="absolute">
              <img src="@/assets/img/auth/arrow_left.svg" class="mr-2 text-grey" />
              {{ t('backToLogin') }}
            </v-btn>
            <v-col id="component" class="relative negative-padding-top" cols="8" lg="12">
              <v-row justify="center" align="center" class="fill-height pa-0 ma-0">
                <v-col cols="12" lg="6" class="d-flex justify-center">
                  <v-form
                    v-model="isValid"
                    class="custom-form-width"
                    @submit.prevent="askChangePassword"
                  >
                    <v-row justify="center">
                      <v-col cols="12" sm="6" class="d-flex justify-center d-lg-none">
                        <v-img src="@/assets/img/logo_black.svg" />
                      </v-col>
                      <v-col cols="12" class="text-center">
                        <h2>{{ t('title') }}</h2>
                        <h4 class="text-grey font-weight-regular mt-4">
                          {{ t('subtitle') }}
                        </h4>
                      </v-col>
                      <v-col cols="12">
                        {{ t('fields.email') }}
                        <v-text-field
                          v-model="email"
                          variant="outlined"
                          :label="t('fields.emailLabel')"
                          class="mt-2 text-grey"
                          :rules="emailRule"
                        >
                          <template #append-inner>
                            <v-img src="@/assets/icons/basic/Mail.svg" width="20" height="20" />
                          </template>
                        </v-text-field>
                      </v-col>
                      <v-col v-if="errorMsg" cols="12">
                        <AuthErrorAlert :auth-error="errorMsg" />
                      </v-col>
                      <v-col cols="12">
                        <v-btn-primary type="submit" block :loading="btnLoading" class="pa-6">
                          {{ t('buttons.sendPassword') }}
                        </v-btn-primary>
                      </v-col>
                    </v-row>
                  </v-form>
                </v-col>
              </v-row>
              <v-snackbar
                v-model="showDialog"
                position="absolute"
                persistent
                color="white"
                attach="#component"
              >
                <v-row align="center">
                  <v-col cols="1" class="d-flex justify-center">
                    <v-icon color="green"> mdi-check-circle-outline </v-icon>
                  </v-col>
                  <v-col cols="10" class="text-body-1 text-start">
                    {{ t('messages.success') }}
                  </v-col>
                  <v-col cols="1">
                    <v-btn icon="mdi-close" variant="text" class="text-grey" @click="closeTab" />
                  </v-col>
                </v-row>
              </v-snackbar>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
      <v-col cols="6" class="fill-height hidden-md-and-down w-full">
        <AuthPreviewSheet />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { z } from 'zod'
import { ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const { t } = useTranslations()
const supabase = useSupabaseClient()

const isValid = ref(false)

const schemaToRule = useZodSchema()

const emailRule = computed(() => [
  schemaToRule(z.string().email({ message: t('validation.invalidEmail') }))
])
const showDialog = ref(false)
const errorMsg = ref('')
const btnLoading = ref(false)
const email = ref('')

function closeTab() {
  showDialog.value = false
}

async function askChangePassword() {
  if (isValid.value) {
    //TODO: Use env to redirect to localhost in dev
    btnLoading.value = true
    const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
      redirectTo: 'https://app.crown-procurement.com/auth/reset'
      // redirectTo: 'http://localhost:3000/auth/reset'
    })
    btnLoading.value = false
    if (error) {
      errorMsg.value = error.message
    } else {
      showDialog.value = true
    }
  }
}
</script>
<style scoped>
.relative {
  position: relative;
}
.absolute {
  position: absolute;
  top: 5%;
  left: 2%;
}
.custom-form-width {
  max-width: 318px;
}
.negative-padding-top {
  /* Used  to match the component alignment with the previous page (/signin) */
  margin-top: -120px !important;
}
</style>
