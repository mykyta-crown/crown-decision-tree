<template>
  <v-form v-model="isValid" class="custom-form-width" @submit.prevent="login">
    <v-row justify="center">
      <v-col cols="8" class="d-flex justify-center d-lg-none">
        <v-img src="@/assets/img/logo_black.svg" />
      </v-col>
      <v-col cols="12" class="text-center">
        <h4 class="text-h4 font-weight-bold">
          {{ t('title') }}
        </h4>
      </v-col>
      <v-col cols="12" class="mt-xl-2 pb-1 text-body-2">
        {{ t('fields.email') }}
        <v-text-field
          v-model="email"
          variant="outlined"
          class="mt-1 text-grey"
          :rules="emailRule"
          :placeholder="t('forms.placeholders.email')"
        >
          <template #append-inner>
            <v-img src="@/assets/icons/basic/Mail.svg" width="20" height="20" />
          </template>
        </v-text-field>
      </v-col>
      <v-col cols="12" class="pt-2 text-body-2">
        {{ t('fields.password') }}
        <v-text-field
          v-model="password"
          variant="outlined"
          class="mt-1 text-grey"
          :type="passwordVisible ? 'text' : 'password'"
          :rules="passwordRule"
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
      </v-col>

      <v-col cols="12" class="my-0 py-0">
        <AuthErrorAlert :auth-error="errorMsg" />
      </v-col>

      <v-col cols="12" class="mt-2">
        <v-btn-primary type="submit" block :disabled="!isValid" class="pa-5 font-weight-semibold">
          {{ t('buttons.login') }}
        </v-btn-primary>
      </v-col>
      <v-col cols="12">
        <v-btn-secondary block to="/auth/signup" class="pa-5 font-weight-semibold">
          {{ t('buttons.signup') }}
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
  </v-form>
</template>

<script setup>
import { z } from 'zod'
import { ref } from 'vue'
import EyeIcon from '@/assets/icons/basic/Eye.svg'
import EyeOffIcon from '@/assets/icons/basic/Eye_Off.svg'

const { t } = useTranslations()
const supabase = useSupabaseClient()
const router = useRouter()

const isValid = ref(false)

const schemaToRule = useZodSchema()

const emailRule = computed(() => [
  schemaToRule(z.string().email({ message: t('validation.invalidEmail') }))
])
const passwordRule = computed(() => [
  schemaToRule(z.string().min(1, { message: t('validation.required') }))
])

const passwordVisible = ref(false)
const passwordIcon = computed(() => (passwordVisible.value ? EyeIcon : EyeOffIcon))

const errorMsg = ref('')

const email = ref('')
const password = ref('')

async function login() {
  if (isValid.value) {
    const { data: session, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value
    })

    console.log('session', session, error)

    if (error) {
      console.log(error)
      errorMsg.value = error.message
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_step')
        .eq('id', session.user.id)
        .single()

      // console.log('profile', profile, session.user.id)

      if (profile && profile.onboarding_step >= 4) {
        router.push('/dashboard')
      } else {
        router.push('/onboarding')
      }
    }
  }
}
</script>

<style scoped>
.custom-form-width {
  width: 318px !important;
}
.v-btn--disabled {
  background-color: #c5c7c9 !important;
}
</style>
