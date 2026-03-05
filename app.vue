<template>
  <NuxtLayout>
    <NuxtPage class="h-100" />
  </NuxtLayout>
  <ToastNotification />
</template>

<script setup>
import ToastNotification from '~/components/Layout/ToastNotification.vue'

// import LogRocket from 'logrocket';
// const config = useRuntimeConfig()

// console.log('process.env: ', config, ' envVercelEnv: ', config.public.envVercelEnv)
// if (config.envVercelEnv === 'production') {
// LogRocket.init('crown/crown');
// }
</script>

<style>
.page-enter-active,
.page-leave-active {
  transition: all 0.4s;
}
.page-enter-from,
.page-leave-to {
  opacity: 0;
  filter: blur(1rem);
}
a {
  color: var(--v-theme-primary-darken-1);
}
</style>
