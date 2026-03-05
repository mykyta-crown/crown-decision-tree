<template>
  <v-row class="py-0">
    <v-col cols="auto" class="py-0 d-flex align-center">
      <div
        v-if="props.icon || props.img"
        class="d-flex align-center justify-center rounded-lg"
        style="width: 50px; height: 50px"
      >
        <v-icon v-if="props.icon" class="mx-auto" :icon="props.icon" size="large" color="white" />

        <img v-else :src="props.img.src" :width="props.img.width" />
      </div>
    </v-col>

    <v-col :cols="appendCols ? 6 : 8">
      <div>
        <slot name="title">
          <div class="text-grey-2 mb-1">
            {{ props.title }}
          </div>
        </slot>
        <div />
      </div>
      <slot name="content">
        <v-slide-y-transition>
          <span class="text-h3 d-flex align-center justify-space-between">{{ props.value }}</span>
        </v-slide-y-transition>
      </slot>
    </v-col>
    <v-col :cols="appendCols ? 2 : 0" class="px-0">
      <slot name="append" />
    </v-col>
  </v-row>
</template>

<script setup>
const props = defineProps(['title', 'icon', 'value', 'img', 'appendCols'])
</script>
