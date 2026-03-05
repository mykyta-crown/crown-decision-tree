<template>
  <v-app>
    <v-main>
      <v-locale-provider :locale="locale">
        <AuthCookieBanner />
        <LayoutNavigationDrawer v-model="showEditDialog" />
        <NuxtLoadingIndicator />
        <slot />
      </v-locale-provider>
    </v-main>
    <!-- <LayoutFooter /> -->
  </v-app>
</template>

<script setup>
import { useLocale } from 'vuetify'
import Intercom from '@intercom/messenger-js-sdk'

// Only initialize Intercom if enabled via environment variable
const config = useRuntimeConfig()
if (config.public.enableIntercom && config.public.intercomAppId) {
  Intercom({
    app_id: config.public.intercomAppId
  })
}

const { locale } = useTranslations()
const { current: vuetifyLocale } = useLocale()

// Sync Vuetify locale with our translation system
watch(
  locale,
  (newLocale) => {
    vuetifyLocale.value = newLocale
  },
  { immediate: true }
)

useHead({
  title: 'Crown',
  meta: [{ name: 'eAuctions', content: 'Crown Website' }]
})
const showEditDialog = ref(false)
provide('showEditDialog', showEditDialog)
</script>

<style lang="css" scoped>
.app-bar-controls {
  width: 100%;
}
</style>
