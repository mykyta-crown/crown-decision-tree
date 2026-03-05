<template>
  <v-banner
    v-show="!consentValue"
    class="cookie-banner"
    rounded
    max-width="400"
    elevation="4"
    mobile
  >
    <template #text>
      We use cookies for audience measurement to understand how visitors interact with our website.
      You can learn more and manage your preferences on our
      <a href="/privacy_policies" target="_blank">Privacy Policy</a> page.
    </template>
    <template #actions>
      <v-btn-secondary @click="setConsent(false)"> Refuse </v-btn-secondary>
      <v-btn-primary class="ml-2" @click="setConsent(true)"> Accept </v-btn-primary>
    </template>
  </v-banner>
</template>

<script setup>
const { setConsent, consentValue } = useConsent()
</script>

<style scoped>
.cookie-banner {
  position: fixed;
  bottom: 30px;
  left: 30px;
  z-index: 1005;
}
</style>
