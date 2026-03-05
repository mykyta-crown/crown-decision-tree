<template>
  <v-card class="mx-auto max-height">
    <v-card-title class="mt-3 pb-0 font-weight-black d-flex justify-space-between">
      <span class="text-h6 font-weight-bold ml-1"> {{ props.title }}</span>
      <slot name="title-content" />
    </v-card-title>

    <v-card-text class="pt-2 fill-height">
      <slot />
    </v-card-text>
  </v-card>
</template>
<script setup>
const props = defineProps(['title'])
</script>
<style scoped>
.custom-height {
  height: 29px;
}
.max-height {
  height: 394px;
}
</style>
