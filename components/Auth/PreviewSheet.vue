<template>
  <v-sheet class="fill-height" :class="color">
    <v-row class="fill-height bg-none" justify="center" align="center">
      <v-col cols="12" class="text-center" />
      <v-col cols="10" class="text-center text-h1 font-weight-regular d-flex flex-column ga-10">
        <div>
          <img width="188" src="@/assets/img/logo_black.svg" />
        </div>
        <div class="text-primary">
          Reach <span class="font-weight-bold">True Market Value</span><br />through
          <span class="font-weight-bold"> Fair</span> Negotiations
        </div>
      </v-col>
      <v-col cols="12">
        <span class="text-uppercase">
          <!-- The best solution for business -->
        </span>
      </v-col>
    </v-row>
  </v-sheet>
</template>
<script setup>
const route = useRoute()
const color = computed(() => {
  if (route.path === '/auth/signin') {
    return 'bg-green-light'
  } else if (route.path === '/auth/ask-password-change') {
    return 'bg-orange-light'
  } else if (route.path === '/auth/signup') {
    return 'bg-purple'
  }

  return ''
})
</script>

<style>
.preview-img {
  max-width: 100%;
}

.signup-gradient {
  background: linear-gradient(326deg, #b9f2e2 -13.07%, #f6f0d8 90.46%) !important;
}
</style>
