<template>
  <v-card class="flex-grow-1">
    <v-container class="fill-height">
      <v-row>
        <v-col class="d-flex align-center">
          <div
            v-if="props.icon || props.img"
            class="d-flex align-center justify-center rounded-lg px-auto"
            style="width: 50px; height: 50px"
          >
            <v-icon
              v-if="props.icon"
              class="mx-auto"
              :icon="props.icon"
              size="large"
              color="white"
            />

            <img v-else :src="props.img.src" :width="props.img.width" />
          </div>

          <div class="ml-4">
            <slot name="title">
              <div class="text-grey mb-1">
                {{ props.title }}
              </div>
            </slot>
            <div>
              <slot name="content">
                <v-slide-y-transition>
                  <span class="text-h3">{{ props.value }}</span>
                </v-slide-y-transition>
              </slot>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script setup>
const props = defineProps(['title', 'icon', 'value', 'img'])
</script>
