<template>
  <div class="text-center d-flex justify-center">
    <v-dialog v-model="model" max-width="800">
      <v-card class="text-center">
        <v-card-title>
          <div class="d-flex justify-space-between align-center">
            <span class="text-body-1 text-grey-lighten-1">
              {{ t('timingRules.title') }}
            </span>
            <v-btn color="grey-lighten-1" variant="text" icon="mdi-close" @click="model = false" />
          </div>
          <v-divider class="text-grey-lighten-3" />
        </v-card-title>
        <v-card-text class="mx-2 my-4 d-flex justify-center">
          <div class="max-width">
            <v-row>
              <v-col class="text-h4 font-weight-bold">
                {{ timingContent[timingRule].title }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="text-body-1 text-left">
                {{ timingContent[timingRule].text }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-img height="200" :src="timingContent[timingRule].img" />
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        <v-card-actions class="justify-center pb-16">
          <v-btn-primary class="rounded-lg px-16 w-33" size="x-large" @click="model = false">
            {{ t('timingRules.ok') }}
          </v-btn-primary>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup>
const { timingRule } = defineProps(['timingRule'])

const { t } = useTranslations()

const model = defineModel()

const timingContent = computed(() => ({
  serial: {
    title: t('timingRules.serial.title'),
    text: t('timingRules.serial.text'),
    img: '/builder/serial-timing.png'
  },

  parallel: {
    title: t('timingRules.parallel.title'),
    text: t('timingRules.parallel.text'),
    img: '/builder/parallel-timing.png'
  },
  staggered: {
    title: t('timingRules.staggered.title'),
    text: t('timingRules.staggered.text'),
    img: '/builder/staggered-timing.png'
  }
}))
</script>
<style scoped>
.max-width {
  max-width: 433px;
}
</style>
