<template>
  <div class="text-center d-flex justify-center">
    <v-dialog v-model="dialog" max-width="700">
      <v-card class="text-center max-card-width">
        <v-card-title>
          <div class="d-flex w-full justify-space-between align-center">
            <span class="text-body-1 text-grey-lighten-1">
              {{ t('timingRules.title') }}
            </span>
            <v-btn
              color="grey-lighten-1"
              variant="text"
              icon="mdi-close"
              @click="emit('update:modelValue', false)"
            />
          </div>
          <v-divider class="text-grey-lighten-3" />
        </v-card-title>
        <v-card-text class="mx-2 my-4 d-flex justify-center">
          <div class="max-width">
            <v-row>
              <v-col class="text-h4 font-weight-bold">
                {{ t('timingRules.chooseTitle') }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12" class="text-body-1">
                {{ t('timingRules.description') }}
              </v-col>
            </v-row>
            <v-row>
              <v-col cols="12">
                <v-radio-group v-model="timingRules" inline>
                  <v-radio
                    v-for="option in optionsList"
                    :key="`option-${option.value}`"
                    class="mr-8"
                    :label="option.label"
                    :value="option.value"
                    :disabled="option.disabled"
                  />
                </v-radio-group>
                <v-tabs-window v-model="timingRules">
                  <v-tabs-window-item
                    v-for="item in optionsList"
                    :key="item.value"
                    :value="item.value"
                  >
                    <v-img height="200" :src="item.img" />
                  </v-tabs-window-item>
                </v-tabs-window>
              </v-col>
            </v-row>
          </div>
        </v-card-text>
        <v-card-actions class="justify-center mb-16 pb-8 ga-8">
          <v-btn-secondary
            class="px-16 w-33"
            size="x-large"
            @click="emit('update:modelValue', false)"
          >
            {{ t('common.cancel') }}
          </v-btn-secondary>
          <v-btn-primary class="rounded-lg px-16 w-33" size="x-large" @click="confirm">
            {{ t('common.confirm') }}
          </v-btn-primary>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script setup>
const props = defineProps({
  modelValue: Boolean,
  timingRules: String,
  disabledTypes: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'confirmed'])

// Use translations
const { t } = useTranslations()

const dialog = ref(toRef(() => props.modelValue))
const timingRules = ref(props.timingRules)

const optionsList = computed(() => {
  return [
    {
      label: t('timingRules.serial.title'),
      value: 'serial',
      disabled: props.disabledTypes.includes('serial'),
      img: '/builder/serial-timing.png'
    },
    {
      label: t('timingRules.parallel.title'),
      value: 'parallel',
      disabled: props.disabledTypes.includes('parallel'),
      img: '/builder/parallel-timing.png'
    },
    {
      label: t('timingRules.staggered.title'),
      value: 'staggered',
      disabled: props.disabledTypes.includes('staggered'),
      img: '/builder/staggered-timing.png'
    }
  ]
})

function confirm() {
  emit('update:modelValue', false)
  emit('confirmed', timingRules.value)
}
</script>
<style scoped>
.max-width {
  max-width: 433px;
}
.max-card-width {
  width: 800px;
}
</style>
