<template>
  <div class="bg-purple">
    <v-container class="fill-height">
      <v-row>
        <v-col cols="12">
          <v-card class="pa-10 fill-height">
            <v-form v-model="isValid" @submit.prevent="changePassword">
              <v-container>
                <v-row>
                  <v-col cols="12" class="pt-0 mb-2">
                    <div class="text-h1">Choose a new password</div>
                  </v-col>
                  <v-col cols="12">
                    <v-tooltip
                      v-model="passwordFocus"
                      location="right"
                      content-class="bg-grey-ligthen-3"
                    >
                      <AuthPasswordCheck
                        :success="passwordValidation.min.success"
                        text="Has at least 8 characters"
                      />
                      <AuthPasswordCheck
                        :success="
                          passwordValidation.lowercase.success &&
                          passwordValidation.uppercase.success
                        "
                        text="Contains both upper & lower case letters"
                      />
                      <AuthPasswordCheck
                        :success="passwordValidation.number.success"
                        text="Contains at least 1 number"
                      />
                      <AuthPasswordCheck
                        :success="passwordValidation.special.success"
                        text="Containes at least 1 special character"
                      />
                      <template #activator="{ props }">
                        <v-text-field
                          v-bind="props"
                          id="password-input"
                          v-model="password"
                          label="Your new password*"
                          :type="passwordType"
                          :rules="passworRules"
                          :append-inner-icon="passwordIcon"
                          @focus="passwordFocus = true"
                          @blur="passwordFocus = false"
                          @click:append-inner="passwordVisible = !passwordVisible"
                        />
                      </template>
                    </v-tooltip>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="confirmPassword"
                      label="Repeat your new password*"
                      :type="passwordType"
                      :rules="[schemaToRule(confirmPasswordSchema)]"
                      :append-inner-icon="passwordIcon"
                      @click:append-inner="passwordVisible = !passwordVisible"
                    />
                  </v-col>
                  <v-col cols="12">
                    <v-btn-primary block size="large" type="submit">
                      Change password
                    </v-btn-primary>
                  </v-col>
                </v-row>
                <v-snackbar v-model="snackbar" location="top right">
                  <v-icon icon="mdi-check" color="primary" class="mr-2" />
                  Your password has been changed.

                  <template #actions>
                    <v-btn color="white" variant="text" @click="snackbar = false"> Close </v-btn>
                  </template>
                </v-snackbar>
              </v-container>
            </v-form>
          </v-card>
        </v-col>

        <!--
          <v-fab
          app
          appear
          extended
          color="primary"

          text="< Go back"
          location="top left"
          @click="router.back()"
          />
        -->
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { z } from 'zod'
import { ref } from 'vue'
import { assignWith, toArray } from 'lodash'
const supabase = useSupabaseClient()
const router = useRouter()
definePageMeta({
  layout: 'auth'
})

const isValid = ref(false)
const snackbar = ref(false)

const passwordFocus = ref(false)
const password = ref('')

const schemaToRule = useZodSchema()

const passwordSchema = {
  min: z.string().min(8, { message: 'Need at least 8 characters' }),
  number: z.string().regex(/\d/, 'Need at least one number'),
  special: z.string().regex(/[^A-Za-z0-9]/, 'Need at least one special character'),
  lowercase: z.string().regex(/[a-z]/, 'Need at least one lower cased letter'),
  uppercase: z.string().regex(/[A-Z]/, 'Need at least one upper cased letter')
}
const passworRules = toArray(passwordSchema).map((schema) => schemaToRule(schema))

const passwordValidation = computed(() => {
  return assignWith({}, passwordSchema, (_, schema) => {
    return schema.safeParse(password.value)
  })
})

const confirmPassword = ref('')
const confirmPasswordSchema = z.string().refine(() => {
  return confirmPassword.value === password.value
}, 'Passwords are not the same')

const passwordVisible = ref(false)
const passwordIcon = computed(() => `mdi-eye${passwordVisible.value ? '-off' : ''}-outline`)
const passwordType = computed(() => (passwordVisible.value ? 'text' : 'password'))
const errorMsg = ref('')

async function changePassword() {
  if (isValid.value) {
    console.log('Changing password')
    const { data, error } = await supabase.auth.updateUser({
      password: password.value
    })

    console.log('error on change password: ', error)
    snackbar.value = true
    setTimeout(() => {
      router.push('/home')
    }, 1000)
  }
}
</script>
