<template>
  <v-form v-model="isValid" class="custom-form-width" @submit.prevent="signup">
    <v-row justify="center">
      <v-col cols="8" class="d-flex justify-center d-lg-none">
        <v-img src="@/assets/img/logo_black.svg" />
      </v-col>
      <v-col cols="12" class="text-center">
        <h4 class="text-h4 font-weight-bold mt-10">
          {{ t('title') }}
        </h4>
      </v-col>
      <v-col cols="12" class="mt-xl-2 pb-1 text-body-2">
        {{ t('fields.email') }}
        <v-text-field
          v-model="formData.email"
          variant="outlined"
          class="mt-2 text-grey"
          :rules="emailRule"
          :placeholder="t('forms.placeholders.email')"
        >
          <template #append-inner>
            <v-img src="@/assets/icons/basic/Mail.svg" width="20" height="20" />
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="12" class="pt-2 pb-1 text-body-2">
        <v-tooltip v-model="passwordFocus" content-class="bg-grey-ligthen-3">
          <AuthPasswordCheck
            :success="passwordValidation.min.success"
            :text="t('passwordRequirements.minLength')"
          />
          <AuthPasswordCheck
            :success="passwordValidation.lowercase.success && passwordValidation.uppercase.success"
            :text="t('passwordRequirements.caseLetters')"
          />
          <AuthPasswordCheck
            :success="passwordValidation.number.success"
            :text="t('passwordRequirements.number')"
          />
          <AuthPasswordCheck
            :success="passwordValidation.special.success"
            :text="t('passwordRequirements.specialChar')"
          />
          <template #activator="{ props }">
            {{ t('fields.password') }}
            <v-text-field
              v-bind="props"
              id="password-input"
              v-model="formData.password"
              variant="outlined"
              class="text-grey mt-2"
              :type="passwordType"
              :rules="passworRules"
              :placeholder="t('forms.placeholders.password')"
              @focus="passwordFocus = true"
              @blur="passwordFocus = false"
            >
              <template #append-inner>
                <v-img
                  :src="passwordIcon"
                  class="cursor-pointer"
                  width="20"
                  height="20"
                  @click="passwordVisible = !passwordVisible"
                />
              </template>
            </v-text-field>
          </template>
        </v-tooltip>
      </v-col>
      <v-col cols="12" class="pt-2 text-body-2">
        {{ t('fields.repeatPassword') }}
        <v-text-field
          v-model="confirmPassword"
          variant="outlined"
          class="text-grey mt-2"
          :type="passwordType"
          :rules="confirmPasswordRule"
          :placeholder="t('forms.placeholders.password')"
        >
          <template #append-inner>
            <v-img
              :src="passwordIcon"
              class="cursor-pointer"
              width="20"
              height="20"
              @click="passwordVisible = !passwordVisible"
            />
          </template>
        </v-text-field>
        <v-checkbox v-model="acceptTerms" :rules="[(v) => v]" density="compact" hide-details>
          <template #label>
            <span class="text-grey text-body-1"
              >{{ t('terms.accept') }}
              <NuxtLink to="/privacy_policies" class="text-primary text-body-1">
                {{ t('terms.privacyPolicy') }}
              </NuxtLink>
              {{ t('terms.and') }}
              <NuxtLink to="/tos" class="text-primary text-body-1">
                {{ t('terms.termsOfUse') }}
              </NuxtLink>
            </span>
          </template>
        </v-checkbox>
      </v-col>
    </v-row>
    <v-row justify="center">
      <v-col cols="12" class="my-0 py-0 mt-5">
        <AuthErrorAlert :auth-error="errorMsg" />
      </v-col>
      <v-col cols="12">
        <v-btn-primary
          block
          type="submit"
          class="pa-5 font-weight-semibold"
          :disabled="!isValid && !acceptTerms"
          :loading="btnLoading"
        >
          {{ t('buttons.signup') }}
        </v-btn-primary>
      </v-col>
      <v-col cols="12">
        <v-btn-secondary block to="/auth/signin" class="pa-5 font-weight-semibold">
          {{ t('buttons.haveAccount') }}
        </v-btn-secondary>
        <v-btn
          variant="text"
          block
          color="primary"
          class="mt-4 text-decoration-underline font-weight-regular"
          to="/auth/ask-password-change"
        >
          {{ t('buttons.forgotPassword') }}
        </v-btn>
      </v-col>
    </v-row>
    <v-dialog max-width="500" persistent :model-value="showDialog">
      <template #default>
        <v-card class="pa-5 pb-11 text-center position-relative">
          <v-btn
            variant="text"
            icon="true"
            class="position-absolute right-0 top-0 rounded-pill"
            onclick="showDialog = false"
          >
            <v-icon size="24" color="grey"> mdi-window-close </v-icon>
          </v-btn>
          <v-card-title class="pb-0 font-weight-bold">
            <v-img
              height="117"
              width="117"
              class="mx-auto"
              src="/assets/img/icons/email_confirmation.png"
            />
            {{ t('dialog.title') }}
          </v-card-title>
          <v-card-text>
            {{ t('dialog.message') }}
          </v-card-text>

          <v-card-actions class="justify-center">
            <v-btn
              color="primary"
              variant="outlined"
              :text="t('dialog.goToSignin')"
              class="px-10"
              @click="redirectToSignin"
            />
          </v-card-actions>
        </v-card>
      </template>
    </v-dialog>
  </v-form>
</template>

<script setup>
import { z } from 'zod'
import { assignWith } from 'lodash'
import { ref, computed } from 'vue'
import EyeIcon from '@/assets/icons/basic/Eye.svg'
import EyeOffIcon from '@/assets/icons/basic/Eye_Off.svg'

const { t } = useTranslations()
const router = useRouter()

const isValid = ref(false)
const showDialog = ref(false)
const btnLoading = ref(false)

const supabase = useSupabaseClient()
const schemaToRule = useZodSchema()

const emailRule = computed(() => [
  schemaToRule(z.string().email({ message: t('validation.invalidEmail') }))
])

const passworRules = computed(() => {
  const schemas = [
    z.string().min(8, { message: t('validation.minLength') }),
    z.string().regex(/\d/, t('validation.needNumber')),
    z.string().regex(/[^A-Za-z0-9]/, t('validation.needSpecial')),
    z.string().regex(/[a-z]/, t('validation.needLowercase')),
    z.string().regex(/[A-Z]/, t('validation.needUppercase'))
  ]
  return schemas.map((schema) => schemaToRule(schema))
})

const formData = ref({
  email: '',
  password: ''
})

function redirectToSignin() {
  router.push('/auth/signin')
}

const passwordFocus = ref(false)

const passwordValidation = computed(() => {
  const passwordSchemas = {
    min: z.string().min(8, { message: t('validation.minLength') }),
    number: z.string().regex(/\d/, t('validation.needNumber')),
    special: z.string().regex(/[^A-Za-z0-9]/, t('validation.needSpecial')),
    lowercase: z.string().regex(/[a-z]/, t('validation.needLowercase')),
    uppercase: z.string().regex(/[A-Z]/, t('validation.needUppercase'))
  }
  return assignWith({}, passwordSchemas, (_, schema) => {
    return schema.safeParse(formData.value.password)
  })
})

const confirmPassword = ref('')
const confirmPasswordRule = computed(() => [
  schemaToRule(
    z.string().refine(() => {
      return confirmPassword.value === formData.value.password
    }, t('validation.passwordMismatch'))
  )
])

const passwordVisible = ref(false)
const passwordType = computed(() => (passwordVisible.value ? 'text' : 'password'))
const passwordIcon = computed(() => (passwordVisible.value ? EyeIcon : EyeOffIcon))

const acceptTerms = ref(false)

const errorMsg = ref('')

async function signup() {
  if (isValid.value) {
    btnLoading.value = true

    //TODO: REGARDER IS ON EST EN DEV OU PAS
    const { data: userData, error } = await supabase.auth.signUp({
      ...formData.value,
      options: {
        emailRedirectTo: 'https://www.crown.ovh/auth/profile'
        // emailRedirectTo: 'http://localhost:3000/auth/profile'
      }
    })

    btnLoading.value = false
    if (error) {
      errorMsg.value = error.message
    } else {
      showDialog.value = true
    }
    // if (!error && !profileError) {
    //   router.push('/auth/profile')
    //   // router.push('/')
    // } else {
    //   errorMsg.value = error.message + profileError
    // }
  }
}
</script>

<style scoped>
.custom-form-width {
  width: 318px !important;
}
.check-img {
  min-width: 20px;
  width: 20px;
  height: 20px;
}
.v-selection-control--density-default {
  padding-left: 0px !important;
  margin-left: -9px !important; /* check this negative margin */
}
.v-btn--disabled {
  background-color: #c5c7c9 !important;
}
:deep(.v-input__details) {
  padding-top: 0 !important;
  min-height: 16px !important;
}
</style>
