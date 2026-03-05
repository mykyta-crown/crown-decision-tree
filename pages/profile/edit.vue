<template>
  <div>
    <v-container class="fill-height">
      <v-row>
        <v-col cols="12">
          <v-card class="pa-10 fill-height">
            <v-container>
              <v-row>
                <v-col cols="12" class="pt-0 mb-2">
                  <div class="text-h1">
                    {{ t('title') }}
                  </div>
                </v-col>
                <v-col cols="6">
                  <v-text-field
                    :model-value="user?.email"
                    hide-details
                    readonly
                    disabled
                    variant="outlined"
                    :label="t('email.label')"
                  />
                </v-col>
                <v-col cols="6" class="d-flex align-center">
                  <v-btn color="primary" variant="text" to="/auth/reset">
                    {{ t('password.changeButton') }}
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <AuthProfileForm :no-redirect="true" @saved="saved" />
                </v-col>
              </v-row>
              <v-snackbar v-model="snackbar" location="top right">
                <v-icon icon="mdi-check" color="primary" class="mr-2" />
                {{ t('snackbar.message') }}

                <template #actions>
                  <v-btn color="white" variant="text" @click="snackbar = false">
                    {{ t('snackbar.close') }}
                  </v-btn>
                </template>
              </v-snackbar>
            </v-container>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const { user } = useUser()
const router = useRouter()

// Use translations
const { t } = useTranslations()

const snackbar = ref(false)

function saved() {
  snackbar.value = true
  setTimeout(() => {
    router.push('/home')
  }, 1000)
}
</script>
